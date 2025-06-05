import requests

# Простий тест підключення
try:
    response = requests.get("http://127.0.0.1:5000", timeout=5)
    print(f"Статус: {response.status_code}")
    print(f"Контент містить 'login': {'login' in response.text}")
    
    # Тест GET на API товарів (без авторизації)
    api_response = requests.get("http://127.0.0.1:5000/api/goods", timeout=5)
    print(f"API товарів (без авторизації): {api_response.status_code}")
    
except Exception as e:
    print(f"Помилка: {e}")

print("Тест завершено")
