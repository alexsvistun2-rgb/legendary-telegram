---
cssClass: dashboard
---

# 🩺 Health Dashboard

> Полный обзор здоровья: анализы, визиты к врачам, тренировки и бег. Работает с папками `30_Areas/34_Health/*`.

## 🧾 Быстрый обзор
```dataviewjs
const analyses = dv.pages('30_Areas/34_Health/34.1_Records/Analyses').array();
const diagnostics = dv.pages('30_Areas/34_Health/34.1_Records/Diagnostics').array();
const doctorNotes = dv.pages('30_Areas/34_Health/34.1_Records/Doctor_Notes').array();
const workouts = dv.pages('30_Areas/34_Health/34.2_Fitness/Workouts').array();
const runs = dv.pages('30_Areas/34_Health/34.2_Fitness/Runs').array();

const now = moment();
const last = list => {
  if (!list.length) return 'нет данных';
  const sorted = [...list].sort((a, b) => moment(b.date ?? b.file.ctime).diff(moment(a.date ?? a.file.ctime)));
  return moment(sorted[0].date ?? sorted[0].file.ctime).format('DD.MM.YYYY');
};

const workouts30 = workouts.filter(p => now.diff(moment(p.date ?? p.file.ctime), 'days') <= 30);
const runs30 = runs.filter(p => now.diff(moment(p.date ?? p.file.ctime), 'days') <= 30);
const workoutMinutes = workouts30.reduce((acc, p) => acc + Number(p.duration ?? p.minutes ?? 0), 0);
const runKm = runs30.reduce((acc, p) => acc + Number(p.distance ?? 0), 0);

const cards = [
  { label: 'Анализы', value: analyses.length, helper: `последний ${last(analyses)}` },
  { label: 'Диагностика', value: diagnostics.length, helper: `последняя ${last(diagnostics)}` },
  { label: 'Тренировки (30д)', value: workouts30.length, helper: `${Math.round(workoutMinutes)} мин` },
  { label: 'Бег (30д)', value: runs30.length, helper: `${runKm.toFixed(1)} км` }
];

const mount = dv.el('div', '');
mount.className = 'health-card-grid';
cards.forEach(card => {
  const el = document.createElement('div');
  el.className = 'health-card';
  el.innerHTML = `<header>${card.label}</header><strong>${card.value}</strong><span>${card.helper}</span>`;
  mount.append(el);
});
```

## 🧪 Анализы & диагностика
> [!multi-column]
>
>> [!info] Последние анализы
>> ```dataview
>> TABLE file.link as "Документ", test as "Тест", date as "Дата"
>> FROM "30_Areas/34_Health/34.1_Records/Analyses"
>> SORT file.ctime desc
>> LIMIT 6
>> ```
>
>> [!info] Диагностика
>> ```dataview
>> TABLE file.link as "Документ", type as "Тип", doctor as "Врач"
>> FROM "30_Areas/34_Health/34.1_Records/Diagnostics"
>> SORT file.ctime desc
>> LIMIT 6
>> ```

## 🩺 Визиты к врачам
> [!multi-column]
>
>> [!tip] Последние визиты
>> ```dataview
>> TABLE file.link as "Запись", doctor as "Врач", followup as "Контроль"
>> FROM "30_Areas/34_Health/34.1_Records/Doctor_Notes"
>> SORT file.ctime desc
>> LIMIT 6
>> ```
>
>> [!warning] Контрольные даты
>> ```dataview
>> TABLE file.link as "Запись", followup as "Контроль", notes as "Комментарий"
>> FROM "30_Areas/34_Health/34.1_Records/Doctor_Notes"
>> WHERE followup
>> SORT followup asc
>> LIMIT 6
>> ```

## 🏃‍♂️ Активность (8 недель)
```dataviewjs
(async () => {
  await dv.view('90_System/92_File/Views/chart-loader');
  const workouts = dv.pages('30_Areas/34_Health/34.2_Fitness/Workouts').array();
  const runs = dv.pages('30_Areas/34_Health/34.2_Fitness/Runs').array();
  const now = moment();
  const weeks = Array.from({ length: 8 }, (_, idx) => {
    const start = now.clone().subtract(7 - idx, 'weeks').startOf('isoWeek');
    return {
      label: start.format('GGGG-[W]WW'),
      start,
      end: start.clone().endOf('isoWeek')
    };
  });
  const workoutData = weeks.map(week => {
    return workouts.filter(p => {
      const date = moment(p.date ?? p.file.ctime);
      return date.isBetween(week.start, week.end, undefined, '[]');
    }).reduce((acc, p) => acc + Number(p.duration ?? p.minutes ?? 0), 0);
  });
  const runData = weeks.map(week => {
    return runs.filter(p => {
      const date = moment(p.date ?? p.file.ctime);
      return date.isBetween(week.start, week.end, undefined, '[]');
    }).reduce((acc, p) => acc + Number(p.distance ?? 0), 0);
  });
  if (!workoutData.some(v => v > 0) && !runData.some(v => v > 0)) {
    dv.paragraph('Добавь тренировки или пробежки, чтобы увидеть динамику.');
    return;
  }
  const mount = dv.el('div', '');
  mount.style.height = '320px';
  const canvas = document.createElement('canvas');
  mount.append(canvas);
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    data: {
      labels: weeks.map(w => w.label),
      datasets: [
        {
          type: 'bar',
          label: 'Минут тренировок',
          data: workoutData.map(v => Number(v.toFixed(0))),
          backgroundColor: 'rgba(46, 204, 113, 0.7)',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Километры бега',
          data: runData.map(v => Number(v.toFixed(2))),
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.15)',
          tension: 0.35,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Минуты' }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Километры' }
        }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
})();
```

## 📂 Документы
```dataview
LIST file.link
FROM "30_Areas/34_Health/34.1_Records"
SORT file.ctime desc
LIMIT 10
```

## 📌 Следующие шаги
- Используй шаблоны для новых анализов и визитов (`90_System/91_Templates`).
- Фиксируй показатели (вес, давление) свойствами `weight::`, `bp::` — их можно отобразить на графиках.
- Добавь заметки о самочувствии в дневник, чтобы видеть связь с тренировками.
