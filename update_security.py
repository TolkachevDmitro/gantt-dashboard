#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔒 БЕЗПЕЧНЕ ОНОВЛЕННЯ СЕКРЕТІВ
Цей скрипт допомагає безпечно оновити всі секрети у проекті
"""

import secrets
import json
import hashlib
from pathlib import Path
from werkzeug.security import generate_password_hash
import getpass

def generate_secure_key():
    """Генерує безпечний SECRET_KEY"""
    return secrets.token_hex(32)

def create_password_hash(password):
    """Створює хеш пароля"""
    return generate_password_hash(password)

def main():
    print("🔒 БЕЗПЕЧНЕ ОНОВЛЕННЯ СЕКРЕТІВ")
    print("=" * 50)
    
    # 1. Генеруємо новий SECRET_KEY
    new_secret_key = generate_secure_key()
    print(f"✅ Новий SECRET_KEY згенеровано")
    print(f"🔑 Ключ: {new_secret_key}")
    print()
    
    # 2. Запитуємо новий пароль адміністратора
    print("🔐 Змініть пароль адміністратора:")
    new_password = getpass.getpass("Введіть новий пароль адміністратора: ")
    confirm_password = getpass.getpass("Підтвердіть пароль: ")
    
    if new_password != confirm_password:
        print("❌ Паролі не співпадають!")
        return
    
    if len(new_password) < 8:
        print("❌ Пароль має бути мінімум 8 символів!")
        return
    
    # 3. Створюємо хеш нового пароля
    password_hash = create_password_hash(new_password)
    
    # 4. Оновлюємо users.json
    users_file = Path("users.json")
    if users_file.exists():
        with open(users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        users['admin']['password_hash'] = password_hash
        
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        
        print("✅ Пароль адміністратора оновлено в users.json")
    
    # 5. Створюємо файл з інструкціями
    instructions = f"""
🔒 ОНОВЛЕННЯ СЕКРЕТІВ ЗАВЕРШЕНО!

📋 ЩО ЗРОБЛЕНО:
✅ Згенеровано новий SECRET_KEY
✅ Оновлено пароль адміністратора

🚨 НЕГАЙНО ВИКОНАЙТЕ:

1. ОНОВІТЬ SECRET_KEY У RAILWAY:
   - Зайдіть на Railway Dashboard
   - Перейдіть у Variables
   - Змініть SECRET_KEY на: {new_secret_key}

2. ЗАВАНТАЖТЕ ОНОВЛЕНИЙ КОД НА GITHUB:
   - git add .
   - git commit -m "Security update: remove exposed secrets"
   - git push origin main

3. ПЕРЕЗАПУСТІТЬ ДОДАТОК НА RAILWAY

4. ПРОТЕСТУЙТЕ НОВИЙ ПАРОЛЬ:
   - Username: admin
   - Password: {new_password}

⚠️ ВАЖЛИВО:
- Старий SECRET_KEY тепер скомпрометований
- Видаліть цей файл після виконання інструкцій
- Не діліться цими даними з іншими
"""
    
    with open("SECURITY_UPDATE_INSTRUCTIONS.txt", "w", encoding='utf-8') as f:
        f.write(instructions)
    
    print("✅ Інструкції збережено у SECURITY_UPDATE_INSTRUCTIONS.txt")
    print()
    print("🚨 КРИТИЧНО: Негайно оновіть SECRET_KEY у Railway!")
    print(f"🔑 Новий ключ: {new_secret_key}")

if __name__ == "__main__":
    main()
