---
cssClass: dashboard media-dashboard
---

# 🎧 Media Hub — музыка, кино, сериалы

> Управляйте коллекцией в папке **40_Resources/42_MediaHub**. Используйте шаблоны для музыки, фильмов, сериалов и плейлистов. Встроенный плеер Media Extended позволяет воспроизводить файлы прямо в заметках.

## 1. Библиотека
```dataview
TABLE WITHOUT ID file.link AS "Название", type, status, rating
FROM "40_Resources/42_MediaHub"
WHERE file.name != "_Template"
SORT file.mtime DESC
LIMIT 20
```

## 2. Музыка и плейлисты
> [!multi-column]
>
>> [!music] Альбомы
>> ```dataview
>> TABLE file.link AS "Альбом", artist, year, rating
>> FROM "40_Resources/42_MediaHub/42.1_Music"
>> SORT file.mtime DESC
>> LIMIT 10
>> ```
>
>> [!playlist] Плейлисты
>> ```dataview
>> TABLE file.link AS "Плейлист", mood, length, track_count
>> FROM "40_Resources/42_MediaHub/42.4_Playlists"
>> SORT file.ctime DESC
>> LIMIT 8
>> ```

## 3. Кино и сериалы
```dataview
TABLE WITHOUT ID file.link AS "Картина", platform, status, score
FROM "40_Resources/42_MediaHub/42.2_Films" OR "40_Resources/42_MediaHub/42.3_Series"
SORT status DESC, rating DESC
LIMIT 20
```

## 4. Отзывы и заметки
```dataview
LIST FROM "40_Resources/42_MediaHub"
WHERE review OR contains(tags, "review")
SORT file.mtime DESC
LIMIT 12
```

## 5. Быстрые кнопки
- [[40_Resources/42_MediaHub/42.0_Templates/Media_Album|➕ Новый альбом]]
- [[40_Resources/42_MediaHub/42.0_Templates/Media_Film|🎬 Добавить фильм]]
- [[40_Resources/42_MediaHub/42.0_Templates/Media_Playlist|🎶 Создать плейлист]]
```
