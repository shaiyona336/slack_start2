from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config

# Initialize extensions
db = SQLAlchemy()
socketio = SocketIO()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # Import and register blueprints
    from routes.auth_routes import auth_bp
    from routes.channel_routes import channel_bp
    from routes.message_routes import message_bp
    from routes.user_routes import user_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(channel_bp, url_prefix='/api/channels')
    app.register_blueprint(message_bp, url_prefix='/api/messages')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    # Initialize Socket.IO
    socketio.init_app(app, cors_allowed_origins="*", async_mode='gevent')
    
    # Import socket event handlers
    from sockets.connection import register_connection_events
    from sockets.channel_events import register_channel_events
    from sockets.message_events import register_message_events
    
    # Register socket events
    register_connection_events(socketio)
    register_channel_events(socketio)
    register_message_events(socketio)
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)