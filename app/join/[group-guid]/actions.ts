"use server";

import { getClient } from "@/utilities/supabase/server";
import { redirect } from "next/navigation";

// Common result type for server actions
type ActionResult = {
  success: boolean;
  error?: string;
};

export async function joinGroup(formData: FormData): Promise<ActionResult | never> {
  const supabase = await getClient();

  // Extract form data
  const groupGuid = formData.get("groupGuid") as string;
  const creatorCode = formData.get("creatorCode") as string;
  const password = formData.get("password") as string || null;
  const name = formData.get("name") as string;
  const codeName = formData.get("codeName") as string || null;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Name is required" };
  }

  // Validate character limits
  if (name.trim().length > 30) {
    return { success: false, error: "Name cannot exceed 30 characters" };
  }

  if (codeName && codeName.trim().length > 30) {
    return { success: false, error: "Code name cannot exceed 30 characters" };
  }

  try {
    // Call the join_group function
    const { error: joinError } = await supabase.rpc("join_group", {
      p_group_guid: groupGuid,
      p_password: password,
      p_name: name,
      p_code: creatorCode,
      p_code_name: codeName,
    });

    if (joinError) {
      console.error("Error joining group:", joinError);
      return { success: false, error: joinError.message || "Failed to join group" };
    }

  } catch (error) {
    console.error("Failed to join group:", error);
    return { success: false, error: "An unexpected error occurred while joining the group" };
  }

  // Redirect to the group page - redirect throws, so it's outside try-catch
  redirect(`/group/${groupGuid}`);
}

export async function getGroupMembershipAndRedirect(groupGuid: string, memberCode: string) {
  const supabase = await getClient();

  let info = null;

  try {
    // Get group information with membership status
    const { data: groupInfo, error } = await supabase.rpc("get_group", {
      p_group_guid: groupGuid,
      p_member_code: memberCode || null,
    });

    if (error) {
      console.error("Error getting group info:", error);
      return null;
    }

    info = groupInfo && groupInfo.length > 0 ? groupInfo[0] : null;
  } catch (error) {
    console.error("Failed to check membership:", error);
    return null;
  }

  // If user is already a member, redirect to group page (outside try-catch so redirect throws properly)
  if (info?.is_member) {
    redirect(`/group/${groupGuid}`);
  }

  return info;
}