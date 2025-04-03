from datetime import datetime
from models.message import Message, MessageReaction
from models.channel import Channel, ChannelMember, DirectMessageChat, DirectMessageParticipant
from models.notification import Notification
from models.user import User
from app import db, socketio
from sqlalchemy.exc import IntegrityError

class MessageService:
    @staticmethod
    def send_channel_message(user_id, channel_id, content):
        # Validate input
        if not content or not content.strip():
            return {'success': False, 'message': 'Message content cannot be empty'}, 400
            
        # Check if channel exists
        channel = Channel.query.get(channel_id)
        if not channel:
            return {'success': False, 'message': 'Channel not found'}, 404
            
        # Check if user is a member of the channel
        is_member = ChannelMember.query.filter_by(
            channel_id=channel_id, 
            user_id=user_id
        ).first() is not None
        
        if not is_member:
            return {'success': False, 'message': 'You must be a channel member to send messages'}, 403
            
        try:
            # Create new message
            message = Message(
                content=content,
                sender_id=user_id,
                channel_id=channel_id
            )
            
            db.session.add(message)
            db.session.flush()  # Get message ID before commit
            
            # Create notifications for channel members (except sender)
            channel_members = ChannelMember.query.filter(
                ChannelMember.channel_id == channel_id,
                ChannelMember.user_id != user_id
            ).all()
            
            for member in channel_members:
                notification = Notification(
                    user_id=member.user_id,
                    message_id=message.id
                )
                db.session.add(notification)
            
            db.session.commit()
            
            # Get sender for response
            sender = User.query.get(user_id)
            
            # Construct response with sender info
            message_data = message.to_dict()
            message_data['sender'] = sender.to_dict()
            
            # Notify channel members via Socket.IO
            socketio.emit('new_message', {
                'message': message_data
            }, room=f'channel_{channel_id}')
            
            return {
                'success': True,
                'message': message_data
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error sending message'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def send_direct_message(user_id, chat_id, content):
        # Validate input
        if not content or not content.strip():
            return {'success': False, 'message': 'Message content cannot be empty'}, 400
            
        # Check if DM chat exists
        dm_chat = DirectMessageChat.query.get(chat_id)
        if not dm_chat:
            return {'success': False, 'message': 'Direct message chat not found'}, 404
            
        # Check if user is a participant in the DM chat
        is_participant = DirectMessageParticipant.query.filter_by(
            chat_id=chat_id, 
            user_id=user_id
        ).first() is not None
        
        if not is_participant:
            return {'success': False, 'message': 'You must be a participant to send messages'}, 403
            
        try:
            # Create new message
            message = Message(
                content=content,
                sender_id=user_id,
                direct_message_chat_id=chat_id
            )
            
            db.session.add(message)
            db.session.flush()  # Get message ID before commit
            
            # Create notifications for other participants
            other_participants = DirectMessageParticipant.query.filter(
                DirectMessageParticipant.chat_id == chat_id,
                DirectMessageParticipant.user_id != user_id
            ).all()
            
            for participant in other_participants:
                notification = Notification(
                    user_id=participant.user_id,
                    message_id=message.id
                )
                db.session.add(notification)
            
            db.session.commit()
            
            # Get sender for response
            sender = User.query.get(user_id)
            
            # Construct response with sender info
            message_data = message.to_dict()
            message_data['sender'] = sender.to_dict()
            
            # Notify participants via Socket.IO
            participants = DirectMessageParticipant.query.filter_by(chat_id=chat_id).all()
            for participant in participants:
                socketio.emit('new_direct_message', {
                    'message': message_data
                }, room=f'user_{participant.user_id}')
            
            return {
                'success': True,
                'message': message_data
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error sending message'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def get_channel_messages(channel_id, user_id, page=1, per_page=50):
        # Check if channel exists
        channel = Channel.query.get(channel_id)
        if not channel:
            return {'success': False, 'message': 'Channel not found'}, 404
            
        # Check if user is a member of the channel
        is_member = ChannelMember.query.filter_by(
            channel_id=channel_id, 
            user_id=user_id
        ).first() is not None
        
        if not is_member and channel.is_private:
            return {'success': False, 'message': 'Access denied'}, 403
            
        # Get messages with pagination
        messages = Message.query.filter_by(channel_id=channel_id) \
            .order_by(Message.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Get sender info for each message
        message_list = []
        for message in messages.items:
            message_data = message.to_dict(include_reactions=True)
            sender = User.query.get(message.sender_id)
            message_data['sender'] = sender.to_dict() if sender else None
            message_list.append(message_data)
        
        # Mark notifications as read
        notifications = Notification.query.join(Message) \
            .filter(
                Notification.user_id == user_id,
                Message.channel_id == channel_id,
                Notification.is_read == False
            ).all()
        
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        return {
            'success': True,
            'messages': message_list,
            'total': messages.total,
            'pages': messages.pages,
            'current_page': messages.page
        }, 200
    
    @staticmethod
    def get_direct_messages(chat_id, user_id, page=1, per_page=50):
        # Check if DM chat exists
        dm_chat = DirectMessageChat.query.get(chat_id)
        if not dm_chat:
            return {'success': False, 'message': 'Direct message chat not found'}, 404
            
        # Check if user is a participant in the DM chat
        is_participant = DirectMessageParticipant.query.filter_by(
            chat_id=chat_id, 
            user_id=user_id
        ).first() is not None
        
        if not is_participant:
            return {'success': False, 'message': 'Access denied'}, 403
            
        # Get messages with pagination
        messages = Message.query.filter_by(direct_message_chat_id=chat_id) \
            .order_by(Message.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Get sender info for each message
        message_list = []
        for message in messages.items:
            message_data = message.to_dict(include_reactions=True)
            sender = User.query.get(message.sender_id)
            message_data['sender'] = sender.to_dict() if sender else None
            message_list.append(message_data)
        
        # Mark notifications as read
        notifications = Notification.query.join(Message) \
            .filter(
                Notification.user_id == user_id,
                Message.direct_message_chat_id == chat_id,
                Notification.is_read == False
            ).all()
        
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        return {
            'success': True,
            'messages': message_list,
            'total': messages.total,
            'pages': messages.pages,
            'current_page': messages.page
        }, 200
    
    @staticmethod
    def add_reaction(user_id, message_id, reaction):
        # Validate input
        if not reaction or not reaction.strip():
            return {'success': False, 'message': 'Reaction cannot be empty'}, 400
            
        # Check if message exists
        message = Message.query.get(message_id)
        if not message:
            return {'success': False, 'message': 'Message not found'}, 404
            
        # Check if user has access to this message
        if message.channel_id:
            # Channel message
            is_member = ChannelMember.query.filter_by(
                channel_id=message.channel_id, 
                user_id=user_id
            ).first() is not None
            
            if not is_member:
                return {'success': False, 'message': 'Access denied'}, 403
        else:
            # Direct message
            is_participant = DirectMessageParticipant.query.filter_by(
                chat_id=message.direct_message_chat_id, 
                user_id=user_id
            ).first() is not None
            
            if not is_participant:
                return {'success': False, 'message': 'Access denied'}, 403
        
        # Check if this reaction already exists
        existing_reaction = MessageReaction.query.filter_by(
            message_id=message_id,
            user_id=user_id,
            reaction=reaction
        ).first()
        
        if existing_reaction:
            return {'success': False, 'message': 'Reaction already exists'}, 409
            
        try:
            # Add reaction
            new_reaction = MessageReaction(
                message_id=message_id,
                user_id=user_id,
                reaction=reaction
            )
            
            db.session.add(new_reaction)
            db.session.commit()
            
            # Construct response
            reaction_data = new_reaction.to_dict()
            
            # Notify users via Socket.IO
            if message.channel_id:
                socketio.emit('new_reaction', {
                    'reaction': reaction_data
                }, room=f'channel_{message.channel_id}')
            else:
                participants = DirectMessageParticipant.query.filter_by(
                    chat_id=message.direct_message_chat_id
                ).all()
                
                for participant in participants:
                    socketio.emit('new_reaction', {
                        'reaction': reaction_data
                    }, room=f'user_{participant.user_id}')
            
            return {
                'success': True,
                'reaction': reaction_data
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error adding reaction'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500