(() => {
  // Удаляем все существующие мини-тултипы при запуске
  setTimeout(() => {
    const miniTooltips = document.querySelectorAll(".mini-tooltip");
    miniTooltips.forEach((tooltip) => tooltip.remove());
  }, 100);

  const MS_PER_DAY = 86400000;
  const today = new Date();
  const calendar = document.getElementById("calendar");
  const todayLabel = document.getElementById("todayLabel");
  todayLabel.textContent = `Сьогодні: ${today.toLocaleDateString("uk-UA")}`;

  // -----------------------------------------------------------------------
  // 1⃣  Будуємо 20 рядків × 181 день (‑90 … 0 … +90)
  // -----------------------------------------------------------------------
  const startDate = new Date(today.getTime() - 90 * MS_PER_DAY);
  const days = Array.from(
    { length: 181 },
    (_, i) => new Date(startDate.getTime() + i * MS_PER_DAY)
  );

  // Розмір колонки — 120 px, масштабування — через CSS transform: scale() у UI.
  const COL_W = 120;

  // Стилізуємо контейнер шириною = днів * COL_W
  calendar.style.width = `${days.length * COL_W}px`;

  // Функція для точного центрування сьогоднішнього дня
  const centerCurrentDay = () => {
    // Використовуємо різні методи центрування для надійності

    const scrollToTodayV1 = () => {
      // Метод 1: через індекс 90
      const todayIndex = 90; // Індекс сьогоднішнього дня у масиві
      const todayOffset = todayIndex * COL_W; // Позиція у пікселях
      const containerWidth = calendar.parentElement.clientWidth;
      const scrollTo = todayOffset - containerWidth / 2 + COL_W / 2;
      calendar.parentElement.scrollLeft = scrollTo;
      console.log("Метод 1:", scrollTo);
    };

    const scrollToTodayV2 = () => {
      // Метод 2: через пошук елемента #today-column
      const todayCol = document.getElementById("today-column");
      if (todayCol) {
        const rect = todayCol.getBoundingClientRect();
        const containerRect = calendar.parentElement.getBoundingClientRect();
        const offset = todayCol.offsetLeft;
        const scrollTo = offset - containerRect.width / 2 + rect.width / 2;
        calendar.parentElement.scrollLeft = scrollTo;
        console.log("Метод 2:", scrollTo);
      }
    };

    const scrollToTodayV3 = () => {
      // Метод 3: анімований скролл до центру з плавною анімацією
      const todayCol = document.getElementById("today-column");
      if (todayCol) {
        todayCol.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
        console.log("Метод 3: scrollIntoView");
      }
    };

    // Запускаємо всі методи по черзі
    scrollToTodayV1();
    setTimeout(scrollToTodayV2, 150);
    setTimeout(scrollToTodayV3, 300);

    // І один метод з затримкою для підстраховки
    setTimeout(scrollToTodayV1, 800);

    console.log("Центрування виконано:", today.toLocaleDateString("uk-UA"));
  };

  // Застосовуємо спеціальне рішення для гарантованого центрування
  const applyCentering = () => {
    // Викликаємо центрування відразу і з різними інтервалами
    centerCurrentDay();

    // Встановлюємо кілька таймерів для надійності
    const timers = [100, 300, 800, 1500];
    timers.forEach((time) => setTimeout(centerCurrentDay, time));
  };

  // Центруємо при завантаженні сторінки різними способами
  window.addEventListener("DOMContentLoaded", applyCentering);
  window.addEventListener("load", applyCentering);

  // Якщо сторінка вже завантажена, то центруємо відразу
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    applyCentering();
  }

  // Також центруємо при зміні розміру вікна
  window.addEventListener("resize", centerCurrentDay);

  // Додатковий код для гарантованого позиціонування
  // через CSS анімацію (одноразову), яка запускається через 1 секунду
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    @keyframes centerTodayColumn {
      from { scroll-behavior: smooth; }
      to { scroll-behavior: smooth; }
    }
    
    #calendar.init-center {
      animation: centerTodayColumn 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(styleElement);

  setTimeout(() => {
    calendar.classList.add("init-center");
    centerCurrentDay();
  }, 1000);

  // Генеруємо верхній ряд дати + 20 рядків із «+» кнопкою
  const header = document.createElement("div");
  header.className = "flex";
  header.style.position = "sticky";
  header.style.top = 0;
  header.style.zIndex = 25; // MODIFIED: Increased z-index from 20 to 25
  calendar.appendChild(header);

  // Створюємо елементи заголовку з датами
  days.forEach((d, index) => {
    const col = document.createElement("div");
    col.className = "border w-30 flex-shrink-0 text-xs text-center py-1";
    col.style.width = `${COL_W}px`;
    col.textContent = d.toLocaleDateString("uk-UA", {
      month: "short",
      day: "numeric",
    });

    // Виділяємо поточний день та додаємо id для швидкого пошуку
    if (d.toDateString() === today.toDateString()) {
      col.classList.add("current-day");
      col.id = "today-column";
      col.setAttribute("data-index", index);

      // Додаємо атрибут title для зручності
      col.title = "Сьогоднішній день";
    }

    // Додаємо спеціальний клас для вихідних днів (субота та неділя)
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 0 - неділя, 6 - субота
      col.classList.add("weekend-column");
      col.setAttribute("data-weekend", dayOfWeek === 0 ? "sunday" : "saturday");
      col.setAttribute("data-column-index", index);
    }

    header.appendChild(col);
  });

  // Створюємо 25 робочих рядків

  // Панель с кнопками \"+\" теперь всегда видима
  const plusOverlay = document.createElement("div");
  plusOverlay.className = "plus-buttons-panel"; // CSS-клас буде управлять всіма стилями позиціонування і видимости

  // Прямі присвоєння стилей для opacity, transform, position, left, pointerEvents і т.д. видалені,
  // так як ми повністю покладаємося на CSS-клас .plus-buttons-panel з style.css.

  Array.from({ length: 25 }).forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = "+";
    btn.className =
      "text-blue-600 hover:text-blue-800 text-xl h-[48px] flex items-center justify-center w-full plus-button";
    btn.style.pointerEvents = "auto";
    btn.title = "Створити прямокутник";
    btn.style.fontSize = "1.44em";
    btn.style.padding = "0";
    btn.style.backgroundColor = "rgba(168, 209, 240, 0.2)";

    btn.onmouseenter = () => {
      btn.style.transform = "scale(1.1)";
      btn.style.backgroundColor = "rgba(168, 209, 240, 0.4)";
    };
    btn.onmouseleave = () => {
      btn.style.transform = "";
      btn.style.backgroundColor = "rgba(168, 209, 240, 0.2)";
    };
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const row = calendar.querySelectorAll(".row")[i];
      createTask(row, i);
      // setTimeout с вызовом showPlusButtons() удален
    });
    plusOverlay.appendChild(btn);
  });

  // Вставляем панель кнопок в DOM
  document.body.insertBefore(plusOverlay, document.body.firstChild);

  // Функции управления видимостью больше не нужны, панель всегда видима
  function showPlusButtons() {
    // Функция оставлена для совместимости с имеющимся кодом
  }

  function hidePlusButtons() {
    // Функция оставлена для совместимости с имеющимся кодом
  }

  // Панель всегда видима (настройки задаются через CSS)

  const scrollContainer = calendar.parentElement;

  function updateButtonVisibility() {
    // Функция сохранена для совместимости с существующим кодом
    // Панель всегда видима, поэтому никаких действий не требуется
  }

  // Слушатели событий для управления видимостью панели больше не нужны
  // так как панель всегда видима

  // Логика sensorZone, функції showPlusButtons, hidePlusButtons, isMouseOverElement,
  // і все связанные с ними обработчики подій (mousemove, click на document, scroll) удалены,
  // так как кнопки теперь всегда видимы. // <-- Этот комментарий устарел, логика видимости кнопок восстановлена

  // Этот слушатель предотвращает всплытие клика с панели кнопок (если клик не по кнопке)
  plusOverlay.addEventListener("click", (event) => {
    if (event.target === plusOverlay) {
      event.stopPropagation();
    }
  });

  // Первоначальный вызов hidePlusButtons() удален.

  for (let r = 0; r < 25; r++) {
    const row = document.createElement("div");
    row.className = "row border-b";

    // «+» кнопка для рядка

    const lines = document.createElement("div");
    lines.className =
      "absolute top-0 left-0 h-full w-full pointer-events-none flex z-0";
    days.forEach((d, index) => {
      const colLine = document.createElement("div");
      colLine.style.width = `${COL_W}px`;
      colLine.className = "border-l border-gray-300/[.15]"; // MODIFIED: Opacity changed from /30 to /.15

      // Добавляем класс для выходных дней (суббота и воскресенье)
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // 0 - неділя, 6 - субота
        colLine.classList.add("weekend-column-background");
        colLine.setAttribute(
          "data-weekend",
          dayOfWeek === 0 ? "sunday" : "saturday"
        );
        colLine.setAttribute("data-column-index", index);
      }

      lines.appendChild(colLine);
    });
    row.appendChild(lines);

    calendar.appendChild(row);
  }

  // -----------------------------------------------------------------------
  // Helper function to show/hide order tooltip - MODIFIED FOR INTERACTIVE EDITING
  // -----------------------------------------------------------------------

  // Global function to save task order and update its tooltip
  function globalSaveTaskOrder(
    taskData,
    baseDiv,
    previousOrderSnapshot = null
  ) {
    console.log("globalSaveTaskOrder - данные задачи:", taskData);
    console.log(
      "globalSaveTaskOrder - предыдущий снимок заказа:",
      previousOrderSnapshot
    );

    // После того как taskData.order обновлен, проверяем нужно ли внести записи в историю
    // Эту часть оставляем пустой, так как запись в историю происходит в функции сохранения кнопки "Зберегти зміни"
    // Это предотвращает дублирование записей в истории изменений
    if (
      previousOrderSnapshot &&
      Object.keys(previousOrderSnapshot).length > 0
    ) {
      // История изменений уже должна быть обновлена перед вызовом этого метода
      console.log(
        "globalSaveTaskOrder - история изменений уже должна быть обновлена"
      );
    }

    // MODIFIED: Added previousOrderSnapshot
    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    }).then(() => {
      if (baseDiv) {
        console.log(
          "globalSaveTaskOrder - после сохранения, данные задачи:",
          taskData
        );

        // Логирование изменений в задаче если функция logEvent доступна
        if (typeof logEvent === "function") {
          // Проверка на изменение дат прямоугольника
          if (
            previousOrderSnapshot &&
            previousOrderSnapshot._lastStartDate &&
            previousOrderSnapshot._lastStartDate !== taskData.start
          ) {
            logEvent({
              type: "edit",
              rectangleId: taskData.id,
              oldValue: new Date(
                previousOrderSnapshot._lastStartDate
              ).toLocaleDateString("ru-RU"),
              newValue: new Date(taskData.start).toLocaleDateString("ru-RU"),
              comment: "Изменение даты начала",
            });
          }

          // Проверка на изменение продолжительности (дней)
          if (
            previousOrderSnapshot &&
            previousOrderSnapshot._lastDays &&
            previousOrderSnapshot._lastDays !== taskData.days
          ) {
            const oldEndDate = new Date(
              new Date(
                previousOrderSnapshot._lastStartDate || taskData.start
              ).getTime() +
                previousOrderSnapshot._lastDays * 86400000
            );
            const newEndDate = new Date(
              new Date(taskData.start).getTime() + taskData.days * 86400000
            );

            logEvent({
              type: "edit",
              rectangleId: taskData.id,
              oldValue: oldEndDate.toLocaleDateString("ru-RU"),
              newValue: newEndDate.toLocaleDateString("ru-RU"),
              comment: "Изменение даты окончания",
            });
          }

          // Проверка на изменение комментария
          if (
            previousOrderSnapshot &&
            previousOrderSnapshot._lastComment !== undefined &&
            previousOrderSnapshot._lastComment !== taskData.comment
          ) {
            logEvent({
              type: "edit",
              rectangleId: taskData.id,
              oldValue: previousOrderSnapshot._lastComment || "—",
              newValue: taskData.comment || "—",
              comment: "Редактирование комментария",
            });
          }
        }

        // Re-render the tooltip. If previousOrderSnapshot is provided, show diff view.
        // Otherwise, show normal view mode.
        showOrderTooltip(
          taskData,
          baseDiv,
          false,
          previousOrderSnapshot,
          !!previousOrderSnapshot
        );
      }
    });
  }

  function showOrderTooltip(
    taskData,
    baseDiv,
    isEditMode = false,
    comparisonSnapshot = null,
    isPostSaveDiffView = false
  ) {
    console.log("showOrderTooltip вызван:", {
      taskData,
      isEditMode,
      comparisonSnapshot,
      isPostSaveDiffView,
    });

    // Проверка валидности taskData
    if (!taskData) {
      console.error("showOrderTooltip: taskData is undefined or null!");
      return;
    }

    // Проверка валидности baseDiv
    if (!baseDiv) {
      console.error("showOrderTooltip: baseDiv is undefined or null!");
      return;
    }

    // MODIFIED: Added comparisonSnapshot and isPostSaveDiffView
    // Получаем интерактивную подсказку
    let tooltip = baseDiv.querySelector(".tooltip");
    const currentOrder = taskData.order || {};
    const hasPositiveQuantityInCurrentOrder = Object.values(currentOrder).some(
      (v) => parseInt(v, 10) > 0
    );

    // --- Start: Conditions to remove tooltip ---
    const comparisonSnapshotIsEmpty =
      !comparisonSnapshot || Object.keys(comparisonSnapshot).length === 0;

    if (
      !isEditMode &&
      !isPostSaveDiffView &&
      !hasPositiveQuantityInCurrentOrder
    ) {
      if (tooltip) tooltip.remove();
      return;
    }
    if (
      isPostSaveDiffView &&
      !hasPositiveQuantityInCurrentOrder &&
      comparisonSnapshotIsEmpty
    ) {
      if (tooltip) tooltip.remove();
      return;
    }
    // --- End: Conditions to remove tooltip ---

    // If in edit mode, a comparisonSnapshot (the "original order" for this edit session) is essential.
    if (isEditMode && !comparisonSnapshot) {
      console.warn(
        "Edit mode called without a snapshot. Reverting to view mode."
      );
      showOrderTooltip(taskData, baseDiv, false, null, false); // Fallback to normal view mode
      return;
    }

    // MODIFIED: Removed text-xs from base class, will set base font size via style
    const desiredBaseClassName =
      "tooltip absolute top-full mt-1 bg-white/90 border p-2 shadow-lg rounded overflow-hidden z-[9990] space-y-1";

    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = desiredBaseClassName;
      baseDiv.appendChild(tooltip);
    } else {
      if (tooltip.className !== desiredBaseClassName) {
        tooltip.className = desiredBaseClassName;
      }
    }

    tooltip.style.width = "600px";
    tooltip.style.maxWidth = "600px";
    tooltip.style.whiteSpace = "normal";
    tooltip.style.fontSize = "0.75rem"; // Уменьшаем базовый размер шрифта для более компактного отображения

    tooltip.innerHTML = "";

    if (!isEditMode) {
      // VIEW MODE or POST-SAVE DIFF VIEW
      const title = document.createElement("div");
      title.className = "font-semibold mb-0.5"; // Уменьшаем отступ заголовка для компактности
      title.textContent = "Замовлені товари:";
      tooltip.appendChild(title);

      // Добавляем стили для максимального уменьшения расстояния между элементами списка
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .tooltip > div { margin-bottom: 0px !important; padding-top: 0px !important; padding-bottom: 0px !important; }
        .tooltip > div .flex { min-height: 20px !important; }
        .tooltip > div:not(:first-child) { margin-top: 0px !important; }
      `;
      tooltip.appendChild(styleElement);

      let hasContentToShow = false;
      const allItemNames = new Set([
        ...Object.keys(currentOrder),
        ...(isPostSaveDiffView && comparisonSnapshot
          ? Object.keys(comparisonSnapshot)
          : []),
      ]);

      allItemNames.forEach((itemName) => {
        const currentQty = parseInt(currentOrder[itemName] || 0, 10);

        // Для отображения изменений используем initialOrder, если мы не на экране diff-view после сохранения
        // В случае diff-view после сохранения используем comparisonSnapshot (предыдущее состояние)
        const originalQtyFromSnapshot =
          isPostSaveDiffView && comparisonSnapshot
            ? parseInt(comparisonSnapshot[itemName] || 0, 10)
            : taskData.initialOrder && taskData.initialOrder[itemName]
            ? parseInt(taskData.initialOrder[itemName], 10)
            : -1;

        let shouldDisplayItem = false;
        if (isPostSaveDiffView && comparisonSnapshot) {
          if (currentQty > 0 || originalQtyFromSnapshot > 0) {
            shouldDisplayItem = true;
          }
        } else {
          if (currentQty > 0) {
            shouldDisplayItem = true;
          }
        }

        if (shouldDisplayItem) {
          hasContentToShow = true;
          const itemDiv = document.createElement("div");
          itemDiv.className = "flex items-center";
          itemDiv.style.marginBottom = "0px"; // Минимальное расстояние между товарами
          itemDiv.style.minHeight = "18px"; // Устанавливаем минимальную высоту строки

          // Добавляем круглую кнопку-индикатор статуса
          const statusButton = document.createElement("div");
          statusButton.className = "status-circle";

          // Инициализируем или получаем текущее состояние цвета для товара
          if (!taskData.orderStatusColors) {
            taskData.orderStatusColors = {};
          }
          if (!taskData.orderStatusColors[itemName]) {
            taskData.orderStatusColors[itemName] = "white";
          }

          // Устанавливаем текущий цвет кнопки
          statusButton.style.backgroundColor =
            taskData.orderStatusColors[itemName];

          // Добавляем обработчик клика для изменения цвета кнопки
          statusButton.addEventListener("click", (event) => {
            // Останавливаем всплытие события
            event.stopPropagation();

            // Массив доступных цветов
            const colors = ["white", "#FF69B4", "#FFA500", "#90EE90"]; // розовый, оранжевый, светло-зеленый

            // Получаем текущий цвет
            const currentColor = taskData.orderStatusColors[itemName];

            // Находим индекс текущего цвета в массиве
            const currentIndex = colors.indexOf(currentColor);

            // Определяем следующий цвет (циклически)
            const nextIndex = (currentIndex + 1) % colors.length;
            const nextColor = colors[nextIndex];

            // Обновляем цвет кнопки и сохраняем его в taskData
            statusButton.style.backgroundColor = nextColor;
            taskData.orderStatusColors[itemName] = nextColor;

            // Логирование изменения статуса товара
            if (typeof logEvent === "function") {
              logEvent({
                type: "edit",
                rectangleId: taskData.id,
                orderNumber: taskData.id,
                productName: itemName,
                statusColor: nextColor,
                oldValue: currentColor || "белый",
                newValue: nextColor,
                comment: "Изменение статуса товара",
              });
            }

            // Сохраняем изменения на сервере
            globalSaveTaskOrder(taskData, baseDiv);
          });

          // Добавляем кнопку в начало itemDiv
          itemDiv.appendChild(statusButton);

          // Создаем контейнер для текста
          const textContainer = document.createElement("div");

          if (
            isPostSaveDiffView &&
            comparisonSnapshot &&
            originalQtyFromSnapshot !== -1
          ) {
            if (currentQty === originalQtyFromSnapshot) {
              // Более компактный размер шрифта и строки
              textContainer.innerHTML = `<span style="line-height:1">${itemName}: </span><strong style="font-size: 1.1rem; line-height:1">${currentQty}</strong>`;
            } else if (
              currentQty > 0 &&
              (originalQtyFromSnapshot === 0 || originalQtyFromSnapshot === -1)
            ) {
              // Более компактный размер шрифта и строки
              textContainer.innerHTML = `<span style="line-height:1">${itemName}: </span><span class="text-green-700 font-semibold" style="font-size: 1.1rem; line-height:1">${currentQty} (додано)</span>`;
            } else if (currentQty === 0 && originalQtyFromSnapshot > 0) {
              // Более компактный размер шрифта и строки
              textContainer.innerHTML = `<span style="line-height:1">${itemName}: </span><s class="text-gray-400" style="font-size: 0.9rem; line-height:1">${originalQtyFromSnapshot}</s> <span class="text-red-600 font-semibold" style="font-size: 1.1rem; line-height:1">(видалено)</span>`;
            } else {
              // MODIFIED: Color based on change or сохраненного цвета, new quantity 1.16rem, original strikethrough 0.97rem
              let valueColorClass;

              // Сначала проверяем есть ли у нас сохраненный цвет
              const savedColor =
                taskData.orderColors && taskData.orderColors[itemName];
              if (savedColor) {
                valueColorClass =
                  savedColor === "red" ? "text-red-600" : "text-green-700";
              } else {
                // Вычисляем цвет на основе сравнения значений
                valueColorClass =
                  currentQty < originalQtyFromSnapshot
                    ? "text-red-600"
                    : "text-green-700";
              }

              textContainer.innerHTML = `<span>${itemName}: </span><s class="text-gray-400" style="font-size: 0.97rem;">${originalQtyFromSnapshot}</s> <span class="${valueColorClass} font-semibold" style="font-size: 1.16rem;">${currentQty}</span>`;
            }

            // Добавляем текстовый контейнер в itemDiv
            itemDiv.appendChild(textContainer);
          } else if (currentQty > 0) {
            // Показываем начальное значение заказа из initialOrder при обычном просмотре
            const initialQty =
              taskData.initialOrder && taskData.initialOrder[itemName]
                ? parseInt(taskData.initialOrder[itemName], 10)
                : null;

            // Создаем основной контейнер для товара
            const itemContainer = document.createElement("div");
            itemContainer.style.width = "100%";

            // Показываем текущее значение
            textContainer.innerHTML = `<span style="line-height:1">${itemName}: </span><strong style="font-size: 1.1rem; line-height:1">${currentQty}</strong>`;

            // Если есть начальное значение и оно отличается от текущего, показываем это
            if (initialQty !== null && initialQty !== currentQty) {
              textContainer.innerHTML = `<span style="line-height:1">${itemName}: </span><s style="color:#666; font-size: 0.9rem; line-height:1">${initialQty}</s> <strong style="font-size: 1.1rem; line-height:1">${currentQty}</strong>`;
            }

            // Добавляем текстовый контейнер в itemDiv
            itemDiv.appendChild(textContainer);

            // Добавляем историю изменений, если она есть
            if (
              taskData.orderChanges &&
              taskData.orderChanges[itemName] &&
              taskData.orderChanges[itemName].length > 0
            ) {
              const changesContainer = document.createElement("div");
              changesContainer.style.marginTop = "1px"; // Еще меньше отступ сверху
              changesContainer.style.paddingLeft = "12px"; // Еще меньше отступ слева
              changesContainer.style.display = "flex";
              changesContainer.style.flexWrap = "wrap";
              changesContainer.style.gap = "3px"; // Еще меньше расстояние между элементами
              changesContainer.style.opacity = "0.5"; // Делаем контейнер еще более прозрачным

              // Добавляем все изменения горизонтально
              taskData.orderChanges[itemName].forEach((change, index) => {
                const { oldQty, newQty } = change;

                // Пропускаем, если нет изменений
                if (oldQty === newQty) return;

                const changeSpan = document.createElement("span");
                changeSpan.style.fontSize = "0.6rem"; // Еще меньше размер шрифта
                changeSpan.style.fontWeight = "400";
                changeSpan.style.border = "1px solid #eee";
                changeSpan.style.borderRadius = "2px";
                changeSpan.style.padding = "0px 1px"; // Еще меньше внутренние отступы
                changeSpan.style.lineHeight = "0.9"; // Еще меньше высота строки

                // Определяем цвет и текст в зависимости от изменения
                if (newQty > oldQty) {
                  // Увеличение - зеленый цвет
                  changeSpan.style.color = "green";
                  changeSpan.innerHTML = `↑${oldQty}→${newQty}`; // Убираем пробелы для компактности
                } else {
                  // Уменьшение - красный цвет
                  changeSpan.style.color = "red";
                  changeSpan.innerHTML = `↓${oldQty}→${newQty}`; // Убираем пробелы для компактности
                }

                changesContainer.appendChild(changeSpan);
              });

              // Добавляем историю изменений в контейнер товара
              itemDiv.appendChild(changesContainer);
            }
          } else {
            return;
          }
          tooltip.appendChild(itemDiv);
        }
      });

      if (!hasContentToShow && !isPostSaveDiffView) {
        const noItemsMsg = document.createElement("div");
        noItemsMsg.textContent = "Замовлення порожнє.";
        tooltip.appendChild(noItemsMsg);
      }

      const showEditButton =
        isPostSaveDiffView ||
        (!isPostSaveDiffView && hasPositiveQuantityInCurrentOrder);
      if (showEditButton) {
        const editButton = document.createElement("button");
        editButton.textContent = "Редагувати кількість";
        editButton.className =
          "mt-2 px-2 py-1 bg-[#a8d1f0] text-gray-700 rounded text-xs hover:bg-[#86b8e0] shadow-sm";
        editButton.onclick = () => {
          const snapshotForNextEdit = JSON.parse(
            JSON.stringify(taskData.order || {})
          );
          showOrderTooltip(taskData, baseDiv, true, snapshotForNextEdit, false); // Enter actual edit mode
        };
        tooltip.appendChild(editButton);
      }

      // Добавляем кнопку "Склади"
      const warehouseButton = document.createElement("button");
      warehouseButton.textContent = "Склади";
      warehouseButton.className =
        "mt-2 px-2 py-1 bg-[#f0a8d1] text-gray-700 rounded text-xs hover:bg-[#e086b8] shadow-sm";
      warehouseButton.onclick = () => {
        toggleWarehouseMenu(taskData, baseDiv, tooltip);
      };
      tooltip.appendChild(warehouseButton);
    } else {
      // EDIT MODE (isEditMode = true)
      let tempEditingOrder = JSON.parse(JSON.stringify(taskData.order || {}));

      const title = document.createElement("div");
      title.className = "font-semibold mb-1"; // Inherits 0.81rem, font-semibold makes it bold
      title.textContent = "Редагування кількості:";
      tooltip.appendChild(title);

      // Показываем только товары, у которых количество в заказе > 0
      const itemsToDisplayInEdit = Object.keys(comparisonSnapshot || {}).filter(
        (itemName) => parseInt(comparisonSnapshot[itemName], 10) > 0
      );

      if (itemsToDisplayInEdit.length === 0) {
        const noItemsMsg = document.createElement("div");
        noItemsMsg.textContent =
          "Немає товарів для редагування (початкове замовлення порожнє).";
        tooltip.appendChild(noItemsMsg);
      } else {
        itemsToDisplayInEdit.forEach((itemName) => {
          // Используем initialOrder как источник "начальных" значений, если он доступен и содержит этот товар
          // Иначе используем comparisonSnapshot (текущее состояние до изменений)
          const originalQty =
            taskData.initialOrder && taskData.initialOrder[itemName]
              ? parseInt(taskData.initialOrder[itemName], 10)
              : parseInt(comparisonSnapshot[itemName] || 0, 10);
          let currentEditingQty = parseInt(tempEditingOrder[itemName] || 0, 10);

          const itemRow = document.createElement("div");
          itemRow.className =
            "flex justify-between items-center space-x-2 py-0.5";

          const nameAndOriginalQtyLabel = document.createElement("span");
          // MODIFIED: Removed text-xs, will inherit 0.81rem. Numbers styled inline.
          nameAndOriginalQtyLabel.className = "flex-grow truncate pr-1";
          nameAndOriginalQtyLabel.innerHTML = `${itemName}: <s style="color:#666; font-size: 0.97rem;">${originalQty}</s>`;

          const controlsContainer = document.createElement("div");
          controlsContainer.className =
            "flex items-center space-x-1 flex-shrink-0";

          const minusButton = document.createElement("button");
          minusButton.textContent = "-";
          minusButton.className =
            "px-1.5 py-0.5 border rounded bg-gray-100 hover:bg-gray-200 text-xs";
          minusButton.type = "button";

          const input = document.createElement("input");
          input.type = "number";
          input.min = 0;
          input.value = currentEditingQty;
          // MODIFIED: Removed explicit font-size and font-weight for input to use smaller/default.
          input.className =
            "border border-gray-300 rounded w-12 text-right px-1";
          // input.style.fontSize = "1.16rem"; // REMOVED
          // input.style.fontWeight = "bold"; // REMOVED

          const plusButton = document.createElement("button");
          plusButton.textContent = "+";
          plusButton.className =
            "px-1.5 py-0.5 border rounded bg-gray-100 hover:bg-gray-200 text-xs";
          plusButton.type = "button";

          const quantityDiffDisplay = document.createElement("span");
          // MODIFIED: Removed text-xs, numbers styled inline
          quantityDiffDisplay.className = "ml-1 w-16 text-left";
          quantityDiffDisplay.style.minWidth = "55px"; // Adjusted minWidth slightly for potentially larger numbers
          quantityDiffDisplay.style.display = "none";

          const updateItemState = (newValue) => {
            const newValidValue = Math.max(0, parseInt(newValue, 10) || 0);
            input.value = newValidValue;

            if (newValidValue > 0) {
              tempEditingOrder[itemName] = newValidValue;
            } else {
              delete tempEditingOrder[itemName];
            }

            if (newValidValue !== originalQty) {
              const valueColorClass =
                newValidValue < originalQty ? "text-red-600" : "text-green-700";
              // MODIFIED: Font size for new value is 1.16rem, color is conditional
              quantityDiffDisplay.innerHTML = `<s class="text-gray-400" style="font-size: 0.97rem;">${originalQty}</s> <span class="${valueColorClass} font-semibold" style="font-size: 1.16rem;">${newValidValue}</span>`;
              quantityDiffDisplay.style.display = "inline-block";
            } else {
              quantityDiffDisplay.innerHTML = "";
              quantityDiffDisplay.style.display = "none";
            }
          };

          if (currentEditingQty !== originalQty) {
            const valueColorClass =
              currentEditingQty < originalQty
                ? "text-red-600"
                : "text-green-700";
            // MODIFIED: Font size for current editing value is 1.16rem, color is conditional
            quantityDiffDisplay.innerHTML = `<s class="text-gray-400" style="font-size: 0.97rem;">${originalQty}</s> <span class="${valueColorClass} font-semibold" style="font-size: 1.16rem;">${currentEditingQty}</span>`;
            quantityDiffDisplay.style.display = "inline-block";
          }

          minusButton.addEventListener("click", () => {
            let val = parseInt(input.value, 10) || 0;
            if (val > 0) updateItemState(val - 1);
          });

          plusButton.addEventListener("click", () => {
            let val = parseInt(input.value, 10) || 0;
            updateItemState(val + 1);
          });

          input.addEventListener("change", () => {
            updateItemState(input.value);
          });
          input.addEventListener("input", () => {
            updateItemState(input.value);
          });

          controlsContainer.appendChild(minusButton);
          controlsContainer.appendChild(input);
          controlsContainer.appendChild(plusButton);

          itemRow.appendChild(nameAndOriginalQtyLabel);
          itemRow.appendChild(controlsContainer);
          itemRow.appendChild(quantityDiffDisplay);
          tooltip.appendChild(itemRow);
        });
      }

      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "mt-2 flex justify-end space-x-2";

      const saveButton = document.createElement("button");
      saveButton.textContent = "Зберегти зміни";
      saveButton.className =
        "px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600";
      saveButton.onclick = () => {
        // ВАЖНО: Перед первой записью зафиксируем начальное состояние
        if (
          !taskData.initialOrder ||
          Object.keys(taskData.initialOrder).length === 0
        ) {
          // При первом редактировании заказа через подсказку сохраняем новый заказ как начальное состояние
          // Это важное изменение от предыдущей логики - сохраняем именно новый заказ, а не компаратор
          taskData.initialOrder = JSON.parse(
            JSON.stringify(tempEditingOrder || {})
          );
          console.log(
            "Tooltip: Установлен initialOrder из нового заказа:",
            taskData.initialOrder
          );
        } else {
          console.log(
            "Tooltip: initialOrder уже существует:",
            taskData.initialOrder
          );
        }

        // Обновляем previousOrder - это состояние ПЕРЕД текущими изменениями
        taskData.previousOrder = JSON.parse(
          JSON.stringify(comparisonSnapshot || {})
        );

        // Сохраняем историю изменений
        if (!taskData.orderChanges) {
          taskData.orderChanges = {};
        }

        // Определяем изменения относительно предыдущего состояния
        Object.keys({ ...tempEditingOrder, ...comparisonSnapshot }).forEach(
          (itemName) => {
            const oldQty = parseInt(comparisonSnapshot[itemName] || 0);
            const newQty = parseInt(tempEditingOrder[itemName] || 0);

            // Если есть изменения в количестве
            if (oldQty !== newQty) {
              if (!taskData.orderChanges[itemName]) {
                taskData.orderChanges[itemName] = [];
              }

              // Добавляем запись об изменении
              taskData.orderChanges[itemName].push({
                oldQty: oldQty,
                newQty: newQty,
                timestamp: Date.now(),
              });
            }
          }
        );

        // Определяем и сохраняем цвета для всех измененных товаров
        const allItemNames = new Set([
          ...Object.keys(tempEditingOrder || {}),
          ...Object.keys(taskData.initialOrder || {}),
        ]);

        // Обновляем цвета для всех товаров в заказе
        allItemNames.forEach((itemName) => {
          const currentQty = parseInt(tempEditingOrder[itemName] || 0, 10);
          const initialQty =
            taskData.initialOrder && taskData.initialOrder[itemName]
              ? parseInt(taskData.initialOrder[itemName], 10)
              : 0;

          // Определяем цвет на основе сравнения с начальным значением
          if (currentQty !== initialQty && currentQty > 0) {
            taskData.orderColors[itemName] =
              currentQty < initialQty ? "red" : "green";
          } else {
            // Если значение равно начальному или равно 0, удаляем информацию о цвете
            delete taskData.orderColors[itemName];
          }
        });

        // Обновляем order новыми данными
        taskData.order = tempEditingOrder;

        // Сохраняем и показываем diff с предыдущим состоянием

        // Логируем изменения в заказе
        if (typeof logEvent === "function") {
          // Проверяем, является ли это созданием нового заказа
          const isNewOrder =
            !comparisonSnapshot || Object.keys(comparisonSnapshot).length === 0;

          if (isNewOrder) {
            // Логирование создания нового заказа
            logEvent({
              type: "create",
              rectangleId: taskData.id,
              orderNumber: taskData.id,
              oldValue: "—",
              newValue: "Создан заказ",
              comment: "Создание заказа",
            });
          }

          // Логирование изменений в количестве товара
          Object.keys({ ...tempEditingOrder, ...comparisonSnapshot }).forEach(
            (itemName) => {
              const oldQty = parseInt(
                (comparisonSnapshot && comparisonSnapshot[itemName]) || 0
              );
              const newQty = parseInt(tempEditingOrder[itemName] || 0);

              if (oldQty !== newQty) {
                logEvent({
                  type:
                    oldQty < newQty ? "edit" : newQty === 0 ? "delete" : "edit",
                  rectangleId: taskData.id,
                  orderNumber: taskData.id,
                  productName: itemName,
                  oldValue: oldQty.toString(),
                  newValue: newQty.toString(),
                  comment: "Корректировка количества товара",
                });
              }
            }
          );
        }

        globalSaveTaskOrder(taskData, baseDiv, comparisonSnapshot);
      };

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Скасувати";
      cancelButton.className =
        "px-2 py-1 bg-gray-300 text-black rounded text-xs hover:bg-gray-400";
      cancelButton.onclick = () => {
        taskData.order = JSON.parse(JSON.stringify(comparisonSnapshot || {})); // Revert to the snapshot taken at the start of this edit session
        showOrderTooltip(taskData, baseDiv, false, null, false); // Refresh to normal view mode
      };

      buttonsDiv.appendChild(cancelButton);
      buttonsDiv.appendChild(saveButton);
      tooltip.appendChild(buttonsDiv);
    }
  }

  function toggleWarehouseMenu(taskData, baseDiv, tooltip) {
    // Проверяем, существует ли уже таблица складов
    let warehouseTable = tooltip.querySelector(".warehouse-table-container");
    if (warehouseTable) {
      warehouseTable.remove(); // Удаляем, если уже открыта
      return;
    }

    // Убедимся, что закладки складов будут отображаться
    // Удаляем существующие индикаторы складов (если они есть)
    const existingIndicators = baseDiv.querySelector(".warehouse-indicators");
    if (existingIndicators) {
      existingIndicators.remove();
    }

    // Помечаем как просмотр склада (чтобы не логировать в историю)
    if (typeof logEvent === "function") {
      logEvent(
        {
          type: "view", // Тип события - просмотр
          isViewOnly: true, // Флаг просмотра
          action: "warehouse_view", // Действие - просмотр склада
          rectangleId: taskData.id,
        },
        true
      ); // true означает пропустить сохранение на сервере
    }

    // Пытаемся создать компактное представление товаров, но не прерываем работу, если складов нет
    // Передаем флаг skipLogging=true, чтобы не логировать изменения при простом открытии/закрытии меню
    try {
      showCompactWarehouseView(taskData, baseDiv, true);
    } catch (error) {
      console.error("Ошибка при отображении складов:", error);
      // Продолжаем работу, даже если что-то пошло не так
    }

    // Создаем новую таблицу складов
    warehouseTable = document.createElement("div");
    warehouseTable.className =
      "warehouse-table-container mt-2 p-2 bg-white border shadow-lg rounded";
    warehouseTable.style.width = "100%"; // Используем 100% ширины контейнера
    warehouseTable.style.overflowY = "auto";
    warehouseTable.style.zIndex = "9998"; // Устанавливаем высокий z-index

    // Добавляем заголовок
    const title = document.createElement("div");
    title.className = "font-semibold mb-2 flex justify-between items-center";
    title.innerHTML =
      'Розподіл товарів по складах <span class="text-xs text-gray-500">(натисніть на склад, щоб редагувати)</span>';
    warehouseTable.appendChild(title);

    // Добавляем контейнер для отображения распределения по складам
    const warehouseDistributionContainer = document.createElement("div");
    warehouseDistributionContainer.className = "warehouse-distribution";
    warehouseTable.appendChild(warehouseDistributionContainer);

    // Проверяем, есть ли распределение по складам
    if (
      !taskData.warehouseDistribution ||
      Object.keys(taskData.warehouseDistribution).length === 0
    ) {
      // Если нет распределения, показываем сообщение
      const noWarehousesMsg = document.createElement("div");
      noWarehousesMsg.className = "text-gray-500 italic text-sm";
      noWarehousesMsg.textContent = "Товари ще не розподілені по складах";
      warehouseDistributionContainer.appendChild(noWarehousesMsg);
    } else {
      // Собираем все склады и товары из распределения
      const allWarehouses = [];
      const allItems = new Set();
      const itemsInWarehouses = {};

      // Обходим все склады и собираем информацию о товарах
      Object.entries(taskData.warehouseDistribution).forEach(
        ([warehouse, items]) => {
          // Пропускаем склады без товаров
          if (Object.keys(items).length === 0) return;

          // Добавляем склад в общий список
          allWarehouses.push(warehouse);

          // Добавляем все товары в общий список
          Object.entries(items).forEach(([itemName, qty]) => {
            allItems.add(itemName);

            // Формируем структуру для быстрого доступа к количеству товара на складе
            if (!itemsInWarehouses[itemName]) {
              itemsInWarehouses[itemName] = {};
            }
            itemsInWarehouses[itemName][warehouse] = qty;
          });
        }
      );

      // Если нет складов с товарами, показываем сообщение
      if (allWarehouses.length === 0) {
        const noWarehousesMsg = document.createElement("div");
        noWarehousesMsg.className = "text-gray-500 italic text-sm";
        noWarehousesMsg.textContent = "Немає складів з товарами";
        warehouseDistributionContainer.appendChild(noWarehousesMsg);
        return;
      }

      // Создаем таблицу с распределением товаров по складам
      const table = document.createElement("table");
      table.className = "w-full text-xs border-collapse mb-2";

      // Создаем заголовок таблицы со складами в колонках
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      // Первая ячейка заголовка - "Товар"
      const headerItem = document.createElement("th");
      headerItem.className = "text-left p-1 border-b font-semibold";
      headerItem.textContent = "Товар";
      headerRow.appendChild(headerItem);

      // Добавляем заголовки для каждого склада
      allWarehouses.forEach((warehouse) => {
        const headerWarehouse = document.createElement("th");
        headerWarehouse.className = "text-center p-1 border-b font-semibold";
        headerWarehouse.textContent = warehouse;
        headerWarehouse.style.cursor = "pointer";

        // Добавляем обработчик клика для редактирования склада
        headerWarehouse.onclick = () => {
          // Передаем дополнительный параметр true, чтобы обозначить это как просмотр
          addWarehouseToOrder(
            taskData,
            warehouse,
            tooltip,
            warehouseTable,
            true
          );
        };

        headerRow.appendChild(headerWarehouse);
      });

      // Добавляем заголовок "Всего"
      const headerTotal = document.createElement("th");
      headerTotal.className =
        "text-center p-1 border-b font-semibold bg-gray-100";
      headerTotal.textContent = "Всього";
      headerRow.appendChild(headerTotal);

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Создаем тело таблицы с товарами в строках
      const tbody = document.createElement("tbody");

      // Сортируем список товаров для удобства
      const sortedItems = Array.from(allItems).sort();

      sortedItems.forEach((itemName) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-50";

        // Ячейка с названием товара
        const itemCell = document.createElement("td");
        itemCell.className = "p-1 border-b";
        itemCell.textContent = itemName;
        row.appendChild(itemCell);

        // Счетчик общего количества товара
        let itemTotal = 0;

        // Добавляем ячейки с количеством товара для каждого склада
        allWarehouses.forEach((warehouse) => {
          const qtyCell = document.createElement("td");
          qtyCell.className = "p-1 border-b text-center";
          const qty = itemsInWarehouses[itemName]?.[warehouse] || 0;
          qtyCell.textContent = qty || "-";

          // Если есть количество, выделяем ячейку цветом
          if (qty > 0) {
            qtyCell.className += " bg-blue-50";
            itemTotal += parseInt(qty);
          }

          // Добавляем обработчик клика для редактирования склада
          qtyCell.style.cursor = "pointer";
          qtyCell.onclick = () => {
            // Добавляем флаг просмотра, чтобы не логировать просмотр данных склада
            addWarehouseToOrder(
              taskData,
              warehouse,
              tooltip,
              warehouseTable,
              true
            );
          };

          row.appendChild(qtyCell);
        });

        // Добавляем ячейку с общим количеством товара
        const totalCell = document.createElement("td");
        totalCell.className =
          "p-1 border-b text-center font-semibold bg-gray-100";

        // Проверяем, если сумма по складам превышает заказанное количество
        const orderQty =
          parseInt(taskData.order && taskData.order[itemName]) || 0;

        if (itemTotal > orderQty && orderQty > 0) {
          // Выделяем красным, если превышено количество в заказе
          totalCell.className += " text-red-600";
          // Добавляем подсказку при наведении
          totalCell.title = `Превышение: в заказе ${orderQty}, распределено ${itemTotal}`;
        }

        totalCell.textContent = itemTotal || "-";
        row.appendChild(totalCell);

        tbody.appendChild(row);
      });

      // Добавляем строку с итогами по складам
      const totalsRow = document.createElement("tr");
      totalsRow.className = "bg-gray-100";

      // Ячейка "Всего" для строки итогов
      const totalsLabelCell = document.createElement("td");
      totalsLabelCell.className = "p-1 border-b font-semibold";
      totalsLabelCell.textContent = "Всього";
      totalsRow.appendChild(totalsLabelCell);

      // Считаем итоги для каждого склада
      let grandTotal = 0;
      allWarehouses.forEach((warehouse) => {
        let warehouseTotal = 0;
        Object.entries(taskData.warehouseDistribution[warehouse] || {}).forEach(
          ([_, qty]) => {
            warehouseTotal += parseInt(qty) || 0;
          }
        );

        const warehouseTotalCell = document.createElement("td");
        warehouseTotalCell.className = "p-1 border-b text-center font-semibold";
        warehouseTotalCell.textContent = warehouseTotal || "-";
        totalsRow.appendChild(warehouseTotalCell);

        grandTotal += warehouseTotal;
      });

      // Ячейка с общим итогом
      const grandTotalCell = document.createElement("td");
      grandTotalCell.className =
        "p-1 border-b text-center font-semibold bg-gray-200";
      grandTotalCell.textContent = grandTotal || "-";
      totalsRow.appendChild(grandTotalCell);

      tbody.appendChild(totalsRow);

      // Добавляем строку с весом товаров по каждому складу
      const weightsRow = document.createElement("tr");
      weightsRow.className = "bg-gray-50";

      // Ячейка "Вага" для строки с весами
      const weightsLabelCell = document.createElement("td");
      weightsLabelCell.className = "p-1 border-b font-semibold";
      weightsLabelCell.textContent = "Вага (кг)";
      weightsRow.appendChild(weightsLabelCell);

      // Считаем вес товаров для каждого склада
      let grandTotalWeight = 0;

      allWarehouses.forEach((warehouse) => {
        // Расчет веса товаров для текущего склада
        let warehouseWeight = 0;

        Object.entries(taskData.warehouseDistribution[warehouse] || {}).forEach(
          ([itemName, qty]) => {
            // Получаем вес товара из taskData (если доступен)
            const weight =
              taskData.itemWeights && taskData.itemWeights[itemName]
                ? parseFloat(taskData.itemWeights[itemName])
                : 0;

            warehouseWeight += (parseInt(qty) || 0) * weight;
          }
        );

        const warehouseWeightCell = document.createElement("td");
        warehouseWeightCell.className =
          "p-1 border-b text-center font-semibold text-blue-600";
        warehouseWeightCell.textContent =
          warehouseWeight > 0 ? warehouseWeight.toFixed(2) : "-";
        weightsRow.appendChild(warehouseWeightCell);

        grandTotalWeight += warehouseWeight;
      });

      // Ячейка с общим весом
      const grandTotalWeightCell = document.createElement("td");
      grandTotalWeightCell.className =
        "p-1 border-b text-center font-semibold bg-blue-100 text-blue-700";
      grandTotalWeightCell.textContent =
        grandTotalWeight > 0 ? grandTotalWeight.toFixed(2) : "-";
      weightsRow.appendChild(grandTotalWeightCell);

      tbody.appendChild(weightsRow);

      // Добавляем строку с количеством паллет по каждому складу
      const palletsRow = document.createElement("tr");
      palletsRow.className = "bg-gray-50";

      // Ячейка "Паллеты" для строки с паллетами
      const palletsLabelCell = document.createElement("td");
      palletsLabelCell.className = "p-1 border-b font-semibold";
      palletsLabelCell.textContent = "Паллети";
      palletsRow.appendChild(palletsLabelCell);

      // Считаем паллеты для каждого склада
      let grandTotalPallets = 0;

      allWarehouses.forEach((warehouse) => {
        // Расчет паллет для текущего склада
        let warehousePallets = 0;

        Object.entries(taskData.warehouseDistribution[warehouse] || {}).forEach(
          ([itemName, qty]) => {
            // Получаем коэффициент паллеты товара из taskData
            const palletCoef =
              taskData.itemPalletCoefs && taskData.itemPalletCoefs[itemName]
                ? parseFloat(taskData.itemPalletCoefs[itemName])
                : 1.0;

            warehousePallets += (parseInt(qty) || 0) * palletCoef;
          }
        );

        // Количество паллет = количество занимаемых мест / 100
        const palletCount = warehousePallets / 100;

        const warehousePalletsCell = document.createElement("td");
        warehousePalletsCell.className =
          "p-1 border-b text-center font-semibold text-purple-600";

        // Округляем до 1 цифры после запятой, если не целое число
        if (palletCount === Math.floor(palletCount)) {
          warehousePalletsCell.textContent =
            palletCount > 0 ? Math.floor(palletCount) : "-";
        } else {
          warehousePalletsCell.textContent =
            palletCount > 0 ? palletCount.toFixed(1) : "-";
        }

        palletsRow.appendChild(warehousePalletsCell);

        grandTotalPallets += palletCount;
      });

      // Ячейка с общим количеством паллет
      const grandTotalPalletsCell = document.createElement("td");
      grandTotalPalletsCell.className =
        "p-1 border-b text-center font-semibold bg-purple-100 text-purple-700";

      // Округляем до 1 цифры после запятой итоговое значение
      if (grandTotalPallets === Math.floor(grandTotalPallets)) {
        grandTotalPalletsCell.textContent =
          grandTotalPallets > 0 ? Math.floor(grandTotalPallets) : "-";
      } else {
        grandTotalPalletsCell.textContent =
          grandTotalPallets > 0 ? grandTotalPallets.toFixed(1) : "-";
      }

      palletsRow.appendChild(grandTotalPalletsCell);

      tbody.appendChild(palletsRow);
      table.appendChild(tbody);
      warehouseDistributionContainer.appendChild(table);
    }

    // Добавляем кнопку для добавления нового склада
    const addWarehouseBtn = document.createElement("button");
    addWarehouseBtn.className =
      "mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 w-full flex justify-center items-center";
    addWarehouseBtn.innerHTML = '<span class="mr-1">+</span> Додати склад';

    // При клике на кнопку показываем меню выбора склада
    addWarehouseBtn.onclick = () => {
      // Проверяем, существует ли уже меню выбора складов
      let warehouseSelector = warehouseTable.querySelector(
        ".warehouse-selector"
      );
      if (warehouseSelector) {
        warehouseSelector.remove();
        return;
      }

      // Создаем меню выбора складов
      warehouseSelector = document.createElement("div");
      warehouseSelector.className =
        "warehouse-selector mt-2 border rounded p-2";

      const selectorTitle = document.createElement("div");
      selectorTitle.className = "font-semibold text-xs mb-1";
      selectorTitle.textContent = "Виберіть склад:";
      warehouseSelector.appendChild(selectorTitle);

      const loadingMsg = document.createElement("div");
      loadingMsg.className = "text-xs text-gray-500";
      loadingMsg.textContent = "Завантаження...";
      warehouseSelector.appendChild(loadingMsg);

      // Загружаем список складов с API
      fetch("/api/warehouses")
        .then((response) => {
          console.log("Ответ от API /api/warehouses получен:", response);
          return response.json();
        })
        .then((warehouses) => {
          console.log("Загружены склады:", warehouses);

          loadingMsg.remove();

          if (!warehouses || warehouses.length === 0) {
            const noWarehousesMsg = document.createElement("div");
            noWarehousesMsg.textContent = "Немає доступних складів";
            noWarehousesMsg.className = "text-xs text-gray-500";
            warehouseSelector.appendChild(noWarehousesMsg);
            return;
          }

          // Создаем список складов
          warehouses.forEach((warehouse) => {
            const warehouseOption = document.createElement("div");
            warehouseOption.className =
              "text-xs p-1 rounded hover:bg-gray-100 cursor-pointer";
            warehouseOption.textContent = warehouse;

            // Добавляем обработчик клика для выбора склада
            warehouseOption.onclick = () => {
              // Добавляем флаг просмотра true, чтобы операция рассматривалась как просмотр
              addWarehouseToOrder(
                taskData,
                warehouse,
                tooltip,
                warehouseTable,
                true
              );
              warehouseSelector.remove();

              // Показываем индикатор складов после добавления нового склада
              const baseDiv = tooltip.closest(".task.base");
              if (baseDiv) {
                // Удаляем существующие индикаторы складов (если они есть)
                const existingIndicators = baseDiv.querySelector(
                  ".warehouse-indicators"
                );
                if (existingIndicators) {
                  existingIndicators.remove();
                }

                // Показываем закладки складов
                showCompactWarehouseView(taskData, baseDiv);
              }
            };

            warehouseSelector.appendChild(warehouseOption);
          });
        })
        .catch((error) => {
          console.error("Ошибка загрузки складов:", error);
          loadingMsg.textContent = "Помилка завантаження списку складів";
          loadingMsg.className = "text-xs text-red-600";
        });

      warehouseTable.appendChild(warehouseSelector);
    };

    warehouseTable.appendChild(addWarehouseBtn);
    tooltip.appendChild(warehouseTable);
  }

  function addWarehouseToOrder(
    taskData,
    warehouse,
    tooltip,
    warehouseTable,
    isExplicitlyViewOnly = false
  ) {
    // Находим baseDiv через родителя tooltip
    const baseDiv = tooltip.closest(".task.base");

    // Проверяем, является ли это просто просмотром существующего склада
    // Учитываем как переданный параметр, так и наличие warehouseTable
    const isViewOnly = isExplicitlyViewOnly || !!warehouseTable;

    // Логируем добавление склада только если это не просмотр
    if (typeof logEvent === "function") {
      logEvent(
        {
          type: isViewOnly ? "view" : "create",
          isViewOnly: isViewOnly,
          rectangleId: taskData.id,
          orderNumber: taskData.id,
          warehouseName: warehouse,
          oldValue: "—",
          newValue: isViewOnly
            ? `Просмотр склада: ${warehouse}`
            : `Добавлен склад: ${warehouse}`,
          comment: isViewOnly ? "Просмотр склада" : "Добавление склада",
        },
        isViewOnly // Пропускаем сохранение на сервере если это просмотр
      );
    }

    // Удаляем существующую таблицу складов (если она передана)
    if (warehouseTable) warehouseTable.remove();

    // Удаляем любые существующие окна для других складов
    tooltip.querySelectorAll(".warehouse-window").forEach((win) => {
      if (win.dataset.warehouse !== warehouse) {
        win.remove();
      }
    });

    // Проверяем, существует ли уже окно для этого склада
    let warehouseWindow = tooltip.querySelector(
      `.warehouse-window[data-warehouse="${warehouse}"]`
    );
    if (warehouseWindow) {
      warehouseWindow.remove();
      // После удаления возвращаемся к отображению общей таблицы
      toggleWarehouseMenu(taskData, baseDiv, tooltip);
      return;
    }

    // Инициализируем структуру для хранения распределения по складам, если она ещё не существует
    if (!taskData.warehouseDistribution) {
      taskData.warehouseDistribution = {};
    }

    // Создаем новое окно для склада
    warehouseWindow = document.createElement("div");
    warehouseWindow.className =
      "warehouse-window border p-2 mt-2 bg-gray-50 rounded shadow-sm";
    warehouseWindow.dataset.warehouse = warehouse;
    warehouseWindow.style.position = "relative"; // Для абсолютного позиционирования кнопки закрытия

    const title = document.createElement("div");
    title.className = "font-semibold mb-2";
    title.textContent = `Активний склад: ${warehouse}`;

    // Создаем контейнер для списка выбранных товаров
    const selectedItemsContainer = document.createElement("div");
    selectedItemsContainer.className =
      "selected-items mb-3 bg-white p-2 border rounded";

    const selectedItemsTitle = document.createElement("div");
    selectedItemsTitle.className = "text-xs font-semibold mb-1 text-gray-700";
    selectedItemsTitle.textContent = "Вибрані товари для цього складу:";
    selectedItemsContainer.appendChild(selectedItemsTitle);

    const itemList = document.createElement("div");
    itemList.className =
      "item-list space-y-1 min-h-[50px] max-h-[150px] overflow-y-auto";

    // Функция для расчета доступного количества товара с учетом распределения по другим складам
    function calculateAvailableQty(
      itemName,
      totalOrderQty,
      currentWarehouse = null,
      currentQty = 0
    ) {
      // Количество товара из заказа
      const orderQty = parseInt(totalOrderQty) || 0;

      // Вычитаем количество товара, распределенное по всем складам, кроме текущего
      let usedQty = 0;
      Object.entries(taskData.warehouseDistribution || {}).forEach(
        ([wh, items]) => {
          // Пропускаем текущий склад, поскольку мы можем изменять его количество
          if (wh !== currentWarehouse && items[itemName]) {
            usedQty += parseInt(items[itemName]) || 0;
          }
        }
      );

      // Если это для элемента, который уже есть в текущем складе, добавляем его текущее количество
      const availableWithCurrent =
        orderQty - usedQty + (currentWarehouse ? parseInt(currentQty) || 0 : 0);

      // Возвращаем доступное количество
      return Math.max(availableWithCurrent, 0);
    }

    // Если для этого склада уже есть распределение, отображаем его
    const tempSelectedItems = {};
    if (taskData.warehouseDistribution[warehouse]) {
      Object.entries(taskData.warehouseDistribution[warehouse]).forEach(
        ([itemName, qty]) => {
          // Добавляем товар в временное хранилище
          tempSelectedItems[itemName] = qty;

          // Рассчитываем максимально доступное количество с учетом количества в текущем складе
          const totalAvailable = calculateAvailableQty(
            itemName,
            taskData.order[itemName],
            warehouse,
            qty
          );

          // Создаем элемент для отображения выбранного товара
          const item = document.createElement("div");
          item.className =
            "warehouse-item border p-1 rounded bg-white shadow-sm flex items-center justify-between";

          // Создаем круглую кнопку-индикатор статуса
          const statusButton = document.createElement("div");
          statusButton.className = "status-circle";
          statusButton.style.width = "15.6px"; // Увеличено на 30% с 12px
          statusButton.style.height = "15.6px"; // Увеличено на 30% с 12px
          statusButton.style.marginRight = "12px"; // Увеличен отступ с 4px до 12px
          statusButton.style.margin = "0 12px 0 4px"; // Добавлены отступы со всех сторон

          // Инициализируем или получаем текущее состояние цвета для товара
          if (!taskData.orderStatusColors) {
            taskData.orderStatusColors = {};
          }
          if (!taskData.orderStatusColors[itemName]) {
            taskData.orderStatusColors[itemName] = "white";
          }

          // Устанавливаем текущий цвет кнопки
          statusButton.style.backgroundColor =
            taskData.orderStatusColors[itemName];

          // Добавляем обработчик клика для изменения цвета кнопки
          statusButton.addEventListener("click", (event) => {
            // Останавливаем всплытие события, чтобы не закрыло модальное окно
            event.stopPropagation();

            // Массив доступных цветов
            const colors = ["white", "#FF69B4", "#FFA500", "#90EE90"]; // розовый, оранжевый, светло-зеленый

            // Получаем текущий цвет
            const currentColor = taskData.orderStatusColors[itemName];

            // Находим индекс текущего цвета в массиве
            const currentIndex = colors.indexOf(currentColor);

            // Определяем следующий цвет (циклически)
            const nextIndex = (currentIndex + 1) % colors.length;
            const nextColor = colors[nextIndex];

            // Обновляем цвет кнопки и сохраняем его в task
            statusButton.style.backgroundColor = nextColor;
            taskData.orderStatusColors[itemName] = nextColor;

            // Логирование изменения статуса товара
            if (typeof logEvent === "function") {
              logEvent({
                type: "edit",
                rectangleId: taskData.id,
                orderNumber: taskData.id,
                productName: itemName,
                statusColor: nextColor,
                oldValue: currentColor || "белый",
                newValue: nextColor,
                comment: "Изменение статуса товара",
                warehouseName: warehouse,
              });
            }

            // Сохраняем изменения на сервере
            globalSaveTaskOrder(taskData, baseDiv);
          });

          // Контейнер для названия и кнопки статуса
          const itemNameContainer = document.createElement("div");
          itemNameContainer.className = "flex items-center flex-grow";

          const itemNameSpan = document.createElement("span");
          itemNameSpan.textContent = itemName;
          itemNameSpan.className = "text-xs text-gray-800 truncate flex-grow";

          itemNameContainer.appendChild(statusButton);
          itemNameContainer.appendChild(itemNameSpan);

          const qtyInput = document.createElement("input");
          qtyInput.type = "number";
          qtyInput.className = "ml-2 w-12 border rounded text-center text-xs";
          qtyInput.value = qty;
          qtyInput.min = 1;
          qtyInput.max = totalAvailable;
          qtyInput.dataset.itemName = itemName;

          // Добавляем ограничение на ввод значений больше максимального
          qtyInput.addEventListener("change", function () {
            const value = parseInt(this.value) || 0;
            const maxAllowed = parseInt(qtyInput.max) || 0;
            if (value > maxAllowed) {
              this.value = maxAllowed;
              tempSelectedItems[itemName] = maxAllowed;
            } else {
              tempSelectedItems[itemName] = value;
            }
          });

          // Добавляем кнопку удаления товара
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "×";
          removeBtn.className =
            "ml-1 text-red-500 hover:text-red-700 font-bold text-xs";
          removeBtn.onclick = () => {
            delete tempSelectedItems[itemName];
            item.remove();
          };

          item.appendChild(itemNameContainer);
          item.appendChild(qtyInput);
          item.appendChild(removeBtn);
          itemList.appendChild(item);
        }
      );
    } else {
      // Инициализируем распределение для этого склада
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "text-xs text-gray-500 italic";
      emptyMsg.textContent = "Товари не вибрані";
      itemList.appendChild(emptyMsg);
    }

    selectedItemsContainer.appendChild(itemList);

    // Добавляем кнопку "Показати/Сховати доступні товари"
    const toggleAvailableBtn = document.createElement("button");
    toggleAvailableBtn.textContent = "Показати доступні товари";
    toggleAvailableBtn.className =
      "text-xs mt-3 border-t pt-2 w-full text-blue-600 hover:text-blue-800 flex items-center justify-between cursor-pointer";

    // Добавляем иконку раскрытия
    const toggleIcon = document.createElement("span");
    toggleIcon.innerHTML = "▾";
    toggleIcon.className = "text-xs ml-1 transform transition-transform";
    toggleAvailableBtn.appendChild(toggleIcon);

    // Добавляем список доступных товаров (изначально скрытый)
    const availableItemsContainer = document.createElement("div");
    availableItemsContainer.className = "available-items pt-2";
    availableItemsContainer.style.display = "none"; // Изначально скрыт

    const availableItemsTitle = document.createElement("div");
    availableItemsTitle.className = "text-xs font-medium mb-2";
    availableItemsTitle.textContent = "Доступні товари із замовлення:";
    availableItemsContainer.appendChild(availableItemsTitle);

    // Обработчик для кнопки
    toggleAvailableBtn.onclick = () => {
      if (availableItemsContainer.style.display === "none") {
        availableItemsContainer.style.display = "block";
        toggleAvailableBtn.textContent = "Сховати доступні товари ";
        toggleIcon.innerHTML = "▴";
        toggleAvailableBtn.appendChild(toggleIcon);
      } else {
        availableItemsContainer.style.display = "none";
        toggleAvailableBtn.textContent = "Показати доступні товари ";
        toggleIcon.innerHTML = "▾";
        toggleAvailableBtn.appendChild(toggleIcon);
      }
    };

    const availableItemsGrid = document.createElement("div");
    availableItemsGrid.className =
      "grid grid-cols-2 gap-1 max-h-[200px] overflow-y-auto";

    // Функция для расчета доступного количества товара с учетом распределения по другим складам
    function calculateAvailableQty(itemName, totalOrderQty) {
      // Количество товара из заказа
      const orderQty = parseInt(totalOrderQty) || 0;

      // Вычитаем количество товара, распределенное по всем складам, кроме текущего
      let usedQty = 0;
      Object.entries(taskData.warehouseDistribution || {}).forEach(
        ([wh, items]) => {
          // Пропускаем текущий склад, поскольку мы можем изменять его количество
          if (wh !== warehouse && items[itemName]) {
            usedQty += parseInt(items[itemName]) || 0;
          }
        }
      );

      // Возвращаем доступное количество
      return Math.max(orderQty - usedQty, 0);
    }

    // Добавляем товары из заказа, которые можно выбрать
    const itemEntries = Object.entries(taskData.order || {});

    if (itemEntries.length === 0) {
      const noItemsMsg = document.createElement("div");
      noItemsMsg.className = "text-xs text-gray-500 italic col-span-2";
      noItemsMsg.textContent = "Немає товарів у замовленні";
      availableItemsGrid.appendChild(noItemsMsg);
    } else {
      itemEntries.forEach(([itemName, qty]) => {
        if (parseInt(qty) > 0) {
          // Рассчитываем доступное количество с учетом других складов
          const availableQty = calculateAvailableQty(itemName, qty);

          // Если товара не осталось для этого склада, не показываем его
          if (
            availableQty <= 0 &&
            !taskData.warehouseDistribution[warehouse]?.[itemName]
          ) {
            return;
          }

          const availableItem = document.createElement("button");
          availableItem.className =
            "text-left px-2 py-1 border rounded bg-white text-xs hover:bg-blue-50 truncate";

          // Показываем доступное количество товара с учетом других складов
          availableItem.textContent = `${itemName} (${availableQty})`;
          availableItem.dataset.itemName = itemName;
          availableItem.dataset.maxQty = availableQty;

          // Если товар уже выбран для этого склада, то учитываем это в отображении
          if (taskData.warehouseDistribution[warehouse]?.[itemName]) {
            availableItem.textContent = `${itemName} (${availableQty} + ${taskData.warehouseDistribution[warehouse][itemName]} вже)`;
          }

          // Добавляем обработчик клика для выбора товара
          availableItem.onclick = () => {
            const itemName = availableItem.dataset.itemName;

            // Если товар уже есть в выбранных, увеличиваем его количество
            const existingInput = itemList.querySelector(
              `input[data-item-name="${itemName}"]`
            );
            if (existingInput) {
              const currentQty = parseInt(existingInput.value) || 0;
              const maxQty = parseInt(availableItem.dataset.maxQty) || 0;
              if (maxQty > 0 && currentQty < maxQty) {
                existingInput.value = currentQty + 1;
                tempSelectedItems[itemName] = currentQty + 1;
              }
            } else {
              // Удаляем сообщение о пустом списке, если оно есть
              const emptyMsg = itemList.querySelector(".text-gray-500.italic");
              if (emptyMsg) {
                emptyMsg.remove();
              }

              // Добавляем новый товар в список выбранных
              tempSelectedItems[itemName] = 1;

              // Создаем элемент для отображения выбранного товара
              const item = document.createElement("div");
              item.className =
                "warehouse-item border p-1 rounded bg-white shadow-sm flex items-center justify-between";

              // Создаем круглую кнопку-индикатор статуса
              const statusButton = document.createElement("div");
              statusButton.className = "status-circle";
              statusButton.style.width = "15.6px"; // Увеличено на 30% с 12px
              statusButton.style.height = "15.6px"; // Увеличено на 30% с 12px
              statusButton.style.marginRight = "12px"; // Увеличен отступ с 4px до 12px
              statusButton.style.margin = "0 12px 0 4px"; // Добавлены отступы со всех сторон

              // Инициализируем или получаем текущее состояние цвета для товара
              if (!taskData.orderStatusColors) {
                taskData.orderStatusColors = {};
              }
              if (!taskData.orderStatusColors[itemName]) {
                taskData.orderStatusColors[itemName] = "white";
              }

              // Устанавливаем текущий цвет кнопки
              statusButton.style.backgroundColor =
                taskData.orderStatusColors[itemName];

              // Добавляем обработчик клика для изменения цвета кнопки
              statusButton.addEventListener("click", (event) => {
                // Останавливаем всплытие события, чтобы не закрыло модальное окно
                event.stopPropagation();

                // Массив доступных цветов
                const colors = ["white", "#FF69B4", "#FFA500", "#90EE90"]; // розовый, оранжевый, светло-зеленый

                // Получаем текущий цвет
                const currentColor = taskData.orderStatusColors[itemName];

                // Находим индекс текущего цвета в массиве
                const currentIndex = colors.indexOf(currentColor);

                // Определяем следующий цвет (циклически)
                const nextIndex = (currentIndex + 1) % colors.length;
                const nextColor = colors[nextIndex];

                // Обновляем цвет кнопки и сохраняем его в task
                statusButton.style.backgroundColor = nextColor;
                taskData.orderStatusColors[itemName] = nextColor;

                // Сохраняем изменения на сервере
                globalSaveTaskOrder(taskData, baseDiv);
              });

              // Контейнер для названия и кнопки статуса
              const itemNameContainer = document.createElement("div");
              itemNameContainer.className = "flex items-center flex-grow";

              const itemNameSpan = document.createElement("span");
              itemNameSpan.textContent = itemName;
              itemNameSpan.className =
                "text-xs text-gray-800 truncate flex-grow";

              itemNameContainer.appendChild(statusButton);
              itemNameContainer.appendChild(itemNameSpan);

              // Рассчитываем максимально доступное количество
              const availableQty = parseInt(availableItem.dataset.maxQty) || 0;

              const qtyInput = document.createElement("input");
              qtyInput.type = "number";
              qtyInput.className =
                "ml-2 w-12 border rounded text-center text-xs";
              qtyInput.value = availableQty > 0 ? 1 : 0;
              qtyInput.min = 1;
              qtyInput.max = availableQty;
              qtyInput.dataset.itemName = itemName;

              // Добавляем ограничение на ввод значений больше максимального
              qtyInput.addEventListener("change", function () {
                const value = parseInt(this.value) || 0;
                if (value > availableQty) {
                  this.value = availableQty;
                  tempSelectedItems[itemName] = availableQty;
                }
              });

              // Добавляем кнопку удаления товара
              const removeBtn = document.createElement("button");
              removeBtn.textContent = "×";
              removeBtn.className =
                "ml-1 text-red-500 hover:text-red-700 font-bold text-xs";
              removeBtn.onclick = () => {
                delete tempSelectedItems[itemName];
                item.remove();

                // Если список выбранных товаров пуст, показываем сообщение
                if (itemList.children.length === 0) {
                  const emptyMsg = document.createElement("div");
                  emptyMsg.className = "text-xs text-gray-500 italic";
                  emptyMsg.textContent = "Товари не вибрані";
                  itemList.appendChild(emptyMsg);
                }
              };

              item.appendChild(itemNameContainer);
              item.appendChild(qtyInput);
              item.appendChild(removeBtn);
              itemList.appendChild(item);
            }
          };

          availableItemsGrid.appendChild(availableItem);
        }
      });
    }

    availableItemsContainer.appendChild(availableItemsGrid);

    // Добавляем кнопки действий
    const actionsContainer = document.createElement("div");
    actionsContainer.className =
      "actions mt-3 border-t pt-3 flex justify-between";

    // Кнопка ОК
    const saveButton = document.createElement("button");
    saveButton.textContent = "Зберегти";
    saveButton.className =
      "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs";
    saveButton.onclick = () => {
      // Находим baseDiv через родителя tooltip
      const baseDiv = tooltip.closest(".task.base");

      // Если объект для склада еще не существует, создаем его
      if (!taskData.warehouseDistribution[warehouse]) {
        taskData.warehouseDistribution[warehouse] = {};
      }

      // Удаляем текущие данные и заменяем их новыми из временного хранилища
      taskData.warehouseDistribution[warehouse] = {};

      // Собираем данные из выбранных товаров
      const inputs = itemList.querySelectorAll("input[data-item-name]");
      inputs.forEach((input) => {
        const itemName = input.dataset.itemName;
        const qty = parseInt(input.value) || 0;

        if (qty > 0) {
          taskData.warehouseDistribution[warehouse][itemName] = qty;
        }
      });

      // Используем существующую функцию для сохранения данных
      saveWarehouseDistribution(taskData, baseDiv, tooltip);

      // Удаляем существующие индикаторы складов (если они есть)
      const existingIndicators = baseDiv.querySelector(".warehouse-indicators");
      if (existingIndicators) {
        existingIndicators.remove();
      }

      // Явно вызываем функцию для отображения закладок складов после сохранения
      showCompactWarehouseView(taskData, baseDiv);

      // Удаляем текущее окно редактирования склада
      warehouseWindow.remove();
    };

    // Кнопка Отмена
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Скасувати";
    cancelButton.className =
      "bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-xs";
    cancelButton.onclick = () => {
      warehouseWindow.remove();
      // Восстанавливаем общую таблицу складов
      toggleWarehouseMenu(taskData, baseDiv, tooltip);
    };

    actionsContainer.appendChild(cancelButton);
    actionsContainer.appendChild(saveButton);

    // Кнопка закрытия окна
    const closeButton = document.createElement("button");
    closeButton.className =
      "absolute top-1 right-1 text-gray-500 hover:text-gray-700";
    closeButton.textContent = "×";
    closeButton.onclick = () => {
      warehouseWindow.remove();
      // Восстанавливаем общую таблицу складов
      toggleWarehouseMenu(taskData, baseDiv, tooltip);
    };

    warehouseWindow.appendChild(closeButton);
    warehouseWindow.appendChild(title);
    warehouseWindow.appendChild(selectedItemsContainer);
    warehouseWindow.appendChild(toggleAvailableBtn);
    warehouseWindow.appendChild(availableItemsContainer);
    warehouseWindow.appendChild(actionsContainer);

    tooltip.appendChild(warehouseWindow);
  }

  // Функция для сохранения распределения товаров по складам
  function saveWarehouseDistribution(taskData, baseDiv, tooltip) {
    // Логируем изменения товаров на складе
    if (typeof logEvent === "function") {
      // Получаем имя склада (его нужно определить из контекста, например из dataset элемента)
      const warehouseWindow = tooltip.querySelector(".warehouse-window");
      if (warehouseWindow) {
        const warehouseName = warehouseWindow.dataset.warehouse;

        // Получаем список изменений товаров для этого склада
        const warehouseItems =
          warehouseWindow.querySelectorAll(".selected-item");
        warehouseItems.forEach((item) => {
          const itemName =
            item.querySelector("[data-item-name]")?.dataset?.itemName;
          const qtyInput = item.querySelector('input[type="number"]');

          if (itemName && qtyInput) {
            const newQty = parseInt(qtyInput.value || 0);
            const oldQty = parseInt(qtyInput.dataset.originalQty || 0);

            if (oldQty !== newQty) {
              logEvent({
                type: "edit",
                rectangleId: taskData.id,
                warehouseName: warehouseName,
                productName: itemName,
                oldValue: oldQty.toString(),
                newValue: newQty.toString(),
                comment: "Корректировка товара на складе",
              });
            }
          }
        });
      }
    }

    // Убедимся, что цвета статусов складов инициализированы
    if (!taskData.warehouseStatusColors) {
      taskData.warehouseStatusColors = {};
    }

    // Обновляем цвета статусов складов
    Object.keys(taskData.warehouseDistribution).forEach((warehouse) => {
      // Если для склада еще нет сохраненного цвета, задаем его по умолчанию (белый)
      if (!taskData.warehouseStatusColors[warehouse]) {
        taskData.warehouseStatusColors[warehouse] = "white";
      }
    });

    // Сохраняем через API
    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка сохранения: ${response.statusText}`);
        }
        console.log(
          `Распределение по складам для задачи ${taskData.id} сохранено`
        );

        // Удаляем существующие индикаторы складов (если они есть)
        const existingIndicators = baseDiv.querySelector(
          ".warehouse-indicators"
        );
        if (existingIndicators) {
          existingIndicators.remove();
        }

        // Создаем компактное представление товаров после сохранения
        showCompactWarehouseView(taskData, baseDiv); // Если передан tooltip, то показываем общую таблицу складов
        if (tooltip) {
          // Закрываем все окна выбора товаров
          const warehouseWindows =
            tooltip.querySelectorAll(".warehouse-window");
          warehouseWindows.forEach((win) => win.remove());

          // Закрываем меню выбора складов, если оно открыто
          const warehouseMenus = tooltip.querySelectorAll(".warehouse-menu");
          warehouseMenus.forEach((menu) => menu.remove());

          // Удаляем существующие таблицы перед тем, как создать новую
          const prevTables = tooltip.querySelectorAll(
            ".warehouse-table-container"
          );
          prevTables.forEach((t) => t.remove());

          // Показываем обновленную таблицу складов
          toggleWarehouseMenu(taskData, baseDiv, tooltip);
        }
      })
      .catch((error) => {
        console.error("Ошибка при сохранении распределения по складам:", error);
      });
  }

  // Функция для отображения компактного представления складов
  function showCompactWarehouseView(taskData, baseDiv, skipLogging = false) {
    // Проверяем, есть ли распределение по складам
    if (
      !taskData.warehouseDistribution ||
      Object.keys(taskData.warehouseDistribution).length === 0
    ) {
      // Если распределения нет, обнуляем счетчик складов и возвращаемся
      taskData._previousWarehousesCount = 0;
      return; // Если распределения нет, то нечего показывать
    }

    // Собираем склады с товарами
    const warehousesWithItems = [];

    Object.entries(taskData.warehouseDistribution).forEach(
      ([warehouse, items]) => {
        if (Object.keys(items).length > 0) {
          warehousesWithItems.push(warehouse);
        }
      }
    );

    if (warehousesWithItems.length === 0) {
      // Если нет складов с товарами, обнуляем счетчик и возвращаемся
      taskData._previousWarehousesCount = 0;
      return; // Если нет складов с товарами, нечего показывать
    }

    // Проверяем изменение количества закладок складов
    // Используем данные из предыдущего состояния, если они были сохранены,
    // или получаем из DOM, если закладки уже отображаются
    let previousTabsCount = 0;

    // Сначала проверяем, были ли данные сохранены в объекте задачи
    if (taskData._previousWarehousesCount !== undefined) {
      previousTabsCount = taskData._previousWarehousesCount;
    } else {
      // Иначе пытаемся получить из DOM
      const existingIndicators = baseDiv.querySelector(".warehouse-indicators");
      const existingTabs = existingIndicators
        ? existingIndicators.querySelectorAll(".tabs > div")
        : [];
      previousTabsCount = existingTabs.length;
    }

    const currentTabsCount = warehousesWithItems.length;

    // Сохраняем текущее количество складов для следующего вызова
    taskData._previousWarehousesCount = currentTabsCount;

    // Если количество закладок изменилось и не указан флаг пропуска логирования, логируем это событие
    if (
      previousTabsCount !== currentTabsCount &&
      typeof logEvent === "function" &&
      !skipLogging
    ) {
      // Формируем детальное сообщение об изменении количества складов
      let detailedMessage;
      if (previousTabsCount === 0) {
        detailedMessage = `Додано ${currentTabsCount} ${getWarehouseCountText(
          currentTabsCount
        )}`;
      } else if (currentTabsCount === 0) {
        detailedMessage = `Видалено всі склади (було ${previousTabsCount} ${getWarehouseCountText(
          previousTabsCount
        )})`;
      } else if (previousTabsCount < currentTabsCount) {
        detailedMessage = `Додано ${
          currentTabsCount - previousTabsCount
        } ${getWarehouseCountText(currentTabsCount - previousTabsCount)}`;
      } else {
        detailedMessage = `Видалено ${
          previousTabsCount - currentTabsCount
        } ${getWarehouseCountText(previousTabsCount - currentTabsCount)}`;
      }

      logEvent({
        type: "edit",
        rectangleId: taskData.id,
        orderNumber: taskData.id,
        oldValue: `${previousTabsCount} ${getWarehouseCountText(
          previousTabsCount
        )}`,
        newValue: `${currentTabsCount} ${getWarehouseCountText(
          currentTabsCount
        )}`,
        comment: detailedMessage,
      });
    }

    // Вспомогательная функция для правильного склонения слова "склад"
    function getWarehouseCountText(count) {
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;

      if (lastDigit === 1 && lastTwoDigits !== 11) {
        return "склад";
      } else if (
        [2, 3, 4].includes(lastDigit) &&
        ![12, 13, 14].includes(lastTwoDigits)
      ) {
        return "склади";
      } else {
        return "складів";
      }
    }

    // Создаем индикатор
    const warehouseIndicators = document.createElement("div");
    warehouseIndicators.className =
      "warehouse-indicators absolute bottom-full left-0 z-10";
    warehouseIndicators.style.display = "block"; // Явно указываем отображение
    warehouseIndicators.style.position = "absolute";
    warehouseIndicators.style.bottom = "100%"; // Размещаем над прямоугольником задачи
    warehouseIndicators.style.left = "0";
    warehouseIndicators.style.zIndex = "50"; // Очень высокий z-index, чтобы быть поверх других элементов
    warehouseIndicators.style.pointerEvents = "auto"; // Убедимся, что закладки реагируют на клики

    // Создаем контейнер для вкладок
    const tabsContainer = document.createElement("div");
    tabsContainer.className =
      "tabs flex flex-wrap items-center justify-start bg-transparent";
    tabsContainer.style.display = "flex";
    tabsContainer.style.flexWrap = "wrap";
    tabsContainer.style.alignItems = "flex-end"; // Выравниваем вкладки по нижнему краю
    tabsContainer.style.minHeight = "28px"; // Увеличиваем минимальную высоту контейнера
    tabsContainer.style.marginBottom = "2px"; // Добавляем небольшой отступ снизу

    // Добавляем вкладки складов
    warehousesWithItems.forEach((warehouse) => {
      const tab = document.createElement("div");
      tab.className =
        "text-xs bg-[#f0a8d1] text-gray-700 rounded-t-lg rounded-b-none px-3 py-1 mx-[6px] cursor-pointer hover:bg-[#e090b9] transform scale-110";
      tab.style.display = "inline-flex"; // Используем flex для размещения статуса слева от имени
      tab.style.alignItems = "center"; // Выравниваем содержимое по центру
      tab.style.margin = "0 6px"; // Увеличиваем отступ между закладками до 6px
      tab.style.padding = "2px 6px";
      tab.style.backgroundColor = "#f0a8d1";
      tab.style.borderRadius = "4px 4px 0 0";
      tab.style.border = "none"; // Убираем обводку
      tab.style.borderBottom = "none";
      tab.style.cursor = "pointer";
      tab.style.fontWeight = "normal"; // Делаем текст не жирным
      tab.style.boxShadow = "none"; // Убираем тень
      tab.style.transition = "all 0.2s ease"; // Добавляем плавный переход для эффектов наведения

      // Создаем индикатор статуса (кружок)
      const statusCircle = document.createElement("div");
      statusCircle.className = "status-circle";
      statusCircle.style.width = "10.4px"; // Увеличено на 30% с 8px
      statusCircle.style.height = "10.4px"; // Увеличено на 30% с 8px
      statusCircle.style.borderRadius = "50%";
      statusCircle.style.marginRight = "8px"; // Увеличен отступ с 5px до 8px
      statusCircle.style.margin = "0 8px 0 2px"; // Добавлены отступы со всех сторон
      statusCircle.style.flexShrink = "0";
      statusCircle.style.cursor = "pointer";

      // Инициализируем сохранение цветов статусов складов, если его нет
      if (!taskData.warehouseStatusColors) {
        taskData.warehouseStatusColors = {};
      }

      // Определяем статус склада на основе данных
      const warehouseItems = taskData.warehouseDistribution[warehouse];
      const itemCount = Object.keys(warehouseItems).length;

      // Если у нас уже есть сохраненный цвет, используем его
      if (taskData.warehouseStatusColors[warehouse]) {
        statusCircle.style.backgroundColor =
          taskData.warehouseStatusColors[warehouse];
        statusCircle.style.borderColor =
          taskData.warehouseStatusColors[warehouse];
      } else {
        // Иначе устанавливаем цвет по умолчанию - белый
        const defaultColor = "white";
        statusCircle.style.backgroundColor = defaultColor;
        statusCircle.style.borderColor = "#ccc"; // Для белого цвета используем серую границу для лучшей видимости

        // Сохраняем цвет по умолчанию
        taskData.warehouseStatusColors[warehouse] = defaultColor;
      }

      // Добавляем обработчик клика для изменения цвета индикатора
      statusCircle.addEventListener("click", (event) => {
        // Останавливаем всплытие события
        event.stopPropagation();

        // Массив доступных цветов
        const colors = ["white", "#FF69B4", "#FFA500", "#90EE90"]; // белый, розовый, оранжевый, зеленый

        // Получаем текущий цвет
        const currentColor = taskData.warehouseStatusColors[warehouse];

        // Находим индекс текущего цвета в массиве
        const currentIndex = colors.indexOf(currentColor);
        let nextIndex;

        // Если текущий цвет не найден в массиве, начинаем с первого цвета
        if (currentIndex === -1) {
          nextIndex = 0;
        } else {
          // Иначе берем следующий цвет (циклически)
          nextIndex = (currentIndex + 1) % colors.length;
        }

        const nextColor = colors[nextIndex];

        // Обновляем цвет индикатора
        statusCircle.style.backgroundColor = nextColor;
        statusCircle.style.borderColor =
          nextColor === "white" ? "#ccc" : nextColor;

        // Сохраняем новый цвет в taskData
        taskData.warehouseStatusColors[warehouse] = nextColor;

        // Логируем изменение статуса склада
        if (typeof logEvent === "function") {
          logEvent({
            type: "edit",
            rectangleId: taskData.id,
            orderNumber: taskData.id,
            warehouseName: warehouse,
            warehouseStatusColor: nextColor,
            oldValue: currentColor || "white",
            newValue: nextColor,
            comment: "Изменение статуса склада",
          });
        }

        // Сохраняем изменения на сервере
        fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        })
          .then(() => {
            console.log(
              `Цвет статуса склада ${warehouse} обновлен на ${nextColor}`
            );
          })
          .catch((error) => {
            console.error(
              `Ошибка при сохранении цвета статуса склада: ${error}`
            );
          });
      });

      // Добавляем статус и название склада
      tab.appendChild(statusCircle);
      tab.appendChild(document.createTextNode(warehouse));
      tab.onmouseenter = () => {
        tab.style.backgroundColor = "#e090b9";
        tab.style.transform = "scale(1.15)"; // Уменьшаем масштаб при наведении
      };

      tab.onmouseleave = () => {
        tab.style.backgroundColor = "#f0a8d1";
        tab.style.transform = "scale(1.10)"; // Уменьшаем масштаб в обычном состоянии
      };

      // Добавляем обработчик клика для склада
      tab.onclick = (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события

        // Проверяем, есть ли уже тултип
        const tooltip = baseDiv.querySelector(".tooltip");
        if (tooltip) {
          // Если есть тултип, показываем окно редактирования этого склада
          const warehouseTable = tooltip.querySelector(
            ".warehouse-table-container"
          );
          if (warehouseTable) {
            // Если таблица открыта, закрываем её
            warehouseTable.remove();
          }

          // Открываем окно редактирования склада
          addWarehouseToOrder(taskData, warehouse, tooltip, null, true);
        } else {
          // Если нет тултипа, сначала показываем его
          showOrderTooltip(taskData, baseDiv, false, null, false);
          const newTooltip = baseDiv.querySelector(".tooltip");
          if (newTooltip) {
            // Затем открываем окно редактирования склада
            addWarehouseToOrder(taskData, warehouse, newTooltip, null, true);
          }
        }
      };

      tabsContainer.appendChild(tab);
    });

    // Добавляем обработчик клика для всего контейнера, чтобы открыть общую таблицу складов
    tabsContainer.addEventListener("click", () => {
      // Проверяем, есть ли уже таблица
      const tooltip = baseDiv.querySelector(".tooltip");
      if (tooltip) {
        // Если таблица складов уже открыта, закрываем её, иначе открываем
        const warehouseTable = tooltip.querySelector(
          ".warehouse-table-container"
        );
        if (warehouseTable) {
          warehouseTable.remove();
        } else {
          toggleWarehouseMenu(taskData, baseDiv, tooltip);
        }
      } else {
        // Если нет тултипа, сначала показываем его, а затем таблицу складов
        showOrderTooltip(taskData, baseDiv, false, null, false);
        const newTooltip = baseDiv.querySelector(".tooltip");
        if (newTooltip) {
          toggleWarehouseMenu(taskData, baseDiv, newTooltip);
        }
      }
    });

    // Добавляем стиль для позиционирования относительно прямоугольника
    tabsContainer.style.marginBottom = "0";

    warehouseIndicators.appendChild(tabsContainer);
    baseDiv.appendChild(warehouseIndicators);
  }

  // -----------------------------------------------------------------------
  // 2⃣  Функція створення / відновлення прямокутника
  // -----------------------------------------------------------------------
  function createTask(rowEl, rowIndex, cfg = null) {
    console.log("Create task triggered for row", rowIndex, "with cfg:", cfg);

    // Validate that rowEl exists
    if (!rowEl) {
      console.error(`Row element for index ${rowIndex} not found!`);
      // Try to find the row element if it wasn't passed correctly
      rowEl = calendar.querySelectorAll(".row")[rowIndex];

      if (!rowEl) {
        console.error(
          `Unable to find row element for index ${rowIndex}. Cannot create task.`
        );
        return; // Exit if we can't find the row
      }
    }

    // Флаг для определения, создается ли новая задача или загружается существующая
    const isNewTask = !cfg;

    const isExistingTask = !!cfg;

    const taskData = {
      id: cfg ? cfg.id : Date.now().toString(),
      row: rowIndex,
      start: cfg ? cfg.start : today.toISOString(),
      days: cfg ? parseFloat(cfg.days) || 14 : 14, // Original committed days
      delta: cfg ? parseFloat(cfg.delta) || 0 : 0, // Deviation from original days
      comment: cfg ? cfg.comment || "" : "",
      order: cfg ? { ...(cfg.order || {}) } : {},
      initialOrder: {},
      previousOrder: {},
      orderColors: cfg && cfg.orderColors ? { ...(cfg.orderColors || {}) } : {}, // Для хранения цветов количеств товаров
      orderStatusColors:
        cfg && cfg.orderStatusColors
          ? { ...(cfg.orderStatusColors || {}) }
          : {}, // Для хранения цветов статусов товаров
      warehouseStatusColors:
        cfg && cfg.warehouseStatusColors
          ? { ...(cfg.warehouseStatusColors || {}) }
          : {}, // Для хранения цветов статусов складов
      warehouseDistribution:
        cfg && cfg.warehouseDistribution
          ? JSON.parse(JSON.stringify(cfg.warehouseDistribution))
          : {}, // Распределение товаров по складам
      itemWeights:
        cfg && cfg.itemWeights
          ? JSON.parse(JSON.stringify(cfg.itemWeights))
          : {}, // Веса товаров для расчета весов по складам
      itemPalletCoefs:
        cfg && cfg.itemPalletCoefs
          ? JSON.parse(JSON.stringify(cfg.itemPalletCoefs))
          : {}, // Коэффициенты паллет товаров для расчета количества паллет
      orderChanges:
        cfg && cfg.orderChanges
          ? JSON.parse(JSON.stringify(cfg.orderChanges))
          : {}, // История изменений количества товаров
    };

    // Якщо загружаємо існуючий таск, ініціалізуємо initialOrder і previousOrder
    if (cfg) {
      // Ініціалізуємо initialOrder
      if (cfg.initialOrder && Object.keys(cfg.initialOrder).length > 0) {
        taskData.initialOrder = JSON.parse(JSON.stringify(cfg.initialOrder));
      }
      // Ініціалізуємо previousOrder
      if (cfg.previousOrder && Object.keys(cfg.previousOrder).length > 0) {
        taskData.previousOrder = JSON.parse(JSON.stringify(cfg.previousOrder));
      }
    }

    // Ensure delta and days are numbers after potential parsing
    taskData.days = Number(taskData.days);
    taskData.delta = Number(taskData.delta);

    const baseDiv = document.createElement("div");
    baseDiv.className = "task base shadow-md"; // baseDiv itself is the "base" task appearance
    baseDiv.dataset.id = taskData.id;
    baseDiv.dataset.row = rowIndex;

    // Зберігаємо початкові значення для відстеження змін дат і логування
    baseDiv.setAttribute("data-original-start", taskData.start);
    baseDiv.setAttribute(
      "data-original-days",
      (taskData.days + taskData.delta).toString()
    );

    // Добавляем data-rectangle-id для связи с записями в логе
    baseDiv.setAttribute("data-rectangle-id", taskData.id);

    // Инициализируем счетчик складов, если есть данные о складах
    if (
      taskData.warehouseDistribution &&
      Object.keys(taskData.warehouseDistribution).length > 0
    ) {
      // Считаем количество складов с товарами
      let warehousesWithItems = 0;
      Object.entries(taskData.warehouseDistribution).forEach(
        ([warehouse, items]) => {
          if (Object.keys(items).length > 0) {
            warehousesWithItems++;
          }
        }
      );

      // Инициализируем счетчик, чтобы при первом показе закладок не считалось, что было 0 складов
      taskData._previousWarehousesCount = warehousesWithItems;
    }

    // MODIFIED: Ensure z-index has a good value for all rows
    // Use a fixed high value to ensure all tasks are above background elements
    baseDiv.style.zIndex = 100 - (rowIndex % 25); // Keep relative z-index between rows but all positive

    // base geometry
    const leftDaysOffset = Math.round(
      (new Date(taskData.start) - startDate) / MS_PER_DAY
    );
    baseDiv.style.left = `${leftDaysOffset * COL_W}px`;

    // Helper function to apply visual changes based on delta
    function applyDeltaVisuals(targetDiv, currentTaskData) {
      // Remove previous indicators
      [
        ...targetDiv.querySelectorAll(".extend-indicator, .shrink-indicator"),
      ].forEach((el) => el.remove());

      const originalDays = currentTaskData.days > 0 ? currentTaskData.days : 1; // Min 1 day for base calculation
      // Ensure delta is a number
      const currentDelta = Number(currentTaskData.delta) || 0;

      let totalVisibleDays = originalDays + currentDelta;
      if (totalVisibleDays < 0.25) {
        // Minimum visual width of a task (e.g., 1/4 day)
        totalVisibleDays = 0.25;
      }

      targetDiv.style.width = `${totalVisibleDays * COL_W}px`;

      if (currentDelta > 0) {
        const extIndicator = document.createElement("div");
        extIndicator.className = "extend-indicator task extend"; // Use existing .task.extend styling
        extIndicator.style.position = "absolute";
        extIndicator.style.top = "0";
        extIndicator.style.height = "100%";
        extIndicator.style.left = `${originalDays * COL_W}px`; // Starts after original committed days
        extIndicator.style.width = `${currentDelta * COL_W}px`; // Width of the extended portion
        targetDiv.appendChild(extIndicator);
      } else if (currentDelta < 0) {
        const shrinkIndicator = document.createElement("div");
        shrinkIndicator.className = "shrink-indicator task shrink"; // Use existing .task.shrink styling
        shrinkIndicator.style.position = "absolute";
        shrinkIndicator.style.top = "0";
        shrinkIndicator.style.height = "100%";
        // Starts where the visible part of the base task ends
        shrinkIndicator.style.left = `${totalVisibleDays * COL_W}px`;
        shrinkIndicator.style.width = `${-currentDelta * COL_W}px`; // Width of the "removed" portion (delta is negative)
        targetDiv.appendChild(shrinkIndicator);
      }
    }

    applyDeltaVisuals(baseDiv, taskData); // Apply initial visuals

    // Удаляем старый элемент "сокращенной части", если он вдруг есть (не должно быть на новом baseDiv)
    // const existingShrunkArea = baseDiv.querySelector('.task-shrunk-area'); // Старый класс
    const existingShrunkIndicator = baseDiv.querySelector(
      ".shrink-indicator.task.shrink"
    ); // Новый поиск
    if (existingShrunkIndicator) {
      existingShrunkIndicator.remove();
    }

    if (taskData.delta < 0) {
      const shrunkPortionEl = document.createElement("div");
      // Присваиваем классы точно как в вашем примере
      shrunkPortionEl.className = "shrink-indicator task shrink";
      shrunkPortionEl.style.position = "absolute";
      shrunkPortionEl.style.height = "100%";
      shrunkPortionEl.style.top = "0";
      shrunkPortionEl.style.left = "100%"; // Справа от содержимого родителя (видимой части задачи)
      shrunkPortionEl.style.width = Math.abs(taskData.delta) * COL_W + "px";
      // Убедимся, что z-index этого элемента ниже, чем у handle, если handle должен быть сверху
      // Например, handle может иметь z-index 10, а этот элемент 5.
      // Или, если handle является дочерним элементом shrunkPortionEl (что маловероятно), то наоборот.
      // Пока оставим z-index по умолчанию.
      baseDiv.appendChild(shrunkPortionEl);
    }

    // 🕹️ Drag & Resize with interact.js
    interact(baseDiv)
      .draggable({
        inertia: true,
        onstart: function (event) {
          // ADDED: onstart handler
          const target = event.target;
          target.setAttribute(
            "data-original-zindex",
            target.style.zIndex ||
              (100 - (parseInt(target.dataset.row, 10) % 25)).toString()
          );
          target.style.zIndex = 999; // Temporarily bring to front
        },
        onmove: dragMoveListener,
        modifiers: [interact.modifiers.restrict({ restriction: "parent" })],
        onend: (event) => {
          // MODIFIED: Pass event, handle promise from save
          const target = event.target;
          save(target, isExistingTask)
            .then(() => {
              // Position and z-index are now updated within the save function's promise
              console.log(
                `Drag ended and task ${target.dataset.id} saved successfully.`
              );
            })
            .catch((error) => {
              console.error("Error saving task after drag:", error);
              // Restore original z-index even if save failed
              target.style.zIndex = target.getAttribute("data-original-zindex");
            });
        },
      })
      .resizable({
        edges: { right: true },
        inertia: true,
        // interact.js will directly manipulate baseDiv.style.width
      })
      .on("resizemove", (event) => {
        const target = event.target; // This is baseDiv
        const newTotalVisualWidthPx = event.rect.width;

        // DEBUG: Log resize info
        console.log(
          `Resizing task ${target.dataset.id} in row ${target.dataset.row}, width=${newTotalVisualWidthPx}px`
        );

        // Calculate new total days, allowing for fractional days (e.g., quarter days)
        let newTotalDays = parseFloat(
          (newTotalVisualWidthPx / COL_W).toFixed(2)
        );
        if (newTotalDays < 0.25) {
          // Enforce minimum task duration
          newTotalDays = 0.25;
        }

        const originalCommittedDays = taskData.days > 0 ? taskData.days : 1;

        taskData.delta = parseFloat(
          (newTotalDays - originalCommittedDays).toFixed(2)
        );

        applyDeltaVisuals(target, taskData); // Update visuals based on new delta
      })
      .on("resizeend", () => {
        // MODIFIED: Handle promise from save for resize
        save(baseDiv, isExistingTask)
          .then(() => {
            console.log(
              `Resize ended and task ${baseDiv.dataset.id} saved successfully.`
            );
          })
          .catch((error) => {
            console.error("Error saving task after resize:", error);
            // Optionally, revert size or handle error visually
          });
      });

    // ❌ delete btn
    const delBtn = document.createElement("span");
    delBtn.textContent = "×";
    delBtn.className =
      "absolute -top-2 -right-2 bg-white shadow rounded-tr px-1 cursor-pointer text-blue-600 text-xs border-t border-r";
    delBtn.title = "Видалити";
    delBtn.addEventListener("click", () => {
      // Логирование удаления прямоугольника
      if (typeof logEvent === "function") {
        logEvent({
          type: "delete",
          rectangleId: taskData.id,
          oldValue: "Прямоугольник существовал",
          newValue: "Удален прямоугольник",
          dateTime: new Date().toLocaleString("ru-RU"),
        });
      }

      baseDiv.remove();
      // Remove tooltip if it exists and is managed by the global orderTooltips map
      const tooltipId = `order-tooltip-${taskData.id}`;
      const globalTooltip = document.getElementById(tooltipId);
      if (globalTooltip) {
        globalTooltip.remove();
        // delete orderTooltips[taskData.id]; // If you have a global map
      }

      fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskData.id }),
      });
    });
    baseDiv.appendChild(delBtn);

    // 📦 «Замовлення» кнопка
    const orderBtn = document.createElement("button");
    orderBtn.textContent = "Замовлення";
    orderBtn.className =
      "absolute left-1 bottom-1 bg-white rounded px-1.5 text-[11.5px] font-medium shadow-sm";
    orderBtn.addEventListener("click", (event) => {
      // Проверяем, что taskData и baseDiv действительно существуют перед вызовом
      console.log("Кнопка Замовлення нажата:", { taskData, baseDiv });
      if (taskData && baseDiv) {
        openOrderModal(taskData, baseDiv, event.currentTarget);
      } else {
        console.error(
          "Ошибка: taskData или baseDiv отсутствуют при клике на Замовлення"
        );
        alert(
          "Ошибка при загрузке данных заказа. Пожалуйста, попробуйте перезагрузить страницу."
        );
      }
    });
    baseDiv.appendChild(orderBtn);

    // ✏️ comment box

    rowEl.appendChild(baseDiv);

    const comment = document.createElement("textarea");
    comment.placeholder = "Коментар…";
    comment.value = taskData.comment;
    comment.className =
      "absolute bottom-1 left-[20%] w-[60%] text-[10px] text-center bg-white/70 rounded resize-none outline-none z-30"; // Added z-30
    comment.addEventListener("change", () => {
      // Сохраняем старое значение комментария для логирования
      const oldComment = taskData.comment || "";
      const newComment = comment.value;

      taskData.comment = newComment;
      save(baseDiv, isExistingTask) // MODIFIED: Handle promise from save for comment change
        .then(() => {
          console.log(
            `Comment changed and task ${baseDiv.dataset.id} saved successfully.`
          );

          // Логирование изменения комментария
          if (typeof logEvent === "function" && oldComment !== newComment) {
            logEvent({
              type: "edit",
              rectangleId: taskData.id,
              oldValue: oldComment || "—",
              newValue: newComment || "—",
              comment: "Редактирование комментария",
            });
          }
        })
        .catch((error) => {
          console.error("Error saving task after comment change:", error);
        });
    });
    baseDiv.appendChild(comment);

    // Мини-тултип удален из проекта

    showOrderTooltip(taskData, baseDiv); // ADDED: Show tooltip on task creation/load

    // Логируем создание нового прямоугольника (только если это действительно новый, а не загрузка существующего)
    if (isNewTask && typeof logEvent === "function") {
      logEvent({
        type: "create",
        rectangleId: taskData.id,
        oldValue: "—",
        newValue: "Создан прямоугольник",
        dateTime: new Date().toLocaleString("ru-RU"),
      });
    }

    // Возвращаем baseDiv для дальнейшего использования
    return baseDiv;

    function dragMoveListener(event) {
      const target = event.target;
      const dx = event.dx;
      // Ensure data-x is initialized if not present
      let currentX = parseFloat(target.getAttribute("data-x")) || 0;
      const x = currentX + dx;
      target.style.transform = `translateX(${x}px)`;
      target.setAttribute("data-x", x);

      // Add debug info
      console.log(
        `Dragging task ${target.dataset.id} in row ${target.dataset.row}, dx=${dx}, currentX=${x}`
      );

      // If there's a global tooltip system, update its position during drag
      // const tooltip = orderTooltips[target.dataset.id];
      // if (tooltip && tooltip.style.visibility === 'visible') {
      //    positionOrderTooltip(target, tooltip);
      // }
    }

    function save(el, isUpdate) {
      // зберігаємо у tasks.json через API
      const xOffset = parseFloat(el.getAttribute("data-x")) || 0;
      const leftPx = parseFloat(el.style.left) + xOffset;

      taskData.start = new Date(
        startDate.getTime() + Math.round(leftPx / COL_W) * MS_PER_DAY
      ).toISOString();

      // taskData.days (original committed days) and taskData.delta are already up-to-date.

      console.log("Saving taskData:", JSON.parse(JSON.stringify(taskData)));

      // Сохраняем предыдущие значения перед сохранением для логирования
      const previousStartDate = el.getAttribute("data-original-start");
      const previousDays = el.getAttribute("data-original-days");
      const currentStartDate = taskData.start;
      const currentDays = taskData.days + taskData.delta;

      // Логирование изменений при перетаскивании и изменении размера
      // Выполняем логирование только если:
      // 1. Функция logEvent доступна
      // 2. Это обновление существующего прямоугольника (а не первичное создание)
      // 3. Произошло фактическое изменение дат (сравнение previous vs current)
      if (typeof logEvent === "function" && isUpdate) {
        // Проверяем, изменилась ли дата начала прямоугольника
        if (previousStartDate && previousStartDate !== currentStartDate) {
          // Отправляем событие в лог с указанием старой и новой дат
          logEvent({
            type: "edit",
            rectangleId: taskData.id,
            oldValue: new Date(previousStartDate).toLocaleDateString("ru-RU"),
            newValue: new Date(currentStartDate).toLocaleDateString("ru-RU"),
            comment: "Изменение даты начала (перетаскивание)",
          });
        }

        // Проверяем, изменилась ли дата завершения через изменение количества дней
        if (previousDays && parseFloat(previousDays) !== currentDays) {
          // Вычисляем старую и новую даты завершения
          const oldEndDate = new Date(
            new Date(previousStartDate || taskData.start).getTime() +
              parseFloat(previousDays) * 86400000
          );
          const newEndDate = new Date(
            new Date(taskData.start).getTime() + currentDays * 86400000
          );

          // Отправляем событие в лог с указанием старой и новой дат завершения
          logEvent({
            type: "edit",
            rectangleId: taskData.id,
            oldValue: oldEndDate.toLocaleDateString("ru-RU"),
            newValue: newEndDate.toLocaleDateString("ru-RU"),
            comment: "Изменение даты окончания (изменение размера)",
          });
        }
      }

      return fetch("/api/tasks", {
        // MODIFIED: Return the fetch promise
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to save task ${taskData.id}: ${response.statusText}`
            );
          }
          // Assuming server doesn't send back data or we don't need it for this step
          return response.text();
        })
        .then(() => {
          // This block executes only on successful save
          const newLeftDaysOffset = Math.round(
            (new Date(taskData.start) - startDate) / MS_PER_DAY
          );
          el.style.left = `${newLeftDaysOffset * COL_W}px`;
          el.style.transform = "translateX(0px)";
          el.setAttribute("data-x", "0");

          // Restore z-index based on the task's row
          // Use the same positive z-index calculation as in the initialization
          el.style.zIndex = 100 - (taskData.row % 25); // Keep positive for all rows
          console.log(
            `Task ${taskData.id} saved and DOM updated. New z-index: ${el.style.zIndex}`
          );

          // Обновляем атрибуты с начальными значениями после успешного сохранения
          // для корректного сравнения при следующем изменении
          el.setAttribute("data-original-start", taskData.start);
          el.setAttribute(
            "data-original-days",
            (taskData.days + taskData.delta).toString()
          );
        });
      // Catch block for fetch errors will be handled by the caller (.catch in onend, etc.)
    }
  }

  // -----------------------------------------------------------------------
  // 3⃣  Завантажуємо tasks.json при старті
  // -----------------------------------------------------------------------
  fetch("/api/tasks")
    .then((r) => r.json())
    .then((data) =>
      Object.values(data).forEach((t) => {
        const r = calendar.querySelectorAll(".row")[t.row];
        const baseDiv = createTask(r, t.row, t); // cfg → відновити без POST

        // Показываем вкладки складов сразу при загрузке, если они есть
        if (
          t.warehouseDistribution &&
          Object.keys(t.warehouseDistribution).length > 0
        ) {
          showCompactWarehouseView(t, baseDiv);
        }
      })
    );

  // -----------------------------------------------------------------------
  // 4⃣  Модальне вікно «Замовлення» (з категоріями товарів)
  // -----------------------------------------------------------------------
  function openOrderModal(task, baseDiv, clickedButtonEl) {
    console.log("openOrderModal вызван с task:", task);

    // Проверка валидности объектов
    if (!task) {
      console.error("openOrderModal: task is undefined or null!");
      alert("Ошибка: Не удалось загрузить данные задачи");
      return;
    }

    if (!baseDiv) {
      console.error("openOrderModal: baseDiv is undefined or null!");
      alert("Ошибка: Не удалось найти элемент задачи");
      return;
    }

    document.body.classList.add("modal-open");

    // Создаем эффект размытия для всех элементов, кроме активного прямоугольника
    const blurCover = document.createElement("div");
    blurCover.className =
      "page-blur-effect fixed inset-0 bg-gray-900 bg-opacity-50 z-[9990]";
    document.body.appendChild(blurCover);

    // Запоминаем текущий z-index активного прямоугольника
    const currentZIndex = baseDiv.style.zIndex;
    // Устанавливаем z-index выше, чем у blurCover
    baseDiv.style.zIndex = "9991";

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[9995]";

    const card = document.createElement("div");
    card.className =
      "bg-white rounded p-4 space-y-3 shadow-lg order-goods-card";
    // Привязка к кнопке "замовлення" - position: absolute вместо fixed для привязки
    // card.style.position = "fixed"; - не нужно, задано в CSS классе
    card.style.zIndex = "9999";
    // Сохраняем originalZIndex для восстановления при закрытии

    // Получаем информацию о позиции кнопки заказа
    const btnRect = clickedButtonEl.getBoundingClientRect();
    let cardTop = btnRect.bottom + 5;
    let cardLeft = btnRect.left;

    // Устанавливаем начальное положение карточки относительно кнопки
    card.style.top = `${cardTop}px`;
    card.style.left = `${cardLeft}px`;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "text-center py-3 text-gray-700";
    loadingIndicator.textContent = "Завантаження списку товарів...";
    card.appendChild(loadingIndicator);

    // Сначала показываем индикатор загрузки, затем добавляем карточку в DOM
    document.body.appendChild(overlay);
    document.body.appendChild(card);

    // После добавления в DOM пересчитываем позицию относительно кнопки
    updateCardPosition();

    // Event listener для закрытия модального окна по клику вне его
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    function closeModal() {
      // Удаляем слушатели событий
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("resize", scrollHandler);
        scrollHandler = null;
      }

      card.remove();
      overlay.remove();
      blurCover.remove();
      document.body.classList.remove("modal-open");

      // Восстанавливаем оригинальный z-index активного прямоугольника
      baseDiv.style.zIndex = currentZIndex;
    }

    // Функция для отслеживания прокрутки и обновления позиции карточки относительно кнопки
    let scrollHandler = null;
    function updateCardPosition() {
      // Получаем актуальные размеры и позицию кнопки и карточки
      const btnRect = clickedButtonEl.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Обновляем положение меню товаров при прокрутке
      let newCardTop = btnRect.bottom + 5;
      let newCardLeft = btnRect.left;

      // Проверяем границы экрана
      if (newCardLeft + cardRect.width > window.innerWidth - 10) {
        newCardLeft = Math.max(10, window.innerWidth - cardRect.width - 10);
      }

      // Если карточка будет выходить за нижний край экрана, отображаем её над кнопкой
      if (newCardTop + cardRect.height > window.innerHeight - 10) {
        newCardTop = Math.max(10, btnRect.top - cardRect.height - 5);
        if (newCardTop < 10) {
          newCardTop = 10;
        }
      }

      // Обеспечиваем, чтобы карточка всегда была видима
      newCardTop = Math.max(
        10,
        Math.min(
          newCardTop,
          window.innerHeight -
            Math.min(cardRect.height, window.innerHeight * 0.8) -
            10
        )
      );

      card.style.left = `${newCardLeft}px`;
      card.style.top = `${newCardTop}px`;
    }

    // Устанавливаем обработчик события прокрутки
    scrollHandler = () => {
      requestAnimationFrame(updateCardPosition);
    };
    window.addEventListener("scroll", scrollHandler);

    // Также обновляем позицию при изменении размера окна
    window.addEventListener("resize", scrollHandler);

    // Хранение ссылок на все поля ввода
    const goodsInputs = {};

    fetch("/api/goods")
      .then((response) => {
        console.log("Ответ от API /api/goods:", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Ошибка при загрузке товаров:", error);
        loadingIndicator.textContent =
          "Помилка завантаження списку товарів. Спробуйте ще раз пізніше.";
        loadingIndicator.className = "text-center py-3 text-red-600";
        // Создаем кнопку закрытия
        const closeButton = document.createElement("button");
        closeButton.textContent = "Закрити";
        closeButton.className = "mt-3 px-2 py-1 bg-gray-300 rounded text-sm";
        closeButton.onclick = closeModal;
        card.appendChild(closeButton);
        throw error; // Прерываем цепочку промисов
      })
      .then((categorizedGoods) => {
        console.log("Загружены категории товаров:", categorizedGoods);

        // Проверяем, есть ли категории товаров
        if (!categorizedGoods || Object.keys(categorizedGoods).length === 0) {
          loadingIndicator.textContent =
            "Не удалось загрузить товары. Категории отсутствуют.";
          loadingIndicator.className = "text-center py-3 text-red-600";
          return;
        }

        loadingIndicator.remove();

        // Создаём контейнер для категорий (гибкий, с горизонтальной прокруткой при необходимости)
        const categoriesContainer = document.createElement("div");
        categoriesContainer.className = "categories-container";
        card.appendChild(categoriesContainer);

        // Обрабатываем каждую категорию
        Object.keys(categorizedGoods).forEach((categoryName) => {
          const categoryColumn = document.createElement("div");
          // Стилизация колонки категории
          categoryColumn.className = "category-column";

          // Заголовок категории
          const categoryTitle = document.createElement("h3");
          categoryTitle.className =
            "font-semibold text-sm mb-2 pb-1 border-b border-gray-200";
          categoryTitle.textContent = categoryName;
          categoryColumn.appendChild(categoryTitle);

          // Контейнер для товаров категории
          const goodsContainer = document.createElement("div");
          goodsContainer.className = "goods-container";
          categoryColumn.appendChild(goodsContainer);

          // Товары в категории
          const goodsList = categorizedGoods[categoryName];
          console.log(
            `Обработка категории ${categoryName}, товаров: ${
              goodsList ? goodsList.length : 0
            }`
          );

          if (Array.isArray(goodsList) && goodsList.length > 0) {
            goodsList.forEach((goodItem) => {
              const goodName = goodItem.name;
              const goodWeight = goodItem.weight || 0;
              const goodPalletCoef = goodItem.pallet_coef || 1.0;

              console.log(
                `Обработка товара: "${goodName}" (вага: ${goodWeight} кг, коеф. паллети: ${goodPalletCoef})`
              );

              // Инициализируем или сохраняем коэффициент паллеты для товара
              if (!task.itemPalletCoefs) {
                task.itemPalletCoefs = {};
              }
              task.itemPalletCoefs[goodName] = goodPalletCoef;

              // Получаем текущее количество с безопасной проверкой объекта task.order
              let currentQuantity = 0;
              if (task && task.order && typeof task.order === "object") {
                currentQuantity = parseInt(task.order[goodName] || 0, 10);
              }
              console.log(
                `Текущее количество товара "${goodName}": ${currentQuantity}`
              );

              const row = document.createElement("div");
              row.className = "goods-item";

              // Создаем круглую кнопку-индикатор статуса
              const statusButton = document.createElement("div");
              statusButton.className = "status-circle";

              // Инициализируем или получаем текущее состояние цвета для товара
              if (!task.orderStatusColors) {
                task.orderStatusColors = {};
              }
              if (!task.orderStatusColors[goodName]) {
                task.orderStatusColors[goodName] = "white";
              }

              // Устанавливаем текущий цвет кнопки
              statusButton.style.backgroundColor =
                task.orderStatusColors[goodName];

              // Добавляем обработчик клика для изменения цвета кнопки
              statusButton.addEventListener("click", (event) => {
                // Останавливаем всплытие события, чтобы не закрыло модальное окно
                event.stopPropagation();

                // Массив доступных цветов
                const colors = ["white", "#FF69B4", "#FFA500", "#90EE90"]; // розовый, оранжевый, светло-зеленый

                // Получаем текущий цвет
                const currentColor = task.orderStatusColors[goodName];

                // Находим индекс текущего цвета в массиве
                const currentIndex = colors.indexOf(currentColor);

                // Определяем следующий цвет (циклически)
                const nextIndex = (currentIndex + 1) % colors.length;
                const nextColor = colors[nextIndex];

                // Обновляем цвет кнопки и сохраняем его в task
                statusButton.style.backgroundColor = nextColor;
                task.orderStatusColors[goodName] = nextColor;

                // Сохраняем изменения на сервере
                globalSaveTaskOrder(task, baseDiv);
              });

              // Название товара и, если есть, начальное количество
              const label = document.createElement("label");
              let initialQuantity = null;

              // Сохраняем вес товара в data-атрибуте для последующих расчетов
              label.dataset.weight = goodWeight;

              // Безопасно проверяем существование task.initialOrder и его свойств
              if (
                task &&
                task.initialOrder &&
                typeof task.initialOrder === "object" &&
                task.initialOrder[goodName] !== undefined
              ) {
                initialQuantity = task.initialOrder[goodName];
                console.log(
                  `Начальное количество товара "${goodName}": ${initialQuantity}`
                );
              }

              if (initialQuantity !== null) {
                label.innerHTML = `${goodName}: <s style="color:#666;">${initialQuantity}</s>`;
              } else {
                label.textContent = goodName;
              }

              label.className = "flex-grow mr-2 text-xs text-gray-700 truncate";
              const inputId = `good-input-${goodName.replace(/\s+/g, "-")}`;
              label.htmlFor = inputId;

              // Контейнер для элементов управления
              const controlsDiv = document.createElement("div");
              controlsDiv.className =
                "flex items-center space-x-1 flex-shrink-0";

              // Кнопка "Минус"
              const minusButton = document.createElement("button");
              minusButton.textContent = "-";
              minusButton.className =
                "px-2 py-0.5 border rounded bg-gray-200 hover:bg-gray-300 text-xs";
              minusButton.type = "button";

              // Поле ввода количества
              const input = document.createElement("input");
              input.type = "number";
              input.min = 0;
              input.value = currentQuantity;
              input.id = inputId;
              input.className = "border w-12 text-center px-1 text-sm rounded";

              // Кнопка "Плюс"
              const plusButton = document.createElement("button");
              plusButton.textContent = "+";
              plusButton.className =
                "px-2 py-0.5 border rounded bg-gray-200 hover:bg-gray-300 text-xs";
              plusButton.type = "button";

              // Обработчики событий
              minusButton.onclick = () => {
                let val = parseInt(input.value, 10) || 0;
                if (val > 0) input.value = val - 1;
              };

              plusButton.onclick = () => {
                let val = parseInt(input.value, 10) || 0;
                input.value = val + 1;
              };

              input.onchange = () => {
                let val = parseInt(input.value, 10);
                if (isNaN(val) || val < 0) input.value = 0;
              };

              // Сохраняем ссылку на поле ввода и добавляем атрибут с весом
              goodsInputs[goodName] = input;
              input.dataset.weight = goodWeight;

              // Добавляем обработчик изменения для пересчета общей массы
              input.addEventListener("change", updateTotalWeight);
              minusButton.addEventListener("click", updateTotalWeight);
              plusButton.addEventListener("click", updateTotalWeight);

              // Добавляем элементы на страницу
              controlsDiv.appendChild(minusButton);
              controlsDiv.appendChild(input);
              controlsDiv.appendChild(plusButton);

              // Создаем контейнер для статусной кнопки и названия товара
              const leftContainer = document.createElement("div");
              leftContainer.className = "flex items-center flex-grow";

              leftContainer.appendChild(statusButton);
              leftContainer.appendChild(label);

              row.appendChild(leftContainer);
              row.appendChild(controlsDiv);
              goodsContainer.appendChild(row);
            });
          } else {
            // Сообщение, если в категории нет товаров
            const noGoodsMsg = document.createElement("p");
            noGoodsMsg.textContent = "Немає товарів у цій категорії.";
            noGoodsMsg.className = "text-xs text-gray-500 italic";
            goodsContainer.appendChild(noGoodsMsg);
          }

          categoriesContainer.appendChild(categoryColumn);
        });

        // Добавляем контейнер для отображения общего веса в нижней части модального окна
        const totalWeightContainer = document.createElement("div");
        totalWeightContainer.className =
          "total-weight-container mt-3 pt-2 border-t text-right font-medium text-sm";
        totalWeightContainer.id = "total-weight";
        card.appendChild(totalWeightContainer);

        // Функция для расчета и обновления общего веса
        function updateTotalWeight(event) {
          let totalWeight = 0;

          // Создаем снимок текущего заказа перед обновлением, если его еще нет
          if (!task._tempOrderSnapshot) {
            task._tempOrderSnapshot = {};
            for (const goodName in goodsInputs) {
              const input = goodsInputs[goodName];
              task._tempOrderSnapshot[goodName] =
                parseInt(input.value, 10) || 0;
            }
          }

          // Если вызов произошел из обработчика события
          if (event && event.target && event.target.tagName === "INPUT") {
            const changedInput = event.target;
            const goodName = changedInput.id.replace("good-input-", "");
            const newQty = parseInt(changedInput.value, 10) || 0;
            const oldQty = task._tempOrderSnapshot[goodName] || 0;

            // Если количество изменилось, записываем в историю
            if (newQty !== oldQty) {
              // Инициализируем структуру для истории изменений, если её нет
              if (!task.orderChanges) {
                task.orderChanges = {};
              }

              if (!task.orderChanges[goodName]) {
                task.orderChanges[goodName] = [];
              }

              // Добавляем запись об изменении
              task.orderChanges[goodName].push({
                oldQty: oldQty,
                newQty: newQty,
                timestamp: Date.now(),
              });

              // Обновляем снимок для этого товара
              task._tempOrderSnapshot[goodName] = newQty;
            }
          }

          // Расчет общего веса
          for (const goodName in goodsInputs) {
            const input = goodsInputs[goodName];
            const quantity = parseInt(input.value, 10) || 0;
            const weight = parseFloat(input.dataset.weight) || 0;
            totalWeight += quantity * weight;
          }

          // Обновляем отображение общего веса
          const weightText =
            totalWeight > 0
              ? `Загальна вага: ${totalWeight.toFixed(2)} кг`
              : "Загальна вага: 0 кг";

          totalWeightContainer.textContent = weightText;
        }

        // Вызываем первичный расчет веса
        updateTotalWeight();

        // Перепозиционируем карточку после того, как контент загружен
        setTimeout(() => {
          const cardRect = card.getBoundingClientRect();
          const btnRect = clickedButtonEl.getBoundingClientRect();

          // Теперь карточка должна оставаться привязанной к кнопке "замовлення"
          // но при этом не выходить за пределы экрана
          cardLeft = btnRect.left; // Привязываем к левому краю кнопки
          cardTop = btnRect.bottom + 5; // Размещаем под кнопкой с отступом

          // Проверяем, не выходит ли за пределы экрана справа
          if (cardLeft + cardRect.width > window.innerWidth - 10) {
            // Если выходит, смещаем карточку влево настолько, чтобы она поместилась
            cardLeft = Math.max(10, window.innerWidth - cardRect.width - 10);
          }

          // Проверяем, не выходит ли за пределы экрана снизу
          if (cardTop + cardRect.height > window.innerHeight - 10) {
            // Если не помещается снизу, размещаем над кнопкой
            cardTop = Math.max(10, btnRect.top - cardRect.height - 5);

            // Если все еще не помещается, ограничиваем высоту и добавляем скролл
            if (cardTop < 10) {
              cardTop = 10;
              card.style.maxHeight = window.innerHeight - 20 + "px";
              card.style.overflowY = "auto";
            }
          }

          // Окончательная проверка, чтобы точно не выйти за границы экрана
          if (cardLeft < 10) cardLeft = 10;
          if (cardTop < 10) cardTop = 10;

          // Устанавливаем позицию
          card.style.left = `${cardLeft}px`;
          card.style.top = `${cardTop}px`;
        }, 0);

        // Контейнер для кнопок
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className =
          "flex justify-end space-x-3 pt-3 mt-2 border-t";

        // Кнопка "OK"
        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.className =
          "bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm";
        okButton.addEventListener("click", () => {
          // Собираем данные о заказе
          const newOrder = {};
          let totalOrderWeight = 0;

          for (const goodName in goodsInputs) {
            const input = goodsInputs[goodName];
            const quantity = parseInt(input.value, 10);
            const weight = parseFloat(input.dataset.weight) || 0;

            if (!isNaN(quantity) && quantity > 0) {
              newOrder[goodName] = quantity;
              totalOrderWeight += quantity * weight;
            }
          }

          // Сохраняем общий вес заказа
          task.totalWeight = totalOrderWeight;

          // Сохраняем веса товаров в отдельное свойство для использования в таблице складов
          if (!task.itemWeights) {
            task.itemWeights = {};
          }

          // Обновляем веса товаров
          for (const goodName in goodsInputs) {
            const input = goodsInputs[goodName];
            const weight = parseFloat(input.dataset.weight) || 0;
            if (weight > 0) {
              task.itemWeights[goodName] = weight;
            }
          }

          // Сохраняем снимок текущего состояния заказа до внесения изменений
          const snapshotForThisSave = JSON.parse(
            JSON.stringify(task.order || {})
          );

          // ВАЖНО: Перед первой записью зафиксируем начальное состояние, если оно еще не установлено
          if (
            !task.initialOrder ||
            Object.keys(task.initialOrder).length === 0
          ) {
            // Это первое редактирование заказа - сохраняем текущий новый заказ как начальное состояние
            // Это важное отличие от предыдущей логики: мы сохраняем именно новый заказ, а не текущий снимок
            task.initialOrder = JSON.parse(JSON.stringify(newOrder));
            console.log(
              "Установлен initialOrder из нового заказа:",
              task.initialOrder
            );
          } else {
            console.log("initialOrder уже существует:", task.initialOrder);
          }

          // Обновляем previousOrder для отслеживания изменений - это снимок состояния ДО текущих изменений
          task.previousOrder = snapshotForThisSave;

          // Определяем и сохраняем цвета для всех измененных товаров
          const allItemNames = new Set([
            ...Object.keys(newOrder || {}),
            ...Object.keys(task.initialOrder || {}),
          ]);

          // Обновляем цвета для всех товаров в заказе
          allItemNames.forEach((itemName) => {
            const currentQty = parseInt(newOrder[itemName] || 0, 10);
            const initialQty =
              task.initialOrder && task.initialOrder[itemName]
                ? parseInt(task.initialOrder[itemName], 10)
                : 0;

            // Определяем цвет на основе сравнения с начальным значением
            if (currentQty !== initialQty && currentQty > 0) {
              task.orderColors = task.orderColors || {};
              task.orderColors[itemName] =
                currentQty < initialQty ? "red" : "green";
            } else {
              // Если значение равно начальному или равно 0, удаляем информацию о цвете
              if (task.orderColors) {
                delete task.orderColors[itemName];
              }
            }
          });

          // Обновляем заказ новыми данными
          task.order = newOrder;

          console.log("Новый заказ перед сохранением:", task.order);
          console.log("Проверка task перед сохранением:", task);

          // Убедимся, что свойство orderStatusColors сохраняется
          console.log(
            "Сохраняем статусы цветов товаров:",
            task.orderStatusColors
          );

          // Выводим информацию об общем весе заказа
          console.log(
            `Общий вес заказа: ${
              task.totalWeight ? task.totalWeight.toFixed(2) : 0
            } кг`
          );

          // Сохраняем и обновляем отображение
          globalSaveTaskOrder(task, baseDiv, snapshotForThisSave);

          // Закрываем модальное окно
          closeModal();
        });

        // Кнопка "Отмена"
        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Скасувати";
        cancelButton.className =
          "bg-gray-300 text-black px-4 py-1.5 rounded hover:bg-gray-400 text-sm";
        cancelButton.addEventListener("click", closeModal);

        buttonsContainer.appendChild(cancelButton);
        buttonsContainer.appendChild(okButton);
        card.appendChild(buttonsContainer);
      })
      .catch((error) => {
        console.error("Error fetching or processing goods:", error);
        loadingIndicator.textContent = `Помилка завантаження товарів: ${error.message}. Спробуйте оновити сторінку.`;
        loadingIndicator.className += " text-red-600";

        const closeButtonError = document.createElement("button");
        closeButtonError.textContent = "Закрити";
        closeButtonError.className =
          "mt-4 bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400";
        closeButtonError.onclick = closeModal;

        if (loadingIndicator.parentNode === card) {
          card.appendChild(closeButtonError);
        } else {
          card.innerHTML = "";
          card.appendChild(loadingIndicator);
          card.appendChild(closeButtonError);
        }
      });
  }

  // -----------------------------------------------------------------------
  // 5⃣  Создание повторяющегося подвала календаря с датами (+ подсветка выходных)
  // -----------------------------------------------------------------------
  const footer = document.createElement("div");
  footer.className = "flex mt-1";
  calendar.appendChild(footer);

  days.forEach((d) => {
    const cell = document.createElement("div");
    cell.className = "border w-30 flex-shrink-0 text-xs text-center py-1";
    cell.style.width = `${COL_W}px`;
    cell.textContent = d.toLocaleDateString("uk-UA", {
      month: "short",
      day: "numeric",
    });

    // Подсветка выходных дней (субботы и воскресенья)
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 0 - воскресенье, 6 - суббота
      cell.classList.add("weekend-column");
    }

    footer.appendChild(cell);
  });
})();
