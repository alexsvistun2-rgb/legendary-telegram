---
cssClass: dashboard health-dashboard
---

# 🩺 Health HQ — здоровье и документы

> Все медицинские записи хранятся в **70_Life/71_Health**. Подпапки: `71.1_Analyses`, `71.2_Visits`, `71.3_Medications`, `71.4_Monitoring`. Используйте шаблоны для структурированного ввода.

## 1. Последние записи
```dataview
TABLE WITHOUT ID file.link AS "Документ", type, date, status
FROM "70_Life/71_Health"
SORT file.mtime DESC
LIMIT 20
```

## 2. Анализы
```dataview
TABLE WITHOUT ID file.link AS "Анализ", date, doctor, next_check
FROM "70_Life/71_Health/71.1_Analyses"
SORT date DESC
LIMIT 15
```

## 3. Приёмы и рекомендации
```dataview
TABLE WITHOUT ID file.link AS "Приём", doctor, clinic, follow_up
FROM "70_Life/71_Health/71.2_Visits"
SORT date DESC
LIMIT 15
```

## 4. Лекарства и мониторинг
> [!multi-column]
>
>> [!pill] Лекарства
>> ```dataview
>> TABLE file.link AS "Название", dosage, schedule
>> FROM "70_Life/71_Health/71.3_Medications"
>> SORT file.mtime DESC
>> LIMIT 10
>> ```
>
>> [!chart] Мониторинг
>> ```dataview
>> TABLE file.link AS "Показатель", metric, value, date
>> FROM "70_Life/71_Health/71.4_Monitoring"
>> SORT date DESC
>> LIMIT 12
>> ```

## 5. Личные документы
```dataview
TABLE WITHOUT ID file.link AS "Документ", category, expires
FROM "70_Life/73_Documents"
SORT expires ASC
LIMIT 20
```

## 6. Быстрые действия
- [[70_Life/71_Health/71.1_Analyses/Анализ_Template|Добавить анализ]]
- [[70_Life/71_Health/71.2_Visits/Прием_Template|Записать визит]]
- [[70_Life/71_Health/71.3_Medications/Препарат_Template|Назначить лекарство]]
- [[70_Life/73_Documents/Документ_Template|Создать документ]]
```
