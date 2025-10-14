---
tags:
  - dashboard
cssClass: dashboard
---

# 🏠 Home — обзор мультипланера

> [!summary] Навигация
> - 🗂 [GTD-доска](Tasks — GTD.md) — оперативные задачи и делегирование.
> - 💼 [Finance Dashboard](💼 Finance — Единая доска (фильтр → графики → таблица).md) — полный финансовый отчёт.
> - 🧭 [Habits](Habits.md) — трекеры привычек.
> - 📚 [Knowledge Hub](Knowledge_Home.md) — база знаний.

## 🔥 Срочные задачи
```tasks
not done
(due before today) OR (due today)
path includes "11_Journal/11.1_Tasks"
sort by due
limit 10
```

## 📈 Финансовая сводка (текущий диапазон)
```dataviewjs
(async () => {
  const wrap = dv.el('div','');
  wrap.style.display = 'grid';
  wrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px,1fr))';
  wrap.style.gap = '12px';
  try {
    const metrics = await window.financeMetrics();
    const fmt = window.financeFormat;
    const palette = window.financePalette;
    const cards = [
      { label: 'Доходы', value: fmt.money(metrics.totals.income,0), color: palette.positive },
      { label: 'Расходы', value: fmt.money(metrics.totals.expense,0), color: palette.negative },
      { label: 'Чистый результат', value: fmt.money(metrics.totals.net,0), color: metrics.totals.net >=0 ? palette.positive : palette.negative },
      { label: 'Операций', value: metrics.counts.total.toString(), color: palette.muted }
    ];
    cards.forEach(card => {
      const el = document.createElement('div');
      el.style.border = '1px solid var(--background-modifier-border)';
      el.style.borderRadius = '12px';
      el.style.padding = '12px';
      el.style.display = 'grid';
      el.style.gap = '4px';
      const label = document.createElement('div'); label.textContent = card.label; label.style.color = 'var(--text-muted)'; label.style.fontSize = '0.85rem';
      const value = document.createElement('div'); value.textContent = card.value; value.style.fontWeight = '700'; value.style.fontSize = '1.2rem'; value.style.color = card.color;
      el.append(label, value);
      wrap.appendChild(el);
    });
  } catch(err) {
    wrap.textContent = 'Открой финансовую доску один раз, чтобы инициализировать данные.';
  }
})();
```

## 🧭 Активные привычки
```dataview
TABLE frequency as Частота, metric as Тип, tracker_start as Старт, file.link as Заметка
FROM "30_Areas/31_Habits"
SORT tracker_start desc
LIMIT 6
```

## 🧠 Последние заметки знаний
```dataview
LIST FROM "50_Knowledge"
SORT file.mtime desc
LIMIT 6
```
