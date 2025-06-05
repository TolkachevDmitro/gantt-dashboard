#!/usr/bin/env python3
"""
Тест-скрипт для перевірки API управління товарами
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_goods_api():
    """Тестуємо API управління товарами"""
    
    print("🧪 Тестування API управління товарами")
    print("=" * 50)
    
    # Створюємо сесію для збереження cookies
    session = requests.Session()
    
    # Крок 1: Авторизація
    print("1️⃣ Авторизація...")
    
    # Спочатку отримуємо CSRF токен
    login_page = session.get(f"{BASE_URL}/login")
    if login_page.status_code != 200:
        print(f"❌ Помилка отримання сторінки входу: {login_page.status_code}")
        return False
    
    # Витягуємо CSRF токен з HTML
    csrf_token = None
    for line in login_page.text.split('\n'):
        if 'csrf_token' in line and 'value=' in line:
            start = line.find('value="') + 7
            end = line.find('"', start)
            csrf_token = line[start:end]
            break
    
    if not csrf_token:
        print("❌ Не вдалося отримати CSRF токен")
        return False
    
    # Авторизуємось
    login_data = {
        'username': 'Dmitro',
        'password': 'AdminPass123!',  # Потрібно буде змінити на правильний пароль
        'csrf_token': csrf_token
    }
    
    login_response = session.post(f"{BASE_URL}/login", data=login_data)
    if login_response.status_code != 200 or 'dashboard' not in login_response.url:
        print(f"❌ Помилка авторизації: {login_response.status_code}")
        print("Спробуйте увійти в браузері спочатку")
        return False
    
    print("✅ Авторизація успішна")
    
    # Крок 2: Отримуємо поточний список товарів
    print("\n2️⃣ Отримуємо поточний список товарів...")
    
    response = session.get(f"{BASE_URL}/api/goods_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання товарів: {response.status_code}")
        return False
    
    current_goods = response.json()
    print(f"✅ Поточні товари: {len(current_goods)} категорій")
    
    for category, items in current_goods.items():
        print(f"   📦 {category}: {len(items)} товарів")
        for item in items[:2]:  # Показуємо перші 2 товари
            print(f"      - {item['name']} ({item['weight']} кг)")
    
    # Крок 3: Додаємо новий тестовий товар
    print("\n3️⃣ Додаємо новий тестовий товар...")
    
    # Додаємо новий товар до існуючої категорії або створюємо нову
    test_category = "Тестова категорія"
    test_product = {
        "name": f"Тестовий товар {len(current_goods.get(test_category, []))}",
        "weight": 1.5,
        "pallet_coef": 2.0
    }
    
    # Копіюємо існуючі товари та додаємо новий
    updated_goods = current_goods.copy()
    if test_category not in updated_goods:
        updated_goods[test_category] = []
    updated_goods[test_category].append(test_product)
    
    # Надсилаємо оновлені дані
    response = session.post(
        f"{BASE_URL}/api/goods_management",
        json=updated_goods,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 200:
        print(f"❌ Помилка додавання товару: {response.status_code}")
        print(f"Відповідь: {response.text}")
        return False
    
    print(f"✅ Товар додано: {test_product['name']}")
    
    # Крок 4: Перевіряємо, що товар збережено
    print("\n4️⃣ Перевіряємо збереження товару...")
    
    response = session.get(f"{BASE_URL}/api/goods_management")
    if response.status_code != 200:
        print(f"❌ Помилка отримання оновлених товарів: {response.status_code}")
        return False
    
    updated_goods_check = response.json()
    
    # Перевіряємо, чи є наш тестовий товар
    if test_category in updated_goods_check:
        test_items = updated_goods_check[test_category]
        found_test_item = any(item['name'] == test_product['name'] for item in test_items)
        if found_test_item:
            print("✅ Товар успішно збережено та завантажено!")
            print(f"   📦 {test_category}: {len(test_items)} товарів")
        else:
            print("❌ Тестовий товар не знайдено після збереження")
            return False
    else:
        print("❌ Тестова категорія не знайдена після збереження")
        return False
    
    # Крок 5: Перевіряємо, що інші товари не зникли
    print("\n5️⃣ Перевіряємо, що інші товари не зникли...")
    
    original_total = sum(len(items) for items in current_goods.values())
    updated_total = sum(len(items) for items in updated_goods_check.values())
    
    if updated_total >= original_total:
        print(f"✅ Всі товари збережено! Було: {original_total}, стало: {updated_total}")
    else:
        print(f"❌ Товари зникли! Було: {original_total}, стало: {updated_total}")
        return False
    
    print("\n🎉 Всі тести пройдено успішно!")
    print("✅ Проблема зі зникаючими товарами виправлена!")
    
    return True

if __name__ == "__main__":
    success = test_goods_api()
    sys.exit(0 if success else 1)
