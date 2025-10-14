---
title: "Health Hub"
tags: [health, dashboard]
---

# 🩺 Health Hub

> Структура:
> - `71_Medical_Records` — заключения врачей, результаты обследований.
> - `72_Analyses` — лабораторные анализы, графики показателей.
> - `73_Treatments` — терапия, курсы, лекарства.
> - `74_Fitness` — тренировки (`74.1_Runs`, `74.2_Workouts`).
> - `75_Wellbeing` — сон, питание, ментальное здоровье.

## 📂 Быстрые ссылки
- [[70_Health/71_Medical_Records|📁 Медицинские записи]]
- [[70_Health/72_Analyses|🧪 Анализы]]
- [[70_Health/73_Treatments|💊 Лечение]]
- [[70_Health/74_Fitness|🏃 Тренировки и бег]]
- [[70_Health/75_Wellbeing|🧘 Благополучие]]

## 🔍 Последние обновления
```dataview
table file.link as "Документ", type, status, file.mtime as "Обновлено"
from "70_Health"
sort file.mtime desc
limit 12
```

## 📈 Метрики (пример)
```dataviewjs
const analyses = dv.pages('\"70_Health/72_Analyses\"');
const rows = analyses.map(p => [p.metric ?? p.title ?? p.file.name, p.value ?? '—', p.units ?? '', p.file.mtime]);
dv.table(['Показатель','Значение','Ед.','Обновлено'], rows.limit(10));
```

> Используй шаблоны `Health_Record.md`, `Workout_Log.md`, `Run_Log.md` из `90_System/93_Templates_Custom`.
