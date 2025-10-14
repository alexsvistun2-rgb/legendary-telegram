---
title: "Media Hub"
tags: [media, dashboard]
---

# 🎬 Media Hub

> Структура:
> - `42.1_Music` — альбомы, плейлисты, концерты.
> - `42.2_Films` — фильмы, документалки.
> - `42.3_Series` — сериалы, шоу.
> - `42.4_Playlists` — собственные подборки (используй шаблон `Media_Item.md`).

## 📚 Последние записи
```dataview
table file.link as "Контент", media_type, status, rating, file.mtime as "Обновлено"
from "40_Resources/42_Media"
sort file.mtime desc
limit 12
```

## 📋 Списки к просмотру / прослушиванию
```dataview
list file.link
from "40_Resources/42_Media"
where status = "planned"
sort file.mtime asc
limit 20
```

> Добавляй обложки и трейлеры через Media Extended — поле `cover` в шаблоне.
