from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from jwt.exceptions import PyJWTError
from models.user import User
from models.channel import ChannelMember
from app import db

def register_connection_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        try:
            # Get token from request
            token = request.args.get('token')
            if not token:
                return False  # Reject connection if no token
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Get user
            user = User.query.get(user_id)
            if not user:
                return False  # Reject connection if user not found
                
            # Update user status
            user.status = 'online'
            db.session.commit()
            
            # Join user's personal room for direct messages
            join_room(f'user_{user_id}')
            
            # Join rooms for all channels the user is a member of
            channel_memberships = ChannelMember.query.filter_by(user_id=user_id).all()
            for membership in channel_memberships:
                join_room(f'channel_{membership.channel_id}')
            
            # Broadcast user status change to others
            emit('user_status_change', {
                'user_id': user_id,
                'status': 'online'
            }, broadcast=True)
            
            return True
            
        except PyJWTError:
            return False  # Reject connection if token is invalid
        except Exception:
            return False  # Reject connection on any error
    
    @socketio.on('disconnect')
    def handle_disconnect():
        try:
            # Get token from request
            token = request.args.get('token')
            if not token:
                return
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Get user
            user = User.query.get(user_id)
            if not user:
                return
                
            # Update user status
            user.status = 'offline'
            db.session.commit()
            
            # Broadcast user status change to others
            emit('user_status_change', {
                'user_id': user_id,
                'status': 'offline'
            }, broadcast=True)
            
        except Exception:
            pass  # Ignore errors on disconnect
    
    @socketio.on('join_channel')
    def handle_join_channel(data):
        channel_id = data.get('channel_id')
        token = data.get('token')
        
        if not channel_id or not token:
            return
            
        try:
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Check if user is a member of the channel
            is_member = ChannelMember.query.filter_by(
                channel_id=channel_id, 
                user_id=user_id
            ).first() is not None
            
            if is_member:
                # Join the channel room
                join_room(f'channel_{channel_id}')
                emit('joined_channel', {'channel_id': channel_id})
                
        except Exception:
            pass  # Ignore errors
    
    @socketio.on('leave_channel')
    def handle_leave_channel(data):
        channel_id = data.get('channel_id')
        token = data.get('token')
        
        if not channel_id or not token:
            return
            
        try:
            # Decode token to get user ID
            decoded_token = decode_token(token)
            
            # Leave the channel room
            leave_room(f'channel_{channel_id}')
            emit('left_channel', {'channel_id': channel_id})
                
        except Exception:
            pass  # Ignore errors