---
tags: [dashboard, knowledge]
---

```dataviewjs
const root = this.container.createDiv();
Object.assign(root.style, {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "16px"
});

function section(title, full=false){
  const sec = root.createDiv();
  if (full) sec.style.gridColumn = "1 / -1";
  const h = sec.createEl("h2", { text: title });
  h.style.margin = "0 0 8px 0";
  return sec;
}

function renderTable(parent, pages, {limit=20, includeLinks=false} = {}) {
  const list = pages.sort(p => p.file.mtime, "desc").limit(limit);
  const rows = list.map(p => includeLinks
    ? [p.file.link, (p.file.inlinks?.length ?? 0), (p.file.outlinks?.length ?? 0), p.file.mtime]
    : [p.file.link, p.file.mtime]
  );
  dv.container = parent;
  if (includeLinks) dv.table(["Заметка","Входящие","Исходящие","Обновлено"], rows);
  else dv.table(["Заметка","Обновлено"], rows);
}

const ROOT = "50_Knowledge/51_ZK";
renderTable(section("Последние заметки"), dv.pages(`"${ROOT}"`));
renderTable(section("MOC / карты"), dv.pages(`"${ROOT}/51.1_MOCs"`));
renderTable(section("Постоянные"), dv.pages(`"${ROOT}/51.2_Permanent"`));
renderTable(section("Мимолётные"), dv.pages(`"${ROOT}/51.3_Fleeting"`));
renderTable(section("Литература"), dv.pages(`"${ROOT}/51.2_Permanent/Literature"`));
renderTable(section("Вопросы"), dv.pages(`"${ROOT}/51.3_Fleeting/Questions"`));
renderTable(section("Источники"), dv.pages(`"${ROOT}/51.2_Permanent/Sources"`));
renderTable(section("Инструменты"), dv.pages(`"${ROOT}/51.2_Permanent/Tools"`));
renderTable(section("Связей < 3", true), dv.pages(`"${ROOT}"`).where(p => ((p.file.inlinks?.length ?? 0) + (p.file.outlinks?.length ?? 0)) <= 2), {limit: 40, includeLinks:true});
```
