---
title: "Health Hub"
tags: [area/health]
---

# 🩺 Health Hub

> Центральное место для здоровья: анализы, приёмы врачей, диагностика, тренировки и беговые сессии.

## 📂 Структура папок
- **34.1_Records** — официальные документы
  - `Analyses` — результаты анализов и лабораторных исследований
  - `Diagnostics` — снимки, обследования, заключения
  - `Doctor_Notes` — визиты к врачам, рекомендации
- **34.2_Fitness** — активность
  - `Workouts` — тренировки в зале, дома, йога и т.д.
  - `Runs` — беговые тренировки

## 🧪 Последние анализы
```dataview
TABLE file.link as "Документ", dateformat(file.ctime, "dd.MM.yyyy") as "Добавлено"
FROM "30_Areas/34_Health/34.1_Records/Analyses"
SORT file.ctime desc
LIMIT 6
```

## 🩻 Диагностика
```dataview
LIST FROM "30_Areas/34_Health/34.1_Records/Diagnostics"
SORT file.mtime desc
LIMIT 6
```

## 🩺 Врачи и рекомендации
```dataview
TABLE file.link as "Запись", doctor as "Врач", followup as "Контроль"
FROM "30_Areas/34_Health/34.1_Records/Doctor_Notes"
WHERE doctor
SORT file.ctime desc
```

## 🏃‍♂️ Активность за 30 дней
> [!multi-column]
>
>> [!info] Workouts
>> ```dataviewjs
>> const rows = dv.pages("30_Areas/34_Health/34.2_Fitness/Workouts").array();
>> const now = moment();
>> const recent = rows.filter(p => now.diff(moment(p.date ?? p.file.ctime), 'days') <= 30);
>> const total = recent.reduce((acc,p)=> acc + Number(p.duration ?? 0), 0);
>> dv.paragraph(`**${recent.length}** трениров${recent.length === 1 ? 'ка' : 'ки'} · **${total}** мин.`);
>> ```
>
>> [!info] Runs
>> ```dataviewjs
>> const runs = dv.pages("30_Areas/34_Health/34.2_Fitness/Runs").array();
>> const now2 = moment();
>> const recentRuns = runs.filter(p => now2.diff(moment(p.date ?? p.file.ctime), 'days') <= 30);
>> const km = recentRuns.reduce((acc,p)=> acc + Number(p.distance ?? 0), 0);
>> dv.paragraph(`**${recentRuns.length}** пробег${recentRuns.length === 1 ? 'а' : 'ов'} · **${km.toFixed(1)}** км.`);
>> ```

## 🧭 Следующие шаги
- Заполни шаблоны для новых анализов и посещений врача.
- Добавь беговые маршруты, цели по пульсу, заметки о самочувствии.
- Используй раздел `Workouts` для планов тренировок и прогресса.
