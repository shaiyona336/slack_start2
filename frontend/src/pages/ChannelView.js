import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaHashtag, FaInfoCircle, FaUserPlus } from 'react-icons/fa';
import Sidebar from '../components/layout/Sidebar';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import { useAuth } from '../contexts/AuthContext';
import ChannelsAPI from '../api/channels';
import MessagesAPI from '../api/messages';
import socketService from '../api/socket';
import InviteUserModal from '../components/modals/InviteUserModal';

const ChannelView = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch channel data
  useEffect(() => {
    const fetchChannel = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ChannelsAPI.getChannel(channelId);
        if (result.success) {
          setChannel(result.channel);
        } else {
          setError(result.message || 'Failed to fetch channel');
        }
      } catch (err) {
        setError('Error fetching channel');
        console.error('Channel fetch error:', err);
      }
    };

    fetchChannel();
  }, [channelId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!channelId) return;

      setLoading(true);
      setError(null);
      try {
        const result = await MessagesAPI.getChannelMessages(channelId, 1);
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
  }, [channelId]);

  // Join socket.io channel room
  useEffect(() => {
    if (channelId) {
      socketService.joinChannel(channelId);
    }

    return () => {
      if (channelId) {
        socketService.leaveChannel(channelId);
      }
    };
  }, [channelId]);

  // Socket event listeners
  useEffect(() => {
    // New message handler
    const handleNewMessage = (data) => {
      if (data.message.channel_id === parseInt(channelId)) {
        setMessages(prevMessages => [data.message, ...prevMessages]);
      }
    };

    // Typing indicator handler
    const handleUserTyping = (data) => {
      if (data.channel_id === parseInt(channelId) && data.user_id !== user?.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });
      }
    };

    // Stopped typing handler
    const handleUserStoppedTyping = (data) => {
      if (data.channel_id === parseInt(channelId)) {
        setTypingUsers(prev => prev.filter(id => id !== data.user_id));
      }
    };

    // Register socket events
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('user_stopped_typing', handleUserStoppedTyping);

    // Cleanup
    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [channelId, user?.id]);

  // Load more messages
  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;

    try {
      const nextPage = page + 1;
      const result = await MessagesAPI.getChannelMessages(channelId, nextPage);
      
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
      await MessagesAPI.sendChannelMessage(channelId, content);
      // Message will be added via socket event
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const toggleInviteModal = () => {
    setShowInviteModal(!showInviteModal);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaHashtag className="text-gray-500 mr-2" />
            <h1 className="font-bold text-xl">{channel?.name || 'Loading...'}</h1>
            {channel?.description && (
              <div className="ml-4 text-gray-600 text-sm border-l border-gray-300 pl-4">
                {channel.description}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              className="text-gray-600 hover:text-gray-800"
              title="Channel information"
            >
              <FaInfoCircle size={18} />
            </button>
            <button
              className="text-gray-600 hover:text-gray-800"
              title="Invite users to channel"
              onClick={toggleInviteModal}
            >
              <FaUserPlus size={18} />
            </button>
          </div>
        </header>
        
        {/* Channel Content */}
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
                currentUser={user}
              />
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-1 text-xs text-gray-500">
                  {typingUsers.length === 1
                    ? 'Someone is typing...'
                    : `${typingUsers.length} people are typing...`}
                </div>
              )}
              
              <MessageInput
                onSendMessage={handleSendMessage}
                channelId={channelId}
                isChannel={true}
                disabled={loading}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          channelId={channelId}
          onClose={toggleInviteModal}
          channelName={channel?.name}
        />
      )}
    </div>
  );
};

export default ChannelView;