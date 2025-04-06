from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.channel_service import ChannelService

channel_bp = Blueprint('channels', __name__)

@channel_bp.route('/', methods=['POST'])
@jwt_required()
def create_channel():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    name = data.get('name')
    description = data.get('description')
    is_private = data.get('is_private', False)
    
    if not name:
        return jsonify({'success': False, 'message': 'Channel name is required'}), 400
        
    result, status_code = ChannelService.create_channel(user_id, name, description, is_private)
    return jsonify(result), status_code

@channel_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_channels():
    user_id = int(get_jwt_identity())
    result, status_code = ChannelService.get_user_channels(user_id)
    return jsonify(result), status_code

@channel_bp.route('/<int:channel_id>', methods=['GET'])
@jwt_required()
def get_channel(channel_id):
    user_id = int(get_jwt_identity())
    result, status_code = ChannelService.get_channel(channel_id, user_id)
    return jsonify(result), status_code

@channel_bp.route('/<int:channel_id>/members', methods=['POST'])
@jwt_required()
def add_channel_member(channel_id):
    added_by_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
        
    result, status_code = ChannelService.add_channel_member(channel_id, user_id, added_by_id)
    return jsonify(result), status_code

@channel_bp.route('/direct-messages', methods=['POST'])
@jwt_required()
def create_direct_message():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    recipient_id = data.get('recipient_id')
    
    if not recipient_id:
        return jsonify({'success': False, 'message': 'Recipient ID is required'}), 400
        
    result, status_code = ChannelService.create_direct_message(user_id, recipient_id)
    return jsonify(result), status_code

@channel_bp.route('/direct-messages', methods=['GET'])
@jwt_required()
def get_user_direct_messages():
    user_id = int(get_jwt_identity())
    result, status_code = ChannelService.get_user_direct_messages(user_id)
    return jsonify(result), status_code