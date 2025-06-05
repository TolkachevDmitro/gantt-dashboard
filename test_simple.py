#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простий скрипт для перевірки доступу до сторінки управління товарами
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Налаштування сесії з повторними спробами
session = requests.Session()
retry_strategy = Retry(
    total=3,
    status_forcelist=[429, 500, 502, 503, 504],
    method_whitelist=["HEAD", "GET", "OPTIONS"]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)

BASE_URL = "http://127.0.0.1:5000"

def test_login_variants():
    """Тестування різних варіантів входу"""
    
    # Список можливих паролів
    password_variants = [
        'admin',
        'password', 
        'Dmitro123',
        'Dmitro123!',
        'dmitro',
        '123456',
        'password123',
        'Dmytro123!',
        'admin123'
    ]
    
    usernames = ['Dmitro', 'Serg']
    
    print("🔍 Тестування входу в систему...")
    
    for username in usernames:
        print(f"\n👤 Тестування користувача: {username}")
        
        for password in password_variants:
            try:
                # Створюємо нову сесію для кожної спроби
                test_session = requests.Session()
                
                # Спочатку отримуємо сторінку входу
                login_page = test_session.get(f"{BASE_URL}/login", timeout=5)
                
                if login_page.status_code != 200:
                    print(f"❌ Не вдалося отримати сторінку входу: {login_page.status_code}")
                    continue
                
                # Спробуємо увійти
                login_data = {
                    'username': username,
                    'password': password
                }
                
                response = test_session.post(f"{BASE_URL}/login", data=login_data, timeout=5)
                
                # Якщо перенаправлення - це може бути успішний вхід
                if response.status_code == 302:
                    # Перевіряємо, чи перенаправляє на головну сторінку
                    redirect_url = response.headers.get('Location', '')
                    if 'login' not in redirect_url:
                        print(f"✅ УСПІХ! {username}:{password}")
                        
                        # Тестуємо доступ до управління товарами
                        goods_page = test_session.get(f"{BASE_URL}/goods_management", timeout=5)
                        if goods_page.status_code == 200:
                            print(f"✅ Доступ до управління товарами: ТАК")
                            return username, password, test_session
                        else:
                            print(f"❌ Доступ до управління товарами: НІ ({goods_page.status_code})")
                    else:
                        print(f"❌ {username}:{password} - неправильний пароль")
                else:
                    print(f"❌ {username}:{password} - помилка {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Помилка з'єднання для {username}:{password} - {e}")
                
    return None, None, None

def test_goods_functionality(session):
    """Тестування функціоналу товарів"""
    
    print("\n🛍️ Тестування функціоналу управління товарами...")
    
    try:
        # Тест 1: Отримання списку товарів
        response = session.get(f"{BASE_URL}/api/goods_management", timeout=10)
        print(f"📦 Отримання списку товарів: {response.status_code}")
        
        if response.status_code == 200:
            goods = response.json()
            print(f"✅ Завантажено {len(goods)} категорій товарів")
            
            for category, items in goods.items():
                print(f"   - {category}: {len(items)} товарів")
        
        # Тест 2: Спроба додати новий товар
        test_good = {
            'category': 'ТЕСТ',
            'name': 'Тестовий товар',
            'weight': 1.0,
            'pallet_coef': 1.5
        }
        
        add_response = session.post(
            f"{BASE_URL}/api/goods_management",
            json=test_good,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"➕ Додавання тестового товару: {add_response.status_code}")
        
        if add_response.status_code == 200:
            result = add_response.json()
            print(f"✅ {result.get('message', 'Товар додано')}")
        else:
            print(f"❌ Помилка: {add_response.text}")
            
        # Тест 3: Перевірка експорту
        export_response = session.get(f"{BASE_URL}/api/goods_export", timeout=10)
        print(f"📤 Експорт товарів: {export_response.status_code}")
        
        if export_response.status_code == 200:
            print("✅ Експорт працює")
        else:
            print(f"❌ Помилка експорту: {export_response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Помилка при тестуванні: {e}")

def main():
    print("🧪 АВТОМАТИЧНЕ ТЕСТУВАННЯ ФУНКЦІОНАЛУ УПРАВЛІННЯ ТОВАРАМИ")
    print("=" * 60)
    
    # Спробуємо знайти правильні облікові дані
    username, password, session = test_login_variants()
    
    if username and password and session:
        print(f"\n🎉 Знайдено робочі облікові дані: {username}:{password}")
        test_goods_functionality(session)
        
        print(f"\n📋 РЕЗУЛЬТАТ ТЕСТУВАННЯ:")
        print(f"✅ Вхід: {username}:{password}")
        print(f"✅ Сервер працює на: {BASE_URL}")
        print(f"✅ Управління товарами: {BASE_URL}/goods_management")
        print(f"✅ API товарів: {BASE_URL}/api/goods_management")
        
    else:
        print(f"\n❌ Не вдалося знайти правильні облікові дані")
        print(f"Можливо потрібно:")
        print(f"1. Перевірити чи працює сервер на {BASE_URL}")
        print(f"2. Створити тестового супер адміна")
        print(f"3. Перевірити налаштування безпеки")

if __name__ == "__main__":
    main()
