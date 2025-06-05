#!/bin/bash
# railway.sh - скрипт запуску для Railway

# Встановлюємо PORT якщо не встановлений
export PORT=${PORT:-8000}

# Запускаємо Gunicorn
exec gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
