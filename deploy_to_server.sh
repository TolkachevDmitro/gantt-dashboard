#!/bin/bash
# deploy_to_server.sh - Скрипт розгортання на Ubuntu сервері

echo "🚀 Початок розгортання Flask додатку на Ubuntu сервері"

# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Python та pip
sudo apt install python3 python3-pip python3-venv nginx -y

# Створення користувача для додатку
sudo useradd -m -s /bin/bash gantt_app
sudo usermod -aG sudo gantt_app

# Перехід до домашньої директорії користувача
cd /home/gantt_app

# Створення віртуального середовища
sudo -u gantt_app python3 -m venv gantt_env
sudo -u gantt_app /home/gantt_app/gantt_env/bin/pip install --upgrade pip

# Копіювання файлів проекту (припускається, що файли вже завантажені)
# sudo cp -r /path/to/your/project/* /home/gantt_app/
# sudo chown -R gantt_app:gantt_app /home/gantt_app/

# Встановлення залежностей
sudo -u gantt_app /home/gantt_app/gantt_env/bin/pip install -r requirements.txt
sudo -u gantt_app /home/gantt_app/gantt_env/bin/pip install gunicorn

echo "✅ Розгортання завершено!"
echo "📋 Наступні кроки:"
echo "1. Скопіюйте файли проекту в /home/gantt_app/"
echo "2. Налаштуйте Nginx"
echo "3. Створіть systemd сервіс"
echo "4. Запустіть додаток"
