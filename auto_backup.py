#!/usr/bin/env python3
"""
Скрипт для автоматичного створення бекапів.
Можна запускати через cron або Task Scheduler.
"""

import sys
import json
import shutil
from datetime import datetime
from pathlib import Path

# Додаємо шлях до додатку
BASE_DIR = Path(__file__).parent
sys.path.append(str(BASE_DIR))

# Імпортуємо функції з app.py
try:
    from app import create_backup, cleanup_old_backups, BACKUP_DIR, BASE_DIR
except ImportError as e:
    print(f"Помилка імпорту: {e}")
    sys.exit(1)

def main():
    """Головна функція для створення автоматичного бекапу."""
    try:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Початок створення автоматичного бекапу...")
        
        # Створюємо бекап
        if create_backup():
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Автоматичний бекап успішно створено")
            
            # Створюємо лог про успішний бекап
            log_file = BASE_DIR / "logs" / "backup.log"
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] AUTO_BACKUP_SUCCESS\n")
            
            return True
        else:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Помилка створення автоматичного бекапу")
            
            # Створюємо лог про помилку
            log_file = BASE_DIR / "logs" / "backup.log"
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] AUTO_BACKUP_FAILED\n")
            
            return False
            
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Критична помилка: {e}")
        
        # Створюємо лог про критичну помилку
        try:
            log_file = BASE_DIR / "logs" / "backup.log"
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] AUTO_BACKUP_CRITICAL_ERROR: {str(e)}\n")
        except:
            pass
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
