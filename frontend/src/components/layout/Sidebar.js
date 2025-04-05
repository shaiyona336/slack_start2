import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChannelsAPI from '../../api/channels';
import { FaPlus, FaHashtag, FaCommentDots, FaSignOutAlt, FaCaretDown, FaCaretRight } from 'react-icons/fa';
import CreateChannelModal from '../modals/CreateChannelModal';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);
  const navigate = useNavigate();

  // Fetch channels and direct messages
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       // Fetch channels
  //       const channelsResult = await ChannelsAPI.getUserChannels();
  //       if (channelsResult.success) {
  //         setChannels(channelsResult.channels);
  //       }

  //       // Fetch direct messages
  //       const dmResult = await ChannelsAPI.getUserDirectMessages();
  //       if (dmResult.success) {
  //         setDirectMessages(dmResult.direct_messages);
  //       }
  //     } catch (err) {
  //       setError('Failed to load workspace data');
  //       console.error('Error loading sidebar data:', err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Attempting to fetch channels...");
        // Fetch channels
        const channelsResult = await ChannelsAPI.getUserChannels();
        console.log("Channels response:", channelsResult);
        if (channelsResult.success) {
          setChannels(channelsResult.channels);
        }
  
        console.log("Attempting to fetch direct messages...");
        // Fetch direct messages
        const dmResult = await ChannelsAPI.getUserDirectMessages();
        console.log("DM response:", dmResult);
        if (dmResult.success) {
          setDirectMessages(dmResult.direct_messages);
        }
      } catch (err) {
        console.error("Detailed error:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          console.error("Error status:", err.response.status);
        }
        setError('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleCreateChannel = () => {
    setShowCreateChannel(!showCreateChannel);
  };

  const toggleChannels = () => {
    setShowChannels(!showChannels);
  };

  const toggleDirectMessages = () => {
    setShowDirectMessages(!showDirectMessages);
  };

  const handleChannelCreated = (newChannel) => {
    setChannels([...channels, newChannel]);
    setShowCreateChannel(false);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="w-64 bg-gray-800 text-white h-screen flex flex-col p-4">
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-64 bg-gray-800 text-white h-screen flex flex-col p-4">
        <div className="flex justify-center items-center h-full">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold truncate">{user?.display_name}'s Workspace</h2>
        <p className="text-gray-400 text-sm">{user?.username}</p>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Channels */}
        <div className="mb-6">
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={toggleChannels}
          >
            <div className="flex items-center">
              {showChannels ? <FaCaretDown className="mr-1" /> : <FaCaretRight className="mr-1" />}
              <h3 className="font-medium text-gray-400">Channels</h3>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleCreateChannel();
              }}
              className="text-gray-400 hover:text-white"
              title="Create Channel"
            >
              <FaPlus />
            </button>
          </div>

          {showChannels && (
            <ul>
              {channels.length === 0 ? (
                <li className="text-gray-500 text-sm pl-6">No channels yet</li>
              ) : (
                channels.map((channel) => (
                  <li key={channel.id} className="mb-1">
                    <Link
                      to={`/channels/${channel.id}`}
                      className="flex items-center py-1 px-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white"
                    >
                      <FaHashtag className="mr-2 text-gray-500" />
                      <span className="truncate">{channel.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* Direct Messages */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={toggleDirectMessages}
          >
            <div className="flex items-center">
              {showDirectMessages ? <FaCaretDown className="mr-1" /> : <FaCaretRight className="mr-1" />}
              <h3 className="font-medium text-gray-400">Direct Messages</h3>
            </div>
          </div>

          {showDirectMessages && (
            <ul>
              {directMessages.length === 0 ? (
                <li className="text-gray-500 text-sm pl-6">No direct messages yet</li>
              ) : (
                directMessages.map((dm) => (
                  <li key={dm.id} className="mb-1">
                    <Link
                      to={`/direct-messages/${dm.id}`}
                      className="flex items-center py-1 px-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white"
                    >
                      <FaCommentDots className="mr-2 text-gray-500" />
                      <span className="truncate">
                        {dm.other_participants && dm.other_participants.length > 0
                          ? dm.other_participants.map(p => p.display_name || p.username).join(', ')
                          : 'Unknown User'}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="font-medium">{user?.display_name?.charAt(0) || user?.username?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-medium">{user?.display_name || user?.username}</p>
            <p className="text-xs text-gray-400">
              {user?.status === 'online' ? (
                <span className="text-green-400">● Online</span>
              ) : (
                <span className="text-gray-400">● {user?.status || 'Offline'}</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white p-1"
          title="Sign Out"
        >
          <FaSignOutAlt />
        </button>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={toggleCreateChannel}
          onChannelCreated={handleChannelCreated}
        />
      )}
    </div>
  );
};

export default Sidebar;