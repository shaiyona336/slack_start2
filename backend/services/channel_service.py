from models.channel import Channel, ChannelMember, DirectMessageChat, DirectMessageParticipant
from models.user import User
from app import db, socketio
from sqlalchemy.exc import IntegrityError

class ChannelService:
    @staticmethod
    def create_channel(user_id, name, description=None, is_private=False):
        try:
            # Create new channel
            channel = Channel(
                name=name,
                description=description,
                is_private=is_private,
                created_by=user_id
            )
            
            db.session.add(channel)
            db.session.flush()  # Get channel ID before commit
            
            # Add creator as channel member
            member = ChannelMember(
                channel_id=channel.id,
                user_id=user_id
            )
            
            db.session.add(member)
            db.session.commit()
            
            # Notify users via Socket.IO
            socketio.emit('channel_created', {
                'channel': channel.to_dict(),
                'creator_id': user_id
            }, broadcast=True)
            
            return {
                'success': True,
                'channel': channel.to_dict(include_members=True)
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error creating channel'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def get_channel(channel_id, user_id=None):
        channel = Channel.query.get(channel_id)
        
        if not channel:
            return {'success': False, 'message': 'Channel not found'}, 404
            
        # If private channel, check if user is a member
        if channel.is_private and user_id:
            is_member = ChannelMember.query.filter_by(
                channel_id=channel_id, 
                user_id=user_id
            ).first() is not None
            
            if not is_member:
                return {'success': False, 'message': 'Access denied'}, 403
        
        return {
            'success': True,
            'channel': channel.to_dict(include_members=True)
        }, 200
    
    @staticmethod
    def get_user_channels(user_id):
        # Get channel IDs where user is a member
        channel_members = ChannelMember.query.filter_by(user_id=user_id).all()
        channel_ids = [member.channel_id for member in channel_members]
        
        # Get channels
        channels = Channel.query.filter(Channel.id.in_(channel_ids)).all()
        
        return {
            'success': True,
            'channels': [channel.to_dict() for channel in channels]
        }, 200
    
    @staticmethod
    def add_channel_member(channel_id, user_id, added_by_id):
        channel = Channel.query.get(channel_id)
        
        if not channel:
            return {'success': False, 'message': 'Channel not found'}, 404
            
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404
            
        # Check if adder is a member
        is_adder_member = ChannelMember.query.filter_by(
            channel_id=channel_id, 
            user_id=added_by_id
        ).first() is not None
        
        if not is_adder_member:
            return {'success': False, 'message': 'You must be a channel member to add users'}, 403
            
        # Check if user is already a member
        is_already_member = ChannelMember.query.filter_by(
            channel_id=channel_id, 
            user_id=user_id
        ).first() is not None
        
        if is_already_member:
            return {'success': False, 'message': 'User is already a channel member'}, 409
            
        try:
            # Add user to channel
            member = ChannelMember(
                channel_id=channel_id,
                user_id=user_id
            )
            
            db.session.add(member)
            db.session.commit()
            
            # Notify users via Socket.IO
            socketio.emit('channel_member_added', {
                'channel_id': channel_id,
                'user_id': user_id,
                'added_by_id': added_by_id
            }, room=f'channel_{channel_id}')
            
            # Notify the added user
            socketio.emit('channel_added', {
                'channel': channel.to_dict()
            }, room=f'user_{user_id}')
            
            return {
                'success': True,
                'message': f'User {user.username} added to channel successfully'
            }, 200
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error adding user to channel'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def create_direct_message(user_id, recipient_id):
        # Validate users
        if user_id == recipient_id:
            return {'success': False, 'message': 'Cannot create direct message with yourself'}, 400
            
        # Check if users exist
        user = User.query.get(user_id)
        recipient = User.query.get(recipient_id)
        
        if not user or not recipient:
            return {'success': False, 'message': 'User not found'}, 404
            
        # Check if DM already exists between these users
        existing_dms = DirectMessageChat.query.join(
            DirectMessageParticipant, 
            DirectMessageChat.id == DirectMessageParticipant.chat_id
        ).filter(
            DirectMessageParticipant.user_id.in_([user_id, recipient_id])
        ).all()
        
        for dm in existing_dms:
            # Count participants to ensure it's just these two users
            participant_count = DirectMessageParticipant.query.filter_by(chat_id=dm.id).count()
            
            if participant_count == 2:
                # Check if both users are participants
                user_is_participant = DirectMessageParticipant.query.filter_by(
                    chat_id=dm.id, 
                    user_id=user_id
                ).first() is not None
                
                recipient_is_participant = DirectMessageParticipant.query.filter_by(
                    chat_id=dm.id, 
                    user_id=recipient_id
                ).first() is not None
                
                if user_is_participant and recipient_is_participant:
                    return {
                        'success': True,
                        'direct_message': dm.to_dict(include_participants=True),
                        'message': 'Direct message already exists'
                    }, 200
        
        try:
            # Create new direct message chat
            dm_chat = DirectMessageChat()
            db.session.add(dm_chat)
            db.session.flush()  # Get chat ID before commit
            
            # Add participants
            participant1 = DirectMessageParticipant(
                chat_id=dm_chat.id,
                user_id=user_id
            )
            
            participant2 = DirectMessageParticipant(
                chat_id=dm_chat.id,
                user_id=recipient_id
            )
            
            db.session.add(participant1)
            db.session.add(participant2)
            db.session.commit()
            
            # Notify users via Socket.IO
            socketio.emit('direct_message_created', {
                'direct_message': dm_chat.to_dict(),
                'participants': [user_id, recipient_id]
            }, room=f'user_{user_id}')
            
            socketio.emit('direct_message_created', {
                'direct_message': dm_chat.to_dict(),
                'participants': [user_id, recipient_id]
            }, room=f'user_{recipient_id}')
            
            return {
                'success': True,
                'direct_message': dm_chat.to_dict(include_participants=True)
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error creating direct message'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def get_user_direct_messages(user_id):
        # Get DM chat IDs where user is a participant
        dm_participants = DirectMessageParticipant.query.filter_by(user_id=user_id).all()
        chat_ids = [p.chat_id for p in dm_participants]
        
        # Get DM chats
        dm_chats = DirectMessageChat.query.filter(DirectMessageChat.id.in_(chat_ids)).all()
        
        # For each chat, get the other participants for easy display
        result_dms = []
        for chat in dm_chats:
            chat_dict = chat.to_dict()
            
            # Get participant user IDs
            participants = DirectMessageParticipant.query.filter_by(chat_id=chat.id).all()
            participant_ids = [p.user_id for p in participants]
            
            # Get the other participant(s)
            other_participants = User.query.filter(
                User.id.in_([pid for pid in participant_ids if pid != user_id])
            ).all()
            
            chat_dict['other_participants'] = [user.to_dict() for user in other_participants]
            result_dms.append(chat_dict)
        
        return {
            'success': True,
            'direct_messages': result_dms
        }, 200