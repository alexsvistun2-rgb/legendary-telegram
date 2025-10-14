---
cssClass: dashboard habits-dashboard
---

# 📈 Habit Studio — привычки и помодоро

> Ведите регулярные практики в папке **70_Life/74_Habits**. Логи хранятся в `74.1_Log`, шаблоны — в `74.2_Templates`. Помодоро-сессии автоматически подтягиваются из журнала (`15_Journal/15.2_Logbook`).

## 1. Обзор прогресса
```dataviewjs
(()=>{
  const wrap = dv.el('div','');
  wrap.className = 'habits-cards';

  const card = (title,value,hint)=>{
    const el = document.createElement('article');
    el.className = 'habits-card';
    el.innerHTML = `<header>${title}</header><strong>${value}</strong><span>${hint||''}</span>`;
    wrap.appendChild(el);
  };

  const trackers = dv.pages('"70_Life/74_Habits"').where(p => p.type === 'habit' || contains(p.tags ?? [], 'habit')).array();
  card('Активных трекеров', trackers.length, 'в папке Habit Studio');

  const logs = dv.pages('"70_Life/74_Habits/74.1_Log"').array();
  const today = moment().format('YYYY-MM-DD');
  const todayDone = logs.filter(p => String(p.date||'') === today).length;
  card('Отметок сегодня', todayDone, 'включая повторы');

  const currentWeek = moment().isoWeek();
  const weekDone = logs.filter(p => moment(p.date).isoWeek() === currentWeek).length;
  card('За неделю', weekDone, 'все выполненные привычки');

  const pomodoro = dv.pages('"15_Journal/15.2_Logbook"').file.tasks.where(t => !t.completed && /pomodoro/i.test(t.text)).length;
  card('Активных помодоро', pomodoro, 'запущенных таймеров');
})();
```

## 2. Статистика привычек
```dataviewjs
(()=>{
  const mount = dv.el('div','');
  mount.className = 'habits-grid';
  const logs = dv.pages('"70_Life/74_Habits/74.1_Log"').array();
  if(!logs.length){
    mount.innerHTML = '<p class="habits-empty">Пока нет отметок. Используйте шаблон "Habit Log".</p>';
    return;
  }
  const grouped = {};
  logs.forEach(p => {
    const habit = p.habit || p.title || p.file.name;
    if(!grouped[habit]) grouped[habit] = {count:0, dates:[]};
    grouped[habit].count += 1;
    if(p.date) grouped[habit].dates.push(moment(p.date).format('YYYY-MM-DD'));
  });

  const table = document.createElement('table');
  table.className = 'habits-table';
  table.innerHTML = `<thead><tr><th>Привычка</th><th>Отметок</th><th>Последняя дата</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  Object.entries(grouped).sort((a,b)=>b[1].count - a[1].count).forEach(([name, info]) => {
    const tr = document.createElement('tr');
    const last = info.dates.sort().at(-1) || '—';
    tr.innerHTML = `<td>${name}</td><td>${info.count}</td><td>${last}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  mount.appendChild(table);
})();
```

## 3. Помодоро-таймеры
```dataview
TABLE file.link AS "Запись", duration, context, status
FROM "15_Journal/15.2_Logbook"
WHERE contains(tags, "pomodoro")
SORT file.ctime DESC
LIMIT 15
```

> [!note] Таймеры
> Рекомендуемый плагин: **obsidian-pomodoro** (поддерживает тэгирование сессий и историю). После установки добавьте команду на панель быстрого доступа.

## 4. Шаблоны и быстрые кнопки
- [[70_Life/74_Habits/74.2_Templates/Habit_Template|Создать новый трекер]]
- [[70_Life/74_Habits/74.2_Templates/Habit_Log|Добавить отметку]]
- [[70_Life/74_Habits/74.2_Templates/Pomodoro_Session|Записать помодоро]]
```
