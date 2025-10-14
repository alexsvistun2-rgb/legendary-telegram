---
cssClass: dashboard tasks
---

# ✅ GTD Board & Task Radar

> Доска CardBoard «GTD»: `📥 Inbox → 🎯 Next → 🔥 Срочно → 🤝 Делегировать → ⏳ В ожидании → 🧠 Проекты → ✅ Done`. Теги: `#t/triage`, `#t/todo`, `#t/urgent`, `#t/delegate`, `#t/waiting`, `#t/project`.

## 🎛️ Быстрый обзор
```dataviewjs
const tags = ['t/triage','t/todo','t/urgent','t/delegate','t/waiting','t/project'];
const rows = tags.map(tag => {
  const tasks = dv.tasks().where(t => !t.completed && t.tags && t.tags.includes(tag));
  return [tag, tasks.length];
});
dv.table(['Колонка/тег','Количество'], rows);
```

## 🗂 Карточки в работе
```tasks
not done
tags include #t/todo OR tags include #t/urgent OR tags include #t/project OR tags include #t/delegate OR tags include #t/waiting
limit 30
sort by due
```

## ✍️ Журнал входящих
```tasks
not done
tags include #t/triage
limit 15
sort by created reverse
```

## 🤝 Делегирование — контроль
```tasks
not done
tags include #t/delegate
sort by due
```

> [!tip] Как использовать доску
> - Открой команду **CardBoard: Open board** → выбери `GTD`.
> - Используй теги прямо в задаче, чтобы перемещать карточку.
> - Делегированные карточки (#t/delegate) автоматически сохраняются в `30_Areas/31_Tasks/31.2_Delegation` и подсвечиваются на доске.
> - Для задач без срока используй чек-лист «Следующие действия» на домашней странице.

> [!hint] Лайфхаки
> - Комбинируй `#t/project` с ссылкой на проект для быстрых переходов.
> - Тег `#t/waiting` держит карточки «ожидание/на паузе», они видны в таблице и на доске.
> - Готовые задачи автоматически попадают в «✅ Done» и архивируются авто-скриптом.
