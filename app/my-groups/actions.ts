"use server";

import { getClient } from "@/utilities/supabase/server";

export async function getMyGroups(memberCode: string) {
  const supabase = await getClient();

  try {
    // Use the get_my_groups function to get all groups where user is member or creator
    const { data: groups, error } = await supabase.rpc("get_my_groups", {
      p_member_code: memberCode,
    });

    if (error) {
      console.error("Error getting user groups:", error);
      return [];
    }

    return groups || [];
  } catch (error) {
    console.error("Failed to get user groups:", error);
    return [];
  }
}