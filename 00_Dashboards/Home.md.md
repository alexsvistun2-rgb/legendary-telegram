---
tags:
  - dashboard
---
created:: `= dateformat(this.file.ctime, "yyyy-MM-dd HH:mm")`
updated:: `= dateformat(this.file.mtime, "yyyy-MM-dd HH:mm")`
# Home

## 🔥 Срочные задачи (сегодня/просрочены)
```tasks
not done
(due before today) OR (due today)
sort by due
```

## ✅ Ближайшие задачи
```tasks
not done
due after today
limit 20
sort by due
```

## 🗂 Канбан (CardBoard)
Открой доску CardBoard **GTD**: Разобрать / To Do / Срочные / Делегировать / Проекты / Done.
(Колонки см. в инструкции ниже.)

## 📝 Последние дневники (ежедневки)
```dataview
LIST FROM "20_Journal/daily"
SORT file.mtime desc
LIMIT 7
```

## 📚 Учёба за неделю (минуты)
```dataview
TABLE sum(number(mins)) as "Минут"
FROM ""
WHERE tracker = "study" AND file.ctime >= date(today) - dur(7 days)
```

## 💸 Финансы (текущий месяц)
```dataview
TABLE round(sum(number(amount)),2) as Total
FROM "20_Journal/daily"
FLATTEN split(purchase, "|")[0] as amount
WHERE purchase AND dateformat(file.ctime, "YYYY-MM") = dateformat(today, "YYYY-MM")
```
