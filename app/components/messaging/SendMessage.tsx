"use client";

import { useState, useEffect, useCallback } from "react";
import { sendMessage, getMessageHistory, markMessagesAsRead, getUnreadMessageCount } from "./actions";
import supabase from "@/utilities/supabase/browser";

interface Message {
  id: number | null;
  message: string;
  is_group_message: boolean;
  is_read: boolean;
  created_date: string;
  sender_name: string;
  recipient_name: string;
}

interface SendMessageProps {
  groupCode: string;
  senderCode: string;
  className?: string;
  messageType?: 'FromAdmin' | 'FromSecretSanta' | 'ToSecretSanta';
  hideIcon?: boolean;
  compactView?: boolean;
  placeholder?: string;
  onMessageCountUpdate?: (unreadCount: number, totalCount: number) => void;
}

interface MessageCounts {
  unread_count: number;
  total_count: number;
}

// Helper function for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Shared message rendering component
const MessageBubble = ({ msg, index, formatDate }: { msg: Message, index: number, formatDate: (dateString: string) => string }) => {
  const isMyMessage = msg.sender_name === 'You';
  const isGroupMessage = msg.is_group_message;
  const isFromAdmin = msg.sender_name === 'Admin';
  const isFromGiftee = msg.sender_name !== 'You' && msg.sender_name !== 'Admin' && msg.sender_name !== 'Secret Santa' && !isGroupMessage;
  const isFromSecretSanta = msg.sender_name === 'Secret Santa';

  // Determine background color based on message type
  let backgroundColor;

  if (isMyMessage) {
    backgroundColor = undefined; // User messages have no background
  } else if (isFromAdmin || isGroupMessage) {
    backgroundColor = 'var(--color-group-message)'; // Admin messages use group message color
  } else if (isFromGiftee) {
    backgroundColor = 'var(--color-santa-giving-message)'; // Messages from giftee
  } else if (isFromSecretSanta) {
    backgroundColor = 'var(--color-santa-receiving-message)'; // Messages from Secret Santa
  }

  return (
    <div key={msg.id || `group-${index}`} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
        isMyMessage ? 'ml-4 text-primary' : 'mr-4 text-white'
      }`} style={{
        backgroundColor: backgroundColor
      }}>
        {/* Sender info for non-self messages */}
        {!isMyMessage && (
          <div className="text-xs opacity-75 mb-1 font-medium">
            {msg.sender_name}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm">
          {msg.message}
        </div>

        {/* Timestamp and read status */}
        <div className={`text-xs mt-1 ${isMyMessage ? 'text-right' : 'text-left'} opacity-75`}>
          <span>{formatDate(msg.created_date)}</span>
          {isMyMessage && (
            <span className="ml-1">
              {msg.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Shared message list rendering
const MessageList = ({ allMessages, loadingHistory, formatDate }: {
  allMessages: Message[],
  loadingHistory: boolean,
  formatDate: (dateString: string) => string
}) => (
  <div className="p-3 space-y-4 max-h-80 overflow-y-auto" data-messages-container>
    {loadingHistory ? (
      <div className="text-center text-muted text-sm py-4">
        Loading messages...
      </div>
    ) : allMessages.length > 0 ? (
      // Reverse messages to show oldest first (like a chat)
      allMessages.slice().reverse().map((msg, index) => (
        <MessageBubble key={msg.id || `group-${index}`} msg={msg} index={index} formatDate={formatDate} />
      ))
    ) : (
      <div className="text-center text-muted text-sm py-4">
        No messages yet. Start the conversation!
      </div>
    )}
  </div>
);

// Shared popup header
const PopupHeader = ({ loadMessageHistory, handleClose, totalCount }: {
  loadMessageHistory: () => void,
  handleClose: () => void,
  totalCount?: number
}) => (
  <div className="flex justify-between items-center p-3 border-b-2 border-accent bg-surface">
    <h3 className="text-sm font-medium text-primary">
      Messages{totalCount && totalCount > 0 ? ` (${totalCount})` : ''}
    </h3>
    <div className="flex items-center space-x-1">
      <button
        onClick={loadMessageHistory}
        className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
        title="Refresh messages"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={handleClose}
        className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
        title="Close"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);

// Shared message form
const MessageForm = ({
  message,
  setMessage,
  handleSubmit,
  handleTextboxClick,
  isSubmitting,
  hideIcon,
  compactView,
  groupCode,
  senderCode,
  messageType,
  placeholder = "Type a message..."
}: {
  message: string,
  setMessage: (message: string) => void,
  handleSubmit: (formData: FormData) => Promise<void>,
  handleTextboxClick?: () => Promise<void>,
  isSubmitting: boolean,
  hideIcon: boolean,
  compactView: boolean,
  groupCode: string,
  senderCode: string,
  messageType?: 'FromAdmin' | 'FromSecretSanta' | 'ToSecretSanta',
  placeholder?: string
}) => (
  <form action={handleSubmit} className="space-y-3">
    {/* Hidden fields */}
    <input type="hidden" name="groupGuid" value={groupCode} />
    <input type="hidden" name="senderCode" value={senderCode} />
    <input type="hidden" name="isGroupMessage" value={messageType === 'FromAdmin' ? 'true' : 'false'} />
    <input type="hidden" name="messageToSecretSanta" value={messageType === 'ToSecretSanta' ? 'true' : 'false'} />

    {/* Message input area */}
    <div className="relative flex items-center">
      <input
        type="text"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onClick={!compactView ? handleTextboxClick : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isSubmitting && message.trim()) {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
              const formData = new FormData(form);
              handleSubmit(formData);
            }
          }
        }}
        placeholder={placeholder}
        required
        disabled={isSubmitting}
        maxLength={150}
        autoComplete="off"
        data-regular-input={!compactView ? "" : undefined}
        className={`input-primary w-full px-3 py-2 ${hideIcon ? 'pr-3' : 'pr-12'} rounded-md text-primary placeholder:text-muted disabled:opacity-50`}
      />

      {/* Send button inside textbox */}
      {!hideIcon && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-secondary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Send message"
        >
          {isSubmitting ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      )}
    </div>

    <p className="text-xs text-muted mt-1">
      Message is required (max 150 characters)
    </p>
  </form>
);

export function SendMessage({
  groupCode,
  senderCode,
  className = "",
  messageType,
  hideIcon = false,
  compactView = false,
  placeholder = "Type a message...",
  onMessageCountUpdate
}: SendMessageProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [messageCounts, setMessageCounts] = useState<MessageCounts>({ unread_count: 0, total_count: 0 });

  // Helper function to update message counts
  const updateMessageCounts = useCallback((newCounts: MessageCounts | ((prev: MessageCounts) => MessageCounts)) => {
    setMessageCounts(prev => {
      const finalCounts = typeof newCounts === 'function' ? newCounts(prev) : newCounts;
      return finalCounts;
    });
  }, []);

  // Trigger callback when message counts change
  useEffect(() => {
    onMessageCountUpdate?.(messageCounts.unread_count, messageCounts.total_count);
  }, [messageCounts.unread_count, messageCounts.total_count, onMessageCountUpdate]);

  // Calculate unread messages
  const hasUnreadMessages = hasLoadedHistory
    ? allMessages.some(msg => !msg.is_read && msg.sender_name !== 'You')
    : messageCounts.unread_count > 0;

  // Load initial message counts when component mounts
  useEffect(() => {
    const loadInitialMessageCounts = async () => {
      if (!hasLoadedHistory) {
        try {
          let result;
          if (messageType === 'FromAdmin') {
            result = await getUnreadMessageCount(groupCode, senderCode, true, false);
          } else if (messageType === 'FromSecretSanta') {
            result = await getUnreadMessageCount(groupCode, senderCode, false, true);
          } else if (messageType === 'ToSecretSanta') {
            result = await getUnreadMessageCount(groupCode, senderCode, false, false);
          }

          if (result?.success && result.data) {
            const counts = result.data as MessageCounts;
            updateMessageCounts(counts);
          }
        } catch (error) {
          console.error('Error loading initial message counts:', error);
        }
      }
    };

    loadInitialMessageCounts();
  }, [groupCode, senderCode, messageType, hasLoadedHistory, updateMessageCounts]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && allMessages.length > 0) {
      setTimeout(() => {
        const messagesContainer = compactView
          ? document.querySelector('[data-compact-popup] [data-messages-container]')
          : document.querySelector('[data-regular-popup] [data-messages-container]');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
  }, [allMessages.length, isExpanded, compactView]);

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isExpanded) return;

      const target = event.target as Element;
      const popup = compactView
        ? document.querySelector('[data-compact-popup]')
        : document.querySelector('[data-regular-popup]');
      const trigger = compactView
        ? document.querySelector('[data-compact-button]')
        : document.querySelector('[data-regular-input]');
      const icon = compactView
        ? document.querySelector('[data-compact-button]')
        : document.querySelector('[data-regular-icon]');
      const unreadCountButton = compactView
        ? document.querySelector('[data-compact-button]')?.nextElementSibling as Element
        : null;
      const sendButton = compactView
        ? document.querySelector('[data-compact-popup] button[type="submit"]')
        : document.querySelector('[data-regular-input]')?.parentElement?.querySelector('button[type="submit"]');

      if (popup && trigger && !popup.contains(target) && !trigger.contains(target) && (!icon || !icon.contains(target)) && (!unreadCountButton || !unreadCountButton.contains(target)) && (!sendButton || !sendButton.contains(target))) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, compactView]);

  // Real-time subscription for message updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    // Subscribe for all message types
    if (messageType === 'ToSecretSanta' || messageType === 'FromSecretSanta' || messageType === 'FromAdmin') {
      const topic = messageType === 'FromAdmin'
        ? `from_admin:${senderCode}`  // Group admins use from_admin channel
        : messageType === 'ToSecretSanta'
        ? `to_secret_santa:${senderCode}`
        : `from_secret_santa:${senderCode}`;

      channel = supabase
        .channel(topic)
        .on('broadcast', { event: 'new_message' }, async (payload) => {
          if (payload.payload) {
            const newMessage = payload.payload as Message;

            // Add to history if loaded
            if (hasLoadedHistory) {
              setAllMessages(prevMessages => {
                const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
                if (!messageExists && newMessage.id) {
                  const updatedMessages = [...prevMessages, newMessage];
                  updatedMessages.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

                  // Update total count when adding to loaded history
                  updateMessageCounts(prev => ({
                    ...prev,
                    total_count: updatedMessages.length
                  }));

                  return updatedMessages;
                }
                return prevMessages;
              });

              // Mark as read if popup is expanded and it's not our message
              if (isExpanded && newMessage.id && newMessage.sender_name !== 'You') {
                try {
                  await markMessagesAsRead(groupCode, senderCode, [newMessage.id]);
                  // The message_read event will handle updating the unread count
                } catch (error) {
                  console.error('Failed to mark new message as read:', error);
                }
              } else if (!isExpanded && newMessage.sender_name !== 'You') {
                // If popup is closed and it's an incoming message, increment unread count
                updateMessageCounts(prev => ({
                  ...prev,
                  unread_count: prev.unread_count + 1
                }));
              }
            } else {
              // Update counts when history not loaded
              if (newMessage.sender_name !== 'You') {
                // Increment unread count for incoming messages
                updateMessageCounts(prev => ({
                  unread_count: prev.unread_count + 1,
                  total_count: prev.total_count + 1
                }));
              } else {
                // Just increment total count for outgoing messages
                updateMessageCounts(prev => ({
                  ...prev,
                  total_count: prev.total_count + 1
                }));
              }
            }
          }
        })
        .on('broadcast', { event: 'read_message' }, (payload) => {
          if (payload.payload?.message_id) {
            const messageId = payload.payload.message_id;

            if (hasLoadedHistory) {
              setAllMessages(prevMessages => {
                const updatedMessages = prevMessages.map(msg =>
                  msg.id === messageId ? { ...msg, is_read: true } : msg
                );

                // Recalculate unread count from updated messages
                const newUnreadCount = updatedMessages.filter(msg => !msg.is_read && msg.sender_name !== 'You').length;
                updateMessageCounts(prev => ({
                  ...prev,
                  unread_count: newUnreadCount
                }));

                return updatedMessages;
              });
            } else {
              // Decrement unread count when history not loaded
              updateMessageCounts(prev => ({
                ...prev,
                unread_count: Math.max(0, prev.unread_count - 1)
              }));
            }
          }
        })
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [messageType, senderCode, compactView, groupCode, isExpanded, hasLoadedHistory, updateMessageCounts]);

  const loadMessageHistory = async () => {
    setLoadingHistory(true);

    try {
      let result;

      if (messageType === 'FromAdmin') {
        result = await getMessageHistory(groupCode, senderCode, true, false);
      } else if (messageType === 'FromSecretSanta') {
        result = await getMessageHistory(groupCode, senderCode, false, true);
      } else if (messageType === 'ToSecretSanta') {
        result = await getMessageHistory(groupCode, senderCode, false, false);
      }

      if (result?.success && result.data) {
        const messagesList = result.data as Message[];
        messagesList.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        setAllMessages(messagesList);
        setHasLoadedHistory(true);
        return messagesList;
      } else {
        setAllMessages([]);
        setHasLoadedHistory(true);
        return [];
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setAllMessages([]);
      setHasLoadedHistory(true);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle expanding the popup
  const handleExpand = async () => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);

    if (willExpand) {
      let messagesToProcess;

      // Load message history when expanding if we haven't loaded it yet
      if (!hasLoadedHistory) {
        messagesToProcess = await loadMessageHistory();
      } else {
        messagesToProcess = allMessages;
      }

      // Mark unread messages as read
      const unreadMessages = messagesToProcess.filter(msg => !msg.is_read && msg.sender_name !== 'You');
      const unreadMessageIds = unreadMessages.map(msg => msg.id).filter((id): id is number => id !== null);

      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(groupCode, senderCode, unreadMessageIds)
          .catch(error => console.error('Failed to mark messages as read:', error));
      }
    }
  };

  const handleTextboxClick = async () => {
    if (!compactView && !isExpanded) {
      await handleExpand();
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await sendMessage(formData);

      if (result.success) {
        setMessage('');
        // Wait for real-time event to add message to history
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setStatusMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact view
  if (compactView) {
    return (
      <div className={`${className} relative flex items-center space-x-2`}>
        <button
          onClick={handleExpand}
          data-compact-button
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content hover:bg-primary/90 transition-colors duration-200 cursor-pointer relative shrink-0 shadow-md"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--color-group-message)' }}></span>
          )}
        </button>

        {/* Unread count display for compact view */}
        {messageCounts.total_count > 0 && (
          <button
            onClick={handleExpand}
            className="text-sm text-primary whitespace-nowrap cursor-pointer hover:text-secondary transition-colors"
          >
            {messageCounts.unread_count > 0
              ? `${messageCounts.unread_count} new`
              : messageCounts.total_count === 1
                ? '1 message'
                : `${messageCounts.total_count} messages`
            }
          </button>
        )}

        {/* Compact view expanded content */}
        {isExpanded && (
          <div data-compact-popup className="absolute bottom-12 left-0 z-50 bg-card border-2 border-accent rounded-md shadow-xl min-w-96 ring-1 ring-black ring-opacity-5">
            <PopupHeader loadMessageHistory={loadMessageHistory} handleClose={handleClose} totalCount={messageCounts.total_count} />
            <MessageList allMessages={allMessages} loadingHistory={loadingHistory} formatDate={formatDate} />
            {!hideIcon && (
              <div className="border-t-2 border-accent p-3">
                <MessageForm
                  message={message}
                  setMessage={setMessage}
                  handleSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  hideIcon={hideIcon}
                  compactView={compactView}
                  groupCode={groupCode}
                  senderCode={senderCode}
                  messageType={messageType}
                  placeholder={placeholder}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular view
  return (
    <div className={`relative space-y-4 ${className}`}>
      {/* Status message display */}
      {statusMessage && (
        <div className="px-4 py-2 rounded-md text-sm bg-error text-error-content">
          {statusMessage}
        </div>
      )}

      {/* Chat Messages Section (shown when expanded) */}
      {isExpanded && (
        <div data-regular-popup className="absolute bottom-full left-0 right-0 mb-2 border-2 border-accent rounded-md bg-card shadow-xl z-10 ring-1 ring-black ring-opacity-5">
          <PopupHeader loadMessageHistory={loadMessageHistory} handleClose={handleClose} totalCount={messageCounts.total_count} />
          <MessageList allMessages={allMessages} loadingHistory={loadingHistory} formatDate={formatDate} />
        </div>
      )}

      {/* Messaging Interface with Icon and Textbox */}
      <div className="flex items-start space-x-3">
        {/* Messaging Icon with Unread Indicator */}
        <button
          onClick={() => {
            if (isExpanded) {
              setIsExpanded(false);
            } else {
              handleExpand();
            }
          }}
          data-regular-icon
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content hover:bg-primary/90 transition-colors duration-200 cursor-pointer relative shrink-0 border-2 border-accent mt-0.5"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--color-group-message)' }}></span>
          )}
        </button>

        {/* Send Message Form */}
        <div className="flex-1">
          <MessageForm
            message={message}
            setMessage={setMessage}
            handleSubmit={handleSubmit}
            handleTextboxClick={handleTextboxClick}
            isSubmitting={isSubmitting}
            hideIcon={hideIcon}
            compactView={compactView}
            groupCode={groupCode}
            senderCode={senderCode}
            messageType={messageType}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}