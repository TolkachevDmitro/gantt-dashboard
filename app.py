# app.py — 💡 heavily commented so you can learn every step
from datetime import date, timedelta, datetime
from pathlib import Path
import json
import pandas as pd  # Добавляем библиотеку pandas для работы с Excel
from werkzeug.security import generate_password_hash, check_password_hash
import threading
import secrets
import os
import shutil
import hashlib
import re

from flask import Flask, jsonify, render_template, request, session, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
from datetime import date, timedelta, datetime
from pathlib import Path
import json
import pandas as pd  # Добавляем библиотеку pandas для работы с Excel
from werkzeug.security import generate_password_hash, check_password_hash
import threading
import secrets
import os
import shutil
import hashlib
import re

from flask import Flask, jsonify, render_template, request, session, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "logs" / "tasks.json"  # JSON‑файл з усіма прямокутниками
GOODS_FILE = BASE_DIR / "goods.xlsx"  # Excel-файл зі списком товарів
USERS_FILE = BASE_DIR / "users.json"  # JSON-файл з користувачами
BACKUP_DIR = BASE_DIR / "backups"  # Папка для бекапів
SECURITY_LOG_FILE = BASE_DIR / "logs" / "security.log"  # Лог безпеки

# Створюємо необхідні папки
BACKUP_DIR.mkdir(exist_ok=True)
(BASE_DIR / "logs").mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# 👉  Flask app: мінімальний бекенд‑API — фронт зберігає/читає JSON через fetch
# ---------------------------------------------------------------------------
app = Flask(__name__, template_folder="templates", static_folder="static")
app.config.update(JSON_SORT_KEYS=False)  # не міняємо порядок ключів

# Безпечний секретний ключ з підтримкою змінних середовища
SECRET_KEY_FILE = BASE_DIR / ".secret_key"
if os.environ.get('SECRET_KEY'):
    # Використовуємо секретний ключ зі змінних середовища (Heroku, Docker)
    app.secret_key = os.environ.get('SECRET_KEY')
elif SECRET_KEY_FILE.exists():
    app.secret_key = SECRET_KEY_FILE.read_text().strip()
else:
    app.secret_key = secrets.token_hex(32)
    SECRET_KEY_FILE.write_text(app.secret_key)

# 🔒 КРИТИЧНІ КОМПОНЕНТИ БЕЗПЕКИ ДЛЯ ПРОДАКШН
# Ініціалізація CSRF Protection
csrf = CSRFProtect(app)

# Исключаем API endpoints из CSRF проверки
@csrf.exempt
def csrf_exempt_api():
    """Исключаем все API endpoints из CSRF проверки для удобства AJAX запросов"""
    pass

# Конфігурація додаткової безпеки для продакшн
app.config.update(
    # Session security для HTTPS (активувати тільки з HTTPS!)
    # SESSION_COOKIE_SECURE=True,  # Розкоментувати для HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Strict',
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8),  # Сесія на 8 годин
    
    # CSRF налаштування
    WTF_CSRF_TIME_LIMIT=3600,  # CSRF токен дійсний 1 годину
    WTF_CSRF_SSL_STRICT=False,  # Для локального тестування, встановити True для HTTPS
)

# Rate limiting - захист від brute force атак
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Security headers для захисту від XSS, clickjacking та ін.
@app.after_request
def add_security_headers(response):
    """Додає важливі заголовки безпеки."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Content Security Policy - захист від XSS
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "font-src 'self' https://fonts.gstatic.com; "
        "object-src 'none'; "
        "base-uri 'self';"
    )
    response.headers['Content-Security-Policy'] = csp
    
    # Strict Transport Security (тільки для HTTPS)
    # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Налаштування Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Будь ласка, увійдіть в систему для доступу до цієї сторінки.'
login_manager.login_message_category = 'info'

# Lock для синхронізації доступу до файлу логів
log_file_lock = threading.Lock()

# Клас користувача
class User(UserMixin):
    def __init__(self, username, role):
        self.id = username
        self.username = username
        self.role = role
    
    def is_super_admin(self):
        return self.role == 'super_admin'
    
    def is_user(self):
        return self.role in ['super_admin', 'user']
    
    def is_viewer(self):
        return self.role in ['super_admin', 'user', 'viewer']

@login_manager.user_loader
def load_user(username):
    users = load_users()
    if username in users:
        return User(username, users[username]['role'])
    return None

def log_security_event(event_type, username, details="", ip_address=""):
    """Логування подій безпеки."""
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {event_type} | User: {username} | IP: {ip_address} | Details: {details}\n"
        
        with open(SECURITY_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Помилка запису в лог безпеки: {e}")

def create_backup():
    """Створення бекапу всіх важливих файлів."""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_folder = BACKUP_DIR / f"backup_{timestamp}"
        backup_folder.mkdir(exist_ok=True)
        
        # Бекап файлів
        files_to_backup = [
            ("users.json", USERS_FILE),
            ("tasks.json", DATA_FILE),
            ("changes_log.json", BASE_DIR / "logs" / "changes_log.json"),
            ("goods.xlsx", GOODS_FILE)
        ]
        
        for backup_name, source_file in files_to_backup:
            if source_file.exists():
                shutil.copy2(source_file, backup_folder / backup_name)
        
        # Видаляємо старі бекапи (залишаємо останні 10)
        cleanup_old_backups()
        
        print(f"Бекап створено: {backup_folder}")
        return True
    except Exception as e:
        print(f"Помилка створення бекапу: {e}")
        return False

def cleanup_old_backups():
    """Видаляємо старі бекапи, залишаємо останні 10."""
    try:
        backup_folders = sorted([d for d in BACKUP_DIR.iterdir() if d.is_dir() and d.name.startswith("backup_")])
        
        if len(backup_folders) > 10:
            for old_backup in backup_folders[:-10]:
                shutil.rmtree(old_backup)
                print(f"Видалено старий бекап: {old_backup}")
    except Exception as e:
        print(f"Помилка очищення старих бекапів: {e}")

def load_users():
    """Читаємо users.json або повертаємо користувачів за замовчуванням."""
    if USERS_FILE.exists():
        with USERS_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    
    # Створюємо користувачів за замовчуванням з захешованими паролями
    default_users = {
        "admin": {
            "password": generate_password_hash("admin123"), 
            "role": "super_admin",
            "created_at": datetime.now().isoformat(),
            "last_login": None
        },
        "user": {
            "password": generate_password_hash("user123"), 
            "role": "user",
            "created_at": datetime.now().isoformat(),
            "last_login": None
        },
        "viewer": {
            "password": generate_password_hash("view123"), 
            "role": "viewer",
            "created_at": datetime.now().isoformat(),
            "last_login": None
        }
    }
    save_users(default_users)
    return default_users

def save_users(users_data):
    """Записуємо користувачів у users.json з бекапом."""
    # Створюємо бекап перед збереженням
    create_backup()
    
    with USERS_FILE.open("w", encoding="utf-8") as f:
        json.dump(users_data, f, ensure_ascii=False, indent=2)

def role_required(required_role):
    """Декоратор для перевірки ролі користувача."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('login'))
            
            if required_role == 'super_admin' and not current_user.is_super_admin():
                flash('У вас немає прав доступу до цієї сторінки.', 'error')
                return redirect(url_for('index'))
            elif required_role == 'user' and not current_user.is_user():
                flash('У вас немає прав доступу до цієї сторінки.', 'error')
                return redirect(url_for('index'))
            elif required_role == 'viewer' and not current_user.is_viewer():
                flash('У вас немає прав доступу до цієї сторінки.', 'error')
                return redirect(url_for('index'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def load_tasks():
    """Читаємо tasks.json або повертаємо пустий словник, якщо файл відсутній."""
    if DATA_FILE.exists():
        with DATA_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_goods():
    """Читаємо goods.xlsx і повертаємо товари, згруповані за категоріями."""
    try:
        if GOODS_FILE.exists():
            print(f"Файл goods.xlsx найден по пути: {GOODS_FILE}")
            # Читаємо Excel-файл, колонки A (категорії), B (товари), D (вага кг) і E (коєфіцієнт місця на паллеті)
            df = pd.read_excel(GOODS_FILE, usecols=[0, 1, 3, 4], header=0)
            
            # Отримаємо назви колонок
            category_column = df.columns[0]  # Колонка A з категоріями
            product_column = df.columns[1]   # Колонка B з товарами
            weight_column = df.columns[2]    # Колонка D з вагою товарів
            pallet_coef_column = df.columns[3]  # Колонка E з коєфіцієнтом місця на паллеті
            
            print(f"Загружены колонки: {category_column}, {product_column}, {weight_column}, {pallet_coef_column}")
            print(f"Количество строк: {len(df)}")
            
            # Видаляємо рядки з відсутніми товарами
            df = df.dropna(subset=[product_column])
            print(f"После удаления строк с пустыми товарами: {len(df)}")
            
            # Якщо категорія відсутня, встановлюємо "Інше" як значення за замовчуванням
            df[category_column] = df[category_column].fillna("Інше")
            
            # Групуємо товари по категоріях
            categorized_goods = {}
            for _, row in df.iterrows():
                category = str(row[category_column]).strip()
                product = str(row[product_column]).strip()
                weight = float(row[weight_column]) if pd.notna(row[weight_column]) else 0
                pallet_coef = float(row[pallet_coef_column]) if pd.notna(row[pallet_coef_column]) else 1.0
                
                if category not in categorized_goods:
                    categorized_goods[category] = []
                    
                categorized_goods[category].append({
                    "name": product,
                    "weight": weight,
                    "pallet_coef": pallet_coef
                })
            
            print(f"Загружено категорій: {len(categorized_goods)}")
            for cat, items in categorized_goods.items():
                print(f"  - {cat}: {len(items)} товарів")
            
            return categorized_goods
        else:
            print(f"Файл goods.xlsx не найден по пути: {GOODS_FILE}")
            # Якщо файл не знайдено, повертаємо структуру за замовчуванням
            default_goods = {
                "Фрукти": [
                    {"name": "манго Бут", "weight": 0.5},
                    {"name": "питахайя Бут", "weight": 0.3},
                    {"name": "маракуйя Бут", "weight": 0.2}
                ],
                "Інше": [{"name": "товар без категорії", "weight": 1.0}]
            }
            print(f"Возвращаем структуру по умолчанию: {default_goods}")
            return default_goods
    except Exception as e:
        print(f"Помилка при читанні файлу goods.xlsx: {e}")
        # Якщо сталася помилка, повертаємо структуру за замовчуванням
        default_goods = {
            "Фрукти": [
                {"name": "манго Бут", "weight": 0.5},
                {"name": "питахайя Бут", "weight": 0.3},
                {"name": "маракуйя Бут", "weight": 0.2}
            ],
            "Інше": [{"name": "товар без категорії", "weight": 1.0}]
        }
        print(f"Возвращаем структуру по умолчанию после ошибки: {default_goods}")
        return default_goods


def load_warehouses():
    """Читаємо goods.xlsx і повертаємо список складів з колонки 'склади' (J)."""
    try:
        if GOODS_FILE.exists():
            # Читаємо Excel-файл, колонку 'склади' (індекс 9)
            df = pd.read_excel(GOODS_FILE, usecols=[9], header=0)
            warehouse_column = df.columns[0]  # Назва колонки 'склади'
            
            # Видаляємо рядки з відсутніми назвами складів та перетворюємо на список
            warehouses = df[warehouse_column].dropna().tolist()
            print(f"Завантажено {len(warehouses)} складів з Excel: {warehouses}")
            return warehouses
        else:
            # Якщо файл не знайдено, повертаємо фіктивний список
            print("Файл Excel не знайдено, використовуємо фіктивний список складів")
            return ["Склад №1", "Склад №2", "Склад №3", "Склад №4"]
    except Exception as e:
        print(f"Помилка при читанні складів з файлу goods.xlsx: {e}")
        # Якщо сталася помилка, повертаємо фіктивний список
        return ["Склад А", "Склад Б", "Склад В"]


def save_tasks(data: dict):
    """Записуємо словник у tasks.json, pretty‑print для зручності з бекапом."""
    # Створюємо бекап перед збереженням важливих змін
    if len(data) % 10 == 0:  # Створюємо бекап кожні 10 операцій
        create_backup()
    
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route("/")
@login_required
def index():
    # ⚠️ На фронт «живі» дані не потрібні — він робить окремий GET /api/tasks.
    #      Тут просто віддаємо HTML‑шаблон.
    return render_template("index.html", user=current_user)

@app.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per minute")  # Максимум 10 спроб входу за хвилину
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        # Валідація даних
        if not username or not password:
            log_security_event("LOGIN_FAILED", username or "unknown", "Empty credentials", ip_address)
            flash('Будь ласка, введіть ім\'я користувача та пароль', 'error')
            return render_template("login.html")
        
        users = load_users()
        
        if username in users:
            stored_password = users[username]["password"]
            
            # Перевіряємо, чи пароль вже захешований (підтримуємо різні алгоритми)
            if (stored_password.startswith('pbkdf2:sha256:') or 
                stored_password.startswith('scrypt:') or 
                stored_password.startswith('argon2:')):
                # Захешований пароль - використовуємо check_password_hash
                password_valid = check_password_hash(stored_password, password)
            else:
                # Старий незахешований пароль - конвертуємо
                password_valid = (stored_password == password)
                if password_valid:
                    # Оновлюємо пароль до захешованого формату
                    users[username]["password"] = generate_password_hash(password)
                    users[username]["last_login"] = datetime.now().isoformat()
                    save_users(users)
            
            if password_valid:
                # Оновлюємо час останнього входу
                users[username]["last_login"] = datetime.now().isoformat()
                save_users(users)
                
                user = User(username, users[username]["role"])
                login_user(user)
                
                log_security_event("LOGIN_SUCCESS", username, f"Role: {users[username]['role']}", ip_address)
                flash(f'Ласкаво просимо, {username}!', 'success')
                return redirect(url_for('index'))
            else:
                log_security_event("LOGIN_FAILED", username, "Invalid password", ip_address)
                flash('Невірне ім\'я користувача або пароль', 'error')
        else:
            log_security_event("LOGIN_FAILED", username, "User not found", ip_address)
            flash('Невірне ім\'я користувача або пароль', 'error')
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    username = current_user.username
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    log_security_event("LOGOUT", username, "", ip_address)
    logout_user()
    flash('Ви успішно вийшли з системи', 'info')
    return redirect(url_for('login'))

@app.route("/admin")
@login_required
@role_required('super_admin')
def admin_panel():
    users = load_users()
    stats = get_user_stats()
    return render_template("admin.html", users=users, stats=stats)

@app.route("/admin/add_user", methods=["POST"])
@login_required
@role_required('super_admin')
@limiter.limit("5 per minute")  # Максимум 5 додавань користувачів за хвилину
def add_user():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    role = request.form.get("role", "")
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    # Валідація імені користувача
    valid_username, username_error = validate_username(username)
    if not valid_username:
        log_security_event("USER_ADD_FAILED", current_user.username, f"Invalid username: {username}", ip_address)
        flash(username_error, 'error')
        return redirect(url_for('admin_panel'))
    
    # Валідація пароля
    valid_password, password_error = validate_password(password)
    if not valid_password:
        log_security_event("USER_ADD_FAILED", current_user.username, f"Invalid password for user: {username}", ip_address)
        flash(password_error, 'error')
        return redirect(url_for('admin_panel'))
    
    # Валідація ролі
    if role not in ['super_admin', 'user', 'viewer']:
        log_security_event("USER_ADD_FAILED", current_user.username, f"Invalid role: {role}", ip_address)
        flash('Невірна роль користувача', 'error')
        return redirect(url_for('admin_panel'))
    
    users = load_users()
    
    # Перевірка на унікальність імені
    if username in users:
        log_security_event("USER_ADD_FAILED", current_user.username, f"User already exists: {username}", ip_address)
        flash('Користувач з таким іменем вже існує', 'error')
        return redirect(url_for('admin_panel'))
    
    # Додаємо користувача з захешованим паролем
    users[username] = {
        "password": generate_password_hash(password), 
        "role": role,
        "created_at": datetime.now().isoformat(),
        "created_by": current_user.username,
        "last_login": None
    }
    save_users(users)
    
    # Лог дії
    log_security_event("USER_ADDED", current_user.username, f"Added user: {username} with role: {role}", ip_address)
    
    flash(f'Користувач {username} успішно додан з роллю {role}', 'success')
    return redirect(url_for('admin_panel'))

@app.route("/admin/delete_user/<username>", methods=["POST"])
@login_required
@role_required('super_admin')
def delete_user(username):
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    if username == current_user.username:
        log_security_event("USER_DELETE_FAILED", current_user.username, "Attempted to delete self", ip_address)
        flash('Ви не можете видалити себе', 'error')
        return redirect(url_for('admin_panel'))
    
    users = load_users()
    if username in users:
        user_role = users[username]["role"]
        del users[username]
        save_users(users)
        
        # Лог дії
        log_security_event("USER_DELETED", current_user.username, f"Deleted user: {username} with role: {user_role}", ip_address)
        
        flash(f'Користувач {username} ({user_role}) успішно видален', 'success')
    else:
        log_security_event("USER_DELETE_FAILED", current_user.username, f"User not found: {username}", ip_address)
        flash('Користувач не знайден', 'error')
    
    return redirect(url_for('admin_panel'))


@app.route("/api/tasks", methods=["GET", "POST", "PUT", "DELETE"])
@login_required
@csrf.exempt  # Исключаем API из CSRF проверки
def tasks():
    db = load_tasks()
    
    if request.method == "GET":  # 🔹 отримати всі прямокутники
        # Здесь фильтруем задачи, удаляя те, которые старше 90 дней
        today = date.today()
        cutoff_date = today - timedelta(days=90)
        tasks_to_delete = []
        
        for task_id, task_data in db.items():
            try:
                # Получаем дату начала задачи из строки ISO
                task_date_str = task_data.get("start", "")
                if task_date_str:
                    # Преобразуем ISO строку в объект date (берем только дату, без времени)
                    task_date = date.fromisoformat(task_date_str.split("T")[0])
                    # Если задача старше 90 дней, добавляем в список на удаление
                    if task_date < cutoff_date:
                        tasks_to_delete.append(task_id)
            except Exception as e:
                print(f"Ошибка при проверке даты задачи {task_id}: {e}")
        
        # Удаляем старые задачи из базы данных
        if tasks_to_delete:
            for task_id in tasks_to_delete:
                db.pop(task_id, None)
                print(f"Задача {task_id} удалена, так как она старше 90 дней")
            
            # Сохраняем обновленную базу данных
            save_tasks(db)
            print(f"Удалено {len(tasks_to_delete)} устаревших задач")
            
        return jsonify(db)

    # Перевіряємо права для модифікації даних
    if current_user.role == 'viewer':
        return jsonify(error="Недостатньо прав для виконання цієї операції"), 403

    payload = request.get_json(force=True)
    rect_id = payload.get("id")

    if request.method == "POST":  # 🔸 створити новий прямокутник
        db[rect_id] = payload  # frontend присвоює id через Date.now()
        save_tasks(db)
        return jsonify(status="created")

    if request.method == "PUT":  # 🟠 оновити існуючий прямокутник
        if rect_id not in db:
            return jsonify(error="not found"), 404
        db[rect_id].update(payload)
        save_tasks(db)
        return jsonify(status="updated")

    if request.method == "DELETE":  # ❌ видалити прямокутник
        db.pop(rect_id, None)
        save_tasks(db)
        return jsonify(status="deleted")

    return jsonify(error="bad request"), 400


@app.route("/api/goods")
@login_required
@csrf.exempt  # Исключаем API из CSRF проверки
def goods():
    """Передаємо список товарів з Excel-файлу для форми замовлення."""
    goods_list = load_goods()
    return jsonify(goods_list)


@app.route("/api/warehouses")
@login_required
@csrf.exempt  # Исключаем API из CSRF проверки
def warehouses():
    """Передаємо список складів з Excel-файлу."""
    warehouse_list = load_warehouses()
    return jsonify(warehouse_list)


@app.route("/api/log_event", methods=["POST"])
@login_required
@csrf.exempt  # Исключаем API из CSRF проверки
def log_event():
    """Сохраняем события лога изменений (только последние 100 записей)."""
    try:
        log_data = request.json
        
        # Проверяем, является ли это просмотром
        if (log_data.get("type") == "view" or 
            log_data.get("isViewOnly") is True):
            # Пропускаем запись в лог просмотров
            return jsonify({"status": "skipped"})
            
        # Логируем все остальные события (создание, редактирование, удаление и т.д.)
            
        log_file = BASE_DIR / "logs" / "changes_log.json"
        
        with log_file_lock:  # Блокируем доступ к файлу
            # Загружаем существующие логи или создаем пустой список
            if log_file.exists():
                try:
                    with log_file.open("r", encoding="utf-8") as f:
                        content = f.read().strip()
                        if content:
                            logs = json.loads(content)
                            # Проверяем, что это действительно список
                            if not isinstance(logs, list):
                                print(f"Warning: logs is not a list, got {type(logs)}, reinitializing...")
                                logs = []
                        else:
                            logs = []
                except (json.JSONDecodeError, Exception) as e:
                    print(f"Error reading log file: {e}, reinitializing...")
                    logs = []
            else:
                logs = []
            
            # Добавляем новую запись в лог с временной меткой
            if not log_data.get("dateTime"):
                from datetime import datetime
                log_data["dateTime"] = datetime.now().strftime("%Y.%m.%d %H:%M:%S")
            
            # Добавляем информацию о пользователе, если она не указана
            if not log_data.get("user"):
                log_data["user"] = current_user.username
                
            # Добавляем новую запись в начало списка (новые записи сверху)
            logs.insert(0, log_data)
            
            # Оставляем только первые 100 логов (самые новые)
            if len(logs) > 100:
                logs = logs[:100]
            
            # Сохраняем обновленный лог
            try:
                with log_file.open("w", encoding="utf-8") as f:
                    json.dump(logs, f, ensure_ascii=False, indent=2)
                print(f"Successfully saved {len(logs)} logs to {log_file}")
            except Exception as write_error:
                print(f"Error writing log file: {write_error}")
                raise write_error
            
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/change_history")
@login_required
@csrf.exempt  # Исключаем API из CSRF проверки
def change_history():
    """Получение истории изменений (последние 100 записей)."""
    try:
        log_file = BASE_DIR / "logs" / "changes_log.json"
        
        with log_file_lock:  # Блокируем доступ к файлу
            if log_file.exists():
                try:
                    with log_file.open("r", encoding="utf-8") as f:
                        content = f.read().strip()
                        if content:
                            logs = json.loads(content)
                            if not isinstance(logs, list):
                                print(f"Warning: logs is not a list in change_history, got {type(logs)}")
                                return jsonify([])
                        else:
                            logs = []
                except (json.JSONDecodeError, Exception) as e:
                    print(f"Error reading log file in change_history: {e}")
                    return jsonify([])
                    
                # Возвращаем первые 100 записей (самые новые, так как теперь новые записи добавляются в начало)
                return jsonify(logs[:100] if len(logs) > 100 else logs)
            else:
                return jsonify([])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def get_user_stats():
    """Отримуємо статистику користувачів."""
    users = load_users()
    stats = {
        'total': len(users),
        'super_admins': sum(1 for u in users.values() if u['role'] == 'super_admin'),
        'users': sum(1 for u in users.values() if u['role'] == 'user'),
        'viewers': sum(1 for u in users.values() if u['role'] == 'viewer')
    }
    return stats

def validate_username(username):
    """Покращена валідація імені користувача."""
    if not username or len(username.strip()) < 3:
        return False, "Ім'я користувача повинно містити мінімум 3 символи"
    
    if len(username) > 50:
        return False, "Ім'я користувача не може бути довше 50 символів"
    
    # Перевірка на заборонені символи
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Ім'я користувача може містити тільки букви, цифри, _ та -"
    
    # Перевірка на заборонені імена
    forbidden_names = ['admin', 'root', 'system', 'administrator', 'guest', 'null', 'undefined']
    if username.lower() in forbidden_names and username.lower() != 'admin':
        return False, "Це ім'я користувача заборонено"
    
    return True, ""

def validate_password(password):
    """Покращена валідація пароля."""
    if not password or len(password) < 8:
        return False, "Пароль повинен містити мінімум 8 символів"
    
    if len(password) > 128:
        return False, "Пароль не може бути довше 128 символів"
    
    # Перевірка на складність пароля
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "Пароль повинен містити великі та малі букви, та цифри"
    
    # Перевірка на слабкі паролі
    weak_passwords = ['password', '12345678', 'qwerty123', 'admin123', 'password123']
    if password.lower() in weak_passwords:
        return False, "Цей пароль занадто простий"
    
    return True, ""


@app.route("/profile")
@login_required
def profile():
    """Профіль користувача."""
    return render_template("profile.html", user=current_user)

@app.route("/test_colors")
@login_required
def test_colors():
    """Тестова сторінка для перевірки відображення кольорів."""
    return render_template("test_colors.html", user=current_user)

@app.route("/profile/change_password", methods=["POST"])
@login_required
@limiter.limit("3 per minute")  # Максимум 3 зміни пароля за хвилину
def change_password():
    """Зміна пароля користувача."""
    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    users = load_users()
    stored_password = users[current_user.username]["password"]
    
    # Перевірка поточного пароля (підтримуємо різні алгоритми)
    if (stored_password.startswith('pbkdf2:sha256:') or 
        stored_password.startswith('scrypt:') or 
        stored_password.startswith('argon2:')):
        # Захешований пароль
        password_valid = check_password_hash(stored_password, current_password)
    else:
        # Старий незахешований пароль
        password_valid = (stored_password == current_password)
    
    if not password_valid:
        log_security_event("PASSWORD_CHANGE_FAILED", current_user.username, "Invalid current password", ip_address)
        flash('Невірний поточний пароль', 'error')
        return redirect(url_for('profile'))
    
    # Валідація нового пароля
    valid_password, password_error = validate_password(new_password)
    if not valid_password:
        log_security_event("PASSWORD_CHANGE_FAILED", current_user.username, f"Invalid new password: {password_error}", ip_address)
        flash(password_error, 'error')
        return redirect(url_for('profile'))
    
    # Перевірка підтвердження пароля
    if new_password != confirm_password:
        log_security_event("PASSWORD_CHANGE_FAILED", current_user.username, "Password confirmation mismatch", ip_address)
        flash('Паролі не співпадають', 'error')
        return redirect(url_for('profile'))
    
    # Перевірка, що новий пароль відрізняється від поточного
    if current_password == new_password:
        log_security_event("PASSWORD_CHANGE_FAILED", current_user.username, "New password same as current", ip_address)
        flash('Новий пароль повинен відрізнятися від поточного', 'error')
        return redirect(url_for('profile'))
    
    # Оновлюємо пароль з хешуванням
    users[current_user.username]["password"] = generate_password_hash(new_password)
    users[current_user.username]["password_changed_at"] = datetime.now().isoformat()
    save_users(users)
    
    # Лог дії
    log_security_event("PASSWORD_CHANGED", current_user.username, "Password successfully changed", ip_address)
    
    flash('Пароль успішно змінено', 'success')
    return redirect(url_for('profile'))

@app.route("/admin/security")
@login_required
@role_required('super_admin')
def security_panel():
    """Панель безпеки для супер адмінів."""
    # Читаємо останні 50 записів логу безпеки
    security_logs = []
    try:
        if SECURITY_LOG_FILE.exists():
            with open(SECURITY_LOG_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
                security_logs = lines[-50:]  # Останні 50 записів
    except Exception as e:
        flash(f'Помилка читання логу безпеки: {e}', 'error')
    
    # Статистика бекапів
    backup_stats = get_backup_stats()
    
    return render_template("security.html", 
                         security_logs=security_logs, 
                         backup_stats=backup_stats)

@app.route("/admin/create_backup", methods=["POST"])
@login_required
@role_required('super_admin')
def manual_backup():
    """Ручне створення бекапу."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    if create_backup():
        log_security_event("MANUAL_BACKUP_CREATED", current_user.username, "Manual backup created successfully", ip_address)
        flash('Бекап успішно створено', 'success')
    else:
        log_security_event("MANUAL_BACKUP_FAILED", current_user.username, "Manual backup creation failed", ip_address)
        flash('Помилка створення бекапу', 'error')
    
    return redirect(url_for('security_panel'))

@app.route("/admin/restore_backup/<backup_name>", methods=["POST"])
@login_required
@role_required('super_admin')
def restore_backup(backup_name):
    """Відновлення з бекапу."""
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    try:
        backup_folder = BACKUP_DIR / backup_name
        if not backup_folder.exists():
            flash('Бекап не знайдено', 'error')
            return redirect(url_for('security_panel'))
        
        # Створюємо бекап поточного стану перед відновленням
        create_backup()
        
        # Відновлюємо файли з бекапу
        files_to_restore = [
            ("users.json", USERS_FILE),
            ("tasks.json", DATA_FILE),
            ("changes_log.json", BASE_DIR / "logs" / "changes_log.json")
        ]
        
        for backup_file, target_file in files_to_restore:
            backup_path = backup_folder / backup_file
            if backup_path.exists():
                shutil.copy2(backup_path, target_file)
        
        log_security_event("BACKUP_RESTORED", current_user.username, f"Restored from backup: {backup_name}", ip_address)
        flash(f'Дані успішно відновлено з бекапу {backup_name}', 'success')
        
    except Exception as e:
        log_security_event("BACKUP_RESTORE_FAILED", current_user.username, f"Failed to restore backup {backup_name}: {str(e)}", ip_address)
        flash(f'Помилка відновлення бекапу: {e}', 'error')
    
    return redirect(url_for('security_panel'))

def get_backup_stats():
    """Отримання статистики бекапів."""
    try:
        backup_folders = [d for d in BACKUP_DIR.iterdir() if d.is_dir() and d.name.startswith("backup_")]
        
        stats = {
            'total_backups': len(backup_folders),
            'backups': []
        }
        
        for backup_folder in sorted(backup_folders, reverse=True)[:10]:  # Останні 10
            try:
                # Отримуємо дату з назви папки
                date_str = backup_folder.name.replace("backup_", "")
                backup_date = datetime.strptime(date_str, "%Y%m%d_%H%M%S")
                
                # Розмір бекапу
                total_size = sum(f.stat().st_size for f in backup_folder.rglob('*') if f.is_file())
                
                stats['backups'].append({
                    'name': backup_folder.name,
                    'date': backup_date.strftime("%Y-%m-%d %H:%M:%S"),
                    'size': f"{total_size / 1024:.1f} KB"
                })
            except Exception as e:
                print(f"Помилка обробки бекапу {backup_folder}: {e}")
        
        return stats
    except Exception as e:
        print(f"Помилка отримання статистики бекапів: {e}")
        return {'total_backups': 0, 'backups': []}

# 🔍 HEALTH CHECK ENDPOINT для моніторингу
@app.route('/health')
def health_check():
    """Health check endpoint для моніторингу стану додатку."""
    try:
        # Перевірка доступності файлів
        users_exists = USERS_FILE.exists()
        goods_exists = GOODS_FILE.exists()
        
        # Перевірка доступності логів
        logs_dir = BASE_DIR / "logs"
        logs_accessible = logs_dir.exists()
        
        status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0',
            'files': {
                'users_json': users_exists,
                'goods_xlsx': goods_exists,
                'logs_directory': logs_accessible
            },
            'csrf_enabled': hasattr(app, 'csrf') or 'csrf' in str(app.before_request_funcs),
            'rate_limiting': 'limiter' in globals()
        }
        
        # Перевірка критичних компонентів
        if not users_exists or not goods_exists:
            status['status'] = 'degraded'
            return jsonify(status), 503
            
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 503

if __name__ == "__main__":
    # 🏃 Запуск сервера (підтримка Heroku та локального запуску)
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
