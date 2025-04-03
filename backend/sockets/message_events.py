from flask import request
from flask_socketio import emit
from flask_jwt_extended import decode_token
from jwt.exceptions import PyJWTError
from models.channel import DirectMessageParticipant
from app import db

def register_message_events(socketio):
    @socketio.on('typing_direct')
    def handle_direct_typing(data):
        try:
            chat_id = data.get('chat_id')
            token = data.get('token')
            
            if not chat_id or not token:
                return
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Check if user is a participant in the direct message chat
            is_participant = DirectMessageParticipant.query.filter_by(
                chat_id=chat_id, 
                user_id=user_id
            ).first() is not None
            
            if is_participant:
                # Get other participants
                other_participants = DirectMessageParticipant.query.filter(
                    DirectMessageParticipant.chat_id == chat_id,
                    DirectMessageParticipant.user_id != user_id
                ).all()
                
                # Broadcast typing status to other participants
                for participant in other_participants:
                    emit('user_typing', {
                        'chat_id': chat_id,
                        'user_id': user_id,
                        'is_direct': True
                    }, room=f'user_{participant.user_id}')
                
        except Exception:
            pass  # Ignore errors
    
    @socketio.on('stopped_typing_direct')
    def handle_direct_stopped_typing(data):
        try:
            chat_id = data.get('chat_id')
            token = data.get('token')
            
            if not chat_id or not token:
                return
                
            # Decode token to get user ID
            decoded_token = decode_token(token)
            user_id = decoded_token['sub']
            
            # Check if user is a participant in the direct message chat
            is_participant = DirectMessageParticipant.query.filter_by(
                chat_id=chat_id, 
                user_id=user_id
            ).first() is not None
            
            if is_participant:
                # Get other participants
                other_participants = DirectMessageParticipant.query.filter(
                    DirectMessageParticipant.chat_id == chat_id,
                    DirectMessageParticipant.user_id != user_id
                ).all()
                
                # Broadcast stopped typing status to other participants
                for participant in other_participants:
                    emit('user_stopped_typing', {
                        'chat_id': chat_id,
                        'user_id': user_id,
                        'is_direct': True
                    }, room=f'user_{participant.user_id}')
                
        except Exception:
            pass  # Ignore errors