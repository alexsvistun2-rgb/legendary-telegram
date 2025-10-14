---
cssClass: dashboard
---

# 🎶 Media & Music Dashboard

> Универсальная панель для музыки, фильмов, сериалов и плейлистов. Работает с папками `40_Resources/43_Media/*` и плагином **Media Extended** для проигрывания.

## 🎚 Быстрый обзор
```dataviewjs
const music = dv.pages("40_Resources/43_Media/43.1_Music").array();
const movies = dv.pages("40_Resources/43_Media/43.2_Movies").array();
const series = dv.pages("40_Resources/43_Media/43.3_Series").array();
const playlists = dv.pages("40_Resources/43_Media/43.4_Playlists").array();

const avg = items => {
  const rated = items
    .map(p => Number(p.rating ?? p.rate ?? 0))
    .filter(n => Number.isFinite(n) && n > 0);
  if (!rated.length) return null;
  return rated.reduce((acc, val) => acc + val, 0) / rated.length;
};

const fmt = value => value === null ? '—' : value.toFixed(1);

const cards = [
  { label: 'Альбомы & треки', value: music.length, helper: `ср. рейтинг ${fmt(avg(music))}` },
  { label: 'Фильмы', value: movies.length, helper: `ср. рейтинг ${fmt(avg(movies))}` },
  { label: 'Сериалы', value: series.length, helper: `ср. рейтинг ${fmt(avg(series))}` },
  { label: 'Плейлисты', value: playlists.length, helper: 'подборок готово' }
];

const mount = dv.el('div', '');
mount.className = 'media-card-grid';
cards.forEach(card => {
  const el = document.createElement('div');
  el.className = 'media-card';
  el.innerHTML = `<header>${card.label}</header><strong>${card.value}</strong><span>${card.helper}</span>`;
  mount.append(el);
});
```

## 🎧 Музыка
> [!multi-column]
>
>> [!info] Недавно добавлено
>> ```dataview
>> TABLE artist as "Исполнитель", year as "Год", rating as "⭐"
>> FROM "40_Resources/43_Media/43.1_Music"
>> SORT file.ctime desc
>> LIMIT 6
>> ```
>
>> [!tip] Любимые (⭐ ≥ 8)
>> ```dataview
>> TABLE artist as "Исполнитель", rating as "⭐", mood as "Настроение"
>> FROM "40_Resources/43_Media/43.1_Music"
>> WHERE rating >= 8
>> SORT rating desc
>> LIMIT 6
>> ```

## 🎞 Фильмы & сериалы
> [!multi-column]
>
>> [!summary] Фильмы к просмотру
>> ```dataview
>> TABLE year as "Год", genre as "Жанр", rating as "⭐", status
>> FROM "40_Resources/43_Media/43.2_Movies"
>> WHERE status != "done" OR !status
>> SORT file.mtime desc
>> LIMIT 6
>> ```
>
>> [!summary] Сериалы в прогрессе
>> ```dataview
>> TABLE seasons as "Сезоны", episode as "Эпизод", rating as "⭐", status
>> FROM "40_Resources/43_Media/43.3_Series"
>> WHERE status != "done" OR !status
>> SORT file.mtime desc
>> LIMIT 6
>> ```

## 📊 Рейтинги
```dataviewjs
(async () => {
  await dv.view('90_System/92_File/Views/chart-loader');
  const groups = [
    { name: 'Музыка', items: dv.pages('40_Resources/43_Media/43.1_Music').array() },
    { name: 'Фильмы', items: dv.pages('40_Resources/43_Media/43.2_Movies').array() },
    { name: 'Сериалы', items: dv.pages('40_Resources/43_Media/43.3_Series').array() }
  ];
  const data = groups.map(group => {
    const rated = group.items
      .map(p => Number(p.rating ?? p.rate ?? 0))
      .filter(n => Number.isFinite(n) && n > 0);
    return {
      label: group.name,
      average: rated.length ? rated.reduce((acc, val) => acc + val, 0) / rated.length : 0,
      count: rated.length
    };
  }).filter(entry => entry.count > 0);
  if (!data.length) {
    dv.paragraph('Добавь оценки, чтобы увидеть распределение.');
    return;
  }
  const mount = dv.el('div', '');
  mount.style.height = '300px';
  const canvas = document.createElement('canvas');
  mount.append(canvas);
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Средний рейтинг',
          data: data.map(d => Number(d.average.toFixed(2))),
          backgroundColor: ['#1abc9c', '#e67e22', '#9b59b6']
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
})();
```

## ▶️ Плейлисты
```dataview
TABLE cover as "Обложка", description as "Описание", mood as "Настроение"
FROM "40_Resources/43_Media/43.4_Playlists"
SORT file.mtime desc
```

## 📥 Файлы и вложения
```dataview
LIST file.link
FROM "40_Resources/43_Media"
WHERE contains(file.extension, "mp3") OR contains(file.extension, "flac") OR contains(file.extension, "mp4")
SORT file.ctime desc
LIMIT 10
```

## 💡 Идеи
- Добавляй тег `#media/favorite` для избранного — можно вынести отдельную колонку на доску.
- Храни изображения обложек в подпапках `cover/` и используй свойство `cover::`.
- Используй `Buttons` для запуска любимых плейлистов и `Media Extended` для встроенного плеера.
