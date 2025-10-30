"use server";

import { getClient } from "@/utilities/supabase/server";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const supabase = await getClient();

  // Extract form data
  const capacity = parseInt(formData.get("capacity") as string);
  const useCodeNames = formData.get("useCodeNames") === "on";
  const autoAssignCodeNames = formData.get("autoAssignCodeNames") === "on";
  const autoJoinGroup = formData.get("autoJoinGroup") === "on";
  const creatorName = formData.get("creatorName") as string;
  const creatorCode = formData.get("creatorCode") as string;
  const creatorCodeName = formData.get("creatorCodeName") as string || null;
  const password = formData.get("password") as string || null;
  const description = formData.get("description") as string;
  const expiryDate = formData.get("expiryDate") as string || null;

  // Validate required fields
  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  try {
    // Call the create_group function
    const { data: groupGuid, error: createError } = await supabase.rpc("create_group", {
      p_capacity: capacity,
      p_use_code_names: useCodeNames,
      p_auto_assign_code_names: autoAssignCodeNames,
      p_creator_name: creatorName,
      p_creator_code: creatorCode,
      p_description: description,
      p_password: password,
      p_expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
    });

    if (createError) {
      console.error("Error creating group:", createError);
      throw new Error(createError.message);
    }

    // If auto-join is enabled, join the group as a member
    if (autoJoinGroup) {
      const { error: joinError } = await supabase.rpc("join_group", {
        p_group_guid: groupGuid,
        p_password: password,
        p_name: creatorName,
        p_code: creatorCode,
        p_code_name: creatorCodeName, // Use the provided code name or null for auto-assignment
      });

      if (joinError) {
        console.error("Error auto-joining group:", joinError);
        // Note: We don't throw here since the group was created successfully
        // The creator can manually join later if needed
        console.warn("Group created successfully but auto-join failed. Creator can join manually.");
      }
    }

    // Redirect to the admin page with the generated GUID
    redirect(`/admin/${groupGuid}`);
  } catch (error) {
    console.error("Failed to create group:", error);
    throw error;
  }
}