"use server";

import { getClient } from "@/utilities/supabase/server";

interface GroupDetails {
  group_guid: string;
  password: string | null;
  capacity: number;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  use_custom_code_names: boolean;
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
  use_custom_code_names: boolean;
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
      console.error('Invalid admin credentials or group not found');
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
      use_custom_code_names: typedGroupDetails.use_custom_code_names,
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
    const newCustomCodeNamesJson = formData.get("newCustomCodeNames") as string;

    // Parse new custom code names if provided
    let newCustomCodeNames: string[] | null = null;
    if (newCustomCodeNamesJson) {
      try {
        newCustomCodeNames = JSON.parse(newCustomCodeNamesJson);
      } catch (err) {
        console.error('Error parsing new custom code names:', err);
        throw new Error('Invalid custom code names format');
      }
    }

    // Get group details to check if it uses custom code names
    const groupDetails = await getGroupDetails(groupGuid, creatorCode);
    if (!groupDetails) {
      throw new Error('Group not found or invalid credentials');
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

    // Validate custom code names if group uses them
    if (groupDetails.use_custom_code_names) {
      // Get existing custom code names
      const existingCustomNames = await getCustomCodeNames(groupGuid, creatorCode);

      // Filter out empty new names
      const validNewNames = newCustomCodeNames ? newCustomCodeNames.filter(name => name.trim() !== '') : [];
      const totalCustomNames = existingCustomNames.length + validNewNames.length;

      // Always check that total custom names meet or exceed capacity
      if (totalCustomNames < capacity) {
        throw new Error(`You need at least ${capacity} custom code names to match the group capacity. Currently you have ${existingCustomNames.length} existing names and ${validNewNames.length} new names (total: ${totalCustomNames}).`);
      }

      // Check for uniqueness only when there are new names being added
      if (validNewNames.length > 0) {
        // Check for duplicate values in new names
        const uniqueNewNames = new Set(validNewNames.map(name => name.trim().toLowerCase()));
        if (uniqueNewNames.size !== validNewNames.length) {
          throw new Error('New custom code names must be unique. Please remove any duplicate names.');
        }

        // Check for duplicates between existing and new names
        const existingNamesLower = existingCustomNames.map(name => name.toLowerCase());
        const newNamesLower = validNewNames.map(name => name.trim().toLowerCase());
        const duplicateExists = newNamesLower.some(newName => existingNamesLower.includes(newName));
        if (duplicateExists) {
          throw new Error('Some new custom code names already exist. Please choose different names.');
        }

        // Update newCustomCodeNames to only include valid names for the database call
        newCustomCodeNames = validNewNames;
      }
    }

    // Call the update_group function
    const { error } = await supabase.rpc("update_group", {
      p_group_guid: groupGuid,
      p_password: password,
      p_capacity: capacity,
      p_is_open: isOpen,
      p_expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      p_creator_code: creatorCode,
      p_additional_custom_code_names: newCustomCodeNames,
    });

    if (error) {
      console.error("Error updating group:", error);
      throw new Error(error.message || 'Failed to update group');
    }

    return true;
  } catch (error) {
    console.error("Failed to update group:", error);
    throw error;
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
      console.error('Error joining group as admin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to join group as admin:', error);
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

export async function getCustomCodeNames(groupGuid: string, creatorCode: string): Promise<string[]> {
  const supabase = await getClient();

  try {
    // Call the get_custom_code_names function
    const { data: customNames, error } = await supabase
      .rpc('get_custom_code_names', {
        p_group_guid: groupGuid,
        p_creator_code: creatorCode
      });

    if (error) {
      console.error('Error fetching custom code names:', error);
      return [];
    }

    // Extract names from the result
    return customNames?.map((item: { name: string }) => item.name) || [];
  } catch (error) {
    console.error('Failed to fetch custom code names:', error);
    return [];
  }
}