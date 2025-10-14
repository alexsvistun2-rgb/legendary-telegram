---
cssClass: dashboard
---

# 🧭 Привычки и регулярные действия

> [!summary] Как пользоваться
> 1. Создавай заметки через шаблон «📊 Привычка» — они автоматически попадут в папку **30_Areas/31_Habits**.
> 2. Заполняй таблицу `habit-log` внутри заметки. Плагин **Tracker** считает графики и суммирует прогресс.
> 3. Используй фильтры ниже, чтобы анализировать динамику.

## 📋 Реестр привычек
```dataview
TABLE frequency as Частота, metric as Тип, target as Цель, tracker_start as Старт, file.link as Заметка
FROM "30_Areas/31_Habits"
SORT tracker_start desc
```

## 📈 Общий график (минуты/выполнения)
```tracker
searchType: table
tableId: habit-log
line:
  title: Динамика
  dataset: Значение
summary:
  - type: sum
    label: Сумма
    column: Значение
  - type: count
    label: Выполнено (да/нет)
    column: Выполнено
```

## 🔥 Стreaks (heatmap)
```tracker
searchType: table
tableId: habit-log
heatmap:
  title: Календарь привычек
  dataset: Выполнено
  view: year
```

## 🧠 Подсказки
- Если привычка бинарная (да/нет), оставляй в графе «Выполнено» `1` или `0`.
- Для количественных привычек заполняй столбец «Значение» (минуты, километры, повторения).
- Можно завести отдельные заметки на «утро», «вечер», «спорт» и так далее — таблица выше покажет все активные трекеры.
