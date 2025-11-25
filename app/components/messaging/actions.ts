"use server";

import { getClient } from "@/utilities/supabase/server";

// Common result type for server actions
type ActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

/**
 * Messaging Actions
 *
 * Group Messages: Always use sender_id = NULL (simplified approach)
 * Individual Messages: Use actual sender_id from members table
 *
 * Only group creators/admins can send group messages.
 * Individual messages require sender to be a member of the group.
 */

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const supabase = await getClient();

  // Extract form data
  const groupGuid = formData.get("groupGuid") as string;
  const senderCode = formData.get("senderCode") as string;
  const isGroupMessage = formData.get("isGroupMessage") === "true";
  const messageToSecretSanta = formData.get("messageToSecretSanta") === "true";
  const message = formData.get("message") as string;

  // Validate required fields
  if (!groupGuid || groupGuid.trim().length === 0) {
    return { success: false, error: "Group GUID is required" };
  }

  if (!senderCode || senderCode.trim().length === 0) {
    return { success: false, error: "Sender code is required" };
  }

  if (!message || message.trim().length === 0) {
    return { success: false, error: "Message is required" };
  }

  try {
    // Call the send_message function
    const { error: sendError } = await supabase.rpc("send_message", {
      p_group_guid: groupGuid,
      p_sender_code: senderCode,
      p_message: message,
      p_is_group_message: isGroupMessage,
      p_message_to_secret_santa: messageToSecretSanta,
    });

    if (sendError) {
      console.error("Error sending message:", sendError);
      return { success: false, error: sendError.message || "Failed to send message" };
    }

    return { success: true };

  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "An unexpected error occurred while sending message" };
  }
}

export async function getMessageHistory(
  groupGuid: string,
  memberCode: string,
  isGroupMessage: boolean = false,
  isFromSecretSanta: boolean = false
): Promise<ActionResult> {
  const supabase = await getClient();

  // Validate required fields
  if (!groupGuid || groupGuid.trim().length === 0) {
    return { success: false, error: "Group GUID is required" };
  }

  if (!memberCode || memberCode.trim().length === 0) {
    return { success: false, error: "Member code is required" };
  }

  try {
    // Call the get_message_history function
    const { data, error: historyError } = await supabase.rpc("get_message_history", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
      p_is_group_message: isGroupMessage,
      p_is_from_secret_santa: isFromSecretSanta,
    });

    if (historyError) {
      console.error("Error getting message history:", historyError);
      return { success: false, error: historyError.message || "Failed to get message history" };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error("Failed to get message history:", error);
    return { success: false, error: "An unexpected error occurred while getting message history" };
  }
}

export async function getUnreadMessageCount(
  groupGuid: string,
  memberCode: string,
  isGroupMessage: boolean = false,
  isFromSecretSanta: boolean = false
): Promise<ActionResult> {
  const supabase = await getClient();

  // Validate required fields
  if (!groupGuid || groupGuid.trim().length === 0) {
    return { success: false, error: "Group GUID is required" };
  }

  if (!memberCode || memberCode.trim().length === 0) {
    return { success: false, error: "Member code is required" };
  }

  try {
    // Call the get_unread_message_count function
    const { data, error: countError } = await supabase.rpc("get_unread_message_count", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
      p_is_group_message: isGroupMessage,
      p_is_from_secret_santa: isFromSecretSanta,
    });

    if (countError) {
      console.error("Error getting unread message count:", countError);
      return { success: false, error: countError.message || "Failed to get unread message count" };
    }

    // The function now returns an array with one row: [{unread_count: number, total_count: number}]
    const result = Array.isArray(data) && data.length > 0 ? data[0] : { unread_count: 0, total_count: 0 };
    return { success: true, data: result };

  } catch (error) {
    console.error("Failed to get unread message count:", error);
    return { success: false, error: "An unexpected error occurred while getting unread message count" };
  }
}

export async function markMessagesAsRead(
  groupGuid: string,
  memberCode: string,
  messageIds: number[]
): Promise<ActionResult> {
  const supabase = await getClient();

  console.log("🔧 markMessagesAsRead action called with:", { groupGuid, memberCode, messageIds });

  // Validate required fields
  if (!groupGuid || groupGuid.trim().length === 0) {
    return { success: false, error: "Group GUID is required" };
  }

  if (!memberCode || memberCode.trim().length === 0) {
    return { success: false, error: "Member code is required" };
  }

  if (!messageIds || messageIds.length === 0) {
    console.log("🔧 No message IDs provided, skipping mark as read");
    return { success: false, error: "Message IDs are required" };
  }

  try {
    console.log("🔧 Calling supabase mark_messages_as_read function...");

    // Call the mark_messages_as_read function
    const { data, error: markError } = await supabase.rpc("mark_messages_as_read", {
      p_group_guid: groupGuid,
      p_member_code: memberCode,
      p_message_ids: messageIds,
    });

    console.log("🔧 Supabase function result:", { data, error: markError });

    if (markError) {
      console.error("Error marking messages as read:", markError);
      return { success: false, error: markError.message || "Failed to mark messages as read" };
    }

    console.log("🔧 Messages marked as read successfully");
    return { success: true };

  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return { success: false, error: "An unexpected error occurred while marking messages as read" };
  }
}

