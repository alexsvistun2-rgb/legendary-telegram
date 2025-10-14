---
cssClass: dashboard
---

# 🏥 Health Dashboard

> [!summary] Быстрые ссылки
> - 📁 [Папка записей](70_Health/70.1_Records/).
> - 🏃 [Тренировки](70_Health/70.2_Fitness/).
> - 📓 [Шаблон Daily](90_System/91_Templates/Daily_Template.md).

## 🏃 Пробежки за последние 30 дней
```dataviewjs
(() => {
  const rows = dv.pages('"70_Health/70.2_Fitness/70.2.1_Runs"').where(p => p.date);
  const data = rows.array().filter(p => moment(p.date).isAfter(moment().subtract(30,'days')));
  if (!data.length) { dv.paragraph('Заполни заметки в папке **70.2.1_Runs** — здесь появится статистика.'); return; }
  const byDay = new Map();
  data.forEach(p => {
    const key = p.date;
    const km = Number(p.distance_km || 0);
    byDay.set(key, (byDay.get(key) || 0) + km);
  });
  const series = Array.from(byDay.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  const mount = dv.el('div','');
  mount.style.height = '260px';
  window.renderChart({
    type: 'bar',
    data: {
      labels: series.map(s => s[0]),
      datasets: [{ label: 'км', data: series.map(s => +s[1].toFixed(2)), backgroundColor: '#2980b9' }]
    },
    options: {
      scales: { y: { ticks: { callback: (value) => `${value} км` } } }
    }
  }, mount);
})();
```

## ⚕️ Последние анализы
```dataview
TABLE date as Дата, clinic as Клиника, scope as Область, file.link as Заметка
FROM "70_Health/70.1_Records"
SORT date desc
LIMIT 6
```

## 📊 Сводка нагрузок
```dataviewjs
(() => {
  const runs = dv.pages('"70_Health/70.2_Fitness/70.2.1_Runs"');
  if (!runs.length) { dv.paragraph('Добавь тренировки в папку 70.2.1_Runs.'); return; }
  let totalKm = 0, totalMin = 0, count = 0;
  runs.forEach(p => {
    totalKm += Number(p.distance_km || 0);
    totalMin += Number(p.duration_min || 0);
    count += 1;
  });
  const avgPace = totalKm ? totalMin / totalKm : 0;
  const grid = dv.el('div','');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px,1fr))';
  grid.style.gap = '12px';
  const cards = [
    ['Общее расстояние', `${totalKm.toFixed(1)} км`],
    ['Общее время', `${totalMin.toFixed(0)} мин`],
    ['Средний темп', totalKm ? `${(avgPace).toFixed(1)} мин/км` : '—'],
    ['Тренировок', `${count}`]
  ];
  cards.forEach(([label,value]) => {
    const el = document.createElement('div');
    el.style.border = '1px solid var(--background-modifier-border)';
    el.style.borderRadius = '12px';
    el.style.padding = '12px';
    el.style.display = 'grid';
    el.style.gap = '4px';
    const l = document.createElement('div'); l.textContent = label; l.style.color = 'var(--text-muted)'; l.style.fontSize = '0.85rem';
    const v = document.createElement('div'); v.textContent = value; v.style.fontWeight = '700'; v.style.fontSize = '1.2rem';
    el.append(l,v);
    grid.appendChild(el);
  });
})();
```
