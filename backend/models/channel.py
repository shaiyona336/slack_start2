from datetime import datetime
from app import db

class Channel(db.Model):
    __tablename__ = 'channels'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    is_private = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('ChannelMember', backref='channel', lazy='dynamic', 
                             cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='channel', lazy='dynamic',
                             foreign_keys='Message.channel_id', 
                             cascade="all, delete-orphan")
    
    def to_dict(self, include_members=False):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_private': self.is_private,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() + 'Z'
        }
        
        if include_members:
            data['members'] = [member.to_dict() for member in self.members]
            
        return data


class ChannelMember(db.Model):
    __tablename__ = 'channel_members'
    
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey('channels.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('channel_id', 'user_id'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'channel_id': self.channel_id,
            'user_id': self.user_id,
            'joined_at': self.joined_at.isoformat() + 'Z'
        }


class DirectMessageChat(db.Model):
    __tablename__ = 'direct_message_chats'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    participants = db.relationship('DirectMessageParticipant', backref='chat',
                                 lazy='dynamic', cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='direct_chat', lazy='dynamic',
                             foreign_keys='Message.direct_message_chat_id',
                             cascade="all, delete-orphan")
    
    def to_dict(self, include_participants=False):
        data = {
            'id': self.id,
            'created_at': self.created_at.isoformat() + 'Z'
        }
        
        if include_participants:
            data['participants'] = [p.to_dict() for p in self.participants]
            
        return data


class DirectMessageParticipant(db.Model):
    __tablename__ = 'direct_message_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('direct_message_chats.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('chat_id', 'user_id'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'user_id': self.user_id
        }