from datetime import datetime
from app import db

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    channel_id = db.Column(db.Integer, db.ForeignKey('channels.id', ondelete='CASCADE'))
    direct_message_chat_id = db.Column(db.Integer, db.ForeignKey('direct_message_chats.id', ondelete='CASCADE'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    is_edited = db.Column(db.Boolean, default=False)
    
    # Relationships
    reactions = db.relationship('MessageReaction', backref='message', lazy='dynamic',
                              cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='message', lazy='dynamic',
                                  cascade="all, delete-orphan")
    
    __table_args__ = (
        db.CheckConstraint('(channel_id IS NULL AND direct_message_chat_id IS NOT NULL) OR '
                          '(channel_id IS NOT NULL AND direct_message_chat_id IS NULL)',
                          name='message_destination_check'),
    )
    
    def to_dict(self, include_reactions=False):
        data = {
            'id': self.id,
            'content': self.content,
            'sender_id': self.sender_id,
            'channel_id': self.channel_id,
            'direct_message_chat_id': self.direct_message_chat_id,
            'created_at': self.created_at.isoformat() + 'Z',
            'is_edited': self.is_edited
        }
        
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat() + 'Z'
            
        if include_reactions:
            data['reactions'] = [reaction.to_dict() for reaction in self.reactions]
            
        return data


class MessageReaction(db.Model):
    __tablename__ = 'message_reactions'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('messages.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reaction = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('message_id', 'user_id', 'reaction'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'message_id': self.message_id,
            'user_id': self.user_id,
            'reaction': self.reaction,
            'created_at': self.created_at.isoformat() + 'Z'
        }