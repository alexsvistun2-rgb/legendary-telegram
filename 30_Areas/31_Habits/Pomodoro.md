---
cssClass: note-habit
tracker_table: pomodoro-log
---

# ⏳ Pomodoro — учёт сессий

> [!info] Настрой плагин **Obsidian Pomodoro**:
> 1. В параметрах включи логирование в файл и укажи путь `30_Areas/31_Habits/Pomodoro.md`.
> 2. Формат записи: `YYYY-MM-DD HH:mm | duration` — плагин добавляет строки автоматически.
> 3. После каждой сессии данные попадают в таблицу `pomodoro-log`, а дашборд «Habits» построит сводные графики.

<!-- tracker:pomodoro-log -->
| Дата | Минуты | Тип | Комментарий |
| --- | --- | --- | --- |

```tracker
searchType: table
tableId: pomodoro-log
line:
  title: Pomodoro (минуты)
  dataset: Минуты
summary:
  - type: sum
    label: Всего минут
    column: Минуты
  - type: count
    label: Сессий
    column: Минуты
```
