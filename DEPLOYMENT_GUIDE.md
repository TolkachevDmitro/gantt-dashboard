# 🚀 ІНСТРУКЦІЯ ПО РОЗГОРТАННЮ НА ЗОВНІШНЬОМУ СЕРВЕРІ

## 📌 ВАРІАНТ 1: HEROKU (Найпростіший)

### Крок 1: Підготовка

1. Зареєструйтеся на https://heroku.com
2. Встановіть Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
3. Встановіть Git якщо не встановлений

### Крок 2: Ініціалізація Git репозиторію

```bash
cd "c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard"
git init
git add .
git commit -m "Initial commit"
```

### Крок 3: Створення Heroku додатку

```bash
heroku login
heroku create your-app-name
```

### Крок 4: Налаштування змінних середовища

```bash
heroku config:set SECRET_KEY=your-super-secret-key-here
heroku config:set FLASK_ENV=production
```

### Крок 5: Розгортання

```bash
git push heroku main
```

### Крок 6: Відкриття додатку

```bash
heroku open
```

---

## 📌 ВАРІАНТ 2: VPS СЕРВЕР (Ubuntu)

### Крок 1: Підключення до сервера

```bash
ssh your-username@your-server-ip
```

### Крок 2: Запуск скрипта розгортання

```bash
chmod +x deploy_to_server.sh
./deploy_to_server.sh
```

### Крок 3: Копіювання файлів

```bash
scp -r ./gantt_dashboard your-username@your-server-ip:/home/gantt_app/
```

### Крок 4: Налаштування systemd сервісу

```bash
sudo cp gantt-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gantt-dashboard
sudo systemctl start gantt-dashboard
```

### Крок 5: Налаштування Nginx

```bash
sudo cp nginx_config.conf /etc/nginx/sites-available/gantt-dashboard
sudo ln -s /etc/nginx/sites-available/gantt-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📌 ВАРІАНТ 3: DOCKER

### Крок 1: Встановлення Docker

- Windows: https://docs.docker.com/desktop/windows/install/
- Linux: https://docs.docker.com/engine/install/

### Крок 2: Збірка образу

```bash
cd "c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard"
docker build -t gantt-dashboard .
```

### Крок 3: Запуск контейнера

```bash
docker run -d -p 80:5000 --name gantt-app gantt-dashboard
```

### Крок 4: Або використання docker-compose

```bash
docker-compose up -d
```

---

## 📌 ВАРІАНТ 4: VERCEL

### Крок 1: Встановлення Vercel CLI

```bash
npm i -g vercel
```

### Крок 2: Логін та розгортання

```bash
vercel login
vercel --prod
```

---

## 🔒 ВАЖЛИВІ НАЛАШТУВАННЯ БЕЗПЕКИ

### 1. Змінити SECRET_KEY

```python
SECRET_KEY = 'ваш-унікальний-довгий-секретний-ключ'
```

### 2. Налаштувати SSL/HTTPS

```bash
# Для Let's Encrypt на Ubuntu
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Налаштувати фаєрвол

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 4. Налаштувати резервне копіювання

```bash
# Додати до crontab
0 2 * * * /home/gantt_app/gantt_env/bin/python /home/gantt_app/auto_backup.py
```

---

## 📞 ПІДТРИМКА

Якщо виникають проблеми:

1. Перевірте логи: `sudo journalctl -u gantt-dashboard -f`
2. Перевірте статус сервісу: `sudo systemctl status gantt-dashboard`
3. Перевірте Nginx: `sudo nginx -t`

## 🎯 РЕКОМЕНДАЦІЇ

**Для початківців:** Heroku
**Для досвідчених:** VPS + Docker
**Для розробників:** Vercel
**Для масштабування:** Kubernetes + Docker
