import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import socketService from '../../api/socket';

const MessageInput = ({ 
  onSendMessage, 
  channelId, 
  chatId,
  isChannel = true,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [channelId, chatId]);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      if (isChannel) {
        socketService.sendTypingChannel(channelId);
      } else {
        socketService.sendTypingDirect(chatId);
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to indicate user stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (isChannel) {
          socketService.sendStoppedTypingChannel(channelId);
        } else {
          socketService.sendStoppedTypingDirect(chatId);
        }
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, isChannel, channelId, chatId]);

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Indicate stopped typing
      if (isTyping) {
        setIsTyping(false);
        if (isChannel) {
          socketService.sendStoppedTypingChannel(channelId);
        } else {
          socketService.sendStoppedTypingDirect(chatId);
        }
      }
    }
  };

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type a message${isChannel ? ' to the channel' : ''}...`}
            className="w-full border border-gray-300 rounded-lg py-2 px-4 pr-24 resize-none focus:outline-none focus:border-blue-500"
            rows={1}
            disabled={disabled}
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />
          
          <div className="absolute right-2 flex space-x-2">
            <div className="relative">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
              >
                <FaSmile size={20} />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-10 right-0 z-10">
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
            </div>
            
            <button
              type="submit"
              className={`text-blue-500 hover:text-blue-700 p-1 ${
                !message.trim() || disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!message.trim() || disabled}
            >
              <FaPaperPlane size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;