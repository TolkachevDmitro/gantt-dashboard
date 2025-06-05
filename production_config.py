# production_config.py - 🔒 Продакшн конфігурація з підвищеною безпекою
import os
from datetime import timedelta

class ProductionConfig:
    """Конфігурація для продакшн середовища з максимальною безпекою."""
    
    # Основні налаштування
    ENV = 'production'
    DEBUG = False
    TESTING = False
    
    # Секретний ключ (ОБОВ'ЯЗКОВО змінити в продакшн!)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'CHANGE_THIS_IN_PRODUCTION'
    
    # 🔒 Безпека сесій для HTTPS
    SESSION_COOKIE_SECURE = True  # Тільки через HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Заборона доступу через JavaScript
    SESSION_COOKIE_SAMESITE = 'Strict'  # Захист від CSRF
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)  # Сесія на 8 годин
    
    # 🔒 CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # CSRF токен дійсний 1 годину
    WTF_CSRF_SSL_STRICT = True  # Строга перевірка SSL для CSRF
    
    # 🔒 Rate Limiting (можна налаштувати через Redis для кластера)
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    
    # 🔒 Логування
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/production.log'
    
    # 🔒 База даних (якщо буде використовуватися)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # 🔒 Налаштування для reverse proxy
    PREFERRED_URL_SCHEME = 'https'
    
    @staticmethod
    def init_app(app):
        """Ініціалізація додаткових налаштувань для продакшн."""
        
        # Налаштування логування
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug:
            # Лог файл з ротацією
            file_handler = RotatingFileHandler(
                ProductionConfig.LOG_FILE, 
                maxBytes=10240000, 
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            
            app.logger.setLevel(logging.INFO)
            app.logger.info('Production application startup')

class DevelopmentConfig:
    """Конфігурація для розробки."""
    
    ENV = 'development'
    DEBUG = True
    TESTING = False
    
    # Менш строгі налаштування для розробки
    SESSION_COOKIE_SECURE = False  # HTTP OK для локальної розробки
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # CSRF для розробки
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 7200  # 2 години для зручності розробки
    WTF_CSRF_SSL_STRICT = False  # HTTP OK для локальної розробки
    
    # Rate limiting для розробки
    RATELIMIT_DEFAULT = "1000 per hour"  # Більш м'які обмеження
    
    LOG_LEVEL = 'DEBUG'

# Вибір конфігурації залежно від змінної середовища
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
