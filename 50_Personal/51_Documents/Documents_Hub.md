---
title: "Documents Hub"
tags: [personal/documents]
---

# 🗂 Личные документы

> Храни сканы паспортов, доверенностей, страховок и других важных бумаг.

## 📁 Структура
- `Passports` — паспорта, загранпаспорта
- `Agreements` — договоры, доверенности
- `Certificates` — свидетельства, полисы, дипломы
- `52_Archive` — истёкшие документы, черновики

## 📌 Последние обновления
```dataview
TABLE file.link as "Документ", type as "Тип", expire as "Срок", dateformat(file.mtime, "dd.MM.yyyy") as "Изменён"
FROM "50_Personal/51_Documents"
WHERE type
SORT file.mtime desc
LIMIT 10
```

## ⏳ Истекающие документы
```dataviewjs
const docs = dv.pages("50_Personal/51_Documents").where(p => p.expire).array();
const soon = docs.filter(p => moment(p.expire, 'YYYY-MM-DD', true).isValid());
soon.sort((a,b)=> moment(a.expire).valueOf() - moment(b.expire).valueOf());
const list = soon.filter(p => moment(p.expire).diff(moment(), 'days') <= 90);
if(!list.length){ dv.paragraph('✅ Нет документов со сроком меньше 90 дней.'); }
else {
  list.forEach(item => {
    const diff = moment(item.expire).diff(moment(), 'days');
    dv.paragraph(`⚠️ **${item.file.link}** — истекает через ${diff} дн.`);
  });
}
```

## ✔️ Советы
- Добавь поле `expire:: YYYY-MM-DD` и `type:: паспорт/договор/...` для сортировки.
- Храни оригиналы в облаке, сюда прикладывай PDF/JPEG.
- Используй теги `#secure` или `#legal` для быстрого поиска.
