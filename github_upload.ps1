# PowerShell скрипт для швидкого завантаження на GitHub
# github_upload.ps1

param(
    [string]$username = "",
    [string]$reponame = "gantt-dashboard"
)

Write-Host "🚀 Підготовка до завантаження на GitHub та розгортання на Railway" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan

# Перевірка Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git не встановлений!" -ForegroundColor Red
    Write-Host "📥 Завантажте Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
    exit 1
}

# Отримання GitHub username якщо не вказаний
if ([string]::IsNullOrEmpty($username)) {
    $username = Read-Host "Введіть ваш GitHub username"
}

Write-Host "👤 GitHub Username: $username" -ForegroundColor Yellow
Write-Host "📁 Репозиторій: $reponame" -ForegroundColor Yellow

try {
    # Перевірка що ми в правильній директорії
    if (!(Test-Path "app.py")) {
        Write-Host "❌ Файл app.py не знайдено! Переконайтеся що ви в правильній директорії." -ForegroundColor Red
        pause
        exit 1
    }

    Write-Host "`n🔄 Підготовка Git репозиторію..." -ForegroundColor Yellow
    
    # Ініціалізація Git якщо потрібно
    if (!(Test-Path ".git")) {
        git init
        Write-Host "✅ Git репозиторій ініціалізовано" -ForegroundColor Green
    }

    # Додавання файлів
    git add .
    
    # Створення коміту
    git commit -m "Deploy to Railway: Gantt Dashboard $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    
    # Додавання remote origin
    $repoUrl = "https://github.com/$username/$reponame.git"
    
    # Видалення старого origin якщо існує
    git remote remove origin 2>$null
    
    # Додавання нового origin
    git remote add origin $repoUrl
    
    Write-Host "`n📤 Завантажуємо на GitHub..." -ForegroundColor Yellow
    
    # Встановлення головної гілки як main
    git branch -M main
    
    # Push на GitHub
    git push -u origin main
    
    Write-Host "`n✅ Код успішно завантажено на GitHub!" -ForegroundColor Green
    Write-Host "🔗 Репозиторій: $repoUrl" -ForegroundColor Cyan
    
    Write-Host "`n🚂 НАСТУПНІ КРОКИ ДЛЯ RAILWAY:" -ForegroundColor Magenta
    Write-Host "1. Зайдіть на https://railway.app" -ForegroundColor White
    Write-Host "2. Натисніть 'Start a New Project'" -ForegroundColor White
    Write-Host "3. Оберіть 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "4. Знайдіть репозиторій: $reponame" -ForegroundColor White
    Write-Host "5. Натисніть 'Deploy Now'" -ForegroundColor White
    Write-Host "`n6. Додайте змінні середовища:" -ForegroundColor White
    Write-Host "   - SECRET_KEY = $(Get-Random -Minimum 100000 -Maximum 999999)-gantt-secret" -ForegroundColor Yellow
    Write-Host "   - FLASK_ENV = production" -ForegroundColor Yellow
    
    Write-Host "`n🌐 Відкриваємо GitHub репозиторій..." -ForegroundColor Green
    Start-Process $repoUrl
    
    Write-Host "`n🌐 Відкриваємо Railway..." -ForegroundColor Green
    Start-Process "https://railway.app/new"
    
} catch {
    Write-Host "❌ Помилка: $_" -ForegroundColor Red
    Write-Host "`n💡 МОЖЛИВІ РІШЕННЯ:" -ForegroundColor Yellow
    Write-Host "1. Переконайтеся що репозиторій існує на GitHub" -ForegroundColor White
    Write-Host "2. Перевірте правильність username" -ForegroundColor White
    Write-Host "3. Можливо потрібна авторизація в Git:" -ForegroundColor White
    Write-Host "   git config --global user.name 'Your Name'" -ForegroundColor Cyan
    Write-Host "   git config --global user.email 'your.email@example.com'" -ForegroundColor Cyan
}

Write-Host "`n" -NoNewline
pause
