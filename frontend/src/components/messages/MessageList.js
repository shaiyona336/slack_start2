import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import MessageItem from './MessageItem';

const MessageList = ({ 
  messages, 
  loading, 
  error, 
  hasMore, 
  loadMoreMessages, 
  isChannel = true,
  currentUser
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  // Detect if user is scrolled to bottom
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const bottom = Math.floor(scrollHeight - scrollTop) <= clientHeight + 50;
      setIsAtBottom(bottom);

      // Load more messages when scrolled to top
      if (scrollTop === 0 && hasMore && !loading) {
        loadMoreMessages();
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLength && isAtBottom) {
      scrollToBottom();
    }
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength, isAtBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};

    messages.forEach(message => {
      const date = new Date(message.created_at);
      const dateString = format(date, 'MMMM d, yyyy');

      if (!groups[dateString]) {
        groups[dateString] = [];
      }

      groups[dateString].push(message);
    });

    return groups;
  };

  // Empty state
  if (!loading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-gray-500">
        <p>No messages yet</p>
        <p className="text-sm">This is the beginning of your conversation</p>
      </div>
    );
  }

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <p className="text-red-500">Error loading messages: {error}</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4" 
      onScroll={handleScroll}
    >
      {/* Loading indicator when fetching more messages */}
      {loading && hasMore && (
        <div className="text-center py-2">
          <p className="text-gray-500 text-sm">Loading more messages...</p>
        </div>
      )}

      {/* Messages grouped by date */}
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date divider */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-xs text-gray-500">{date}</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Messages for this date */}
          <div className="space-y-4">
            {dateMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUser?.id}
                isChannel={isChannel}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Scroll to bottom reference element */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;