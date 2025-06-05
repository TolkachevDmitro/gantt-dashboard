// filepath: c:\Users\tolka\OneDrive\Рабочий стол\gantt_dashboard_footer_sunday\gantt_dashboard\static\script-fixed-order-logging.js
// Этот скрипт добавляет функциональность логирования изменений заказа

// Дожидаемся загрузки основного скрипта и замещаем функцию
document.addEventListener("DOMContentLoaded", function () {
  // Ожидаем загрузку основного скрипта и создание глобальных функций
  setTimeout(function () {
    console.log("Инициализация скрипта логирования изменений заказа...");

    // Создаем функцию для логирования изменений товаров в заказе
    window.logOrderChanges = function (task, oldOrder, newOrder) {
      if (!task || !task.id) {
        console.error("Невозможно логировать изменения - нет данных задачи");
        return;
      }

      // Получаем множество всех товаров из обоих состояний
      let allItemNames = new Set([
        ...Object.keys(oldOrder || {}),
        ...Object.keys(newOrder || {}),
      ]);

      // Проверяем каждый товар на изменение количества
      allItemNames.forEach((itemName) => {
        const oldQty = parseInt(oldOrder[itemName] || 0, 10);
        const newQty = parseInt(newOrder[itemName] || 0, 10);

        // Если количество изменилось, записываем в историю
        if (oldQty !== newQty) {
          // Инициализируем структуру для истории изменений, если её нет
          if (!task.orderChanges) {
            task.orderChanges = {};
          }

          if (!task.orderChanges[itemName]) {
            task.orderChanges[itemName] = [];
          }

          // Добавляем запись об изменении
          task.orderChanges[itemName].push({
            oldQty: oldQty,
            newQty: newQty,
            timestamp: Date.now(),
          });

          console.log(
            `Логирование изменения товара ${itemName}: ${oldQty} -> ${newQty}`
          );

          // Вызываем функцию логирования для отображения в интерфейсе, если она существует
          if (typeof logEvent === "function") {
            logEvent({
              type: "edit",
              rectangleId: task.id,
              productName: itemName,
              oldValue: oldQty,
              newValue: newQty,
              comment: "Изменение товара в заказе",
            });
          }
        }
      });
    };

    // Заменяем функцию сохранения заказа, чтобы добавить логирование
    const originalSaveTaskOrder = window.globalSaveTaskOrder;
    if (typeof originalSaveTaskOrder === "function") {
      window.globalSaveTaskOrder = function (
        taskData,
        baseDiv,
        comparisonSnapshot
      ) {
        // Логируем изменения перед сохранением, если есть снимок для сравнения
        if (comparisonSnapshot && taskData && taskData.order) {
          window.logOrderChanges(taskData, comparisonSnapshot, taskData.order);
        }

        // Вызываем оригинальную функцию сохранения
        return originalSaveTaskOrder(taskData, baseDiv, comparisonSnapshot);
      };

      console.log("Функция логирования изменений заказа успешно интегрирована");
    } else {
      console.error("Не удалось найти функцию globalSaveTaskOrder для замены");
    }
  }, 500); // Небольшая задержка для уверенности в загрузке основного скрипта
});
