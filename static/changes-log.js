// Файл для функций логирования изменений

// Текущий пользователь (заглушка, можно заменить на реального пользователя из авторизации)
let currentUser = "Користувач";

// Функция для установки текущего пользователя
function setCurrentUser(username) {
  currentUser = username;
}

// Функция для проверки валидности цвета (hex, rgb, rgba, именованные цвета)
function isValidColor(color) {
  if (!color || typeof color !== "string") return false;

  // Проверяем hex цвета (#fff, #ffffff)
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (hexPattern.test(color)) return true;

  // Проверяем rgb/rgba цвета
  const rgbPattern =
    /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
  if (rgbPattern.test(color)) return true;

  // Проверяем именованные цвета браузера
  const namedColors = [
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    "gray",
    "grey",
  ];
  if (namedColors.includes(color.toLowerCase())) return true;

  return false;
}

// Функция для замены hex кодов цветов и именованных цветов на визуальные прямоугольники в тексте
function replaceColorsInText(text) {
  if (!text || typeof text !== "string") return text;

  // Паттерн для поиска hex цветов в тексте
  const hexPattern = /#[A-Fa-f0-9]{3,6}\b/g;

  // Именованные цвета для замены
  const namedColors = [
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    "gray",
    "grey",
  ];

  // Заменяем hex цвета
  let result = text.replace(hexPattern, function (match) {
    if (isValidColor(match)) {
      return `<span class="color-rectangle" style="background-color: ${match};" title="${match}"></span>`;
    }
    return match;
  });

  // Заменяем именованные цвета
  namedColors.forEach((colorName) => {
    // Создаем паттерн для поиска цвета как отдельного слова (с границами слов)
    const colorPattern = new RegExp(`\\b${colorName}\\b`, "gi");
    result = result.replace(colorPattern, function (match) {
      // Для белого цвета добавляем серую границу для лучшей видимости
      const style =
        match.toLowerCase() === "white"
          ? `background-color: ${match}; border-color: #ccc;`
          : `background-color: ${match};`;
      return `<span class="color-rectangle" style="${style}" title="${match}"></span>`;
    });
  });

  return result;
}

// Функция для создания DOM элемента записи лога без добавления в контейнер
function createLogEntryElement(eventInfo) {
  // Проверяем только на просмотр
  if (eventInfo.type === "view" || eventInfo.isViewOnly === true) {
    console.log("Пропущена запись в лог просмотра:", eventInfo);
    return null; // Не логируем просмотры
  }

  // Создаем строку лога
  const logEntry = document.createElement("div");
  logEntry.className = "changes-log-entry";

  // Добавляем data-rectangle-id для возможности подсветки связанного прямоугольника
  if (eventInfo.rectangleId) {
    logEntry.setAttribute("data-rectangle-id", eventInfo.rectangleId);
  }

  // Формируем дату и время
  const now = new Date();
  const dateTimeString = eventInfo.dateTime || now.toLocaleString("ru-RU");

  // Базовая строка с датой и пользователем
  let text = `<span class="changes-log-date">${dateTimeString}</span> - <span class="changes-log-user">${
    eventInfo.user || currentUser
  }</span>: `;

  // Определяем тип события для стилизации
  let eventTypeClass = "";

  if (eventInfo.type === "create") {
    eventTypeClass = "changes-log-add";
  } else if (eventInfo.type === "delete") {
    eventTypeClass = "changes-log-delete";
  } else if (eventInfo.type === "edit") {
    eventTypeClass = "changes-log-edit";
  }

  // Добавляем детали события
  let details = "";

  if (eventInfo.rectangleId) {
    details += `<span>Задача #${eventInfo.rectangleId}</span>`;
  }

  if (eventInfo.orderNumber) {
    details += `<span>Замовлення #${eventInfo.orderNumber}</span>`;
  }
  if (eventInfo.productName) {
    details += ` <span>${replaceColorsInText(eventInfo.productName)}</span>`;
  }

  if (eventInfo.oldValue !== undefined) {
    details += ` <span>${replaceColorsInText(eventInfo.oldValue)}</span>`;
  }

  if (eventInfo.newValue !== undefined) {
    details += ` → <span class="${eventTypeClass}">${replaceColorsInText(
      eventInfo.newValue
    )}</span>`;
  }
  if (eventInfo.statusColor) {
    // Создаем визуальный прямоугольник цвета вместо текста hex-кода
    if (isValidColor(eventInfo.statusColor)) {
      // Для белого цвета добавляем серую границу для лучшей видимости
      const style =
        eventInfo.statusColor.toLowerCase() === "white"
          ? `background-color: ${eventInfo.statusColor}; border-color: #ccc;`
          : `background-color: ${eventInfo.statusColor};`;
      const colorDisplay = `<span class="color-display">Колір: <span class="color-rectangle" style="${style}" title="${eventInfo.statusColor}"></span></span>`;
      details += ` ${colorDisplay}`;
    } else {
      details += ` <span>Колір: ${eventInfo.statusColor}</span>`;
    }
  }
  if (eventInfo.warehouseName) {
    details += ` <span>Склад: ${eventInfo.warehouseName}</span>`;
  }
  if (eventInfo.warehouseStatusColor) {
    // Создаем визуальный круг статуса склада как в оригинальном элементе
    if (isValidColor(eventInfo.warehouseStatusColor)) {
      // Для белого цвета используем серую границу для лучшей видимости
      const borderColor =
        eventInfo.warehouseStatusColor.toLowerCase() === "white"
          ? "#ccc"
          : eventInfo.warehouseStatusColor;
      const statusDisplay = `<span class="color-display">Статус складу: <span class="status-circle" style="background-color: ${eventInfo.warehouseStatusColor}; border-color: ${borderColor};" title="${eventInfo.warehouseStatusColor}"></span></span>`;
      details += ` ${statusDisplay}`;
    } else {
      details += ` <span>Статус складу: ${eventInfo.warehouseStatusColor}</span>`;
    }
  }

  if (eventInfo.comment) {
    details += ` <span>(${replaceColorsInText(eventInfo.comment)})</span>`;
  }
  // Собираем полный текст события
  logEntry.innerHTML = text + details;

  // Добавляем класс для записей с удалением (содержащих слово "Видалено")
  const fullText = text + details;
  if (
    fullText.includes("Видалено") ||
    (eventInfo.comment && eventInfo.comment.includes("Видалено")) ||
    (eventInfo.newValue && eventInfo.newValue.includes("Видалено"))
  ) {
    logEntry.classList.add("deleted-text");
  }

  return logEntry;
}

// Функция для записи события в лог
function logEvent(eventInfo, skipServerSave = false) {
  console.log("Запись в лог события:", eventInfo);

  const logContainer = document.getElementById("changes-log-content");
  if (!logContainer) return;

  // Создаем DOM элемент с помощью новой функции
  const logEntry = createLogEntryElement(eventInfo);
  if (!logEntry) return; // Если элемент не создан (например, для просмотров)

  // Добавляем в начало контейнера (новые события сверху)
  logContainer.insertBefore(logEntry, logContainer.firstChild);

  // Сохраняем на сервере только если не указан флаг пропуска сохранения
  if (!skipServerSave) {
    saveEventToServer(eventInfo);
  }
}

// Функция для сохранения события на сервере
function saveEventToServer(eventInfo) {
  // Отправляем данные на сервер
  fetch("/api/log_event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventInfo),
  })
    .then((response) => response.json())
    .then((data) => console.log("Лог сохранен на сервере:", data))
    .catch((err) => console.error("Ошибка сохранения лога:", err));
}

// Функция для переключения видимости лога
function setupLogToggle() {
  const toggleButton = document.getElementById("changes-log-toggle");
  const logContainer = document.getElementById("changes-log-container");

  if (toggleButton && logContainer) {
    // Инициализируем состояние и текст кнопки
    if (!logContainer.classList.contains("collapsed")) {
      toggleButton.textContent = "Сховати лог";
    } else {
      toggleButton.textContent = "Показати лог";
    }

    // Добавляем обработчик клика
    toggleButton.addEventListener("click", () => {
      logContainer.classList.toggle("collapsed");
      if (logContainer.classList.contains("collapsed")) {
        toggleButton.textContent = "Показати лог";
      } else {
        toggleButton.textContent = "Сховати лог";
      }
    });
  }
}

// Функция для загрузки истории изменений с сервера
function loadChangeHistory() {
  const logContainer = document.getElementById("changes-log-content");
  if (!logContainer) return;

  // Очищаем контейнер от предыдущих записей
  logContainer.innerHTML = "";
  // Добавляем индикатор загрузки
  const loader = document.createElement("div");
  loader.textContent = "Завантаження історії змін...";
  loader.className = "text-center py-2 text-gray-500";
  logContainer.appendChild(loader);

  // Запрашиваем данные с сервера
  fetch("/api/change_history")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не удалось загрузить историю изменений");
      }
      return response.json();
    })
    .then((data) => {
      // Убираем индикатор загрузки
      loader.remove();
      if (Array.isArray(data) && data.length > 0) {
        // Добавляем информацию о количестве загруженных записей
        const countInfo = document.createElement("div");
        countInfo.textContent = `Завантажено ${data.length} записів (з останніх 100)`;
        countInfo.className = "text-right text-xs text-gray-500 mb-2";
        logContainer.appendChild(countInfo); // Отображаем полученные данные (данные уже в правильном порядке - новые сверху)
        data.forEach((eventInfo) => {
          // Создаем DOM элемент
          const logEntry = createLogEntryElement(eventInfo);
          if (logEntry) {
            // Добавляем в конец контейнера, так как данные уже отсортированы
            logContainer.appendChild(logEntry);
          }
        });
      } else {
        // Если данных нет, показываем сообщение
        const emptyMsg = document.createElement("div");
        emptyMsg.textContent = "Історія змін порожня";
        emptyMsg.className = "text-center py-2 text-gray-500";
        logContainer.appendChild(emptyMsg);
      }
    })
    .catch((error) => {
      console.error("Ошибка загрузки истории:", error);
      loader.textContent = "Не вдалося завантажити історію";
      loader.className = "text-center py-2 text-red-500";
    });
}

// Функция для подсветки прямоугольника по его ID
function highlightRectangle(rectangleId) {
  // Удаляем предыдущую подсветку
  document.querySelectorAll(".task.highlight-rectangle").forEach((el) => {
    el.classList.remove("highlight-rectangle");
  });

  if (!rectangleId) return;

  // Находим прямоугольник по ID
  const rectangle = document.querySelector(
    `.task[data-rectangle-id="${rectangleId}"]`
  );
  if (rectangle) {
    // Добавляем класс подсветки
    rectangle.classList.add("highlight-rectangle");

    // Прокручиваем к прямоугольнику и центрируем его в видимой области
    const calendarContainer = document.querySelector("main");
    if (calendarContainer) {
      // Получаем координаты прямоугольника
      const rect = rectangle.getBoundingClientRect();
      // Получаем координаты контейнера
      const containerRect = calendarContainer.getBoundingClientRect();

      // Вычисляем позицию прокрутки для центрирования по горизонтали
      const centerX = rect.left + rect.width / 2 - containerRect.left;
      const targetScrollLeft =
        calendarContainer.scrollLeft + centerX - containerRect.width / 2;

      // Вычисляем позицию прокрутки для центрирования по вертикали
      const centerY = rect.top + rect.height / 2 - containerRect.top;
      const targetScrollTop =
        calendarContainer.scrollTop + centerY - containerRect.height / 2;

      // Плавно прокручиваем к прямоугольнику
      calendarContainer.scrollTo({
        left: targetScrollLeft,
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }
}

// Функция для удаления подсветки прямоугольника
function removeRectangleHighlight() {
  document.querySelectorAll(".task.highlight-rectangle").forEach((el) => {
    el.classList.remove("highlight-rectangle");
  });
}

// Функция для настройки обработчиков событий подсветки
function setupLogEntryHighlighting() {
  // Находим контейнер лога
  const logContainer = document.getElementById("changes-log-content");
  if (!logContainer) return;

  // Добавляем обработку события делегированием
  logContainer.addEventListener("mouseover", function (event) {
    // Проверяем, навели ли мы на запись лога
    const logEntry = event.target.closest(".changes-log-entry");
    if (logEntry) {
      // Добавляем класс подсветки записи
      logEntry.classList.add("log-entry-hover");

      // Получаем ID прямоугольника из атрибута data-rectangle-id
      const rectangleId = logEntry.getAttribute("data-rectangle-id");
      if (rectangleId) {
        // Подсвечиваем соответствующий прямоугольник
        highlightRectangle(rectangleId);
      }
    }
  });

  // Обработчик события при уходе курсора
  logContainer.addEventListener("mouseout", function (event) {
    // Проверяем, ушли ли мы с записи лога
    const logEntry = event.target.closest(".changes-log-entry");
    if (logEntry) {
      // Удаляем класс подсветки записи
      logEntry.classList.remove("log-entry-hover");

      // Удаляем подсветку прямоугольника
      removeRectangleHighlight();
    }
  });
}

// Инициализация функций логирования при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  // Устанавливаем текущего пользователя из глобальной переменной
  if (window.currentUsername) {
    setCurrentUser(window.currentUsername);
  }

  setupLogToggle();
  // Загружаем историю изменений при запуске
  loadChangeHistory();
  // Настраиваем подсветку и центрирование прямоугольников при наведении на записи в логе
  setupLogEntryHighlighting();
});
