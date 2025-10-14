---
title: "Media Hub"
tags: [media]
---

# 🎬 Media Hub

> Музыка, фильмы, сериалы и плейлисты в одном месте. Используй плагин **Media Extended** для проигрывания и **Buttons** для запуска плейлистов.

## 📂 Папки
- `43.1_Music` — альбомы, треки (форматы audio, ссылки на Spotify/YouTube)
- `43.2_Movies` — фильмы с описанием и отзывом
- `43.3_Series` — сериалы и шоу, прогресс по сезонам
- `43.4_Playlists` — авторские плейлисты, подборки по настроению

## 🎧 Музыка
```dataview
TABLE artist as "Исполнитель", year as "Год", rating as "Оценка", mood as "Настроение"
FROM "40_Resources/43_Media/43.1_Music"
WHERE type = "music"
SORT file.ctime desc
```

## 🎞 Фильмы
```dataview
TABLE year as "Год", genre as "Жанр", rating as "Оценка", review as "Отзыв"
FROM "40_Resources/43_Media/43.2_Movies"
WHERE type = "movie"
SORT file.ctime desc
```

## 📺 Сериалы
```dataview
TABLE seasons as "Сезоны", status as "Статус", rating as "Оценка"
FROM "40_Resources/43_Media/43.3_Series"
WHERE type = "series"
SORT file.ctime desc
```

## ▶️ Плейлисты
```dataview
LIST FROM "40_Resources/43_Media/43.4_Playlists"
SORT file.mtime desc
```

## 🔘 Быстрый плеер
```button
name ▶️ Открыть плеер
type command
action Media Extended: Open Player
```

## 💡 Идеи
- Добавляй обложки через `cover::` и сохраняй изображения в `43.1_Music/cover` и т.п.
- Используй `rating::` (0–10), `mood::`, `status:: (planned/in progress/done)`.
- Для сериалов фиксируй эпизоды с помощью чек-листов.
