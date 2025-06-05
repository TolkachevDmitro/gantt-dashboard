#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тестовий скрипт для перевірки функціоналу управління товарами
"""

import requests
import json

# Налаштування
BASE_URL = "http://127.0.0.1:5000"
SESSION = requests.Session()

def login_as_admin():
    """Вхід як супер адмін"""
    login_data = {
        'username': 'Dmitro',
        'password': 'Dmytro123!'  # Потрібно буде уточнити пароль
    }
    
    response = SESSION.post(f"{BASE_URL}/login", data=login_data)
    print(f"Статус входу: {response.status_code}")
    return response.status_code == 200 or response.status_code == 302

def test_goods_api():
    """Тестування API товарів"""
    print("\n=== Тестування API товарів ===")
    
    # Отримання списку товарів
    response = SESSION.get(f"{BASE_URL}/api/goods_management")
    print(f"Отримання товарів: {response.status_code}")
    if response.status_code == 200:
        goods = response.json()
        print(f"Знайдено категорій: {len(goods)}")
        for category, items in goods.items():
            print(f"  - {category}: {len(items)} товарів")
    
    # Тестування додавання товару
    new_good = {
        'category': 'Тестова категорія',
        'name': 'Тестовий товар',
        'weight': 1.5,
        'pallet_coef': 2.0
    }
    
    response = SESSION.post(f"{BASE_URL}/api/goods_management", 
                           json=new_good,
                           headers={'Content-Type': 'application/json'})
    print(f"Додавання товару: {response.status_code}")
    if response.status_code == 200:
        print("✅ Товар успішно додано")
    else:
        print(f"❌ Помилка: {response.text}")

def test_goods_page():
    """Тестування сторінки управління товарами"""
    print("\n=== Тестування сторінки управління ===")
    
    response = SESSION.get(f"{BASE_URL}/goods_management")
    print(f"Доступ до сторінки: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Сторінка управління товарами доступна")
        # Перевіряємо, чи є основні елементи на сторінці
        content = response.text
        if "Управління товарами" in content:
            print("✅ Заголовок знайдено")
        if "Додати товар" in content:
            print("✅ Кнопка додавання знайдена")
        if "Завантажити Excel" in content:
            print("✅ Кнопка експорту знайдена")
        if "Імпортувати Excel" in content:
            print("✅ Кнопка імпорту знайдена")
    else:
        print(f"❌ Помилка доступу: {response.status_code}")

def main():
    print("🧪 Початок тестування функціоналу управління товарами")
    
    # Спробуємо увійти як адмін
    if login_as_admin():
        print("✅ Успішний вхід як адмін")
        test_goods_page()
        test_goods_api()
    else:
        print("❌ Не вдалося увійти як адмін")
        print("Потрібно перевірити логін та пароль")

if __name__ == "__main__":
    main()
