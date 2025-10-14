---
tags: [dashboard, knowledge]
---



```dataviewjs
const root = this.container.createDiv();
Object.assign(root.style, {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
  gap: "16px"
});

function section(title, full=false){
  const sec = root.createDiv();
  if (full) sec.style.gridColumn = "1 / -1";
  const h = sec.createEl("h2", { text: title });
  h.style.margin = "0 0 8px 0";
  return sec;
}

function tableSimple(parent, pages, {limit=20, includeLinks=false} = {}) {
  const list = pages.sort(p => p.file.mtime, "desc").limit(limit);
  const rows = list.map(p => includeLinks
    ? [p.file.link, (p.file.inlinks?.length ?? 0), (p.file.outlinks?.length ?? 0), p.file.mtime]
    : [p.file.link, p.file.mtime]
  );
  dv.container = parent;
  if (includeLinks) dv.table(["File","In","Out","Updated"], rows);
  else dv.table(["File","Updated"], rows);
}

const ROOT = "40_Resources/41_ZK/41.1_Inbox/41.1.1_ZK";

// keep: Последние, Автор/Личность, Fleeting, Книги, Цитаты
tableSimple(section("Последние заметки"), dv.pages('"' + ROOT + '"'));
tableSimple(section("Автор/Личность"), dv.pages('"' + ROOT + '/Authors"'));
tableSimple(section("Fleeting"), dv.pages('"' + ROOT + '/Fleeting"'));

// Книги = Books + E-books (Literature/Books + Literature/E-books)
const books = dv.pages('"' + ROOT + '/Literature/Books"');
const ebooks = dv.pages('"' + ROOT + '/Literature/E-books"');
tableSimple(section("Книги"), books.concat(ebooks));

tableSimple(section("Цитаты"), dv.pages('"' + ROOT + '/Literature/Quotes"'));

// add: Questions
tableSimple(section("Questions"), dv.pages('"' + ROOT + '/Questions"'));

// bottom full-width: 0–2 links
const fewLinks = dv.pages('"' + ROOT + '"')
  .where(p => ((p.file.inlinks?.length ?? 0) + (p.file.outlinks?.length ?? 0)) <= 2);
tableSimple(section("Заметки без связей (0–2 ссылки)", true), fewLinks, {limit: 30, includeLinks: true});
```
