"use server";

import { getClient } from "@/utilities/supabase/server";
import { redirect } from "next/navigation";

export async function checkMembership(groupGuid: string, memberCode: string) {
  const supabase = await getClient();

  try {
    // Check if user is already a member of this group
    const { data: isMember, error } = await supabase.rpc("is_member", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
    });

    if (error) {
      console.error("Error checking membership:", error);
      return false;
    }

    return isMember === true;
  } catch (error) {
    console.error("Failed to check membership:", error);
    return false;
  }
}

export async function joinGroup(formData: FormData) {
  const supabase = await getClient();

  // Extract form data
  const groupGuid = formData.get("groupGuid") as string;
  const creatorCode = formData.get("creatorCode") as string;
  const password = formData.get("password") as string || null;
  const name = formData.get("name") as string;
  const codeName = formData.get("codeName") as string || null;

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
      throw new Error(joinError.message);
    }

    // Redirect to the group page (we'll use the group GUID for now)
    redirect(`/group/${groupGuid}`);
  } catch (error) {
    console.error("Failed to join group:", error);
    throw error;
  }
}

export async function getGroupInfo(groupGuid: string) {
  const supabase = await getClient();

  try {
    // Get group information to determine if code names are used
    const { data: groupInfo, error } = await supabase.rpc("get_group", {
      p_group_guid: groupGuid,
    });

    if (error) {
      console.error("Error getting group info:", error);
      return null;
    }

    return groupInfo && groupInfo.length > 0 ? groupInfo[0] : null;
  } catch (error) {
    console.error("Failed to get group info:", error);
    return null;
  }
}