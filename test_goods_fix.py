#!/usr/bin/env python3
"""
Тест для перевірки виправленого функціоналу управління товарами
Перевіряємо, що товари не зникають після збереження нових
"""

import requests
import json
import time

# Базова URL
BASE_URL = "http://127.0.0.1:5000"

def login():
    """Авторизація в системі"""
    session = requests.Session()
    
    # Отримуємо сторінку входу для CSRF токену
    login_page = session.get(f"{BASE_URL}/login")
    if login_page.status_code != 200:
        print(f"❌ Помилка отримання сторінки входу: {login_page.status_code}")
        return None
    
    # Логінимося
    login_data = {
        'username': 'Dmitro',
        'password': 'Prodigy9195'
    }
    
    response = session.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code == 200 and "admin" in response.text.lower():
        print("✅ Успішно увійшли в систему")
        return session
    else:
        print(f"❌ Помилка входу: {response.status_code}")
        return None

def test_goods_management():
    """Тестуємо управління товарами"""
    print("\n🔍 ТЕСТУВАННЯ УПРАВЛІННЯ ТОВАРАМИ")
    print("=" * 50)
    
    # Авторизуємося
    session = login()
    if not session:
        return False
    
    # 1. Отримуємо поточні товари
    print("\n1️⃣ Отримуємо поточний список товарів...")
    response = session.get(f"{BASE_URL}/api/goods_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання товарів: {response.status_code}")
        return False
    
    initial_goods = response.json()
    print(f"✅ Отримано товарів: {len(initial_goods)} категорій")
    
    # Підрахуємо загальну кількість товарів
    total_initial = sum(len(items) for items in initial_goods.values())
    print(f"   Загальна кількість товарів: {total_initial}")
    
    # 2. Додаємо новий товар
    print("\n2️⃣ Додаємо новий тестовий товар...")
    new_goods = initial_goods.copy()
    
    # Якщо немає категорії "Тест", створюємо її
    if "Тест" not in new_goods:
        new_goods["Тест"] = []
    
    # Додаємо новий товар
    test_item = {
        "name": f"Тестовий товар {int(time.time())}",
        "weight": 1.5,
        "pallet_coef": 2.0
    }
    new_goods["Тест"].append(test_item)
    
    # Зберігаємо оновлений список
    response = session.post(f"{BASE_URL}/api/goods_management", 
                          json=new_goods,
                          headers={'Content-Type': 'application/json'})
    
    if response.status_code != 200:
        print(f"❌ Помилка збереження товару: {response.status_code}")
        print(f"Відповідь: {response.text}")
        return False
    
    print(f"✅ Новий товар додано: {test_item['name']}")
    
    # 3. Перевіряємо, що всі товари збереглися
    print("\n3️⃣ Перевіряємо, що попередні товари не зникли...")
    response = session.get(f"{BASE_URL}/api/goods_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання товарів після збереження: {response.status_code}")
        return False
    
    updated_goods = response.json()
    total_updated = sum(len(items) for items in updated_goods.values())
    
    print(f"   Товарів було: {total_initial}")
    print(f"   Товарів стало: {total_updated}")
    
    if total_updated > total_initial:
        print("✅ УСПІХ! Товари не зникли, новий товар додано")
        
        # Покажемо додатковi деталі
        print(f"\n📊 Деталі по категоріях:")
        for category, items in updated_goods.items():
            print(f"   {category}: {len(items)} товарів")
            
        return True
    elif total_updated == total_initial:
        print("⚠️ УВАГА! Кількість товарів не змінилася. Можливо товар не додався")
        return False
    else:
        print("❌ КРИТИЧНА ПОМИЛКА! Товари зникли після збереження")
        print(f"   Втрачено {total_initial - total_updated} товарів")
        return False

def test_warehouses_management():
    """Тестуємо управління складами"""
    print("\n🏪 ТЕСТУВАННЯ УПРАВЛІННЯ СКЛАДАМИ")
    print("=" * 50)
    
    # Авторизуємося
    session = login()
    if not session:
        return False
    
    # 1. Отримуємо поточні склади
    print("\n1️⃣ Отримуємо поточний список складів...")
    response = session.get(f"{BASE_URL}/api/warehouses_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання складів: {response.status_code}")
        return False
    
    warehouses = response.json()
    print(f"✅ Отримано складів: {len(warehouses)}")
    
    # 2. Додаємо новий склад
    print("\n2️⃣ Додаємо новий тестовий склад...")
    test_warehouse = f"Тестовий склад {int(time.time())}"
    updated_warehouses = warehouses + [test_warehouse]
    
    response = session.post(f"{BASE_URL}/api/warehouses_management", 
                          json=updated_warehouses,
                          headers={'Content-Type': 'application/json'})
    
    if response.status_code != 200:
        print(f"❌ Помилка збереження складу: {response.status_code}")
        return False
    
    print(f"✅ Новий склад додано: {test_warehouse}")
    
    # 3. Перевіряємо результат
    response = session.get(f"{BASE_URL}/api/warehouses_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання складів після збереження: {response.status_code}")
        return False
    
    final_warehouses = response.json()
    print(f"   Складів було: {len(warehouses)}")
    print(f"   Складів стало: {len(final_warehouses)}")
    
    if len(final_warehouses) > len(warehouses):
        print("✅ УСПІХ! Склад додано успішно")
        return True
    else:
        print("❌ Помилка додавання складу")
        return False

if __name__ == "__main__":
    print("🚀 ЗАПУСК ТЕСТІВ СИСТЕМИ УПРАВЛІННЯ")
    print("=" * 60)
    
    # Тестуємо товари
    goods_success = test_goods_management()
    
    # Тестуємо склади
    warehouses_success = test_warehouses_management()
    
    # Підсумок
    print("\n" + "=" * 60)
    print("📋 ПІДСУМОК ТЕСТУВАННЯ:")
    print(f"   Управління товарами: {'✅ ПРОЙДЕНО' if goods_success else '❌ ПРОВАЛЕНО'}")
    print(f"   Управління складами: {'✅ ПРОЙДЕНО' if warehouses_success else '❌ ПРОВАЛЕНО'}")
    
    if goods_success and warehouses_success:
        print("\n🎉 ВСІ ТЕСТИ ПРОЙДЕНО УСПІШНО!")
        print("   Система управління товарами та складами працює коректно")
    else:
        print("\n⚠️ ДЕЯКІ ТЕСТИ ПРОВАЛИЛИСЯ")
        print("   Потрібна додаткова діагностика")
