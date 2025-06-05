# PowerShell скрипт для автоматичного розгортання на Heroku
# deploy_to_heroku.ps1

Write-Host "🚀 Початок розгортання Gantt Dashboard на Heroku" -ForegroundColor Green

# Перевірка Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git не встановлений. Завантажте з https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Перевірка Heroku CLI
if (-not (Get-Command heroku -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Heroku CLI не встановлений. Завантажте з https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Генерація унікального імені додатку
$appName = "gantt-dashboard-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "📱 Створюємо додаток: $appName" -ForegroundColor Yellow

try {
    # Створення додатку на Heroku
    heroku create $appName
    
    # Генерація секретного ключа
    $secretKey = [System.Web.Security.Membership]::GeneratePassword(32, 0)
    
    # Налаштування змінних середовища
    Write-Host "🔐 Налаштовуємо змінні середовища..." -ForegroundColor Yellow
    heroku config:set SECRET_KEY=$secretKey --app $appName
    heroku config:set FLASK_ENV=production --app $appName
    
    # Розгортання
    Write-Host "📤 Відправляємо код на Heroku..." -ForegroundColor Yellow
    git push heroku main
    
    Write-Host "✅ Розгортання завершено успішно!" -ForegroundColor Green
    Write-Host "🌐 Ваш додаток доступний за адресою: https://$appName.herokuapp.com" -ForegroundColor Cyan
    
    # Відкриття в браузері
    heroku open --app $appName
    
} catch {
    Write-Host "❌ Помилка під час розгортання: $_" -ForegroundColor Red
    Write-Host "📋 Перевірте логи: heroku logs --tail --app $appName" -ForegroundColor Yellow
}
