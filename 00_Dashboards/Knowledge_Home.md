---
tags: [dashboard, knowledge]
cssClass: knowledge-dashboard
---

```dataviewjs
const root = this.container.createDiv();
Object.assign(root.style, {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px"
});

function section(title, full=false){
  const sec = root.createDiv();
  if(full) sec.style.gridColumn = "1 / -1";
  const h = sec.createEl("h2", { text: title });
  h.style.marginBottom = "8px";
  return sec;
}

function tableSimple(parent, pages, {limit=15, includeLinks=false} = {}){
  const list = pages.sort(p => p.file.mtime, "desc").limit(limit);
  const rows = list.map(p => includeLinks
    ? [p.file.link, (p.file.inlinks?.length ?? 0), (p.file.outlinks?.length ?? 0), p.file.mtime]
    : [p.file.link, p.file.mtime]);
  dv.container = parent;
  if(includeLinks) dv.table(["Файл","Вход","Выход","Обновлено"], rows);
  else dv.table(["Файл","Обновлено"], rows);
}

const ROOT = "50_Knowledge";

// Библиотека и заметки
const books = dv.pages('"' + ROOT + '/52_Library/52.1_Books"');
const ebooks = dv.pages('"' + ROOT + '/52_Library/52.2_Ebooks"');
tableSimple(section("Книги"), books.concat(ebooks));

tableSimple(section("Цитаты"), dv.pages('"' + ROOT + '/52_Library/52.3_Quotes"'));

tableSimple(section("Термины"), dv.pages('"' + ROOT + '/52_Library/52.4_Terms"'));

tableSimple(section("Fleeting"), dv.pages('"' + ROOT + '/53_Notes/53.1_Fleeting"'));
tableSimple(section("Permanent"), dv.pages('"' + ROOT + '/53_Notes/53.2_Permanent"'));
tableSimple(section("MOC"), dv.pages('"' + ROOT + '/53_Notes/53.3_MOC"'));

tableSimple(section("Вопросы"), dv.pages('"' + ROOT + '/54_Research/54.1_Questions"'));
tableSimple(section("Источники"), dv.pages('"' + ROOT + '/54_Research/54.2_Sources"'));
tableSimple(section("Промпты"), dv.pages('"' + ROOT + '/54_Research/54.3_Prompts"'));
tableSimple(section("Инструменты"), dv.pages('"' + ROOT + '/54_Research/54.4_Tools"'));

tableSimple(section("Авторы", true), dv.pages('"' + ROOT + '/55_Authors"'), {limit:25});

tableSimple(section("Открытые заметки (0–2 связи)", true),
  dv.pages('"' + ROOT + '"').where(p => ((p.file.inlinks?.length ?? 0) + (p.file.outlinks?.length ?? 0)) <= 2),
  {limit:30, includeLinks:true});
```
