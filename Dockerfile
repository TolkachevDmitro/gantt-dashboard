# Використовуємо Python 3.11
FROM python:3.11-slim

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо файл залежностей
COPY requirements.txt .

# Встановлюємо залежності
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо код додатку
COPY . .

# Створюємо директорії для логів та бекапів
RUN mkdir -p logs backups

# Відкриваємо порт
EXPOSE 5000

# Встановлюємо змінні середовища
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Запускаємо додаток
CMD ["python", "app.py"]
