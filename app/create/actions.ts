"use server";

import { getClient } from "@/utilities/supabase/server";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const supabase = await getClient();

  // Extract form data
  const capacity = parseInt(formData.get("capacity") as string);
  const useCodeNames = formData.get("useCodeNames") === "on";
  const autoAssignCodeNames = formData.get("autoAssignCodeNames") === "on";
  const useCustomCodeNames = formData.get("useCustomCodeNames") === "on";
  const autoJoinGroup = formData.get("autoJoinGroup") === "on";
  const creatorName = formData.get("creatorName") as string;
  const creatorCode = formData.get("creatorCode") as string;
  const creatorCodeName = formData.get("creatorCodeName") as string || null;
  const password = formData.get("password") as string || null;
  const description = formData.get("description") as string;
  const expiryDate = formData.get("expiryDate") as string || null;

  // Extract custom code names array
  const customCodeNamesCount = parseInt(formData.get("customCodeNamesCount") as string || "0");
  const customCodeNames: string[] = [];

  if (useCustomCodeNames && customCodeNamesCount > 0) {
    for (let i = 0; i < customCodeNamesCount; i++) {
      const name = formData.get(`customCodeName_${i}`) as string;
      if (name && name.trim().length > 0) {
        customCodeNames.push(name.trim());
      }
    }
  }

  // Validate required fields
  if (!creatorName || creatorName.trim().length === 0) {
    throw new Error("Admin name is required");
  }

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required");
  }

  // Validate capacity
  if (isNaN(capacity) || capacity < 2) {
    throw new Error("Capacity must be at least 2 members");
  }

  if (capacity > 100) {
    throw new Error("Capacity cannot exceed 100 members");
  }

  // Validate expiry date
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();

    if (isNaN(expiry.getTime())) {
      throw new Error("Invalid expiry date format");
    }

    if (expiry <= now) {
      throw new Error("Expiry date must be in the future");
    }

    // Optional: Add maximum expiry date limit (e.g., 1 year from now)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (expiry > oneYearFromNow) {
      throw new Error("Expiry date cannot be more than 1 year from now");
    }
  }

  // Validate custom code names if enabled
  if (useCustomCodeNames) {
    if (customCodeNames.length === 0) {
      throw new Error("Custom code names are required when 'Provide your own code names' is enabled");
    }

    if (customCodeNames.length < capacity) {
      throw new Error(`You must provide at least ${capacity} custom code names to match the group capacity`);
    }

    // Check for duplicate custom code names (case-insensitive)
    const uniqueNames = new Set(customCodeNames.map(name => name.toLowerCase()));
    if (uniqueNames.size !== customCodeNames.length) {
      throw new Error("Custom code names must be unique. Please remove any duplicate names.");
    }
  }

  try {
    // Call the create_group function
    const { data: groupGuid, error: createError } = await supabase.rpc("create_group", {
      p_capacity: capacity,
      p_use_code_names: useCodeNames,
      p_auto_assign_code_names: autoAssignCodeNames,
      p_use_custom_code_names: useCustomCodeNames,
      p_creator_name: creatorName,
      p_creator_code: creatorCode,
      p_description: description,
      p_password: password,
      p_expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      p_custom_code_names: customCodeNames.length > 0 ? customCodeNames : null,
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
        // The admin can manually join later if needed
        console.warn("Group created successfully but auto-join failed. Admin can join manually.");
      }
    }

    // Redirect to the admin page with the generated GUID
    redirect(`/admin/${groupGuid}`);
  } catch (error) {
    console.error("Failed to create group:", error);
    throw error;
  }
}