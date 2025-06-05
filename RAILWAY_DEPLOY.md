# 🚂 РОЗГОРТАННЯ НА RAILWAY - ПОКРОКОВА ІНСТРУКЦІЯ

## 🎯 Railway - найпростіший спосіб розгортання!

Railway автоматично визначає Flask додатки і розгортає їх без додаткових налаштувань.

---

## 📋 **КРОК 1: Створити GitHub репозиторій**

### 1.1 Зайдіть на GitHub

- Відкрийте https://github.com
- Натисніть "New repository" (зелена кнопка)

### 1.2 Створіть репозиторій

- **Repository name:** `gantt-dashboard` (або будь-яке ім'я)
- **Description:** `Gantt Calendar Dashboard - Production Ready`
- ✅ **Public** (можна Private, але Public простіше)
- ❌ НЕ додавайте README, .gitignore, license (у нас вже є)

### 1.3 Завантажте код

Після створення репозиторію GitHub покаже команди. Виконайте їх:

```powershell
# У вашій директорії проекту:
cd "c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard"

# Додайте remote origin (замініть YOUR_USERNAME на ваш GitHub логін)
git remote add origin https://github.com/YOUR_USERNAME/gantt-dashboard.git

# Завантажте код
git branch -M main
git push -u origin main
```

---

## 📋 **КРОК 2: Розгортання на Railway**

### 2.1 Зайдіть на Railway

- Відкрийте https://railway.app
- Натисніть **"Start a New Project"**

### 2.2 Підключіть GitHub

- Натисніть **"Deploy from GitHub repo"**
- Авторизуйтесь через GitHub (якщо ще не авторизовані)
- Дозвольте Railway доступ до ваших репозиторіїв

### 2.3 Оберіть репозиторій

- Знайдіть ваш репозиторій `gantt-dashboard`
- Натисніть **"Deploy Now"**

### 2.4 Налаштування змінних середовища

Railway автоматично створить додаток, але потрібно додати змінні:

1. На панелі Railway знайдіть вкладку **"Variables"**
2. Додайте змінні:
   - `SECRET_KEY` = `your-super-secret-key-here-change-this`
   - `FLASK_ENV` = `production`

### 2.5 Отримайте URL

- Railway автоматично згенерує URL типу: `https://your-app-name.railway.app`
- URL буде показаний на Dashboard

---

## 📋 **КРОК 3: Перевірка**

### 3.1 Відкрийте ваш сайт

- Натисніть на згенерований URL
- Повинна відкритися сторінка входу

### 3.2 Увійдіть в систему

- **Логін:** admin
- **Пароль:** admin
- Або створіть нового користувача

### 3.3 Перевірте функціональність

- ✅ Завантаження даних з Excel
- ✅ Створення та редагування задач
- ✅ Збереження змін
- ✅ Історія змін

---

## 🎉 **ГОТОВО!**

Ваш Gantt Dashboard тепер доступний в інтернеті!

### 🔗 **Корисні посилання:**

- **Railway Dashboard:** https://railway.app/dashboard
- **Документація Railway:** https://docs.railway.app
- **Логи Railway:** На Dashboard -> Deployments -> View Logs

### 📝 **Додаткові налаштування:**

#### Власний домен (опціонально)

1. На Railway Dashboard йдіть в Settings
2. Натисніть "Custom Domain"
3. Додайте ваш домен

#### Автоматичне розгортання

Railway автоматично перерозгортає проект при кожному push в GitHub!

---

## 🆘 **Вирішення проблем**

### Якщо сайт не відкривається:

1. Перевірте логи на Railway Dashboard
2. Переконайтеся що змінні середовища встановлені
3. Перевірте що файл `Procfile` існує

### Якщо виникають помилки:

1. Перевірте що всі файли завантажені в GitHub
2. Перевірте `requirements.txt`
3. Подивіться на логи розгортання

### Контакт підтримки:

- Railway Support: https://railway.app/help
- GitHub Issues: у вашому репозиторії

---

## 💡 **Поради**

1. **Security:** Обов'язково змініть SECRET_KEY
2. **Backup:** Railway має автоматичні бекапи
3. **Monitoring:** Використовуйте Railway Analytics
4. **Updates:** Просто push код в GitHub - Railway автоматично оновить

**Railway - це найпростіший спосіб вивести ваш додаток в продакшн! 🚀**
