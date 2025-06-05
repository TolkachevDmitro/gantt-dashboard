import requests
import json
import time

# Базова URL
BASE_URL = "http://127.0.0.1:5000"

def test_with_login():
    """Тестуємо систему після авторизації"""
    print("🔐 АВТОМАТИЗОВАНИЙ ТЕСТ СИСТЕМИ")
    print("=" * 50)
    
    # Створюємо сесію
    session = requests.Session()
    
    try:
        # 1. Авторизуємося
        print("1️⃣ Авторизація...")
        login_data = {
            'username': 'Dmitro',
            'password': 'Prodigy9195'
        }
        
        response = session.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code == 200 and ("admin" in response.text.lower() or "dashboard" in response.text.lower()):
            print("✅ Успішно увійшли в систему")
        else:
            print(f"❌ Помилка входу: {response.status_code}")
            return False
        
        # 2. Тестуємо API діагностики
        print("\n2️⃣ Запуск тестового API...")
        response = session.get(f"{BASE_URL}/test_goods_api")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Тестовий API відповів успішно")
            
            # Показуємо результати тестів
            for test in result.get('tests', []):
                status = test.get('status', '❓')
                name = test.get('name', 'Невідомий тест')
                details = test.get('details', '')
                print(f"   {status} {name}: {details}")
            
            # Перевіряємо критичні помилки
            failed_tests = [t for t in result.get('tests', []) if t.get('status') == '❌']
            if failed_tests:
                print(f"\n⚠️ Знайдено {len(failed_tests)} проблем:")
                for test in failed_tests:
                    print(f"   • {test.get('name')}: {test.get('details')}")
                    
                    # Якщо проблема із збереженням товарів - це критично
                    if 'збереження' in test.get('name', '').lower() or 'втрачено' in test.get('details', '').lower():
                        print("🚨 КРИТИЧНА ПРОБЛЕМА: Товари зникають при збереженні!")
                        return False
            else:
                print("\n🎉 Всі тести пройшли успішно!")
                
                # Показуємо статистику товарів
                goods = result.get('goods', {})
                warehouses = result.get('warehouses', [])
                total_goods = sum(len(items) for items in goods.values())
                
                print(f"\n📊 Поточна статистика:")
                print(f"   Категорій товарів: {len(goods)}")
                print(f"   Загальна кількість товарів: {total_goods}")
                print(f"   Кількість складів: {len(warehouses)}")
                
            return True
        else:
            print(f"❌ Помилка тестового API: {response.status_code}")
            print(f"Відповідь: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Помилка: {e}")
        return False

def test_manual_goods_api():
    """Тестуємо API управління товарами вручну"""
    print("\n🛠️ РУЧНИЙ ТЕСТ API УПРАВЛІННЯ ТОВАРАМИ")
    print("=" * 50)
    
    session = requests.Session()
    
    try:
        # Авторизуємося
        login_data = {'username': 'Dmitro', 'password': 'Prodigy9195'}
        response = session.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code != 200:
            print("❌ Помилка авторизації")
            return False
        
        # 1. Отримуємо поточні товари
        print("1️⃣ Отримання поточних товарів...")
        response = session.get(f"{BASE_URL}/api/goods_management")
        if response.status_code != 200:
            print(f"❌ Помилка отримання товарів: {response.status_code}")
            return False
        
        initial_goods = response.json()
        initial_count = sum(len(items) for items in initial_goods.values())
        print(f"✅ Отримано {initial_count} товарів у {len(initial_goods)} категоріях")
        
        # 2. Додаємо новий товар
        print("\n2️⃣ Додавання нового товару...")
        new_good_data = {
            'category': 'Тест',
            'name': f'Автотест товар {int(time.time())}',
            'weight': 1.5,
            'pallet_coef': 2.0
        }
        
        response = session.post(f"{BASE_URL}/api/goods_management", 
                              json=new_good_data,
                              headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            print(f"✅ Товар '{new_good_data['name']}' успішно додано")
        else:
            print(f"❌ Помилка додавання товару: {response.status_code}")
            print(f"Відповідь: {response.text}")
            return False
        
        # 3. Перевіряємо, що товари не зникли
        print("\n3️⃣ Перевірка збереження товарів...")
        response = session.get(f"{BASE_URL}/api/goods_management")
        if response.status_code != 200:
            print(f"❌ Помилка отримання товарів після додавання: {response.status_code}")
            return False
        
        updated_goods = response.json()
        updated_count = sum(len(items) for items in updated_goods.values())
        
        print(f"   Товарів було: {initial_count}")
        print(f"   Товарів стало: {updated_count}")
        
        if updated_count > initial_count:
            print("✅ УСПІХ! Товари збереглися, новий товар додано")
            
            # Показуємо деталі
            print(f"\n📋 Оновлена статистика:")
            for category, items in updated_goods.items():
                print(f"   {category}: {len(items)} товарів")
                if category == 'Тест':
                    for item in items:
                        print(f"     • {item['name']} ({item['weight']} кг)")
            
            return True
        elif updated_count == initial_count:
            print("⚠️ Товар не додався або замінив існуючий")
            return False
        else:
            print("❌ КРИТИЧНА ПОМИЛКА! Товари зникли")
            print(f"   Втрачено {initial_count - updated_count} товарів")
            return False
            
    except Exception as e:
        print(f"❌ Помилка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 КОМПЛЕКСНИЙ ТЕСТ СИСТЕМИ УПРАВЛІННЯ ТОВАРАМИ")
    print("=" * 70)
    
    # Перевіряємо, чи сервер запущений
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Сервер доступний")
        else:
            print(f"⚠️ Сервер відповів з кодом {response.status_code}")
    except:
        print("❌ Сервер недоступний. Переконайтеся, що Flask запущений на http://127.0.0.1:5000")
        exit(1)
    
    # Запускаємо тести
    test1_success = test_with_login()
    test2_success = test_manual_goods_api()
    
    # Підсумок
    print("\n" + "=" * 70)
    print("📋 ПІДСУМОК ТЕСТУВАННЯ:")
    print(f"   Діагностичний тест: {'✅ ПРОЙДЕНО' if test1_success else '❌ ПРОВАЛЕНО'}")
    print(f"   Ручний тест API: {'✅ ПРОЙДЕНО' if test2_success else '❌ ПРОВАЛЕНО'}")
    
    if test1_success and test2_success:
        print("\n🎉 ВСІ ТЕСТИ ПРОЙДЕНО УСПІШНО!")
        print("   Система управління товарами працює коректно.")
        print("   Проблема зі зникаючими товарами ВИПРАВЛЕНА! ✅")
    else:
        print("\n⚠️ ДЕЯКІ ТЕСТИ ПРОВАЛИЛИСЯ")
        print("   Потрібна додаткова діагностика або виправлення.")
