from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from jwt.exceptions import PyJWTError
from models.channel import Channel, ChannelMember
from app import db

def register_channel_events(socketio):
    @socketio.on('typing_channel')
    def handle_channel_typing(data):
        try:
            channel_id = data.get('channel_id')
            token = data.get('token')
            
            if not channel_id or not token:
                return
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Check if user is a member of the channel
            is_member = ChannelMember.query.filter_by(
                channel_id=channel_id, 
                user_id=user_id
            ).first() is not None
            
            if is_member:
                # Broadcast typing status to channel members
                emit('user_typing', {
                    'channel_id': channel_id,
                    'user_id': user_id
                }, room=f'channel_{channel_id}', include_self=False)
                
        except Exception:
            pass  # Ignore errors
    
    @socketio.on('stopped_typing_channel')
    def handle_channel_stopped_typing(data):
        try:
            channel_id = data.get('channel_id')
            token = data.get('token')
            
            if not channel_id or not token:
                return
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Check if user is a member of the channel
            is_member = ChannelMember.query.filter_by(
                channel_id=channel_id, 
                user_id=user_id
            ).first() is not None
            
            if is_member:
                # Broadcast stopped typing status to channel members
                emit('user_stopped_typing', {
                    'channel_id': channel_id,
                    'user_id': user_id
                }, room=f'channel_{channel_id}', include_self=False)
                
        except Exception:
            pass  # Ignore errors