"use server";

import { getClient } from "@/utilities/supabase/server";

// Common result type for server actions
type ActionResult = {
  success: boolean;
  error?: string;
  data?: string;
};

export async function backupCreatorCode(formData: FormData): Promise<ActionResult> {
  const supabase = await getClient();

  // Extract form data
  const creatorCode = formData.get("creatorCode") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate required fields
  if (!creatorCode || creatorCode.trim().length === 0) {
    return { success: false, error: "Creator code is required" };
  }

  if (!password || password.trim().length === 0) {
    return { success: false, error: "Password is required" };
  }

  if (!confirmPassword || confirmPassword.trim().length === 0) {
    return { success: false, error: "Password confirmation is required" };
  }

  // Validate password match
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }



  try {
    // Call the backup_creator_code function
    const { data, error: backupError } = await supabase.rpc("backup_creator_code", {
      p_creator_code: creatorCode,
      p_password: password,
    });

    if (backupError) {
      console.error("Error backing up creator code:", backupError);
      return { success: false, error: backupError.message || "Failed to backup creator code" };
    }

    // Return success with the backup GUID
    return {
      success: true,
      data: data // This is the backup GUID returned by the function
    };

  } catch (error) {
    console.error("Failed to backup creator code:", error);
    return { success: false, error: "An unexpected error occurred while backing up creator code" };
  }
}