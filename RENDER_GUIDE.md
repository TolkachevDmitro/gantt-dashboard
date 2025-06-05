# 🔧 RENDER.COM - НАЛАШТУВАННЯ ПРОЕКТУ

## 📋 НАЛАШТУВАННЯ ДЛЯ RENDER.COM:

### Basic Settings:
- **Name:** gantt-dashboard-tolkachev
- **Environment:** Python 3
- **Region:** Frankfurt (EU) або Oregon (US)
- **Branch:** main

### Build & Deploy Settings:
- **Build Command:** 
```
pip install -r requirements.txt
```

- **Start Command:**
```
python app.py
```

### Advanced Settings:
- **Root Directory:** оставити пустим
- **Python Version:** 3.11.0

---

## 🔧 ЗМІННІ СЕРЕДОВИЩА (Environment Variables):

Після створення сервісу додайте змінні:

### Крок 1: У налаштуваннях сервісу знайдіть "Environment"
### Крок 2: Додайте змінні:

**Змінна 1:**
- Key: `SECRET_KEY`
- Value: `gantt-secret-key-tolkachev-2025-production`

**Змінна 2:**
- Key: `FLASK_ENV`
- Value: `production`

**Змінна 3:**
- Key: `PORT`
- Value: `5000`

---

## 🚀 ПРОЦЕС РОЗГОРТАННЯ:

1. ✅ Connect Repository
2. ⚙️ Configure Settings
3. 🔧 Add Environment Variables
4. 🚀 Deploy!

---

## 🌐 ОТРИМАННЯ URL:

Render автоматично створить URL типу:
`https://gantt-dashboard-tolkachev.onrender.com`

---

## ⏱️ ЧАС РОЗГОРТАННЯ:
- Перше розгортання: ~5-10 хвилин
- Наступні оновлення: ~2-3 хвилини

---

## ✅ ПЕРЕВАГИ RENDER.COM:
- 🆓 Безкоштовний план
- 🔄 Автоматичне SSL
- 📈 Простий моніторинг
- 🔧 Легкі налаштування
