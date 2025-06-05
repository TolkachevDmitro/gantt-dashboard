#!/usr/bin/env python3
"""
run_production.py - 🔒 Запуск додатку в продакшн режимі з підвищеною безпекою
"""

import os
import sys
from pathlib import Path

# Додаємо поточну директорію в Python path
sys.path.insert(0, str(Path(__file__).parent))

from app import app
from production_config import ProductionConfig

def main():
    """Запуск додатку в продакшн режимі."""
    
    # Перевірка критичних змінних середовища
    required_env_vars = [
        'SECRET_KEY',
        'FLASK_ENV'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ ПОМИЛКА: Відсутні критичні змінні середовища:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Створіть файл .env з необхідними змінними (див. .env.example)")
        sys.exit(1)
    
    # Перевірка секретного ключа
    secret_key = os.environ.get('SECRET_KEY', '')
    if secret_key in ['YOUR_SUPER_SECRET_KEY_HERE_CHANGE_THIS', 'change_me', '']:
        print("❌ КРИТИЧНА ПОМИЛКА: Секретний ключ не змінено!")
        print("💡 Згенеруйте новий секретний ключ:")
        print("   python -c \"import secrets; print(secrets.token_hex(32))\"")
        sys.exit(1)
    
    # Перевірка DEBUG режиму
    if app.debug:
        print("❌ КРИТИЧНА ПОМИЛКА: DEBUG режим активний в продакшн!")
        print("💡 Встановіть FLASK_DEBUG=False")
        sys.exit(1)
    
    # Застосування продакшн конфігурації
    app.config.from_object(ProductionConfig)
    ProductionConfig.init_app(app)
    
    # Перевірка HTTPS
    if not os.environ.get('SSL_CERT_PATH') or not os.environ.get('SSL_KEY_PATH'):
        print("⚠️  УВАГА: SSL сертифікати не налаштовані!")
        print("💡 Налаштуйте SSL_CERT_PATH та SSL_KEY_PATH")
        print("   Або використовуйте reverse proxy (nginx/apache)")
    
    # Перевірка логів
    log_dir = Path("logs")
    if not log_dir.exists():
        log_dir.mkdir(parents=True)
        print(f"✅ Створено директорію логів: {log_dir}")
    
    # Інформація про запуск
    print("🔒 ЗАПУСК В ПРОДАКШН РЕЖИМІ")
    print(f"   Environment: {app.config.get('ENV', 'unknown')}")
    print(f"   Debug: {app.debug}")
    print(f"   Secret key: {'✅ Налаштовано' if secret_key else '❌ Відсутній'}")
    print(f"   CSRF Protection: {'✅ Активно' if app.config.get('WTF_CSRF_ENABLED') else '❌ Вимкнено'}")
    print(f"   Session Security: {'✅ Налаштовано' if app.config.get('SESSION_COOKIE_SECURE') else '⚠️ HTTP тільки'}")
    
    # Запуск додатку
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    
    # SSL налаштування
    ssl_context = None
    cert_path = os.environ.get('SSL_CERT_PATH')
    key_path = os.environ.get('SSL_KEY_PATH')
    
    if cert_path and key_path and Path(cert_path).exists() and Path(key_path).exists():
        ssl_context = (cert_path, key_path)
        print(f"✅ SSL активовано: {cert_path}")
    else:
        print("⚠️  Запуск без SSL (використовуйте reverse proxy)")
    
    print(f"\n🚀 Сервер запущено на {host}:{port}")
    print("   Натисніть Ctrl+C для зупинки")
    
    try:
        app.run(
            host=host,
            port=port,
            debug=False,
            ssl_context=ssl_context,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Сервер зупинено")
    except Exception as e:
        print(f"❌ Помилка запуску: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # Завантаження змінних середовища з .env файлу
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  python-dotenv не встановлено. Змінні середовища завантажуються з системи.")
    
    main()
