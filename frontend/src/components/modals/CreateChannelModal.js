import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import ChannelsAPI from '../../api/channels';

const CreateChannelModal = ({ onClose, onChannelCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const result = await ChannelsAPI.createChannel({
        name: data.name,
        description: data.description,
        is_private: data.isPrivate
      });

      if (result.success) {
        onChannelCreated(result.channel);
      } else {
        setError(result.message || 'Failed to create channel');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Create channel error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Create a Channel</h2>
          <p className="text-sm text-gray-600">
            Channels are where your team communicates. They're best organized around a topic.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                errors.name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="e.g. project-launch"
              {...register('name', { 
                required: 'Channel name is required',
                pattern: {
                  value: /^[a-z0-9-_]+$/,
                  message: 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
                }
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="What's this channel about?"
              {...register('description')}
            />
            <p className="text-gray-500 text-xs mt-1">
              Let people know what this channel is for.
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                {...register('isPrivate')}
              />
              <span className="ml-2 text-gray-700 text-sm">
                Make private
              </span>
            </label>
            <p className="text-gray-500 text-xs ml-6">
              Private channels are only visible to those invited.
            </p>
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 rounded-lg mr-2 hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;