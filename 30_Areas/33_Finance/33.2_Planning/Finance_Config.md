---
title: "Finance Config"
savingsGoals:
  - name: "Подушка безопасности"
    description: "3-6 месяцев расходов"
    target: 450000
    targetDate: 2025-12-31
    match:
      field: "to"
      value: "Подушка"
    color: "#1abc9c"
  - name: "Отпуск"
    description: "Летний отпуск"
    target: 200000
    targetDate: 2025-07-01
    match:
      field: "to"
      value: "Отпуск"
    color: "#f39c12"
  - name: "Инвестиции"
    description: "Дополнительный портфель"
    target: 600000
    match:
      field: "category"
      value: "Инвестиции"
    color: "#2980b9"
---

> Используй этот файл как конфигурацию для финансовой панели.
>
> - `match.field` может быть `category`, `subcategory`, `to`, `from`, `account` или `tag` (ищет совпадение в тегах заметки).
> - `target` и `targetDate` помогают отследить прогресс накоплений и сроки.
> - Добавь сюда новые цели сбережений или дополнительные настройки аналитики.

```dataview
TABLE name as "Цель", target as "Цель ₽", targetDate as "Срок", description as "Описание"
FROM this.file
FLATTEN savingsGoals
WHERE savingsGoals
```
