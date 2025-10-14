---
name: ""
type: habit
tag: [habit]
frequency: daily
target: 30
metric: "дней"
---

# {{name}}

- **Описание:** 
- **Почему важно:** 
- **Индикатор успеха:** 
- **Награда:** 

## 🔁 Отслеживание
- Запуск: <% tp.date.now("YYYY-MM-DD") %>
- Цель: {{target}} {{metric}}
- Частота: {{frequency}}
- Текущий прогресс: `= round(length(listfrom("70_Life/74_Habits/74.1_Log").where(l => l.habit = this.file.name))/target*100,2) + "%"`

## 🧠 Заметки
- 
- 
