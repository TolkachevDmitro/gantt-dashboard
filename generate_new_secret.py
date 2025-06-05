#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔐 ГЕНЕРАТОР НОВОГО SECRET_KEY
Створює новий безпечний ключ для Flask додатку
"""

import secrets
import string
from datetime import datetime

def generate_secure_key(length=64):
    """Генерує безпечний SECRET_KEY"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def main():
    print("🔐 ГЕНЕРАЦІЯ НОВОГО SECRET_KEY")
    print("=" * 50)
    
    # Генеруємо новий ключ
    new_key = generate_secure_key()
    
    print(f"📅 Дата створення: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔑 Новий SECRET_KEY: {new_key}")
    print()
    print("🚨 ВАЖЛИВО:")
    print("1. Скопіюйте цей ключ")
    print("2. Оновіть змінну SECRET_KEY у Railway")
    print("3. НЕ публікуйте цей ключ у GitHub!")
    print()
    print("📋 Для Railway:")
    print(f"SECRET_KEY = {new_key}")
    
    # Зберігаємо у файл (тимчасово)
    with open('.new_secret_key.txt', 'w') as f:
        f.write(new_key)
    
    print("\n✅ Ключ збережено у файл '.new_secret_key.txt'")
    print("⚠️  Видаліть цей файл після оновлення Railway!")

if __name__ == "__main__":
    main()
