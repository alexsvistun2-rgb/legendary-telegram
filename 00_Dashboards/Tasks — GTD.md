---
cssClass: dashboard
---

# 🗂 GTD — оперативные задачи

> [!summary] О доске
> - Управление тегами: `#t/triage` (разобрать), `#t/todo`, `#t/urgent`, `#t/delegate`, `#t/project`.
> - Все заметки создаются шаблоном «⚡ Быстрая задача» и автоматически попадают в папку **11_Journal/11.1_Tasks**.
> - Колонка **Done** заполняется автоматически по завершённым задачам.

```cardboard
board: GTD
```

## 🔍 Быстрые фильтры
> [!multi-column|3]
>
>> [!info] Просрочено / сегодня
>> ```tasks
>> not done
>> (due before today) OR (due today)
>> path includes "11_Journal/11.1_Tasks"
>> sort by due
>> ```
>
>> [!info] Делегировано
>> ```tasks
>> not done
>> tags include #t/delegate
>> path includes "11_Journal/11.1_Tasks"
>> sort by due
>> ```
>
>> [!info] Завершено (последние 10)
>> ```tasks
>> done
>> path includes "11_Journal/11.1_Tasks"
>> sort by done desc
>> limit 10
>> ```

## 📝 Напоминания
- Используй теги `#t/urgent` для срочных задач — они автоматически подсветятся в столбце «Срочные».
- Добавляй дату в шаблоне, чтобы задача попала в соответствующую колонку CardBoard.
- Для проектов используй тег `#t/project` и связывай заметку проекта (см. колонку «Проекты»).
