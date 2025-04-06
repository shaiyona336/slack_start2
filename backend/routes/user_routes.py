from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from app import db

user_bp = Blueprint('users', __name__)

@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    return jsonify({
        'success': True,
        'user': user.to_dict(include_email=True)
    }), 200

@user_bp.route('/status', methods=['PUT'])
@jwt_required()
def update_status():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    status = data.get('status')
    
    if not status or status not in ['online', 'away', 'offline', 'busy']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    user.status = status
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Status updated successfully',
        'user': user.to_dict()
    }), 200

@user_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    query = request.args.get('query', '')
    
    # Search users by username or display name
    if query:
        users = User.query.filter(
            (User.username.ilike(f'%{query}%')) | 
            (User.display_name.ilike(f'%{query}%'))
        ).all()
    else:
        users = User.query.all()
        
    return jsonify({
        'success': True,
        'users': [user.to_dict() for user in users]
    }), 200

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200

@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    # Update fields if provided
    if 'display_name' in data:
        user.display_name = data['display_name']
        
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
        
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'user': user.to_dict(include_email=True)
    }), 200