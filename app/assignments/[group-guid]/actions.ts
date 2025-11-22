"use server";

import { getClient } from "@/utilities/supabase/server";

export interface SecretSantaAssignment {
  santaName: string;
  santaCodeName: string | null;
  receiverName: string;
  receiverCodeName: string | null;
}

interface AssignmentData {
  santa_name: string;
  santa_code_name: string | null;
  receiver_name: string;
  receiver_code_name: string | null;
}

export async function getAllSecretSantaAssignments(
  groupGuid: string,
  creatorCode: string
): Promise<SecretSantaAssignment[]> {
  const supabase = await getClient();

  try {
    // Call the get_all_secret_santa_relationships function
    const { data: assignments, error } = await supabase.rpc(
      "get_all_secret_santa_relationships",
      {
        p_group_guid: groupGuid,
        p_creator_code: creatorCode,
      }
    );

    if (error) {
      console.error("Error getting Secret Santa assignments:", error);
      return [];
    }

    // Transform the data to match our interface
    return (assignments || []).map((rel: AssignmentData) => ({
      santaName: rel.santa_name,
      santaCodeName: rel.santa_code_name,
      receiverName: rel.receiver_name,
      receiverCodeName: rel.receiver_code_name,
    }));
  } catch (error) {
    console.error("Failed to get Secret Santa assignments:", error);
    return [];
  }
}

export async function validateAdminAccess(
  groupGuid: string,
  creatorCode: string
): Promise<boolean> {
  const supabase = await getClient();

  try {
    // Check if the provided creatorCode matches the group's creator_code
    const { data: isCreator, error } = await supabase.rpc("is_creator", {
      p_group_guid: groupGuid,
      p_creator_code: creatorCode,
    });

    if (error) {
      console.error("Error validating admin access:", error);
      return false;
    }

    return isCreator || false;
  } catch (error) {
    console.error("Failed to validate admin access:", error);
    return false;
  }
}