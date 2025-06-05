import requests

print("🚀 Тестування API товарів...")

# Спробуємо підключитися до сервера
try:
    response = requests.get("http://127.0.0.1:5000", timeout=5)
    print(f"✅ Сервер відповідає: {response.status_code}")
except Exception as e:
    print(f"❌ Помилка підключення: {e}")

print("Тест завершено.")
