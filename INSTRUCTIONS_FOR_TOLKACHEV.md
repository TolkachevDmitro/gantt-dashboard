# 🚀 ІНСТРУКЦІЯ ДЛЯ TolkachevDmitro

## 📋 КРОК 1: Створіть репозиторій на GitHub

### 1.1 Зайдіть на GitHub
- Відкрийте: https://github.com/TolkachevDmitro
- Натисніть зелену кнопку **"New"** або **"Create repository"**

### 1.2 Налаштування репозиторію
- **Repository name:** `gantt-dashboard`
- **Description:** `Gantt Calendar Dashboard - Production Ready Flask App`
- **Visibility:** ✅ Public (або Private - на ваш вибір)
- **Initialize:** ❌ НЕ ставте галочки (README, .gitignore, license)

### 1.3 Натисніть "Create repository"

---

## 📋 КРОК 2: Завантажте код

Після створення репозиторію виконайте команди в PowerShell:

```powershell
cd "c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard"

# Push код на GitHub
git push -u origin main
```

Якщо запитає авторизацію - введіть ваші GitHub дані.

---

## 📋 КРОК 3: Розгортання на Railway

### 3.1 Зайдіть на Railway
- Відкрийте: https://railway.app
- Натисніть **"Login"** та авторизуйтесь через GitHub

### 3.2 Створіть новий проект
- Натисніть **"New Project"**
- Оберіть **"Deploy from GitHub repo"**
- Дозвольте Railway доступ до ваших репозиторіїв

### 3.3 Оберіть репозиторій
- Знайдіть **"gantt-dashboard"**
- Натисніть **"Deploy Now"**

### 3.4 Дочекайтесь розгортання
Railway автоматично:
- ✅ Встановить Python 3.11
- ✅ Встановить залежності з requirements.txt
- ✅ Запустить додаток через gunicorn
- ✅ Створить публічний URL

---

## 📋 КРОК 4: Налаштування змінних середовища

### 4.1 На панелі Railway
- Відкрийте ваш проект
- Перейдіть на вкладку **"Variables"**

### 4.2 Додайте змінні:

**SECRET_KEY:**
```
gantt-secret-key-tolkachev-2025-production
```

**FLASK_ENV:**
```
production
```

### 4.3 Перезапустіть сервіс
- Натисніть **"Redeploy"** після додавання змінних

---

## 📋 КРОК 5: Отримайте URL та тестуйте

### 5.1 Знайдіть URL
- На головній панелі Railway буде показаний URL типу:
- `https://gantt-dashboard-production-xxxx.up.railway.app`

### 5.2 Відкрийте сайт
- Натисніть на URL або скопіюйте в браузер
- Повинна відкритися сторінка входу

### 5.3 Увійдіть в систему
- **Логін:** admin
- **Пароль:** admin

---

## 🎉 ГОТОВО!

Ваш Gantt Dashboard тепер доступний онлайн!

### 🔗 Корисні посилання:
- **Ваш GitHub:** https://github.com/TolkachevDmitro/gantt-dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Ваш сайт:** (URL буде на Railway панелі)

---

## 🆘 Якщо щось не працює:

### 1. Перевірте логи
- На Railway Dashboard → вкладка "Deployments" → "View Logs"

### 2. Перевірте змінні
- Variables → переконайтеся що SECRET_KEY та FLASK_ENV встановлені

### 3. Перевірте репозиторій
- https://github.com/TolkachevDmitro/gantt-dashboard
- Переконайтеся що всі файли завантажені

---

## 🔄 Автоматичні оновлення

Railway автоматично перерозгортає при кожному push в GitHub!

Щоб оновити сайт:
```powershell
cd "c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard"

# Внесіть зміни в код
git add .
git commit -m "Update: [опис змін]"
git push
```

Railway автоматично оновить сайт!

---

**Успіхів з розгортанням! 🚀**
