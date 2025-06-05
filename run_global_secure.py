#!/usr/bin/env python3
# run_global_secure.py - 🌍 Безпечний запуск для глобального доступу

import os
import sys
import secrets
import logging
from pathlib import Path
from datetime import datetime
import subprocess
import signal
import atexit

# Імпорт Flask та компонентів
try:
    from flask import Flask
    from global_config import GlobalConfig, SecureGlobalConfig
    import app as main_app
except ImportError as e:
    print(f"❌ Помилка імпорту: {e}")
    print("Встановіть залежності: pip install -r requirements.txt")
    sys.exit(1)

class GlobalServerManager:
    """Менеджер для безпечного глобального сервера."""
    
    def __init__(self, secure_mode=True):
        self.secure_mode = secure_mode
        self.config = SecureGlobalConfig if secure_mode else GlobalConfig
        self.ngrok_process = None
        self.server_pid = None
        
        # Налаштування логування
        self.setup_logging()
        
    def setup_logging(self):
        """Налаштування розширеного логування."""
        Path('logs').mkdir(exist_ok=True)
        
        # Основний логер
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            handlers=[
                logging.FileHandler('logs/global_server.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger('GlobalServer')
        
    def check_security_requirements(self):
        """Перевірка вимог безпеки."""
        self.logger.info("🔒 Перевірка вимог безпеки...")
        
        issues = []
        
        # Перевірка секретного ключа
        secret_file = Path('.secret_key')
        if not secret_file.exists():
            self.logger.warning("Генерація нового секретного ключа...")
            secret_file.write_text(secrets.token_hex(32))
        
        secret_key = secret_file.read_text().strip()
        if len(secret_key) < 32:
            issues.append("Секретний ключ занадто короткий")
        
        # Перевірка критичних файлів
        required_files = ['users.json', 'goods.xlsx']
        for file_path in required_files:
            if not Path(file_path).exists():
                issues.append(f"Відсутній критичний файл: {file_path}")
        
        # Перевірка залежностей
        try:
            from flask_wtf.csrf import CSRFProtect
            from flask_limiter import Limiter
        except ImportError:
            issues.append("Відсутні критичні модулі безпеки")
        
        if issues:
            self.logger.error("❌ Знайдено проблеми безпеки:")
            for issue in issues:
                self.logger.error(f"  - {issue}")
            return False
        
        self.logger.info("✅ Всі перевірки безпеки пройдено")
        return True
        
    def check_ports(self):
        """Перевірка доступності портів."""
        import socket
        
        ports_to_check = [5000, 4040]
        
        for port in ports_to_check:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            
            if result == 0:
                self.logger.error(f"❌ Порт {port} вже зайнятий")
                return False
                
        self.logger.info("✅ Всі порти доступні")
        return True
        
    def setup_ngrok(self):
        """Налаштування ngrok."""
        self.logger.info("🌐 Налаштування ngrok...")
        
        # Перевірка наявності ngrok
        try:
            result = subprocess.run(['ngrok', 'version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                raise FileNotFoundError
        except (FileNotFoundError, subprocess.TimeoutExpired):
            self.logger.error("❌ ngrok не знайдено. Завантажте з https://ngrok.com/")
            return False
        
        # Створення конфігурації ngrok
        ngrok_config = Path.home() / '.ngrok2' / 'ngrok.yml'
        ngrok_config.parent.mkdir(exist_ok=True)
        
        if not ngrok_config.exists():
            config_content = f"""version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN_HERE
tunnels:
  gantt-calendar:
    addr: 5000
    proto: http
    host_header: localhost:5000
    bind_tls: true
"""
            ngrok_config.write_text(config_content)
            self.logger.warning("⚠️  Налаштуйте ngrok auth token у файлі:")
            self.logger.warning(f"   {ngrok_config}")
            
        return True
        
    def start_ngrok(self):
        """Запуск ngrok."""
        self.logger.info("🚀 Запуск ngrok...")
        
        try:
            # Запуск ngrok у фоновому режимі
            self.ngrok_process = subprocess.Popen(
                ['ngrok', 'http', '5000', '--log=stdout'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Очікування запуску
            import time
            time.sleep(3)
            
            # Перевірка статусу
            if self.ngrok_process.poll() is not None:
                stdout, stderr = self.ngrok_process.communicate()
                self.logger.error(f"❌ Помилка запуску ngrok: {stderr}")
                return False
                
            self.logger.info("✅ ngrok запущено")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Помилка запуску ngrok: {e}")
            return False
            
    def get_public_url(self):
        """Отримання публічної URL."""
        import time
        import requests
        
        for attempt in range(10):
            try:
                response = requests.get('http://localhost:4040/api/tunnels', timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    tunnels = data.get('tunnels', [])
                    
                    for tunnel in tunnels:
                        if tunnel.get('proto') == 'https':
                            public_url = tunnel['public_url']
                            self.logger.info(f"🌍 Публічна URL: {public_url}")
                            
                            # Збереження URL
                            Path('public_url.txt').write_text(public_url)
                            return public_url
                            
            except Exception as e:
                self.logger.debug(f"Спроба {attempt + 1}: {e}")
                time.sleep(1)
                
        self.logger.warning("⚠️  Не вдалось отримати публічну URL")
        return None
        
    def configure_flask_app(self):
        """Конфігурація Flask додатку для глобального доступу."""
        self.logger.info("⚙️  Конфігурація Flask...")
        
        # Застосування конфігурації
        main_app.app.config.from_object(self.config)
        
        # Ініціалізація конфігурації
        self.config.init_app(main_app.app)
        
        # Додавання middleware для логування доступу
        @main_app.app.before_request
        def log_request_info():
            from flask import request
            main_app.app.logger.info(
                f"ACCESS: {request.remote_addr} - {request.method} {request.path}"
            )
            
        # Додавання middleware для безпеки
        @main_app.app.after_request
        def add_global_security_headers(response):
            # Додаткові заголовки для глобального доступу
            response.headers['X-Robots-Tag'] = 'noindex, nofollow'
            response.headers['X-Global-Access'] = 'ngrok-tunnel'
            return response
            
        self.logger.info("✅ Flask сконфігуровано")
        
    def start_server(self):
        """Запуск Flask сервера."""
        self.logger.info("🚀 Запуск Flask сервера...")
        
        try:
            # Запуск у продакшн режимі
            main_app.app.run(
                host='127.0.0.1',
                port=5000,
                debug=False,
                threaded=True
            )
        except KeyboardInterrupt:
            self.logger.info("🛑 Отримано сигнал зупинки")
            self.cleanup()
        except Exception as e:
            self.logger.error(f"❌ Помилка сервера: {e}")
            self.cleanup()
            
    def cleanup(self):
        """Очищення ресурсів."""
        self.logger.info("🧹 Очищення ресурсів...")
        
        # Зупинка ngrok
        if self.ngrok_process:
            self.ngrok_process.terminate()
            self.ngrok_process.wait(timeout=5)
            self.logger.info("✅ ngrok зупинено")
            
        # Видалення тимчасових файлів
        temp_files = ['public_url.txt', 'server_status.txt']
        for file_path in temp_files:
            if Path(file_path).exists():
                Path(file_path).unlink()
                
        self.logger.info("✅ Очищення завершено")
        
    def run(self):
        """Основний метод запуску."""
        self.logger.info("🚀 Запуск глобального сервера...")
        self.logger.info(f"🔒 Режим безпеки: {'УВІМКНЕНО' if self.secure_mode else 'СТАНДАРТНИЙ'}")
        
        # Реєстрація cleanup на вихід
        atexit.register(self.cleanup)
        
        # Перевірки
        if not self.check_security_requirements():
            return False
            
        if not self.check_ports():
            return False
            
        if not self.setup_ngrok():
            return False
            
        # Конфігурація
        self.configure_flask_app()
        
        # Запуск ngrok
        if not self.start_ngrok():
            return False
            
        # Отримання публічної URL
        public_url = self.get_public_url()
        
        # Збереження статусу
        Path('server_status.txt').write_text(f"running\n{datetime.now()}\n{public_url or 'N/A'}")
        
        # Інформація для користувача
        print("\n" + "="*60)
        print("🎉 ГЛОБАЛЬНИЙ СЕРВЕР ЗАПУЩЕНО!")
        print("="*60)
        print(f"📍 Локальний доступ:  http://localhost:5000")
        print(f"🌍 Глобальний доступ: {public_url or 'Перевірте http://localhost:4040'}")
        print(f"📊 ngrok панель:      http://localhost:4040")
        print(f"🔒 Режим безпеки:     {'УВІМКНЕНО' if self.secure_mode else 'СТАНДАРТНИЙ'}")
        print("="*60)
        print("⚠️  ВАЖЛИВО:")
        print("   - Сервер доступний глобально")
        print("   - Використовуйте сильні паролі") 
        print("   - Регулярно перевіряйте логи")
        print("   - Для зупинки: Ctrl+C або stop_server.bat")
        print("="*60)
        
        # Запуск сервера
        self.start_server()
        
        return True

def main():
    """Головна функція."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Безпечний глобальний сервер для Gantt Calendar')
    parser.add_argument('--secure', action='store_true', 
                       help='Увімкнути максимальний режим безпеки')
    parser.add_argument('--check-only', action='store_true',
                       help='Тільки перевірити конфігурацію')
    parser.add_argument('--test-mode', action='store_true',
                       help='Запуск у тестовому режимі без ngrok')
    
    args = parser.parse_args()
    
    # Створення менеджера
    manager = GlobalServerManager(secure_mode=args.secure)
    
    if args.test_mode:
        # Тестовий режим - тільки локальний сервер
        print("🧪 ТЕСТОВИЙ РЕЖИМ - Локальний сервер без ngrok")
        manager.configure_flask_app()
        
        # Додавання health check endpoint
        @main_app.app.route('/health')
        def health_check():
            return {'status': 'ok', 'mode': 'test'}, 200
        
        try:
            main_app.app.run(host='127.0.0.1', port=5000, debug=False)
        except KeyboardInterrupt:
            print("🛑 Тестовий сервер зупинено")
        return 0
    elif args.check_only:
        # Тільки перевірки
        security_ok = manager.check_security_requirements()
        ports_ok = manager.check_ports()
        ngrok_ok = manager.setup_ngrok()
        
        if security_ok and ports_ok and ngrok_ok:
            print("✅ Всі перевірки пройдено. Готовий до запуску.")
            return 0
        else:
            print("❌ Знайдено проблеми. Перегляньте логи.")
            return 1
    else:
        # Повний запуск
        success = manager.run()
        return 0 if success else 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n🛑 Зупинка сервера...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Критична помилка: {e}")
        sys.exit(1)
