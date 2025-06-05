# 🚀 ШВИДКИЙ СТАРТ З HEROKU

## Крок 1: Встановлення Heroku CLI

1. Завантажте Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Після встановлення перезапустіть PowerShell

## Крок 2: Логін та створення додатку

```powershell
# Логін в Heroku
heroku login

# Створіть унікальне ім'я для вашого додатку (замініть на своє)
heroku create gantt-dashboard-tolka

# Або дозвольте Heroku автоматично згенерувати ім'я
heroku create
```

## Крок 3: Налаштування змінних середовища

```powershell
# Встановіть секретний ключ (згенеруйте власний!)
heroku config:set SECRET_KEY="your-super-secret-key-$(Get-Random)"

# Встановіть режим продакшену
heroku config:set FLASK_ENV=production
```

## Крок 4: Розгортання

```powershell
# Відправляємо код на Heroku
git push heroku main

# Якщо виникає помилка з main, спробуйте master
git push heroku master
```

## Крок 5: Відкриття додатку

```powershell
# Відкрити додаток в браузері
heroku open

# Переглянути логи якщо щось не працює
heroku logs --tail
```

---

## 🔧 АЛЬТЕРНАТИВНИЙ ВАРІАНТ: RAILWAY

Якщо Heroku не підходить, спробуйте Railway (ще простіше):

1. Зайдіть на https://railway.app
2. Підключіть GitHub репозиторій
3. Railway автоматично визначить Flask додаток
4. Натисніть Deploy!

---

## 📞 ДОПОМОГА

Якщо виникають проблеми:

- Перевірте логи: `heroku logs --tail`
- Переконайтеся що файли Procfile та runtime.txt існують
- Переконайтеся що requirements.txt містить всі залежності
