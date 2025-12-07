"use server";

import { getClient } from "@/utilities/supabase/server";

export async function createDemoGroups(userCode: string) {
  const supabase = await getClient();

  try {
    const { error } = await supabase.rpc("create_demo_groups", {
      p_user_code: userCode,
    });

    if (error) {
      console.error("Error creating demo groups:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create demo groups:", error);
    return { success: false, error: "Unexpected error" };
  }
}

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