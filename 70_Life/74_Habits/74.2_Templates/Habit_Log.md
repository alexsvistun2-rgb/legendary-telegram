---
habit: ""
date: <% tp.date.now("YYYY-MM-DD") %>
energy: 
notes: ""
---

- **Привычка:** [[<% tp.file.cursor(1) %>]]
- **Дата:** <% tp.date.now("YYYY-MM-DD") %>
- **Энергия/настроение:** 
- **Комментарий:** {{notes}}

```dataviewjs
(() => {
  const habit = dv.current().habit || dv.current().file.name;
  const log = dv.el('div','');
  log.innerHTML = `<strong>${habit}</strong> отмечена`; 
})();
```
