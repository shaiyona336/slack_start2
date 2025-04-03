from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.message_service import MessageService

message_bp = Blueprint('messages', __name__)

@message_bp.route('/channel/<int:channel_id>', methods=['POST'])
@jwt_required()
def send_channel_message(channel_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    content = data.get('content')
    
    if not content:
        return jsonify({'success': False, 'message': 'Message content is required'}), 400
        
    result, status_code = MessageService.send_channel_message(user_id, channel_id, content)
    return jsonify(result), status_code

@message_bp.route('/channel/<int:channel_id>', methods=['GET'])
@jwt_required()
def get_channel_messages(channel_id):
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    result, status_code = MessageService.get_channel_messages(channel_id, user_id, page, per_page)
    return jsonify(result), status_code

@message_bp.route('/direct/<int:chat_id>', methods=['POST'])
@jwt_required()
def send_direct_message(chat_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    content = data.get('content')
    
    if not content:
        return jsonify({'success': False, 'message': 'Message content is required'}), 400
        
    result, status_code = MessageService.send_direct_message(user_id, chat_id, content)
    return jsonify(result), status_code

@message_bp.route('/direct/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_direct_messages(chat_id):
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    result, status_code = MessageService.get_direct_messages(chat_id, user_id, page, per_page)
    return jsonify(result), status_code

@message_bp.route('/<int:message_id>/reactions', methods=['POST'])
@jwt_required()
def add_reaction(message_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No input data provided'}), 400
        
    reaction = data.get('reaction')
    
    if not reaction:
        return jsonify({'success': False, 'message': 'Reaction is required'}), 400
        
    result, status_code = MessageService.add_reaction(user_id, message_id, reaction)
    return jsonify(result), status_code