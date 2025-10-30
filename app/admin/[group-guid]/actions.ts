"use server";

import { getClient } from "@/utilities/supabase/server";

interface GroupDetails {
  group_guid: string;
  password: string | null;
  capacity: number;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  creator_name: string;
  description: string | null;
  is_open: boolean;
  expiry_date: string | null;
  is_frozen: boolean;
}

interface GetGroupResult {
  password: string | null;
  capacity: number;
  description: string | null;
  is_open: boolean;
  expiry_date: string | null;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  creator_name: string;
  is_frozen: boolean;
}

export async function getGroupDetails(groupGuid: string, creatorCode: string): Promise<GroupDetails | null> {
  const supabase = await getClient();

  try {
    // Validate that the provided creatorCode matches the group's creator_code
    const { data: isValidCreator, error: validationError } = await supabase
      .rpc('is_creator', {
        p_group_guid: groupGuid,
        p_creator_code: creatorCode
      })
      .single();

    if (validationError || !isValidCreator) {
      console.error('Invalid creator credentials or group not found');
      return null;
    }

    // Get group details using the updated get_group function
    const { data: groupDetails, error: detailsError } = await supabase
      .rpc('get_group', {
        p_group_guid: groupGuid
      })
      .single();

    if (detailsError || !groupDetails) {
      console.error('Error fetching group details:', detailsError);
      return null;
    }

    // Type cast the result
    const typedGroupDetails = groupDetails as GetGroupResult;

    return {
      group_guid: groupGuid,
      password: typedGroupDetails.password,
      capacity: typedGroupDetails.capacity,
      use_code_names: typedGroupDetails.use_code_names,
      auto_assign_code_names: typedGroupDetails.auto_assign_code_names,
      creator_name: typedGroupDetails.creator_name,
      description: typedGroupDetails.description,
      is_open: typedGroupDetails.is_open,
      expiry_date: typedGroupDetails.expiry_date,
      is_frozen: typedGroupDetails.is_frozen,
    };
  } catch (error) {
    console.error('Failed to fetch group details:', error);
    return null;
  }
}

export async function updateGroup(formData: FormData): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Extract form data
    const groupGuid = formData.get("groupGuid") as string;
    const creatorCode = formData.get("creatorCode") as string;
    const capacity = parseInt(formData.get("capacity") as string);
    const password = formData.get("password") as string || null;
    const expiryDate = formData.get("expiryDate") as string || null;
    const isOpen = formData.get("isOpen") === "on";

    // Call the update_group function
    const { error } = await supabase.rpc("update_group", {
      p_group_guid: groupGuid,
      p_password: password,
      p_capacity: capacity,
      p_is_open: isOpen,
      p_expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      p_creator_code: creatorCode,
    });

    if (error) {
      console.error("Error updating group:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to update group:", error);
    return false;
  }
}

export async function getGroupMembers(groupGuid: string, creatorCode: string): Promise<string[]> {
  const supabase = await getClient();

  try {
    // Use the get_members function to get all members in the group
    const { data: members, error } = await supabase
      .rpc('get_members', {
        p_group_guid: groupGuid,
        p_member_code: creatorCode
      });

    if (error) {
      console.error('Error fetching group members:', error);
      return [];
    }

    // Extract member names from the result
    return members?.map((member: { name: string }) => member.name) || [];
  } catch (error) {
    console.error('Failed to fetch group members:', error);
    return [];
  }
}

export async function assignSecretSanta(groupGuid: string, creatorCode: string): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Call the assign_santa function
    const { error } = await supabase.rpc('assign_santa', {
      p_group_guid: groupGuid,
      p_creator_code: creatorCode
    });

    if (error) {
      console.error('Error assigning Secret Santa:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to assign Secret Santa:', error);
    return false;
  }
}

export async function joinGroupAsCreator(groupGuid: string, creatorCode: string, creatorName: string, password: string | null, codeName: string | null): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Call the join_group function
    const { error } = await supabase.rpc('join_group', {
      p_group_guid: groupGuid,
      p_password: password,
      p_name: creatorName,
      p_code: creatorCode,
      p_code_name: codeName
    });

    if (error) {
      console.error('Error joining group as creator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to join group as creator:', error);
    return false;
  }
}

export async function kickMember(groupGuid: string, creatorCode: string, memberName: string): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Call the kick_member function
    const { error } = await supabase.rpc('kick_member', {
      p_group_guid: groupGuid,
      p_creator_code: creatorCode,
      p_member_name: memberName
    });

    if (error) {
      console.error('Error kicking member:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to kick member:', error);
    return false;
  }
}

export async function unlockGroup(groupGuid: string, creatorCode: string): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Call the unlock_group function
    const { error } = await supabase.rpc('unlock_group', {
      p_group_guid: groupGuid,
      p_creator_code: creatorCode
    });

    if (error) {
      console.error('Error unlocking group:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to unlock group:', error);
    return false;
  }
}