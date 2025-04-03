import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaSmile, FaEdit, FaTrash } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import MessagesAPI from '../../api/messages';

const MessageItem = ({ message, isOwnMessage, isChannel }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format timestamp
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Format date if needed (for hovering)
  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'MMMM d, yyyy h:mm a');
  };

  // Handle emoji selection
  const handleEmojiClick = async (emojiData) => {
    setShowEmojiPicker(false);
    setLoading(true);
    setError(null);

    try {
      await MessagesAPI.addReaction(message.id, emojiData.emoji);
    } catch (err) {
      setError('Failed to add reaction');
      console.error('Error adding reaction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group reactions by emoji
  const groupReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return [];
    }

    const groups = {};
    message.reactions.forEach(reaction => {
      if (!groups[reaction.reaction]) {
        groups[reaction.reaction] = {
          emoji: reaction.reaction,
          count: 0,
          users: []
        };
      }
      
      groups[reaction.reaction].count += 1;
      groups[reaction.reaction].users.push(reaction.user_id);
    });

    return Object.values(groups);
  };

  const groupedReactions = groupReactions();

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3/4 ${isOwnMessage ? 'bg-blue-50' : 'bg-white'} rounded-lg shadow p-3`}>
        {/* Message header with sender info and timestamp */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
              {message.sender?.avatar_url ? (
                <img 
                  src={message.sender.avatar_url} 
                  alt={message.sender.display_name || message.sender.username} 
                  className="w-8 h-8 rounded-full" 
                />
              ) : (
                <span>
                  {(message.sender?.display_name || message.sender?.username || 'U')?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <span className="font-semibold text-sm">
                {message.sender?.display_name || message.sender?.username || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-500 ml-2" title={formatDate(message.created_at)}>
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>
          
          {isOwnMessage && (
            <div className="flex space-x-2">
              <button 
                className="text-gray-400 hover:text-gray-600"
                title="Edit message"
              >
                <FaEdit size={12} />
              </button>
              <button 
                className="text-gray-400 hover:text-red-600"
                title="Delete message"
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="text-gray-800 mb-2 break-words">
          {message.content}
          {message.is_edited && (
            <span className="text-xs text-gray-500 ml-1">(edited)</span>
          )}
        </div>

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {groupedReactions.map((reaction, index) => (
              <div 
                key={index} 
                className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-gray-200"
                title={`${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}`}
              >
                <span>{reaction.emoji}</span>
                <span className="ml-1">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reaction button and emoji picker */}
        <div className="relative mt-1">
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={loading}
          >
            <FaSmile size={16} />
          </button>

          {showEmojiPicker && (
            <div className="absolute z-10 bottom-8 left-0">
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                disableAutoFocus={true}
                searchDisabled={true}
                skinTonesDisabled={true}
                width={300}
                height={400}
              />
            </div>
          )}

          {error && (
            <span className="text-xs text-red-500 ml-2">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;