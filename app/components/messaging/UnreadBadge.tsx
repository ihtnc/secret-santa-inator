import Badge from "@/app/components/Badge";

export function UnreadBadge({
  count,
  messageType,
  className = ""
}: {
  count: number;
  messageType: 'FromAdmin' | 'FromSecretSanta' | 'FromGiftee';
  className?: string;
}) {
  if (count === 0) {
    return null;
  }

  // Define colors for different message types
  const getMessageTypeColor = (type: typeof messageType) => {
    switch (type) {
      case 'FromAdmin':
        return 'var(--color-group-message)';
      case 'FromSecretSanta':
        return 'var(--color-santa-receiving-message)';
      case 'FromGiftee':
        return 'var(--color-santa-giving-message)';
      default:
        return 'var(--color-group-message)';
    }
  };

  return (
    <Badge
      variant="info"
      size="sm"
      className={className}
      style={{ 
        backgroundColor: getMessageTypeColor(messageType),
        color: 'white'
      }}
    >
      {count} New
    </Badge>
  );
}