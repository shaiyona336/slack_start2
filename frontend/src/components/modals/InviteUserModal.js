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