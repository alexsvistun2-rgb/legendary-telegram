---
tags: [dashboard]
cssClass: dashboard home
---

# 🏠 Command Center

> Единая домашняя страница: слева — задачи и фокус, справа — финансы и привычки, ниже — ключевые области. Всё подтягивается автоматически по папкам.

> [!multi-column]
> > [!info] Быстрые действия
> > - [[30_Areas/31_Tasks/31.1_Journal|📌 Журнал задач]] — drag & drop на доске CardBoard.
> > - [[60_Finance/61_Journal|💸 Финансовый журнал]] — для ручной корректировки или импорта.
> > - [[50_Knowledge/51_ZK/51.2_Permanent/Core|🧠 Хранилище знаний]] и [[40_Resources/42_Media|🎬 Медиа-библиотека]].
> > - Смотри шаблоны в `90_System/91_Templates` и новые пресеты в `90_System/93_Templates_Custom`.
>
> > [!tip] Карта системы
> > - CardBoard: **GTD** — настроенные колонки Inbox → Done.
> > - Финансы: `💼 Finance — Единая доска` — фильтр + графики + таблица.
> > - Привычки: `🧠 Habits & Focus` — чек-ин привычек и помодоро.

## ✅ Фокус на сегодня
```tasks
tags include #type/task
not done
(due before tomorrow)
limit 12
sort by due
```

## 📅 Подготовка к неделе
```tasks
tags include #type/task
not done
(due after tomorrow)
due before in 1 week
sort by due
limit 12
```

## 💡 Следующие действия (без срока)
```tasks
tags include #t/todo
not done
no due date
limit 8
sort by priority
default sort by scheduled reverse
default sort by created
```

## 💰 Финансовые показатели (текущий месяц)
```dataviewjs
const month = moment().format('YYYY-MM');
const pages = dv.pages('\"60_Finance/61_Journal\"');
let income = 0, expense = 0, savings = 0, investment = 0;
const amountFrom = (page) => Number(page.amount ?? 0);
for (const page of pages){
  const fileMonth = moment(page.file.mtime).format('YYYY-MM');
  if (fileMonth !== month) continue;
  const type = (page.type || '').toString();
  const amount = amountFrom(page);
  if (['income','refund','dividend','divint','invest_sell'].includes(type)) income += amount;
  else if (['expense','purchase','tax','fee'].includes(type)) expense += amount;
  else if (['savings','sinking'].includes(type)) savings += amount;
  else if (['invest_buy','invest_sell','dividend','divint'].includes(type)) investment += (type === 'invest_buy' ? -amount : amount);
}
const fmt = (num) => Number(num||0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
dv.table(['Показатель','₽'], [
  ['Доходы', fmt(income)],
  ['Расходы', fmt(expense)],
  ['Чистый поток', fmt(income - expense)],
  ['Сбережения', fmt(savings)],
  ['Инвестиции (нетто)', fmt(investment)]
]);
```

## 🧭 Мониторинг привычек
- См. [[00_Dashboards/🧠 Habits & Focus|🧠 Habits & Focus]] для тепловых карт, чек-листов и помодоро.
- Логи привычек сохраняются в `30_Areas/32_Habits/32.1_Log`.

## 🩺 Здоровье
```dataview
table file.link as "Документ", type, status, file.mtime as "Обновлено"
from "70_Health"
sort file.mtime desc
limit 8
```

## 📚 Знания
```dataview
table file.link as "Заметка", category as "Категория", file.mtime as "Обновлено"
from "50_Knowledge/51_ZK"
sort file.mtime desc
limit 10
```

## 🎧 Медиа / Чтение
```dataview
table file.link as "Файл", rating as "Оценка", status, file.mtime as "Обновлено"
from "40_Resources/42_Media"
sort file.mtime desc
limit 8
```

---

### 📎 Инбокс & журналы
- [[10_Incoming|📥 Incoming]] — заметки, созданные вне шаблонов, ждут обработки.
- [[20_Journal/21_Daily|🗓️ Daily Journal]] — для записей/рефлексии, авто-сортировка с помощью Auto Rename.
- [[30_Areas/31_Tasks/31.1_Journal|📔 Task Journal]] — архив карточек задач.

> [!hint] Используй Auto Note Mover: новые теги `#type/task`, `#note/*`, `#media/*` и `#lib/*` уже настроены для маршрутизации по папкам.
