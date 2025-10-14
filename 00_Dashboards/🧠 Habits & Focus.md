---
cssClass: dashboard habits
---

# 🧠 Habits & Focus Dashboard

> Отслеживай ежедневные привычки и помодоро-сессии. Логи лежат в `30_Areas/32_Habits/32.1_Log` (см. шаблон `Habit_Log.md`). Плагин `pomodoro-timer` добавлен в список — включи его в настройках для таймера в статус-баре.

## ✅ Статистика по привычкам
```dataviewjs
const logs = dv.pages('\"30_Areas/32_Habits/32.1_Log\"');
const summary = new Map();
const history = [];
logs.sort(p=>p.date ?? p.file.name, 'asc').forEach(log => {
  const date = log.date ? moment(log.date).format('YYYY-MM-DD') : moment(log.file.ctime).format('YYYY-MM-DD');
  const habits = Array.isArray(log.habits) ? log.habits : [];
  habits.forEach(item => {
    if (!item || !item.name) return;
    const key = item.name;
    if (!summary.has(key)) summary.set(key, { done:0, total:0 });
    const entry = summary.get(key);
    entry.total += 1;
    if (Number(item.value) === 1 || item.value === true || item.status === 'done') entry.done += 1;
    history.push({ habit:key, date, value: Number(item.value) === 1 || item.value === true || item.status === 'done' ? 1 : 0 });
  });
});
const rows = Array.from(summary.entries()).map(([name,data]) => {
  const rate = data.total ? Math.round(data.done / data.total * 100) : 0;
  return [name, `${data.done}/${data.total}`, `${rate}%`];
}).sort((a,b)=>b[2].localeCompare(a[2]));
if (!rows.length) {
  dv.paragraph('Логи пока пусты — создайте запись по шаблону Habit_Log.');
} else {
  dv.table(['Привычка','Выполнено','Успех'], rows);
}
```

## 📆 Последние 14 дней
```dataviewjs
const logs = dv.pages('\"30_Areas/32_Habits/32.1_Log\"').sort(p=>p.date ?? p.file.ctime, 'desc').limit(14);
const { fmt } = { fmt: (v)=>Number(v||0).toLocaleString('ru-RU',{minimumFractionDigits:0}) };
const rows = [];
logs.forEach(log => {
  const date = log.date ? moment(log.date).format('DD.MM') : moment(log.file.ctime).format('DD.MM');
  const habits = Array.isArray(log.habits) ? log.habits : [];
  const done = habits.filter(h => Number(h.value) === 1 || h.value === true || h.status === 'done').length;
  rows.push([date, `${done}/${habits.length || 0}`, log.mood ?? '—']);
});
if (rows.length) dv.table(['Дата','Привычки','Настроение'], rows);
```

## ⏱️ Помодоро (из логов)
```dataviewjs
const logs = dv.pages('\"30_Areas/32_Habits/32.1_Log\"');
const pomodoro = [];
logs.forEach(log => {
  const date = log.date ? moment(log.date).format('YYYY-MM-DD') : moment(log.file.ctime).format('YYYY-MM-DD');
  const entries = Array.isArray(log.pomodoro) ? log.pomodoro : [];
  entries.forEach(item => {
    pomodoro.push({ project: item.project || 'Focus', minutes: Number(item.minutes || 0), date });
  });
});
if (!pomodoro.length) {
  dv.paragraph('Добавляйте блок `pomodoro:` в логи, чтобы видеть статистику.');
} else {
  const total = pomodoro.reduce((acc,x)=>acc+x.minutes,0);
  const byProject = {};
  pomodoro.forEach(p => { byProject[p.project] = (byProject[p.project] || 0) + p.minutes; });
  const rows = Object.entries(byProject).map(([name,mins]) => [name, `${mins} мин.`]).sort((a,b)=>b[1].localeCompare(a[1]));
  dv.table(['Проект','Время'], rows);
  dv.paragraph(`Всего помодоро минут: **${total}**`);
}
```

> [!tip] Настрой помодоро-плагин
> - После включения `pomodoro-timer` выбери длительность сессии и перерывов в настройках плагина.
> - Каждая законченная сессия записывается в статус-бар; по окончании добавляй строку в лог с проектом и временем.
> - Для визуализации можно подключить `heatmap-calendar` — добавь в лог поле `calendar: value` и используйте виджет плагина.

> [!hint] Структура записи (см. шаблон `Habit_Log.md`)
> ```yaml
> ---
> date: 2025-02-14
> habits:
>   - name: Медитация
>     value: 1
>   - name: Чтение
>     value: 0
> mood: energised
> pomodoro:
>   - project: Deep Work
>     minutes: 50
> ---
> ```
