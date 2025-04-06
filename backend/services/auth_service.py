from flask_jwt_extended import create_access_token, create_refresh_token
from models.user import User
from app import db
from sqlalchemy.exc import IntegrityError
import re

class AuthService:
    @staticmethod
    def register_user(username, email, password, display_name=None):
        # Validate input
        if not username or not email or not password:
            return {'success': False, 'message': 'All fields are required'}, 400
            
        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return {'success': False, 'message': 'Invalid email format'}, 400
            
        # Validate password strength
        if len(password) < 8:
            return {'success': False, 'message': 'Password must be at least 8 characters'}, 400
            
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            return {'success': False, 'message': 'Username already exists'}, 409
            
        if User.query.filter_by(email=email).first():
            return {'success': False, 'message': 'Email already exists'}, 409
        
        try:
            # Create new user
            user = User(
                username=username,
                email=email,
                display_name=display_name or username
            )
            user.set_password(password)
            
            # Save to database
            db.session.add(user)
            db.session.commit()
            
            # Generate tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return {
                'success': True,
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }, 201
            
        except IntegrityError:
            db.session.rollback()
            return {'success': False, 'message': 'Error creating user'}, 500
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': str(e)}, 500
    
    @staticmethod
    def login_user(username, password):
        if not username or not password:
            return {'success': False, 'message': 'Username and password are required'}, 400
            
        # Find user by username
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if user and user.check_password(password):
            # Update last_active
            user.status = 'online'
            db.session.commit()
            
            # Generate tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return {
                'success': True,
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }, 200
        else:
            return {'success': False, 'message': 'Invalid username or password'}, 401
    
    @staticmethod
    def refresh_token(user_id):
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'message': 'User not found'}, 404
            
        # Generate new access token
        access_token = create_access_token(identity=str(user.id))
        
        return {
            'success': True,
            'access_token': access_token
        }, 200