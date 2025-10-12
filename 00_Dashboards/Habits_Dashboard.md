---
cssClass: dashboard
---

# 🌿 Habits & Routines Dashboard

> Центр отслеживания привычек и регулярных действий. Работает в связке с папками `30_Areas/35_Habits` и плагинами **Tracker**, **Heatmap Calendar**, **Meta Bind**.

## ⚙️ Как использовать
1. Создавай определения привычек в `30_Areas/35_Habits/35.2_Definitions` (см. шаблон).
2. Логируй выполнения в `30_Areas/35_Habits/35.1_Log` — по одной заметке на день или на событие.
3. Для трекинга помодоро используй плагин **"Focus Timer"** (рекомендуемый) или **"Obsidian Pomodoro"** и сохраняй логи в той же папке с тегом `#habit/pomodoro`.

## 📊 Статус привычек (30 дней)
```dataviewjs
const PAGE_FOLDER = "30_Areas/35_Habits/35.1_Log";
const defs = dv.pages("30_Areas/35_Habits/35.2_Definitions").where(p => p.habit).array();
const logs = dv.pages(PAGE_FOLDER).array();
const today = moment();
const from = today.clone().subtract(29,'days').startOf('day');

function normalize(val){
  if(Array.isArray(val)) return val.map(String);
  if(typeof val === 'string') return [val];
  return [];
}

const summary = defs.map(def => {
  const keys = normalize(def.keys ?? def.tag ?? def.habit);
  const entries = logs.filter(log => {
    const tags = normalize(log.tags ?? log.tag ?? []);
    const date = moment(log.date ?? log.file.ctime);
    if(date.isBefore(from) || date.isAfter(today)) return false;
    return keys.some(k => tags.includes(k) || (log.habit && String(log.habit) === k));
  });
  const total = entries.length;
  const target = Number(def.targetPerWeek ?? def.target ?? 0);
  const compliance = target ? Math.min(100, Math.round(total / (target * 4) * 100)) : Math.min(100, total * 10);
  return { name: def.habit ?? def.file.name, total, compliance, color: def.color ?? '#27ae60' };
});

const mount = dv.el('div','');
mount.className = 'habit-status-grid';
summary.forEach(item => {
  const card = document.createElement('div');
  card.className = 'habit-status-card';
  const bar = document.createElement('div');
  bar.className = 'habit-progress';
  bar.style.setProperty('--habit-color', item.color);
  bar.style.width = item.compliance + '%';
  card.innerHTML = `<header>${item.name}</header><div class="habit-progress-bg"></div><strong>${item.total} выполнений</strong>`;
  card.querySelector('.habit-progress-bg').append(bar);
  mount.append(card);
});
```

## 🔥 Ежедневная тепловая карта
```heatmap-calendar
style: "width:100%;"
dateFormat: "YYYY-MM-DD"
startWeekOnMonday: true
folder: "30_Areas/35_Habits/35.1_Log"
valueField: "count"
```

## ⏱ Pomodoro & Focus
```dataviewjs
const logs = dv.pages("30_Areas/35_Habits/35.1_Log").array();
const pomodoros = logs.filter(p => String(p.habit || '').toLowerCase().includes('pomodoro') || (p.tags ?? []).includes("habit/pomodoro"));
const total = pomodoros.reduce((acc,p)=> acc + Number(p.pomodoros ?? p.count ?? 0), 0);
const minutes = pomodoros.reduce((acc,p)=> acc + Number(p.minutes ?? 25 * Number(p.pomodoros ?? 0)), 0);
dv.paragraph(`**${total}** помодоро · **${minutes}** минут сфокусированной работы.`);
```

## 📈 Динамика привычек (Chart.js)
```dataviewjs
(async function(){
  if (window.financeBootstrap) {
    await window.financeBootstrap();
  }
  if(!window.Chart){
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    await new Promise((res,rej)=>{script.onload=res;script.onerror=rej;document.head.appendChild(script);});
  }
  const logs = dv.pages('30_Areas/35_Habits/35.1_Log').array();
  const grouped = {};
  logs.forEach(p => {
    const date = moment(p.date ?? p.file.ctime).format('YYYY-MM-DD');
    const key = (p.habit ?? (p.tags && p.tags[0]) ?? 'Habit');
    if(!grouped[key]) grouped[key]={};
    grouped[key][date]=(grouped[key][date]||0)+Number(p.count ?? 1);
  });
  const dates = Array.from(new Set(Object.values(grouped).flatMap(obj => Object.keys(obj)))).sort();
  const datasets = Object.entries(grouped).map(([name,values],idx)=>({
    label:name,
    data:dates.map(d=>values[d]||0),
    borderWidth:2,
    tension:.4,
    fill:false,
    borderColor:`hsl(${(idx*57)%360},70%,55%)`,
    backgroundColor:`hsl(${(idx*57)%360},70%,75%)`
  }));
  const mount = dv.el('div','');
  mount.style.height='320px';
  new Chart(mount, { type:'line', data:{ labels:dates, datasets }, options:{ plugins:{ legend:{ position:'bottom' }}}});
})();
```

## 🧭 Список привычек
```dataview
TABLE habit as "Привычка", why as "Зачем", trigger as "Триггер", reward as "Награда"
FROM "30_Areas/35_Habits/35.2_Definitions"
WHERE habit
SORT habit asc
```
