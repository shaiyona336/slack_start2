import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCircle } from 'react-icons/fa';
import Sidebar from '../components/layout/Sidebar';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import { useAuth } from '../contexts/AuthContext';
import ChannelsAPI from '../api/channels';
import MessagesAPI from '../api/messages';
import socketService from '../api/socket';

const DirectMessageView = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Fetch direct message chat data
  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get all DMs
        const result = await ChannelsAPI.getUserDirectMessages();
        if (result.success) {
          // Find the specific chat
          const foundChat = result.direct_messages.find(
            dm => dm.id === parseInt(chatId)
          );
          
          if (foundChat) {
            setChat(foundChat);
            // Get the other user(s) in the chat
            if (foundChat.other_participants && foundChat.other_participants.length > 0) {
              setOtherUser(foundChat.other_participants[0]);
            }
          } else {
            setError('Chat not found');
          }
        } else {
          setError(result.message || 'Failed to fetch chat');
        }
      } catch (err) {
        setError('Error fetching chat');
        console.error('Chat fetch error:', err);
      }
    };

    fetchChat();
  }, [chatId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;

      setLoading(true);
      setError(null);
      try {
        const result = await MessagesAPI.getDirectMessages(chatId, 1);
        if (result.success) {
          setMessages(result.messages);
          setHasMore(result.current_page < result.pages);
          setPage(1);
        } else {
          setError(result.message || 'Failed to fetch messages');
        }
      } catch (err) {
        setError('Error fetching messages');
        console.error('Messages fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  // Socket event listeners
  useEffect(() => {
    // New message handler
    const handleNewMessage = (data) => {
      if (data.message.direct_message_chat_id === parseInt(chatId)) {
        setMessages(prevMessages => [data.message, ...prevMessages]);
      }
    };

    // Typing indicator handler
    const handleUserTyping = (data) => {
      if (data.chat_id === parseInt(chatId) && data.is_direct && data.user_id !== user?.id) {
        setIsTyping(true);
      }
    };

    // Stopped typing handler
    const handleUserStoppedTyping = (data) => {
      if (data.chat_id === parseInt(chatId) && data.is_direct) {
        setIsTyping(false);
      }
    };

    // Register socket events
    socketService.on('new_direct_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stopped_typing', handleUserStoppedTyping);

    // Cleanup
    return () => {
      socketService.off('new_direct_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [chatId, user?.id]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;

    try {
      const nextPage = page + 1;
      const result = await MessagesAPI.getDirectMessages(chatId, nextPage);
      
      if (result.success) {
        setMessages(prevMessages => [...prevMessages, ...result.messages]);
        setHasMore(result.current_page < result.pages);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    }
  };

  // Send message
  const handleSendMessage = async (content) => {
    try {
      await MessagesAPI.sendDirectMessage(chatId, content);
      // Message will be added via socket event
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {otherUser ? (
              <>
                <div className="relative mr-3">
                  {otherUser.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt={otherUser.display_name || otherUser.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {(otherUser.display_name || otherUser.username).charAt(0)}
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ${
                    otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                </div>
                <div>
                  <h1 className="font-bold text-xl">{otherUser.display_name || otherUser.username}</h1>
                  <p className="text-xs text-gray-500 flex items-center">
                    {otherUser.status === 'online' ? (
                      <>
                        <FaCircle className="text-green-500 mr-1" size={8} />
                        Online
                      </>
                    ) : (
                      <>
                        <FaCircle className="text-gray-400 mr-1" size={8} />
                        Offline
                      </>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <h1 className="font-bold text-xl">Direct Message</h1>
            )}
          </div>
        </header>
        
        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <MessageList
                messages={messages}
                loading={loading}
                error={error}
                hasMore={hasMore}
                loadMoreMessages={loadMoreMessages}
                isChannel={false}
                currentUser={user}
              />
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="px-4 py-1 text-xs text-gray-500">
                  {otherUser?.display_name || otherUser?.username || 'User'} is typing...
                </div>
              )}
              
              <MessageInput
                onSendMessage={handleSendMessage}
                chatId={chatId}
                isChannel={false}
                disabled={loading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessageView;