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
  const re = new RegExp('([\\\\*_`\\[\\]\\(\\)<>#+!|\\-])','g');
  return String(x ?? "—").replace(re, "\\$1");
}

// Return folder path ANM will use for a given money type
function targetFolderFor(type){
  const map = {
    expense:    "60_Finance/69_Inbox/69.1_Finance_note/Purchase",
    income:     "60_Finance/69_Inbox/69.1_Finance_note/Income",
    transfer:   "60_Finance/69_Inbox/69.1_Finance_note/Transfer",
    sinking:    "60_Finance/69_Inbox/69.1_Finance_note/Savings",
    invest_buy: "60_Finance/69_Inbox/69.1_Finance_note/Invest_Buy",
    invest_sell:"60_Finance/69_Inbox/69.1_Finance_note/Invest_Sell",
    divint:     "60_Finance/69_Inbox/69.1_Finance_note/Dividend",
    tax:        "60_Finance/69_Inbox/69.1_Finance_note/Tax",
    fee:        "60_Finance/69_Inbox/69.1_Finance_note/Fee",
    refund:     "60_Finance/69_Inbox/69.1_Finance_note/Refund",
    other:      "60_Finance/69_Inbox/69.1_Finance_note/Other"
  };
  return map[type] || map.other;
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
  [
    "⚡ Быстрая задача",
    "💵 Деньги",
    "🤝 Делегировать",
    "📚 Знания",
    "🏃 Тренировка",
    "🧪 Анализы",
    "🎧 Медиа",
    "📘 Библиотека",
    "📁 Документ",
    "📊 Привычка"
  ],
  [
    "quick",
    "money",
    "delegate",
    "knowledge",
    "workout",
    "health_record",
    "media",
    "library",
    "document",
    "habit"
  ],
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
let fmExtra = [];
const addFm = (key, value) => {
  if (value === undefined || value === null || value === '') return;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    fmExtra.push(`${key}: ${value}`);
  } else if (typeof value === 'boolean') {
    fmExtra.push(`${key}: ${value}`);
  } else {
    fmExtra.push(`${key}: ${JSON.stringify(String(value))}`);
  }
};
const sanitizeTitle = (value, fallback = 'Заметка') => {
  const base = (value && String(value).trim()) || fallback;
  return base.replace(/[\\/:?<>*"|]/g, ' ').replace(/\s+/g, ' ').trim();
};

// ---------- KNOWLEDGE ----------
if (choice === "knowledge") {
  // create folder tree if not exists
  async function ensureFolder(folderPath) {
    const norm = String(folderPath || "").replace(/\\/g, "/");
    if (app.vault.getAbstractFileByPath(norm)) return;
    const parts = norm.split("/");
    let acc = "";
    for (const p of parts) {
      if (!p) continue;
      acc = acc ? `${acc}/${p}` : p;
      if (!app.vault.getAbstractFileByPath(acc)) {
        try { await app.vault.createFolder(acc); } catch (e) {}
      }
    }
  }
  const ROOT = "50_Knowledge/59_Inbox/59.1_ZK";
  const KR = (p) => `${ROOT}/${p}`;

  // Map from item key to RU tag (second tag)
  const TAG = {
    liter_book: "Книга",
    ebook: "Книга",
    liter_quote: "Цитата",
    liter_term: "Термин",
    permanent: "Заметка",
    fleeting: "Мимолётная",
    moc: "MOC",
    author: "Автор",
    source: "Источник",
    lecture: "Лекция",
    usmle: "USMLE",
    question: "Вопрос",
    prompt: "Prompt",
    tool: "Инструмент",
    okr: "OKR"
  };

  const ITEMS = [
    { key:"liter_book",  emoji:"📚", name:"Литература — Книга", ru:"Книга", tagCat:"Книга", folder: KR("Literature/Books"),
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
    { key:"ebook", emoji:"📘", name:"E-book заметка", ru:"Книга (e-book)", tagCat:"Книга", folder: KR("Literature/E-books"),
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
    { key:"liter_quote", emoji:"📝", name:"Литература — Цитата", ru:"Цитата", tagCat:"Цитата", folder: KR("Literature/Quotes"),
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
    { key:"liter_term", emoji:"🏷️", name:"Литература — Термин", ru:"Термин", tagCat:"Термин", folder: KR("Literature/Terms"),
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
    { key:"permanent", emoji:"🧠", name:"Заметка (перманентная)", ru:"Заметка", tagCat:"Заметка", folder: KR("Permanent"),
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
    { key:"fleeting", emoji:"💡", name:"Мимолётная", ru:"Мимолётная", tagCat:"Мимолётная", folder: KR("Fleeting"),
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
    { key:"moc", emoji:"🧩", name:"Структура (MOC)", ru:"MOC", tagCat:"MOC", folder: KR("MOC"),
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
    { key:"author", emoji:"👤", name:"Автор/Личность", ru:"Автор/Личность", tagCat:"Автор", folder: KR("Authors"),
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
    { key:"source", emoji:"🔗", name:"Источник / Статья", ru:"Источник", tagCat:"Источник", folder: KR("Sources"),
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
    { key:"lecture", emoji:"🎓", name:"Лекция / Конспект", ru:"Лекция", tagCat:"Лекция", folder: KR("Lectures"),
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
    { key:"usmle", emoji:"🩺", name:"USMLE — Тема", ru:"USMLE", tagCat:"USMLE", folder: KR("USMLE"),
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
    { key:"question", emoji:"❓", name:"Вопрос (шаблон)", ru:"Вопрос", tagCat:"Вопрос", folder: KR("Questions"),
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
    { key:"prompt", emoji:"🤖", name:"Prompt (шаблон)", ru:"Prompt", tagCat:"Prompt", folder: KR("Prompts"),
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
    { key:"tool", emoji:"🛠️", name:"Инструмент", ru:"Инструмент", tagCat:"Инструмент", folder: KR("Tools"),
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
    { key:"okr", emoji:"🎯", name:"OKR", ru:"OKR", tagCat:"OKR", folder: KR("OKR"),
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
  fm.tags  = ["knowledge", TAG[k.key] || k.tagCat]; // simplified tags

  // body
  body += [
    k.skeleton,
    ""
  ].join("\n");

  finalTitle = unique;
}

// ---------- QUICK ----------
else if (choice === "quick") {
  const baseTitle = `Быстрая задача ${nowDate} ${nowTimeSafe}`;
  // Для быстрых задач проверим уникальность в текущей папке
  const folder = tp.file.folder(true); // absolute path relative to vault
  finalTitle = await ensureUniqueTitle(folder, baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "task";
  fm.tags = ["t/quick"];

  const title = await tp.system.prompt("Текст задачи", "");
  const mode = await tp.system.suggester(
    ["∅ Без даты","⏳ Скоро","📅 Дата","🗓️ Диапазон"],
    ["none","soon","single","range"],
    false,
    "Когда выполнить?"
  );
  const nowFull = tp.date.now("YYYY-MM-DD HH:mm");

  let when = "";
  if (mode === "single") { const a = await tp.system.prompt("YYYY-MM-DD HH:mm (или YYYY-MM-DD)", nowFull); if (a) when = ` 📅 ${a}`; fm.tags.push("t/urgent"); }
  else if (mode === "range")  { const a = await tp.system.prompt("Начало: YYYY-MM-DD HH:mm", nowFull); const b = await tp.system.prompt("Окончание: YYYY-MM-DD HH:mm", nowFull); if (a && b) when = ` 🛫 ${a} 📅 ${b}`; fm.tags.push("t/urgent"); }
  else if (mode === "soon")   { fm.tags.push("t/todo"); }
  else                        { fm.tags.push("t/triage"); }

  body += [
    "## ✅ Входящие/быстрые",
    `- [ ] ${md(title || "—")}${when}`,
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
  finalTitle = await ensureUniqueTitle(targetFolder, baseTitle);

  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = moneyType || "other";
  fm.tags = [ TagMap[moneyType] || TagMap.other ];

  const ask = async (label, def="") => await tp.system.prompt(label, def);

  if (moneyType === "expense") {
    const amount   = cleanAmount(await ask("Сумма ₽"));
    const category = await ask("Категория (еда/транспорт/аптека/...)");
    const descr    = await ask("Описание (опц.)");
    const account  = await ask("Счёт (нал/карта/банк/кошелёк)");
    const date     = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 🧾 Операция записана — расход",
      `- Сумма: **${amount} ₽**`,
      `- Категория: **${md(category || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "income") {
    const amount  = cleanAmount(await ask("Сумма ₽"));
    const src     = await ask("Источник");
    const account = await ask("На счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 💼 Операция записана — доход",
      `- Сумма: **${amount} ₽**`,
      `- Источник: **${md(src || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "transfer") {
    const amount = cleanAmount(await ask("Сумма ₽"));
    const from   = await ask("С какого счёта");
    const to     = await ask("На какой счёт");
    const descr  = await ask("Описание (опц.)");
    const date   = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 🔁 Перевод между счетами",
      `- Сумма: **${amount} ₽**`,
      `- Откуда: **${md(from || "-")}**`,
      `- Куда: **${md(to || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "sinking") {
    const amount  = cleanAmount(await ask("Сумма ₽"));
    const fund    = await ask("Цель/конверт");
    const account = await ask("Счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 🎯 Сбережение (конверт)",
      `- Сумма: **${amount} ₽**`,
      `- Цель: **${md(fund || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "invest_buy" || moneyType === "invest_sell") {
    const side    = (moneyType==="invest_buy") ? "покупка" : "продажа";
    const amount  = cleanAmount(await ask("Сумма сделки ₽"));
    const ticker  = await ask("Тикер/актив");
    const qty     = await ask("Кол-во (шт, опц.)");
    const price   = await ask("Цена за ед. (опц.)");
    const account = await ask("Брокерский счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      `> [!done] 📊 Инвестиция — ${side}`,
      `- Сумма: **${amount} ₽**`,
      `- Актив: **${md(ticker || "-")}**`,
      `- Кол-во/Цена: **${[qty,price].filter(Boolean).join(" x ") || "-" }**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "divint") {
    const amount  = cleanAmount(await ask("Сумма ₽"));
    const src     = await ask("Источник (тикер/счёт)");
    const account = await ask("На счёт");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 💸 Дивиденд/процент",
      `- Сумма: **${amount} ₽**`,
      `- Источник: **${md(src || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "tax") {
    const amount  = cleanAmount(await ask("Сумма налога ₽"));
    const kind    = await ask("Вид налога");
    const account = await ask("Счёт оплаты");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!done] 🧾 Налог",
      `- Сумма: **${amount} ₽**`,
      `- Вид: **${md(kind || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "fee") {
    const amount  = cleanAmount(await ask("Сумма комиссии ₽"));
    const who     = await ask("Кто взял комиссию");
    const account = await ask("С какого счёта списано");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!warn] 🏦 Комиссия",
      `- Сумма: **${amount} ₽**`,
      `- Кто: **${md(who || "-")}**`,
      `- Счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }

  if (moneyType === "refund") {
    const amount  = cleanAmount(await ask("Сумма возврата ₽"));
    const reason  = await ask("Причина/за что");
    const account = await ask("На какой счёт пришло");
    const descr   = await ask("Описание (опц.)");
    const date    = await ask("Дата", tp.date.now("YYYY-MM-DD HH:mm"));
    body += [
      "> [!success] ↩️ Возврат",
      `- Сумма: **${amount} ₽**`,
      `- Причина: **${md(reason || "-")}**`,
      `- На счёт: **${md(account || "-")}**`,
      `- Описание: **${md(descr || "-")}**`,
      `- Дата: **${date}**`,
      ""
    ].join("\n");
  }
}

// ---------- DELEGATE ----------
else if (choice === "delegate") {
  const baseTitle = `Делегирование ${nowDate} ${nowTimeSafe}`;
  const folder = tp.file.folder(true);
  finalTitle = await ensureUniqueTitle(folder, baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "delegate";
  fm.tags = ["t/delegate"];

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
    fm.tags.push("t/urgent");
  } else if (mode === "range") {
    const a = await tp.system.prompt("Начало: YYYY-MM-DD HH:mm", tp.date.now("YYYY-MM-DD HH:mm"));
    const b = await tp.system.prompt("Окончание: YYYY-MM-DD HH:mm", tp.date.now("YYYY-MM-DD HH:mm"));
    ddl = (a && b) ? (a + " → " + b) : "";
    fm.tags.push("t/urgent");
  }

  const due = ddl ? " 📅 " + ddl : "";

  body += [
    "## 🤝 Делегировать",
    `- [ ] ${md(task)} → **${md(to)}**${due}`,
    ""
  ].join("\n");
}


// ---------- WORKOUT ----------
else if (choice === "workout") {
  const workoutType = await tp.system.suggester(
    ["🏃 Бег","🏋️ Силовая","🚴 Велотренировка","🧘 Йога/мобилити"],
    ["run","strength","bike","mobility"],
    false,
    "Тип тренировки"
  );
  const date = await tp.system.prompt("Дата тренировки", tp.date.now("YYYY-MM-DD"));
  const startTime = await tp.system.prompt("Время начала (опц.)", tp.date.now("HH:mm"));
  const durationRaw = await tp.system.prompt("Длительность (мин)", "45");
  const durationVal = durationRaw ? Number(cleanAmount(durationRaw)) : null;
  let distanceRaw = "";
  if (workoutType === "run" || workoutType === "bike") {
    distanceRaw = await tp.system.prompt("Дистанция (км)", "");
  }
  const distanceVal = distanceRaw ? Number(cleanAmount(distanceRaw)) : null;
  const hr = await tp.system.prompt("Средний пульс (опц.)", "");
  const rpe = await tp.system.prompt("RPE (1-10)", "");
  const notes = await tp.system.prompt("Ключевые заметки", "");
  const labelMap = { run: "Пробежка", strength: "Силовая тренировка", bike: "Велотренировка", mobility: "Мобилити" };
  const safeLabel = sanitizeTitle(labelMap[workoutType] || "Тренировка");
  const baseTitle = `${safeLabel} ${date}`.trim();
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "workout";
  const tagMap = { run: "fitness/run", strength: "fitness/workout", bike: "fitness/workout", mobility: "fitness/workout" };
  fm.tags = ["fitness", tagMap[workoutType] || "fitness/workout"];
  addFm("date", date);
  addFm("workout_type", workoutType);
  if (durationVal !== null && !Number.isNaN(durationVal)) addFm("duration_min", durationVal);
  if (distanceVal !== null && !Number.isNaN(distanceVal)) addFm("distance_km", distanceVal);
  if (hr) addFm("hr_avg", Number(cleanAmount(hr)));
  if (rpe) addFm("rpe", Number(cleanAmount(rpe)));
  const durationDisplay = (durationVal !== null && !Number.isNaN(durationVal)) ? durationVal : "—";
  const distanceDisplay = (distanceVal !== null && !Number.isNaN(distanceVal)) ? distanceVal : "—";
  const metrics = [
    `- Дата: **${date}${startTime ? " " + startTime : ""}**`,
    `- Формат: **${labelMap[workoutType] || "Тренировка"}**`,
    `- Длительность: **${durationDisplay} мин**`,
  ];
  if (distanceRaw) metrics.push(`- Дистанция: **${distanceDisplay} км**`);
  if (hr) metrics.push(`- Средний пульс: **${hr} уд/мин**`);
  if (rpe) metrics.push(`- RPE: **${rpe}/10**`);
  body += [
    "## 🏃 Тренировка",
    ...metrics,
    "",
    "### 📓 Лог тренировки",
    "<!-- tracker:workout-log -->",
    "| Дата | Минуты | Дистанция | RPE | Пульс | Комментарий |",
    "| --- | --- | --- | --- | --- | --- |",
    `| ${date} | ${durationDisplay} | ${distanceRaw || '—'} | ${rpe || '—'} | ${hr || '—'} | ${notes || '—'} |`,
    "",
    "```tracker",
    "searchType: table",
    "tableId: workout-log",
    "line:",
    "  title: Нагрузка (мин)",
    "  dataset: Минуты",
    "summary:",
    "  - type: sum",
    "    label: Минут за период",
    "    column: Минуты",
    "  - type: sum",
    "    label: Км за период",
    "    column: Дистанция",
    "```",
    "",
    "> [!tip] Tracker\n> Добавляй строки в таблицу выше — график и суммы обновятся автоматически.",
    ""
  ].join("
");
}

// ---------- HEALTH RECORD ----------
else if (choice === "health_record") {
  const scope = await tp.system.prompt("Название анализа/осмотра", "");
  const date = await tp.system.prompt("Дата", tp.date.now("YYYY-MM-DD"));
  const clinic = await tp.system.prompt("Клиника/лаборатория", "");
  const doctor = await tp.system.prompt("Врач (опц.)", "");
  const summary = await tp.system.prompt("Основные выводы (опц.)", "");
  const nextSteps = await tp.system.prompt("Следующие шаги (опц.)", "");
  const safeScope = sanitizeTitle(scope, "Анализ");
  const baseTitle = `${safeScope} ${date}`.trim();
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "health_record";
  fm.tags = ["health/record"];
  addFm("date", date);
  addFm("scope", scope || safeScope);
  addFm("clinic", clinic);
  if (doctor) addFm("doctor", doctor);
  body += [
    "## 🧪 Анализ / обследование",
    `- Название: **${md(scope || safeScope)}**`,
    `- Дата: **${date}**`,
    `- Локация: **${md(clinic || '—')}**`,
    `- Врач: **${md(doctor || '—')}**`,
    "",
    "### 📊 Показатели",
    "| Показатель | Значение | Норма | Комментарий |",
    "| --- | --- | --- | --- |",
    "| | | | |",
    "",
    "### 📝 Выводы",
    summary ? md(summary) : "—",
    "",
    "### ▶️ Следующие шаги",
    nextSteps ? md(nextSteps) : "—",
    ""
  ].join("
");
}

// ---------- MEDIA ----------
else if (choice === "media") {
  const mediaType = await tp.system.suggester(
    ["🎵 Музыка","🎬 Фильм","📺 Сериал","🎧 Плейлист"],
    ["music","film","series","playlist"],
    false,
    "Тип медиа"
  );
  const title = await tp.system.prompt("Название", "");
  const labelMap = { music: "Музыка", film: "Фильм", series: "Сериал", playlist: "Плейлист" };
  const roleMap = { music: "Исполнитель/группа", film: "Режиссёр/студия", series: "Шоураннер/студия", playlist: "Автор плейлиста" };
  const creator = await tp.system.prompt(roleMap[mediaType] || "Автор", "");
  const release = await tp.system.prompt("Год релиза", "");
  const rating = await tp.system.prompt("Оценка (например 8/10)", "");
  const mood = await tp.system.prompt("Жанр/настроение", "");
  const link = await tp.system.prompt("Основная ссылка (Spotify/Кинопоиск/...)", "");
  const cover = await tp.system.prompt("Обложка (файл или URL)", "");
  const review = await tp.system.prompt("Короткое впечатление", "");
  const safeName = sanitizeTitle(title, "Медиа");
  const baseTitle = `${safeName} — ${labelMap[mediaType] || 'Медиа'}`;
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${title || finalTitle}`;
  fm.title = title || finalTitle;
  fm.type = "media";
  const tagMap = { music: "media/music", film: "media/film", series: "media/series", playlist: "media/playlist" };
  fm.tags = ["media", tagMap[mediaType] || "media/item"];
  addFm("media_type", mediaType);
  addFm("creator", creator);
  addFm("release", release);
  addFm("rating", rating);
  if (link) addFm("link", link);
  if (cover) addFm("cover", cover);
  if (mood) addFm("mood", mood);
  body += [
    "> [!info] Карточка",
    `> **Тип:** ${labelMap[mediaType] || 'Медиа'}`,
    `> **Автор:** ${md(creator || '—')}`,
    `> **Год:** ${release || '—'}`,
    `> **Оценка:** ${rating || '—'}`,
    `> **Настроение:** ${md(mood || '—')}`,
    `> **Ссылка:** ${link ? `[перейти](${link})` : '—'}`,
    `> **Обложка:** ${cover || '—'}`,
    "",
    "## 💽 Обзор",
    review || "—",
    "",
    "## 🎯 Любимые моменты",
    "- ",
    "- ",
    "",
    "## 📓 Заметки",
    "- ",
    "- ",
    "",
    "## 🎵 Плейлист / треклист",
    "- ",
    "- ",
    ""
  ].join("
");
}

// ---------- LIBRARY ----------
else if (choice === "library") {
  const material = await tp.system.prompt("Название книги/материала", "");
  const author = await tp.system.prompt("Автор/источник", "");
  const status = await tp.system.suggester(
    ["🟢 Читаю","✅ Прочитано","📝 Планирую","⏸️ Пауза"],
    ["reading","finished","planned","paused"],
    false,
    "Статус"
  );
  const progressRaw = await tp.system.prompt("Прогресс (%)", "");
  const progressVal = progressRaw ? Number(cleanAmount(progressRaw)) : null;
  const safeName = sanitizeTitle(material, "Материал");
  const baseTitle = `${safeName} — конспект`;
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${material || finalTitle}`;
  fm.title = material || finalTitle;
  fm.type = "library";
  fm.tags = ["library"];
  addFm("source", material || finalTitle);
  addFm("author", author);
  addFm("status", status);
  if (progressVal !== null && !Number.isNaN(progressVal)) addFm("progress", progressVal);
  body += [
    "## 📘 Карточка материала",
    `- Название: **${md(material || finalTitle)}**`,
    `- Автор: **${md(author || '—')}**`,
    `- Статус: **${status || '—'}**`,
    progressVal !== null && !Number.isNaN(progressVal) ? `- Прогресс: **${progressVal}%**` : "- Прогресс: **—**",
    "",
    "## 🧠 Ключевые идеи",
    "- ",
    "- ",
    "",
    "## 💬 Цитаты",
    "- ",
    "- ",
    "",
    "## ✏️ Конспект",
    "",
    "",
    "## 🔗 Связи и ссылки",
    "- ",
    ""
  ].join("
");
}

// ---------- DOCUMENT ----------
else if (choice === "document") {
  const docType = await tp.system.prompt("Тип документа", "Паспорт");
  const owner = await tp.system.prompt("Владелец", "");
  const issued = await tp.system.prompt("Дата выдачи", tp.date.now("YYYY-MM-DD"));
  const expires = await tp.system.prompt("Дата окончания (опц.)", "");
  const storage = await tp.system.prompt("Где хранится оригинал", "");
  const noteDoc = await tp.system.prompt("Заметки/особенности", "");
  const safeDoc = sanitizeTitle(docType, "Документ");
  const safeOwner = sanitizeTitle(owner, nowDate);
  const baseTitle = `${safeDoc} — ${safeOwner}`.trim();
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${finalTitle}`;
  fm.title = finalTitle;
  fm.type = "document";
  fm.tags = ["docs/id"];
  addFm("doc_type", docType || safeDoc);
  addFm("owner", owner || safeOwner);
  addFm("issued", issued);
  if (expires) addFm("expires", expires);
  if (storage) addFm("storage", storage);
  addFm("sensitive", true);
  body += [
    "## 📁 Документ",
    `- Тип: **${md(docType || safeDoc)}**`,
    `- Владелец: **${md(owner || safeOwner)}**`,
    `- Дата выдачи: **${issued || '—'}**`,
    `- Действителен до: **${expires || '—'}**`,
    `- Где хранится: **${md(storage || '—')}**`,
    "",
    "### 📝 Заметки",
    noteDoc ? md(noteDoc) : "—",
    "",
    "### 📎 Файлы",
    "- Вложи скан документа сюда.",
    ""
  ].join("
");
}

// ---------- HABIT ----------
else if (choice === "habit") {
  const habitName = await tp.system.prompt("Название привычки", "");
  const frequency = await tp.system.suggester(
    ["Ежедневно","Еженедельно","Ежемесячно"],
    ["daily","weekly","monthly"],
    false,
    "Частота контроля"
  );
  const metric = await tp.system.suggester(
    ["☑️ Да/нет","🔢 Количественная"],
    ["boolean","number"],
    false,
    "Тип учёта"
  );
  const target = await tp.system.prompt(metric === "number" ? "Целевое значение за период" : "Целевых выполнений за период", "");
  const startDate = await tp.system.prompt("Дата старта", tp.date.now("YYYY-MM-DD"));
  const safeHabit = sanitizeTitle(habitName, "Привычка");
  const baseTitle = `Привычка — ${safeHabit}`;
  finalTitle = await ensureUniqueTitle(tp.file.folder(true), baseTitle);
  try { await tp.file.rename(finalTitle); } catch(e) {}
  H1 = `# ${habitName || safeHabit}`;
  fm.title = habitName || safeHabit;
  fm.type = "habit";
  fm.tags = ["habit"];
  addFm("habit", habitName || safeHabit);
  addFm("frequency", frequency);
  addFm("metric", metric);
  if (target) {
    const targetVal = Number(cleanAmount(target));
    if (!Number.isNaN(targetVal)) addFm("target", targetVal);
  }
  addFm("tracker_start", startDate);
  const trackerColumn = metric === "number" ? "Значение" : "Выполнено";
  const trackerSummaryType = metric === "number" ? "sum" : "count";
  const trackerSummaryLabel = metric === "number" ? "Сумма" : "Количество выполнений";
  const trackerTable = metric === "number"
    ? `| Дата | Значение | Комментарий |
| --- | --- | --- |
| ${startDate} | 1 | Стартовая запись |`
    : `| Дата | Выполнено | Комментарий |
| --- | --- | --- |
| ${startDate} | 1 | Стартовая запись |`;
  body += [
    "## 🎯 Цель",
    `- Привычка: **${md(habitName || safeHabit)}**`,
    `- Частота: **${frequency || '—'}**`,
    `- Тип учёта: **${metric === 'number' ? 'Количественный' : 'Бинарный'}**`,
    target ? `- Цель: **${target}**` : "- Цель: **—**",
    `- Старт: **${startDate}**`,
    "",
    "### 📊 Трекер",
    "```tracker",
    "searchType: table",
    "tableId: habit-log",
    "line:",
    `  title: ${habitName || 'Привычка'}`,
    `  dataset: ${trackerColumn}`,
    "summary:",
    `  - type: ${trackerSummaryType}`,
    `    label: ${trackerSummaryLabel}`,
    `    column: ${trackerColumn}`,
    "```",
    "",
    "<!-- tracker:habit-log -->",
    trackerTable,
    "",
    "> [!tip] Ведение привычки
> Добавляй новые строки в таблицу выше, чтобы графики обновлялись автоматически.",
    ""
  ].join("
");
}

// ---------- Compose Frontmatter + Header (with visible tags) ----------
const fmLinesArr = [
  "---",
  `title: ${fm.title ? '"' + fm.title.replace(/"/g,'\\"') + '"' : '""'}`,
  `type: ${fm.type || ""}`,
  `tags: [${Array.from(new Set(fm.tags)).join(', ')}]`,
];
if (fmExtra.length) fmLinesArr.push(...fmExtra);
fmLinesArr.push("---", "");
const fmLines = fmLinesArr.join("\n");

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
