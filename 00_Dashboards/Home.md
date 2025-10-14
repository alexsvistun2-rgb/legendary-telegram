---
cssClass: dashboard home-dashboard
---

# 🏠 Домашняя панель управления

> Быстрый обзор ключевых зон: входящие, задачи, финансы, привычки, здоровье и медиатека. Все блоки собирают данные автоматически.

## 1. Входящие и незаконченные задачи
> [!multi-column]
>
>> [!tip] Входящие заметки
>> ```dataview
>> LIST FROM "10_Incoming"
>> WHERE !contains(file.folder, "Templates")
>> SORT file.ctime DESC
>> LIMIT 6
>> ```
>
>> [!warning] Срочные задачи (теги #t/urgent)
>> ```dataview
>> TASK FROM "15_Journal/15.1_Tasks"
>> WHERE !completed AND contains(tags, "t/urgent")
>> SORT due ASC
>> ```
>
>> [!info] Делегировано и ожидание
>> ```dataview
>> TASK FROM "15_Journal/15.1_Tasks"
>> WHERE !completed AND contains(tags, "t/delegate")
>> SORT file.mtime DESC
>> LIMIT 8
>> ```

## 2. Быстрые метрики
```dataviewjs
(()=>{
  const wrap = dv.el('div','');
  wrap.className = 'home-cards';

  const card = (title, value, hint, tone) => {
    const el = document.createElement('article');
    el.className = `home-card home-card--${tone}`;
    el.innerHTML = `<header>${title}</header><strong>${value}</strong><span>${hint||''}</span>`;
    wrap.appendChild(el);
  };

  const tasks = dv.pages('"15_Journal/15.1_Tasks"').file.tasks.where(t => !t.completed);
  card('Активные задачи', tasks.length || 0, 'в работе', 'tasks');

  const financeRange = window.financeCurrentRange ? window.financeCurrentRange() : null;
  if(financeRange){
    card('Период отчёта', `${financeRange.from} → ${financeRange.to}`, 'финансовая доска', 'finance');
  }

  const today = moment().format('YYYY-MM-DD');
  const habitsToday = dv.pages('"70_Life/74_Habits/74.1_Log"').where(p => p.date && String(p.date) === today);
  card('Записи привычек', habitsToday.length || 0, 'за сегодня', 'habit');

  const healthDocs = dv.pages('"70_Life/71_Health"').length;
  card('Медицинские записи', healthDocs || 0, 'анализы и приёмы', 'health');

  const media = dv.pages('"40_Resources/42_MediaHub"').length;
  card('Медиа-коллекция', media || 0, 'музыка · кино · сериалы', 'media');
})();
```

## 3. Финансовый срез
```dataviewjs
(async ()=>{
  const root = dv.el('div','');
  root.className = 'home-finance';
  if(!window.financeRows){
    root.innerHTML = '<p>Откройте финансовую доску, чтобы инициализировать расчёты.</p>';
    return;
  }
  const rows = await window.financeRows();
  if(!rows.length){
    root.innerHTML = '<p>Нет операций в текущем диапазоне.</p>';
    return;
  }
  const totals = {income:0, expense:0};
  rows.forEach(r => {
    const type = r[1] || '';
    const amount = Number(String(r[2]||'').replace(/\s+/g,'').replace(',','.')) || 0;
    if(/income|refund|invest_sell|divint/.test(type)) totals.income += Math.abs(amount);
    else if(/expense|tax|fee|invest_buy|sinking/.test(type)) totals.expense += Math.abs(amount);
  });
  const nf = new Intl.NumberFormat('ru-RU', {maximumFractionDigits:0});
  root.innerHTML = `
    <div class="home-finance__grid">
      <div>
        <h3>Доходы</h3>
        <strong>${nf.format(totals.income)} ₽</strong>
      </div>
      <div>
        <h3>Расходы</h3>
        <strong>${nf.format(totals.expense)} ₽</strong>
      </div>
      <div>
        <h3>Кэш-флоу</h3>
        <strong>${nf.format(totals.income - totals.expense)} ₽</strong>
      </div>
    </div>`;
})();
```

## 4. Привычки и ритуалы
> [!multi-column]
>
>> [!success] Активные трекеры (папка 70_Life/74_Habits)
>> ```dataview
>> TABLE WITHOUT ID file.link AS "Трекер", status, target
>> FROM "70_Life/74_Habits"
>> WHERE (type = "habit" OR contains(tags, "habit")) AND !contains(file.path, "74.2_Templates")
>> SORT file.mtime DESC
>> LIMIT 10
>> ```
>
>> [!question] Последние отметки
>> ```dataview
>> LIST FROM "70_Life/74_Habits/74.1_Log"
>> SORT file.ctime DESC
>> LIMIT 6
>> ```
>
>> [!example] Помодоро-сессии (по тегу #pomodoro)
>> ```dataview
>> TABLE file.link AS "Сессия", duration, context
>> FROM "15_Journal/15.2_Logbook"
>> WHERE contains(tags, "pomodoro")
>> SORT file.ctime DESC
>> LIMIT 6
>> ```

## 5. Здоровье и документы
```dataview
TABLE WITHOUT ID file.link AS "Документ", type, date, status
FROM "70_Life/71_Health"
SORT date DESC
LIMIT 12
```

```dataview
TABLE WITHOUT ID file.link AS "Файл", description
FROM "70_Life/73_Documents"
SORT file.mtime DESC
LIMIT 8
```

## 6. Медиа и знания
> [!multi-column]
>
>> [!music] Плейлисты
>> ```dataview
>> LIST FROM "40_Resources/42_MediaHub/42.4_Playlists"
>> SORT file.mtime DESC
>> LIMIT 5
>> ```
>
>> [!play] Фильмы / сериалы в очереди
>> ```dataview
>> TABLE file.link AS "Название", status, rating
>> FROM "40_Resources/42_MediaHub/42.2_Films" OR "40_Resources/42_MediaHub/42.3_Series"
>> WHERE status != "Просмотрено"
>> SORT file.mtime DESC
>> LIMIT 6
>> ```
>
>> [!quote] Новые заметки знаний
>> ```dataview
>> LIST FROM "50_Knowledge"
>> WHERE file.mtime >= date(today) - dur(7 days)
>> SORT file.mtime DESC
>> LIMIT 8
>> ```

## 7. Быстрые действия
- [[90_System/91_Templates/Daily_Template|🪄 Открыть мастер шаблон]]
- [[00_Dashboards/💼 Finance — Единая доска (фильтр → графики → таблица)|📊 Финансовая доска]]
- [[00_Dashboards/Habit_Studio|📈 Студия привычек]]
- [[00_Dashboards/Media_Hub|🎧 Медиа-хаб]]
- [[00_Dashboards/Health_HQ|🩺 Центр здоровья]]
```
