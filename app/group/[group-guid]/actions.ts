"use server";

import { getClient } from "@/utilities/supabase/server";
import { redirect } from "next/navigation";

export async function getUserInfo(groupGuid: string, memberCode: string) {
  const supabase = await getClient();

  try {
    // Get member information using the get_member function
    const { data: memberData, error } = await supabase.rpc("get_member", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
    });

    if (error) {
      console.error("Error getting member info:", error);
      return null;
    }

    // If no data returned, member doesn't exist
    if (!memberData || memberData.length === 0) {
      return null;
    }

    return memberData[0];
  } catch (error) {
    console.error("Failed to get member info:", error);
    return null;
  }
}

export async function getMySecretSanta(groupGuid: string, memberCode: string) {
  const supabase = await getClient();

  try {
    // Get the user's Secret Santa assignment
    const { data: secretSanta, error } = await supabase.rpc("get_my_secret_santa", {
      p_group_guid: groupGuid,
      p_code: memberCode,
    });

    if (error) {
      console.error("Error getting Secret Santa:", error);
      return null;
    }

    return secretSanta;
  } catch (error) {
    console.error("Failed to get Secret Santa:", error);
    return null;
  }
}

export async function getGroupMembers(groupGuid: string, memberCode: string) {
  const supabase = await getClient();

  try {
    // Use the get_members function to get all members in the group
    const { data: members, error } = await supabase.rpc("get_members", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
    });

    if (error) {
      console.error("Error getting group members:", error);
      return [];
    }

    return members || [];
  } catch (error) {
    console.error("Failed to get group members:", error);
    return [];
  }
}

export async function getGroupInfo(groupGuid: string) {
  const supabase = await getClient();

  try {
    // Get group information
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

export async function leaveGroup(formData: FormData) {
  const supabase = await getClient();

  // Extract form data
  const groupGuid = formData.get("groupGuid") as string;
  const memberCode = formData.get("memberCode") as string;

  try {
    // Call the leave_group function
    const { error: leaveError } = await supabase.rpc("leave_group", {
      p_group_guid: groupGuid,
      p_code: memberCode,
    });

    if (leaveError) {
      console.error("Error leaving group:", leaveError);
      throw new Error(leaveError.message);
    }

    // Redirect to home page after leaving
    redirect("/");
  } catch (error) {
    console.error("Failed to leave group:", error);
    throw error;
  }
}