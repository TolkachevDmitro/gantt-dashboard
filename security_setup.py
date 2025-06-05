#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔒 БЕЗПЕЧНА ЗМІНА ПАРОЛЯ АДМІНІСТРАТОРА
Автоматично генерує новий пароль та оновлює users.json
"""

import json
import secrets
import string
from werkzeug.security import generate_password_hash
from pathlib import Path
import os

def generate_secure_password(length=16):
    """Генерує безпечний пароль"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_secret_key(length=50):
    """Генерує новий SECRET_KEY"""
    return secrets.token_urlsafe(length)

def update_admin_password():
    """Оновлює пароль адміністратора"""
    
    print("🔒 БЕЗПЕЧНА ЗМІНА ПАРОЛЯ АДМІНІСТРАТОРА")
    print("=" * 50)
    
    # Шлях до файлу користувачів
    users_file = Path("users.json")
    
    if not users_file.exists():
        print("❌ Файл users.json не знайдено!")
        return
    
    # Генеруємо новий пароль
    new_password = generate_secure_password()
    password_hash = generate_password_hash(new_password)
    
    try:
        # Читаємо поточних користувачів
        with open(users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        # Оновлюємо пароль адміністратора
        if 'admin' in users:
            users['admin']['password_hash'] = password_hash
            users['admin']['role'] = 'admin'
            
            # Зберігаємо оновлений файл
            with open(users_file, 'w', encoding='utf-8') as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
            
            print("✅ Пароль адміністратора successfully оновлений!")
            print(f"🔑 НОВИЙ ПАРОЛЬ: {new_password}")
            print(f"👤 ЛОГІН: admin")
            print()
            print("⚠️  ВАЖЛИВО:")
            print(f"   - Запишіть пароль: {new_password}")
            print("   - Не діліться ним з іншими")
            print("   - Перезапустіть додаток")
            
        else:
            print("❌ Користувач 'admin' не знайдений!")
            
    except Exception as e:
        print(f"❌ Помилка при оновленні пароля: {e}")

def generate_new_secret_key():
    """Генерує новий SECRET_KEY"""
    
    print("\n🔐 ГЕНЕРАЦІЯ НОВОГО SECRET_KEY")
    print("=" * 50)
    
    new_secret_key = generate_secret_key()
    
    print("✅ Новий SECRET_KEY згенерований!")
    print(f"🔑 SECRET_KEY: {new_secret_key}")
    print()
    print("📝 ІНСТРУКЦІЯ:")
    print("1. Скопіюйте цей ключ")
    print("2. Перейдіть на Railway → Variables")
    print("3. Оновіть SECRET_KEY")
    print("4. Перезапустіть додаток")

def main():
    """Головна функція"""
    
    print("🛡️  НАЛАШТУВАННЯ БЕЗПЕКИ GANTT DASHBOARD")
    print("=" * 60)
    print()
    print("Оберіть опцію:")
    print("1. Змінити пароль адміністратора")
    print("2. Згенерувати новий SECRET_KEY") 
    print("3. Зробити все разом")
    print("0. Вихід")
    print()
    
    choice = input("Ваш вибір (0-3): ").strip()
    
    if choice == "1":
        update_admin_password()
    elif choice == "2":
        generate_new_secret_key()
    elif choice == "3":
        update_admin_password()
        generate_new_secret_key()
    elif choice == "0":
        print("👋 До побачення!")
    else:
        print("❌ Невірний вибір!")

if __name__ == "__main__":
    main()
