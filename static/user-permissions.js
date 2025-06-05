// Скрипт для управління правами доступу користувачів
(() => {
  console.log('Ініціалізація системи прав доступу...');
  console.log('Роль користувача:', window.userRole);
  console.log('Це спостерігач:', window.isViewer);
  console.log('Може редагувати:', window.canEdit);

  // Якщо користувач - спостерігач, обмежуємо функціональність
  if (window.isViewer) {
    console.log('Активація режиму тільки для перегляду...');
    
    // Додаємо CSS для відключення взаємодії з елементами
    const style = document.createElement('style');
    style.textContent = `
      .viewer-mode .task-rect {
        cursor: default !important;
        pointer-events: none !important;
      }
      
      .viewer-mode .task-rect:hover {
        transform: none !important;
      }
      
      .viewer-disabled {
        opacity: 0.6;
        pointer-events: none;
        cursor: not-allowed;
      }
      
      .viewer-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 1000;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Додаємо клас до body для режиму спостерігача
    document.body.classList.add('viewer-mode');
    
    // Показуємо повідомлення про режим тільки для перегляду
    showViewerNotification();
    
    // Перехоплюємо спроби створення нових завдань
    interceptTaskCreation();
    
    // Перехоплюємо спроби редагування існуючих завдань
    interceptTaskEditing();
    
    // Перехоплюємо контекстне меню
    interceptContextMenu();
  }
  
  function showViewerNotification() {
    const notification = document.createElement('div');
    notification.className = 'viewer-notification';
    notification.innerHTML = `
      <strong>Режим перегляду</strong><br>
      Ви можете тільки переглядати календар
    `;
    document.body.appendChild(notification);
    
    // Автоматично прибираємо повідомлення через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  
  function interceptTaskCreation() {
    // Перехоплюємо кліки по календарю
    document.addEventListener('click', (e) => {
      if (window.isViewer && e.target.closest('#calendar')) {
        // Перевіряємо, чи це спроба створити нове завдання
        const calendarCell = e.target.closest('.calendar-day-cell');
        if (calendarCell && !e.target.closest('.task-rect')) {
          e.preventDefault();
          e.stopPropagation();
          showAccessDeniedMessage('Ви не можете створювати нові завдання');
          return false;
        }
      }
    }, true);
    
    // Перехоплюємо подвійні кліки
    document.addEventListener('dblclick', (e) => {
      if (window.isViewer && e.target.closest('#calendar')) {
        e.preventDefault();
        e.stopPropagation();
        showAccessDeniedMessage('Ви не можете створювати нові завдання');
        return false;
      }
    }, true);
  }
  
  function interceptTaskEditing() {
    // Перехоплюємо кліки по завданнях
    document.addEventListener('click', (e) => {
      if (window.isViewer && e.target.closest('.task-rect')) {
        e.preventDefault();
        e.stopPropagation();
        showAccessDeniedMessage('Ви не можете редагувати завдання');
        return false;
      }
    }, true);
    
    // Перехоплюємо спроби перетягування
    document.addEventListener('mousedown', (e) => {
      if (window.isViewer && e.target.closest('.task-rect')) {
        e.preventDefault();
        e.stopPropagation();
        showAccessDeniedMessage('Ви не можете переміщувати завдання');
        return false;
      }
    }, true);
  }
  
  function interceptContextMenu() {
    // Перехоплюємо правий клік
    document.addEventListener('contextmenu', (e) => {
      if (window.isViewer && e.target.closest('#calendar')) {
        e.preventDefault();
        showAccessDeniedMessage('Контекстне меню недоступне в режимі перегляду');
        return false;
      }
    }, true);
  }
  
  function showAccessDeniedMessage(message) {
    // Видаляємо попереднє повідомлення, якщо воно є
    const existing = document.querySelector('.access-denied-message');
    if (existing) {
      existing.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'access-denied-message';
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fee2e2;
      border: 2px solid #dc2626;
      color: #dc2626;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
      font-weight: 500;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: shake 0.5s ease-in-out;
    `;
    
    // Додаємо анімацію струшування
    const shakeKeyframes = `
      @keyframes shake {
        0%, 100% { transform: translate(-50%, -50%) translateX(0); }
        25% { transform: translate(-50%, -50%) translateX(-5px); }
        75% { transform: translate(-50%, -50%) translateX(5px); }
      }
    `;
    
    if (!document.querySelector('#shake-animation')) {
      const shakeStyle = document.createElement('style');
      shakeStyle.id = 'shake-animation';
      shakeStyle.textContent = shakeKeyframes;
      document.head.appendChild(shakeStyle);
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Прибираємо повідомлення через 3 секунди
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
    
    // Також прибираємо при кліку
    messageDiv.addEventListener('click', () => {
      messageDiv.remove();
    });
  }
  
  // Модифікуємо існуючі функції для перевірки прав
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // Перевіряємо, чи це запит на модифікацію даних
    if (window.isViewer && options && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      if (url.includes('/api/tasks')) {
        showAccessDeniedMessage('Ви не можете змінювати завдання');
        return Promise.reject(new Error('Access denied: viewer role'));
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('Система прав доступу ініціалізована');
})();
