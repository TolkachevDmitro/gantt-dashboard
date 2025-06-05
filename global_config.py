# global_config.py - 🌍 Конфігурація для глобального доступу через ngrok
import os
from datetime import timedelta
from pathlib import Path

class GlobalConfig:
    """Конфігурація для безпечного глобального доступу через ngrok."""
    
    # Основні налаштування
    ENV = 'global'
    DEBUG = False
    TESTING = False
    
    # Секретний ключ з файлу
    SECRET_KEY_FILE = Path('.secret_key')
    if SECRET_KEY_FILE.exists():
        SECRET_KEY = SECRET_KEY_FILE.read_text().strip()
    else:
        SECRET_KEY = os.environ.get('SECRET_KEY', 'TEMPORARY_KEY_CHANGE_THIS')
    
    # 🔒 Безпека сесій (адаптовано для ngrok HTTP)
    SESSION_COOKIE_SECURE = False  # ngrok може використовувати HTTP
    SESSION_COOKIE_HTTPONLY = True  # Заборона JavaScript доступу
    SESSION_COOKIE_SAMESITE = 'Lax'  # Менш строго для ngrok
    PERMANENT_SESSION_LIFETIME = timedelta(hours=6)  # Коротша сесія для безпеки
    
    # 🔒 CSRF Protection (адаптовано для ngrok)
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 2400  # 40 хвилин
    WTF_CSRF_SSL_STRICT = False  # ngrok може використовувати HTTP
    
    # 🔒 Посилене Rate Limiting для глобального доступу
    RATELIMIT_DEFAULT = "100 per day, 20 per hour"  # Більш строгі ліміти
    
    # 🔒 Логування для моніторингу
    LOG_LEVEL = 'INFO'
    SECURITY_LOG_FILE = 'logs/global_security.log'
    ACCESS_LOG_FILE = 'logs/global_access.log'
    
    # 🔒 Додаткові налаштування безпеки
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB максимум для файлів
    
    # 🌍 Налаштування для ngrok
    NGROK_ENABLED = True
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']  # Буде розширено автоматично
    
    @staticmethod
    def init_app(app):
        """Ініціалізація для глобального доступу."""
        import logging
        import sys
        from logging.handlers import RotatingFileHandler
        
        # Створення папки логів
        Path('logs').mkdir(exist_ok=True)
        
        # Налаштування логування безпеки
        security_handler = RotatingFileHandler(
            GlobalConfig.SECURITY_LOG_FILE,
            maxBytes=5*1024*1024,  # 5MB
            backupCount=3
        )
        security_handler.setFormatter(logging.Formatter(
            '%(asctime)s [SECURITY] %(levelname)s: %(message)s'
        ))
        security_handler.setLevel(logging.WARNING)
        
        # Логування доступу
        access_handler = RotatingFileHandler(
            GlobalConfig.ACCESS_LOG_FILE,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        access_handler.setFormatter(logging.Formatter(
            '%(asctime)s [ACCESS] %(remote_addr)s - %(method)s %(path)s - %(status_code)s'
        ))
        access_handler.setLevel(logging.INFO)
        
        # Додавання обробників
        app.logger.addHandler(security_handler)
        app.logger.addHandler(access_handler)
        app.logger.setLevel(logging.INFO)
        
        # Консольне логування для моніторингу
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] %(message)s'
        ))
        console_handler.setLevel(logging.INFO)
        app.logger.addHandler(console_handler)
        
        app.logger.info('🌍 Global server configuration initialized')

class SecureGlobalConfig(GlobalConfig):
    """Більш безпечна конфігурація для глобального доступу."""
    
    # Ще більш строгі ліміти
    RATELIMIT_DEFAULT = "50 per day, 10 per hour"
    
    # Коротша сесія
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    
    # Короткий час життя CSRF токенів
    WTF_CSRF_TIME_LIMIT = 1200  # 20 хвилин
    
    # Максимальний розмір запиту
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8MB

# Вибір конфігурації
config_map = {
    'global': GlobalConfig,
    'secure_global': SecureGlobalConfig,
    'default': GlobalConfig
}

def get_config(config_name='global'):
    """Отримати конфігурацію за назвою."""
    return config_map.get(config_name, GlobalConfig)
