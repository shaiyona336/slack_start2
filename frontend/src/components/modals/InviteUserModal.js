import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus } from 'react-icons/fa';
import UsersAPI from '../../api/users';
import ChannelsAPI from '../../api/channels';
import { useAuth } from '../../contexts/AuthContext';

const InviteUserModal = ({ channelId, channelName, onClose }) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await UsersAPI.getUsers();
        if (result.success) {
          // Filter out current user
          const filteredUsers = result.users.filter(u => u.id !== currentUser?.id);
          setUsers(filteredUsers);
          setFilteredUsers(filteredUsers);
        }
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser?.id]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) || 
        (user.display_name && user.display_name.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Invite selected users
  const inviteUsers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Invite each user in sequence
      for (const userId of selectedUsers) {
        await ChannelsAPI.addChannelMember(channelId, userId);
      }

      setSuccess(`${selectedUsers.length} user(s) invited to #${channelName}`);
      setSelectedUsers([]);
    } catch (err) {
      setError('Failed to invite some users');
      console.error('Error inviting users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Invite People to #{channelName}
          </h2>
          <p className="text-sm text-gray-600">
            Search for people to add to this channel.
          </p>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Search by name or username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mt-2 p-2 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* User list */}
        <div className="p-4 max-h-60 overflow-y-auto">
          {loading && filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found</p>
          ) : (
            <ul className="space-y-2">
              {filteredUsers.map((user) => (
                <li 
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name || user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span>
                          {(user.display_name || user.username).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name || user.username}</p>
                      {user.display_name && (
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border ${
                    selectedUsers.includes(user.id) 
                      ? 'bg-blue-500 border-blue-500 flex items-center justify-center' 
                      : 'border-gray-300'
                  }`}>
                    {selectedUsers.includes(user.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 rounded-lg mr-2 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center ${
              loading || selectedUsers.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
            onClick={inviteUsers}
            disabled={loading || selectedUsers.length === 0}
          >
            <FaUserPlus className="mr-2" />
            {loading ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;