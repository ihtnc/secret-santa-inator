"use server";

import { getClient } from "@/utilities/supabase/server";

// Common result type for server actions
type ActionResult = {
  success: boolean;
  error?: string;
  data?: string;
};

export async function restoreCreatorCode(formData: FormData): Promise<ActionResult> {
  const supabase = await getClient();

  // Extract form data
  const backupGuid = formData.get("backupGuid") as string;
  const password = formData.get("password") as string;
  const currentGuid = formData.get("currentGuid") as string;

  // Validate required fields
  if (!backupGuid || backupGuid.trim().length === 0) {
    return { success: false, error: "Backup code is required" };
  }

  if (!password || password.trim().length === 0) {
    return { success: false, error: "Password is required" };
  }

  if (!currentGuid || currentGuid.trim().length === 0) {
    return { success: false, error: "Current GUID is required" };
  }

  try {
    // Call the restore_creator_code function
    const { data, error: restoreError } = await supabase.rpc("restore_creator_code", {
      p_backup_guid: backupGuid,
      p_password: password,
      p_current_guid: currentGuid,
    });

    if (restoreError) {
      console.error("Error restoring creator code:", restoreError);
      return { success: false, error: restoreError.message || "Failed to restore data" };
    }

    // Return success with the restored creator code
    return {
      success: true,
      data: data // This is the creator code returned by the function
    };

  } catch (error) {
    console.error("Failed to restore creator code:", error);
    return { success: false, error: "An unexpected error occurred while restoring data" };
  }
}