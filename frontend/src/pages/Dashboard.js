import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-10 flex items-center justify-center">
          <div className="max-w-lg text-center">
            <h1 className="text-3xl font-bold mb-6">
              Welcome to your workspace, {user?.display_name || user?.username}!
            </h1>
            <p className="text-gray-600 mb-8">
              Use the sidebar to navigate to your channels and direct messages.
            </p>
            <div className="flex flex-col space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
                <p className="text-gray-600 mb-4">
                  Chat in a channel or send direct messages to colleagues.
                </p>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Join existing channels from the sidebar</li>
                  <li>Create new channels for team discussions</li>
                  <li>Start direct messages with team members</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">About Channels</h2>
                <p className="text-gray-600 mb-4">
                  Channels are where your team communicates. They're best organized around a topic — #marketing, for example.
                </p>
                <p className="text-blue-600 font-medium">
                  To create a channel, click the + icon next to "Channels" in the sidebar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;