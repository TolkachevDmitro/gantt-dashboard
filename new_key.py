import secrets
import string

# Генеруємо новий безпечний SECRET_KEY
alphabet = string.ascii_letters + string.digits + "!@#$%^&*()_+-="
new_key = ''.join(secrets.choice(alphabet) for _ in range(64))

print("🔐 НОВИЙ SECRET_KEY:")
print("=" * 70)
print(new_key)
print("=" * 70)
print()
print("🚨 НЕГАЙНО ОНОВІТЬ У RAILWAY:")
print("1. Зайдіть у Railway Dashboard")
print("2. Variables -> SECRET_KEY")
print("3. Замініть старий ключ на новий")
print("4. Перезапустіть додаток")
