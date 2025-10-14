<%*
/* =========================================
   MASTER TEMPLATE — Daily Multi-Starter
   (updated: tags rendered under "Последнее редактирование")
   ========================================= */

// ---------- Helpers ----------
function cleanAmount(x){
  if (!x) return 0;
  let s = String(x).replace(/\s+/g,'').replace(',', '.');  // "12 345,67" -> "12345.67"
  let m = s.match(/[-+]?\d+(?:[.,]\d+)?/);
  return m ? m[0] : 0;
}

function md(x){ // escape Markdown safely
  const re = new RegExp('([\\*_`\[\]\(\)<>#+!|\-])','g');
  return String(x ?? "—").replace(re, "\$1");
}

async function ensureFolder(folderPath) {
  const norm = String(folderPath || "").replace(/\\/g, "/");
  if (!norm) return;
  if (app.vault.getAbstractFileByPath(norm)) return;
  const parts = norm.split("/");
  let acc = "";
  for (const p of parts) {
    if (!p) continue;
    acc = acc ? `${acc}/${p}` : p;
    if (!app.vault.getAbstractFileByPath(acc)) {
      try { await app.vault.createFolder(acc); } catch (_) {}
    }
  }
}

// Return folder path ANM will use for a given money type
function targetFolderFor(type){
  const map = {
    expense:    "60_Finance/61_Journal/61.1_Expenses",
    income:     "60_Finance/61_Journal/61.2_Income",
    transfer:   "60_Finance/61_Journal/61.3_Transfers",
    sinking:    "60_Finance/61_Journal/61.5_Savings",
    invest_buy: "60_Finance/61_Journal/61.4_Investments/Buy",
    invest_sell:"60_Finance/61_Journal/61.4_Investments/Sell",
    divint:     "60_Finance/61_Journal/61.4_Investments/Dividends",
    tax:        "60_Finance/61_Journal/61.7_Taxes",
    fee:        "60_Finance/61_Journal/61.8_Fees",
    refund:     "60_Finance/61_Journal/61.9_Refunds",
    other:      "60_Finance/61_Journal"
  };
  return map[type] || map.other;
}

function fmtCurrency(num){
  try { return Number(num ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  catch(_) { return String(num ?? 0); }
}

// Ensure a unique title in a folder by appending (2), (3) if necessary
async function ensureUniqueTitle(folderPath, baseTitle){
  let n = 1;
  let candidate = baseTitle;
  while (true) {
    const path = `${folderPath}/${candidate}.md`;
    const exists = await tp.file.exists(path);
    if (!exists) return candidate;
    n += 1;
    candidate = `${baseTitle} (${n})`;
  }
}

// Short helper: join fm.tags into visible hashtag string
function visibleTagsLine(tagsArr){
  const uniq = Array.from(new Set(tagsArr || []));
  if (!uniq.length) return "";
  return uniq.map(t => `#${t}`).join(" ");
}

const nowDate = tp.date.now("YYYY-MM-DD");
const nowTimeSafe = tp.date.now("HH-mm"); // Windows-safe, minutes granularity

// ---------- Main choice ----------
const choice = await tp.system.suggester(
  ["⚡ Быстрая задача","💵 Деньги","🤝 Делегировать","📚 Знания"],
  ["quick","money","delegate","knowledge"],
  false,
  "Что создать?"
);

// Common vars
let H1 = `# Заметка ${nowDate} ${nowTimeSafe}`;
let body = "";
let moneyType = null;
let finalTitle = null; // целевое имя файла
let knowledgeCategory = null;

// Frontmatter to render
let fm = { title: "", type: "", tags: [] };

// ---------- KNOWLEDGE ----------
if (choice === "knowledge") {
  const ROOT = "50_Knowledge/51_ZK";
  const INBOX = "50_Knowledge/59_Inbox/59.1_ZK";
  const KR = (p) => `${ROOT}/${p}`;
  const KI = (p) => `${INBOX}/${p}`;

  // Map from item key to system tag (second tag)
  const TAG = {
    liter_book: "note/book",
    ebook: "note/book_ebook",
    liter_quote: "note/quote",
    liter_term: "note/term",
    permanent: "note/permanent",
    fleeting: "note/fleeting",
    moc: "note/moc",
    author: "note/person",
    source: "note/source",
    lecture: "note/lecture",
    usmle: "note/course",
    question: "note/question",
    prompt: "note/prompt",
    tool: "note/tool",
    okr: "note/okr"
  };

  const ITEMS = [
    { key:"liter_book",  emoji:"📚", name:"Литература — Книга", ru:"Книга", tagCat:"Книга", folder: KR("51.2_Permanent/Literature/Books"),
      skeleton:[
        "## 📗 Название",
        "",
        "## 📇 Библиографические данные",
        "- Автор: ",
        "- Год: ",
        "- ISBN: ",
        "- Ссылка: ",
        "",
        "## 📝 Аннотация / зачем читать",
        "",
        "## 🧠 Конспект (тезисы автора)",
        "- ",
        "- ",
        "- ",
        "",
        "## 💬 Цитаты",
        "- ",
        "- ",
        "",
        "## 💡 Идеи / выводы",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"ebook", emoji:"📘", name:"E-book заметка", ru:"Книга (e-book)", tagCat:"Книга", folder: KR("51.2_Permanent/Literature/E-books"),
      skeleton:[
        "## 📗 Название",
        "",
        "## 📇 Библиографические данные",
        "- Автор: ",
        "- Год: ",
        "- ISBN: ",
        "- Ссылка: ",
        "",
        "## 📝 Аннотация",
        "",
        "## 🧠 Конспект",
        "- ",
        "- ",
        "",
        "## 💬 Цитаты",
        "- ",
        "",
        "## 💡 Идеи / выводы",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"liter_quote", emoji:"📝", name:"Литература — Цитата", ru:"Цитата", tagCat:"Цитата", folder: KR("51.2_Permanent/Literature/Quotes"),
      skeleton:[
        "## 💬 Цитата",
        "",
        "## 🧭 Источник и контекст",
        "- Книга/статья: ",
        "- Автор: ",
        "- Стр./тайм-код: ",
        "",
        "## 💡 Моя мысль",
        ""
      ].join("\n")
    },
    { key:"liter_term", emoji:"🏷️", name:"Литература — Термин", ru:"Термин", tagCat:"Термин", folder: KR("51.2_Permanent/Literature/Terms"),
      skeleton:[
        "## 🏷️ Термин:",
        "",
        "## 📘 Определение",
        "",
        "## 🧩 Примеры",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- ",
        "",
        "## 🧠 Связанные термины",
        "- ",
        "- "
      ].join("\n")
    },
    { key:"permanent", emoji:"🧠", name:"Заметка (перманентная)", ru:"Заметка", tagCat:"Заметка", folder: KR("51.2_Permanent/Core"),
      skeleton:[
        "## 🧠 Суть",
        "",
        "## 📚 Аргументы / источники",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- ",
        "",
        "## 🕸️ Связи",
        "- ",
        "- "
      ].join("\n")
    },
    { key:"fleeting", emoji:"💡", name:"Мимолётная", ru:"Мимолётная", tagCat:"Мимолётная", folder: KR("51.3_Fleeting/Inbox"),
      skeleton:[
        "## 💡 Мысль",
        "",
        "## 🎯 Что сделать",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки (опц.)",
        "- ",
        "",
        "## 📎 Вложения",
        ""
      ].join("\n")
    },
    { key:"moc", emoji:"🧩", name:"Структура (MOC)", ru:"MOC", tagCat:"MOC", folder: KR("51.1_MOCs/Areas"),
      skeleton:[
        "## 🗺️ Обзор",
        "",
        "## 🧭 Ключевые узлы",
        "- ",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- ",
        "",
        "## ▶️ Дальше / маршрут",
        "- "
      ].join("\n")
    },
    { key:"author", emoji:"👤", name:"Автор/Личность", ru:"Автор/Личность", tagCat:"Автор", folder: KR("51.1_MOCs/People"),
      skeleton:[
        "## 👤 Имя",
        "",
        "## 📜 Биография",
        "- Дата рождения: ",
        "- Дата смерти: ",
        "- Место рождения: ",
        "- Род деятельности: ",
        "",
        "## 📚 Основные труды",
        "- ",
        "- ",
        "",
        "## 💡 Идеи / влияние",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"source", emoji:"🔗", name:"Источник / Статья", ru:"Источник", tagCat:"Источник", folder: KR("51.2_Permanent/Sources"),
      skeleton:[
        "## 📑 Реквизиты",
        "- Автор: ",
        "- Название: ",
        "- Год/журнал/URL: ",
        "",
        "## 🧠 Тезисы",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"lecture", emoji:"🎓", name:"Лекция / Конспект", ru:"Лекция", tagCat:"Лекция", folder: KR("51.2_Permanent/Courses/Lectures"),
      skeleton:[
        "## 🎓 Название лекции",
        "",
        "## 🔗 Источник",
        "- ",
        "",
        "## 📝 Тезисы",
        "- ",
        "- ",
        "",
        "## 🧪 Примеры / кейсы",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- ",
        "",
        "## ❓ Вопросы",
        "- "
      ].join("\n")
    },
    { key:"usmle", emoji:"🩺", name:"USMLE — Тема", ru:"USMLE", tagCat:"USMLE", folder: KR("51.2_Permanent/Courses/USMLE"),
      skeleton:[
        "## 🩺 High-Yield",
        "- ",
        "- ",
        "",
        "## 🔍 Диагностика",
        "- ",
        "- ",
        "",
        "## 💊 Лечение",
        "- ",
        "- ",
        "",
        "## ⚠️ Ловушки",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- ",
        "",
        "## ❓ Вопросы для самопроверки",
        "- "
      ].join("\n")
    },
    { key:"question", emoji:"❓", name:"Вопрос (шаблон)", ru:"Вопрос", tagCat:"Вопрос", folder: KR("51.3_Fleeting/Questions"),
      skeleton:[
        "## ❓ Вопрос",
        "",
        "## 🧭 Гипотезы / направления поиска",
        "- ",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"prompt", emoji:"🤖", name:"Prompt (шаблон)", ru:"Prompt", tagCat:"Prompt", folder: KR("51.2_Permanent/Prompts"),
      skeleton:[
        "## 🤖 Задача для ИИ",
        "- ",
        "",
        "## ✅ Результат / заметки",
        "- ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"tool", emoji:"🛠️", name:"Инструмент", ru:"Инструмент", tagCat:"Инструмент", folder: KR("51.2_Permanent/Tools"),
      skeleton:[
        "## 🧰 Описание",
        "- ",
        "",
        "## ▶️ Как использовать",
        "1) ",
        "2) ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    },
    { key:"okr", emoji:"🎯", name:"OKR", ru:"OKR", tagCat:"OKR", folder: KR("51.2_Permanent/OKR"),
      skeleton:[
        "## 🎯 Objective",
        "- ",
        "",
        "## 🔑 Key Results",
        "1) ",
        "2) ",
        "3) ",
        "",
        "## 🔗 Ссылки",
        "- "
      ].join("\n")
    }
  ];

  const labels2 = ITEMS.map(x => `${x.emoji} ${x.name}`);
  const chosen = await tp.system.suggester(labels2, ITEMS, false, "Раздел «Знания»: что создать?");
  const k = chosen || ITEMS[0];
  knowledgeCategory = k.ru;

  const baseName = await tp.system.prompt("Название заметки", "Без названия") || tp.date.now("YYYY-MM-DD HH-mm");
  const ts = tp.date.now("YYYYMMDDHHmm");
  const baseTitle = `${k.ru} — ${baseName} — ${ts}`;

  await ensureFolder(k.folder);
  const unique = await ensureUniqueTitle(k.folder, baseTitle);
  try { await tp.file.rename(unique); } catch(e) {}
  try { await tp.file.move(`${k.folder}/${unique}`); } catch(e) {}

  H1 = ""; // без дубля заголовка
  fm.title = unique;
  fm.type  = "knowledge";
  fm.tags  = ["knowledge", "type/knowledge", TAG[k.key] || k.tagCat];

  // body
  body += [
    k.skeleton,
    ""
  ].join("\n");

  finalTitle = unique;
}

// ---------- QUICK ----------
else if (choice === "quick") {
  const targetFolder = "30_Areas/31_Tasks/31.1_Journal";
  await ensureFolder(targetFolder);
  const baseTitle = `Задача ${nowDate} ${nowTimeSafe}`;
  finalTitle = await ensureUniqueTitle(targetFolder, baseTitle);
  try { await tp.file.rename(finalTitle); } catch(_) {}
  try { await tp.file.move(`${targetFolder}/${finalTitle}`); } catch(_) {}

  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "task";
  fm.tags = ["type/task", "t/quick"];

  const title = await tp.system.prompt("Текст задачи", "");
  const mode = await tp.system.suggester(
    ["∅ Без даты","⏳ Скоро","📅 Дата","🗓️ Диапазон"],
    ["none","soon","single","range"],
    false,
    "Когда выполнить?"
  );
  const nowFull = tp.date.now("YYYY-MM-DD HH:mm");

  let when = "";
  let due = null;
  if (mode === "single") {
    const a = await tp.system.prompt("YYYY-MM-DD HH:mm (или YYYY-MM-DD)", nowFull);
    if (a) { when = ` 📅 ${a}`; due = a; }
    fm.tags.push("t/urgent");
  } else if (mode === "range")  {
    const a = await tp.system.prompt("Начало: YYYY-MM-DD HH:mm", nowFull);
    const b = await tp.system.prompt("Окончание: YYYY-MM-DD HH:mm", nowFull);
    if (a && b) { when = ` 🛫 ${a} 📅 ${b}`; fm.start = a; fm.due = b; }
    fm.tags.push("t/urgent");
  } else if (mode === "soon")   {
    fm.tags.push("t/todo");
  } else {
    fm.tags.push("t/triage");
  }
  if (due && !fm.due) fm.due = due;

  body += [
    "## ✅ Входящие/быстрые",
    `- [ ] ${md(title || "—")}${when}`,
    "",
    visibleTagsLine(fm.tags) ? visibleTagsLine(fm.tags) : "#type/task",
    ""
  ].join("\n");
}

// ---------- MONEY ----------
else if (choice === "money") {
  moneyType = await tp.system.suggester(
    [
      "🛍️ Покупка (расход)",
      "💼 Доход",
      "🔁 Перевод",
      "🎯 Сбережение (конверт)",
      "📈 Инвест-покупка",
      "📉 Инвест-продажа",
      "💸 Дивиденд/процент",
      "🧾 Налог",
      "🏦 Комиссия",
      "↩️ Возврат"
    ],
    ["expense","income","transfer","sinking","invest_buy","invest_sell","divint","tax","fee","refund"],
    false,
    "Тип операции"
  );

  const H1map = {
    expense:    "Покупка",
    income:     "Доход",
    transfer:   "Перевод",
    sinking:    "Сбережение",
    invest_buy: "Инвест покупка",
    invest_sell:"Инвест продажа",
    divint:     "Дивиденд",
    tax:        "Налог",
    fee:        "Комиссия",
    refund:     "Возврат",
  };
  const TagMap = {
    expense:    "type/purchase",
    income:     "type/income",
    transfer:   "type/transfer",
    sinking:    "type/savings",
    invest_buy: "type/invest_buy",
    invest_sell:"type/invest_sell",
    divint:     "type/dividend",
    tax:        "type/tax",
    fee:        "type/fee",
    refund:     "type/refund",
    other:      "type/other"
  };

  const titleWord = H1map[moneyType] || "Деньги";
  const baseTitle = `${titleWord} ${nowDate} ${nowTimeSafe}`;
  const targetFolder = targetFolderFor(moneyType);
  await ensureFolder(targetFolder);
  finalTitle = await ensureUniqueTitle(targetFolder, baseTitle);

  try { await tp.file.rename(finalTitle); } catch(_) {}
  try { await tp.file.move(`${targetFolder}/${finalTitle}`); } catch(_) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = moneyType || "other";
  const baseTag = TagMap[moneyType] || TagMap.other;
  fm.tags = ["finance", "type/finance", baseTag];
  fm.currency = fm.currency || "RUB";

  const ask = async (label, def="") => await tp.system.prompt(label, def);

  if (moneyType === "expense") {
    const amount   = Number(cleanAmount(await ask("Сумма ₽"))) || 0;
    const category = await ask("Категория (еда/транспорт/аптека/...)");
    const descr    = await ask("Описание (опц.)");
    const account  = await ask("Счёт (нал/карта/банк/кошелёк)");
    const date     = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.category = category || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "out";
    body += [
      "> [!done] 🧾 Операция записана — расход",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Категория: **${md(category || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "income") {
    const amount  = Number(cleanAmount(await ask("Сумма ₽"))) || 0;
    const src     = await ask("Источник");
    const account = await ask("На счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.source = src || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "in";
    body += [
      "> [!done] 💼 Операция записана — доход",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Источник: **${md(src || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "transfer") {
    const amount = Number(cleanAmount(await ask("Сумма ₽"))) || 0;
    const from   = await ask("С какого счёта");
    const to     = await ask("На какой счёт");
    const descr  = await ask("Описание (опц.)");
    const date   = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.from = from || "";
    fm.to = to || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "transfer";
    body += [
      "> [!done] 🔁 Перевод между счетами",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Откуда: **${md(from || "-")}**`,
      `- Куда: **${md(to || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "sinking") {
    const amount  = Number(cleanAmount(await ask("Сумма ₽"))) || 0;
    const fund    = await ask("Цель/конверт");
    const account = await ask("Счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.goal = fund || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "savings";
    body += [
      "> [!done] 🎯 Сбережение (конверт)",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Цель: **${md(fund || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "invest_buy" || moneyType === "invest_sell") {
    const side    = (moneyType==="invest_buy") ? "покупка" : "продажа";
    const amount  = Number(cleanAmount(await ask("Сумма сделки ₽"))) || 0;
    const ticker  = await ask("Тикер/актив");
    const qtyRaw  = await ask("Кол-во (шт, опц.)");
    const priceRaw= await ask("Цена за ед. (опц.)");
    const account = await ask("Брокерский счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    const qty     = qtyRaw ? Number(cleanAmount(qtyRaw)) : null;
    const price   = priceRaw ? Number(cleanAmount(priceRaw)) : null;
    fm.amount = amount;
    fm.asset = ticker || "";
    fm.quantity = qty;
    fm.price = price;
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = moneyType;
    body += [
      `> [!done] 📊 Инвестиция — ${side}`,
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Актив: **${md(ticker || "-")}**`,
      `- Кол-во/Цена: **${[qtyRaw, priceRaw].filter(Boolean).join(" × ") || "-" }**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "divint") {
    const amount  = Number(cleanAmount(await ask("Сумма ₽"))) || 0;
    const src     = await ask("Источник (тикер/счёт)");
    const account = await ask("На счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.source = src || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "dividend";
    body += [
      "> [!done] 💸 Дивиденд/процент",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Источник: **${md(src || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "tax") {
    const amount  = Number(cleanAmount(await ask("Сумма налога ₽"))) || 0;
    const kind    = await ask("Вид налога");
    const account = await ask("Счёт оплаты");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.category = kind || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "tax";
    body += [
      "> [!done] 🧾 Налог",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Вид: **${md(kind || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "fee") {
    const amount  = Number(cleanAmount(await ask("Сумма комиссии ₽"))) || 0;
    const who     = await ask("Кто взял комиссию");
    const account = await ask("С какого счёта списано");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.source = who || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "fee";
    body += [
      "> [!warn] 🏦 Комиссия",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Кто: **${md(who || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }

  if (moneyType === "refund") {
    const amount  = Number(cleanAmount(await ask("Сумма возврата ₽"))) || 0;
    const reason  = await ask("Причина/за что");
    const account = await ask("На какой счёт пришло");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    fm.amount = amount;
    fm.category = reason || "";
    fm.account = account || "";
    fm.note = descr || "";
    fm.date = date;
    fm.flow = "refund";
    body += [
      "> [!success] ↩️ Возврат",
      `- Сумма: **${fmtCurrency(amount)} ₽**`,
      `- Причина: **${md(reason || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("
");
  }
}

// ---------- DELEGATE ----------
else if (choice === "delegate") {
  const targetFolder = "30_Areas/31_Tasks/31.2_Delegation";
  await ensureFolder(targetFolder);
  const baseTitle = `Делегирование ${nowDate} ${nowTimeSafe}`;
  finalTitle = await ensureUniqueTitle(targetFolder, baseTitle);
  try { await tp.file.rename(finalTitle); } catch(_) {}
  try { await tp.file.move(`${targetFolder}/${finalTitle}`); } catch(_) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "delegate";
  fm.tags = ["type/task", "t/delegate"];

  const task = await tp.system.prompt("Что делегировать?", "");
  const to   = await tp.system.prompt("Кому?", "");

  const mode = await tp.system.suggester(
    ["∅ Без даты","📅 Дата","🗓️ Диапазон"],
    ["none","single","range"],
    false,
    "Срок выполнения?"
  );

  let ddl = "";
  if (mode === "single") {
    ddl = await tp.system.prompt("YYYY-MM-DD HH:mm (или YYYY-MM-DD)", tp.date.now("YYYY-MM-DD HH:mm"));
    if (ddl) fm.due = ddl;
    fm.tags.push("t/urgent");
  } else if (mode === "range") {
    const a = await tp.system.prompt("Начало: YYYY-MM-DD HH:mm", tp.date.now("YYYY-MM-DD HH:mm"));
    const b = await tp.system.prompt("Окончание: YYYY-MM-DD HH:mm", tp.date.now("YYYY-MM-DD HH:mm"));
    ddl = (a && b) ? (a + " → " + b) : "";
    if (a) fm.start = a;
    if (b) fm.due = b;
    fm.tags.push("t/urgent");
  }

  fm.assignee = to || "";
  fm.request = task || "";

  const due = ddl ? " 📅 " + ddl : "";

  body += [
    "## 🤝 Делегировать",
    `- [ ] ${md(task)} → **${md(to)}**${due}`,
    "",
    visibleTagsLine(fm.tags) ? visibleTagsLine(fm.tags) : "#type/task",
    ""
  ].join("
");
}

// ---------- Compose Frontmatter + Header (with visible tags) ----------
const fmLines = [
  "---",
  `title: ${fm.title ? '"' + fm.title.replace(/"/g,'\\"') + '"' : '""'}`,
  `type: ${fm.type || ""}`,
  `tags: [${Array.from(new Set(fm.tags)).join(', ')}]`,
  "---",
  ""
].join("\n");

// Visible header under H1: Last edit + TAGS block
const headerMeta = (() => {
  const lines = [
    `**Последнее редактирование:** \`= dateformat(this.file.mtime, "yyyy-MM-dd HH:mm")\``,
    ""
  ];
  if (fm.type === "knowledge") {
    lines.push(`**Раздел:** Знания  **Категория:** ${knowledgeCategory || ""}`);
    lines.push(`**Теги:** ${visibleTagsLine(fm.tags)}`);
  } else {
    lines.push(visibleTagsLine(fm.tags));
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  return lines.join("\n");
})();;

tR += [fmLines, H1, "", headerMeta, body].join("\n");

// Late rename after ANM move (still apply; suffix already unique for target folder)
try { if (finalTitle) { await tp.system.sleep(500); await tp.file.rename(finalTitle); } } catch (e) {}
%>

## 📎 Вложения

```button
name ➕ Добавить файл
type command
action editor:go-to-end-of-file
action editor:go-to-end
action Вложение
```
