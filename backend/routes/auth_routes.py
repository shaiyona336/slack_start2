from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, current_user
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name')
    
    result, status_code = AuthService.register_user(username, email, password, display_name)
    return jsonify(result), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    result, status_code = AuthService.login_user(username, password)
    return jsonify(result), status_code

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    result, status_code = AuthService.refresh_token(user_id)
    return jsonify(result), status_code

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    # Logic to update user status to offline would go here
    return jsonify({'success': True, 'message': 'User logged out successfully'}), 200