// Функция для изменения стиля инпутов с ненулевыми значениями
function updateInputStyles() {
  // Найти все числовые поля ввода в карточке товаров
  const inputs = document.querySelectorAll('.goods-item input[type="number"]');
  
  // Для каждого поля
  inputs.forEach(input => {
    // Установим текущее значение стиля всегда
    applyStyle(input);
    
    // Проверяем, добавлен ли уже обработчик (чтобы не дублировать)
    if (!input.hasAttribute('data-has-style-listener')) {
      // Обработчик события ввода значений
      input.addEventListener('input', function() {
        applyStyle(this);
      });
      
      // Обработчик события изменения (для программной установки значений)
      input.addEventListener('change', function() {
        applyStyle(this);
      });
      
      // Найдем кнопки +/- рядом с инпутом
      const controlsGroup = input.closest('.controls-group') || input.parentElement;
      if (controlsGroup) {
        const buttons = controlsGroup.querySelectorAll('button');
        buttons.forEach(button => {
          if (!button.hasAttribute('data-has-style-listener')) {
            button.addEventListener('click', () => {
              // После клика на кнопку +/- применяем стиль с небольшой задержкой
              setTimeout(() => applyStyle(input), 50);
            });
            button.setAttribute('data-has-style-listener', 'true');
          }
        });
      }
      
      // Метка, что обработчик для этого элемента уже установлен
      input.setAttribute('data-has-style-listener', 'true');
    }
  });
}

// Функция применения стиля в зависимости от значения
function applyStyle(input) {
  if (!input) return; // Защита от null/undefined
  
  // Получаем текущее значение, обрабатываем edge-cases
  const inputValue = input.value || '';
  const trimmedValue = inputValue.toString().trim();
  const numValue = parseFloat(trimmedValue);
  
  // Применяем стили только если значение действительно не равно 0 и не NaN
  if (trimmedValue !== '' && !isNaN(numValue) && numValue !== 0) {
    input.classList.add('non-zero-value');
    
    // Получаем текстовое описание товара для логирования (отладка)
    const goodsItem = input.closest('.goods-item');
    const goodName = goodsItem ? (goodsItem.querySelector('label')?.textContent || 'Неизвестный товар') : 'Товар';
    
    // console.log(`Применен стиль non-zero-value для ${goodName}: ${numValue}`);
  } else {
    input.classList.remove('non-zero-value');
  }
}

// Запускаем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Немедленно вызываем один раз
  updateInputStyles();
  
  // Затем через 1 секунду для обработки элементов, добавленных динамически
  setTimeout(updateInputStyles, 1000);
});

// Обновляем стили после динамической подгрузки товаров в модальное окно
// Создаем эффективный MutationObserver с использованием дебаунсинга
let updatePending = false;
const processQueueDelay = 100; // миллисекунды задержки для дебаунсинга

// Функция отложенного обновления с дебаунсингом
function scheduleUpdate() {
  if (!updatePending) {
    updatePending = true;
    setTimeout(() => {
      updateInputStyles();
      updatePending = false;
    }, processQueueDelay);
  }
}

// Подписываемся на изменения DOM с оптимизированной логикой и фильтрацией
const observer = new MutationObserver(mutations => {
  // Быстрая проверка на добавление товаров или модальных окон
  const relevantMutation = mutations.some(mutation => {
    // Проверка на добавление новых узлов
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Ищем .goods-item, .order-goods-card или карточки товаров
          if ((node.classList && 
               (node.classList.contains('goods-item') || 
                node.classList.contains('order-goods-card') || 
                node.classList.contains('categories-container'))) || 
              (node.querySelector && 
               (node.querySelector('.goods-item') || 
                node.querySelector('input[type="number"]')))) {
            return true;
          }
        }
      }
    }
    
    // Если изменены значимые атрибуты в модальных окнах или карточках товаров
    if (mutation.type === 'attributes' && 
        mutation.attributeName === 'value' &&
        mutation.target.tagName === 'INPUT' &&
        mutation.target.type === 'number') {
      return true;
    }
    
    return false;
  });
  
  if (relevantMutation) {
    scheduleUpdate();
  }
});

// Наблюдаем за изменениями в документе с использованием делегирования событий
document.addEventListener('DOMContentLoaded', () => {
  // Инициализация стилей
  updateInputStyles();
  
  // Оптимизированное наблюдение: фокусируемся на основных элементах взаимодействия
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['value', 'style', 'class'] // Следим только за важными атрибутами
  });
  
  // Также добавляем делегирование событий для изменения значений
  document.body.addEventListener('click', e => {
    // Если был клик на кнопку в товаре
    if (e.target.tagName === 'BUTTON' && 
        (e.target.closest('.goods-item') || e.target.textContent === '+' || e.target.textContent === '-')) {
      // Находим ближайший инпут и применяем стиль с задержкой
      setTimeout(() => {
        const goodsItem = e.target.closest('.goods-item');
        if (goodsItem) {
          const input = goodsItem.querySelector('input[type="number"]');
          if (input) applyStyle(input);
        }
      }, 50);
    }
  });
  
  // Обновление при открытии модальных окон (с отслеживанием изменений видимости)
  const modalCheckInterval = setInterval(() => {
    const visibleModals = document.querySelectorAll('.order-goods-card:not([style*="display: none"])');
    if (visibleModals.length > 0) {
      updateInputStyles();
    }
  }, 1000); // Проверка каждую секунду
  
  // Очистка интервала при закрытии страницы
  window.addEventListener('unload', () => clearInterval(modalCheckInterval));
});

// Выводим сообщение при загрузке скрипта
console.log('InputNumberStyle: Скрипт для стилизации инпутов с ненулевыми значениями загружен');

// Вспомогательные функции для отладки
let debugEnabled = false;

function enableDebugMode() {
  debugEnabled = true;
  console.log('Режим отладки для стилей полей ввода активирован');
  
  // Отображение текущего состояния всех инпутов
  const inputs = document.querySelectorAll('.goods-item input[type="number"]');
  console.log(`Найдено ${inputs.length} инпутов с числами:`);
  
  inputs.forEach((input, index) => {
    const goodsItem = input.closest('.goods-item');
    const goodName = goodsItem ? (goodsItem.querySelector('label')?.textContent || 'Товар') : 'Товар';
    console.log(`${index + 1}. ${goodName}: value="${input.value}", hasClass=${input.classList.contains('non-zero-value')}`);
  });
  
  // Обновляем стили и показываем результат
  updateInputStyles();
}

// Добавляем функцию в глобальную область для доступа из консоли
window.enableInputStylesDebug = enableDebugMode;

function logDebug(message) {
  if (debugEnabled) {
    console.log(`[InputStyles] ${message}`);
  }
}
