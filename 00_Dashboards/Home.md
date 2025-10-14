---
cssClass: dashboard
---

# 🏠 Home Hub

> Быстрый обзор по задачам, финансам, привычкам и ключевым зонам. Обновляется автоматически благодаря Dataview, Tasks и CardBoard.

## 🔔 Фокус дня
> [!multi-column]
>
>> [!todo] Срочные задачи (до сегодня)
>> ```tasks
>> not done
>> (due before today) OR (due today)
>> sort by due
>> ```
>
>> [!tip] Активные проекты
>> ```dataview
>> TABLE file.link as "Проект", status
>> FROM "20_Projects"
>> WHERE status != "done" OR !status
>> SORT file.mtime desc
>> LIMIT 6
>> ```

## 🗂 Канбан (CardBoard GTD)
> Открой доску **GTD** в CardBoard: Разобрать · To Do · Срочные · Делегировать · Проекты · Done. Для нового нео-глассморфного оформления включи сниппеты `card-board-elevated` и `dashboard-widgets`.

## 📅 Журнал & привычки
> [!multi-column]
>
>> [!info] Последние дневники
>> ```dataview
>> LIST FROM "20_Journal/21_Daily"
>> SORT file.ctime desc
>> LIMIT 5
>> ```
>
>> [!success] Привычки (7 дней)
>> ```dataviewjs
>> const logs = dv.pages("30_Areas/35_Habits/35.1_Log").array();
>> const now = moment();
>> const week = logs.filter(p => now.diff(moment(p.date ?? p.file.ctime), 'days') <= 7);
>> const grouped = {};
>> week.forEach(p => {
>>   const key = p.habit ?? (p.tags && p.tags[0]) ?? 'Habit';
>>   grouped[key] = (grouped[key] || 0) + Number(p.count ?? 1);
>> });
>> if(Object.keys(grouped).length === 0){ dv.paragraph('Добавь записи в Habits Dashboard.'); }
>> else {
>>   dv.ul(Object.entries(grouped).map(([name,total]) => `${name}: **${total}**`));
>> }
>> ```

## 💰 Финансы (текущий диапазон)
> Выбор периода находится на доске «💼 Finance — Единая доска». Ниже — мини-обзор.

```dataviewjs
(async function(){
  if(!window.financeRows){ return dv.paragraph('Открой финансовую доску для инициализации данных.'); }
  const mount = dv.el('div','');
  mount.className = 'finance-home-cards';
  const rows = await window.financeRows();
  const IN = /^(income|refund|dividend|invest_sell)$/;
  let inc = 0, exp = 0;
  rows.forEach(r => {
    const amt = Math.abs(Number((r[2] || '0').toString().replace(',','.')));
    if(IN.test(r[1])) inc += amt; else exp += amt;
  });
  const net = inc - exp;
  const items = [
    { label: 'Доходы', value: inc, accent: '#2ecc71' },
    { label: 'Расходы', value: exp, accent: '#e74c3c' },
    { label: 'Net', value: net, accent: net >= 0 ? '#3498db' : '#e67e22' }
  ];
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'finance-card';
    card.style.setProperty('--accent', item.accent);
    card.innerHTML = `<span>${item.label}</span><strong>${item.value.toLocaleString('ru-RU', {minimumFractionDigits:2, maximumFractionDigits:2})} ₽</strong>`;
    mount.append(card);
  });
})();
```

## 📘 Knowledge & Library
> [!multi-column]
>
>> [!quote] Недавние заметки знаний
>> ```dataview
>> LIST FROM "40_Resources/41_ZK"
>> SORT file.mtime desc
>> LIMIT 5
>> ```
>
>> [!summary] Новые книги
>> ```dataview
>> TABLE file.link as "Книга", status, rating
>> FROM "40_Resources/42_Library"
>> WHERE type = "book"
>> SORT file.ctime desc
>> LIMIT 5
>> ```

## 🩺 Здоровье
```dataview
TABLE file.link as "Документ", dateformat(file.ctime, "dd.MM") as "Дата", doctor
FROM "30_Areas/34_Health/34.1_Records"
WHERE doctor OR type
SORT file.ctime desc
LIMIT 6
```

## 🎧 Медиа & развлечения
```dataview
TABLE file.link as "Название", type, rating
FROM "40_Resources/43_Media"
WHERE type
SORT file.mtime desc
LIMIT 6
```

## 📂 Входящие
```dataview
LIST FROM "10_Incoming"
SORT file.ctime desc
LIMIT 10
```

## 🔗 Навигация
- [[00_Dashboards/Habits_Dashboard|🌿 Habits Dashboard]]
- [[00_Dashboards/Health_Dashboard|🩺 Health Dashboard]]
- [[00_Dashboards/💼 Finance — Единая доска (фильтр → графики → таблица)|💼 Finance Board]]
- [[00_Dashboards/Media_Dashboard|🎶 Media Dashboard]]
- [[30_Areas/34_Health/Health_Hub|🩺 Health Hub]]
- [[40_Resources/43_Media/Media_Hub|🎬 Media Hub]]
- [[40_Resources/42_Library/Library_Hub|📚 Library Hub]]
- [[50_Personal/51_Documents/Documents_Hub|🗂 Documents Hub]]

---

**Советы:**
- Для Pomodoro установи плагин [Focus Timer](https://obsidian.md/plugins?id=focus-timer) или [Pomodoro Scheduler].
- Для прогресса чтения подключи плагин [Tracker] и используй привычки.
- Следи за сниппетами CSS в `Settings → Appearance → CSS snippets`.
