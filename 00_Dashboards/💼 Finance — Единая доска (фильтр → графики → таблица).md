---
cssClass: dashboard
---

# 💼 Finance — Единая доска (фильтр → графики → таблица)

> Обновлённая панель: сверху — **фильтр периода**, затем **быстрая сводка и ключевые графики**, ниже — **накопления, расширенная аналитика и интерактивная таблица**. Все блоки реагируют на выбор периода.

## Служебные скрипты (Chart.js, плагины, Tabulator, helper)
```dataviewjs
(async function(){
  const CDN = {
    chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
    datalabels: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
    matrix: 'https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js',
    hierarchy: 'https://cdn.jsdelivr.net/npm/chartjs-chart-hierarchy@2.0.1/dist/chartjs-chart-hierarchy.min.js',
    treemap: 'https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js',
    sankey: 'https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js',
    tabulatorJS: 'https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/js/tabulator.min.js',
    tabulatorCSS: 'https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/css/tabulator.min.css'
  };

  async function loadScript(url, test){
    if (test && test()) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url; s.async = true; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + url));
      document.head.appendChild(s);
    });
  }
  async function loadCss(url){
    if ([...document.styleSheets].some(s => s.href && s.href.includes(url))) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = url;
    document.head.appendChild(link);
    await new Promise(res => { link.onload = res; link.onerror = res; });
  }

  await loadScript(CDN.chart, () => window.Chart);
  await Promise.all([
    loadScript(CDN.datalabels, () => window.ChartDataLabels),
    loadScript(CDN.matrix, () => window.Chart && Chart.registry.getController('matrix')),
    loadScript(CDN.hierarchy, () => window.Chart && Chart.registry.getController('sunburst')),
    loadScript(CDN.treemap, () => window.Chart && Chart.registry.getController('treemap')),
    loadScript(CDN.sankey, () => window.Chart && Chart.registry.getController('sankey')),
    loadCss(CDN.tabulatorCSS).then(() => loadScript(CDN.tabulatorJS, () => window.Tabulator))
  ]);

  if (window.Chart && window.Chart.register && window.ChartDataLabels) {
    try { Chart.register(window.ChartDataLabels); } catch(_) {}
  }

  const palette = ['#5b8bf7','#7b61ff','#ff6f91','#ff9671','#ffc75f','#f9f871','#38ada9','#079992','#60a3bc','#ee5253'];
  const FINANCE_META = {
    expense:      { sign: -1, bucket: 'Расходы', label: 'Расход', color: '#ff6f91' },
    purchase:     { sign: -1, bucket: 'Расходы', label: 'Расход', color: '#ff6f91' },
    tax:          { sign: -1, bucket: 'Расходы', label: 'Налог',  color: '#ff9671' },
    fee:          { sign: -1, bucket: 'Расходы', label: 'Комиссия', color: '#ff9671' },
    income:       { sign:  1, bucket: 'Доходы', label: 'Доход', color: '#1dd1a1' },
    refund:       { sign:  1, bucket: 'Доходы', label: 'Возврат', color: '#48dbfb' },
    savings:      { sign: -1, bucket: 'Сбережения', label: 'Сбережение', color: '#54a0ff' },
    sinking:      { sign: -1, bucket: 'Сбережения', label: 'Сбережение', color: '#54a0ff' },
    invest_buy:   { sign: -1, bucket: 'Инвестиции', label: 'Инвест-покупка', color: '#a29bfe' },
    invest_sell:  { sign:  1, bucket: 'Инвестиции', label: 'Инвест-продажа', color: '#81ecec' },
    dividend:     { sign:  1, bucket: 'Инвестиции', label: 'Дивиденд', color: '#00cec9' },
    divint:       { sign:  1, bucket: 'Инвестиции', label: 'Дивиденд', color: '#00cec9' },
    transfer:     { sign:  0, bucket: 'Переводы', label: 'Перевод', color: '#8395a7' },
    other:        { sign:  1, bucket: 'Прочее', label: 'Прочее', color: '#c8d6e5' }
  };
  const TYPE_ALIAS = {
    purchase: 'expense',
    divint: 'dividend',
    sinking: 'savings'
  };

  const cache = window.financeCache = window.financeCache || { analytics: null, key: null, all: null };

  const fmtCurrency = (num, digits=2) => {
    const n = Number(num || 0);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
  const cleanNumber = (x) => {
    if (x === null || x === undefined) return null;
    const s = String(x).replace(/\s+/g,'').replace(',', '.');
    const m = s.match(/[-+]?\d+(?:[.,]\d+)?/);
    if (!m) return null;
    const val = Number(m[0]);
    return Number.isFinite(val) ? val : null;
  };
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
  const normaliseTag = (tag) => {
    if (!tag) return null;
    const t = String(tag).trim();
    if (!t) return null;
    return t.startsWith('#') ? t : '#' + t;
  };

  function currentRange(){
    let cfg = {};
    try {
      const raw = localStorage.getItem('finance_range2');
      cfg = raw ? JSON.parse(raw) : { mode: 'all' };
    } catch(_) { cfg = { mode: 'all' }; }
    const now = moment().endOf('day');
    const modes = {
      all: () => ({ s: moment('1900-01-01'), e: now }),
      day: () => cfg.day ? (() => { const d = moment(cfg.day,'YYYY-MM-DD'); return { s: d.clone().startOf('day'), e: d.clone().endOf('day') }; })() : null,
      week: () => cfg.week ? (() => { const w = moment(cfg.week+'-1','GGGG-[W]WW-E'); return { s: w.clone().startOf('isoWeek'), e: w.clone().endOf('isoWeek') }; })() : null,
      month: () => cfg.month ? (() => { const m = moment(cfg.month,'YYYY-MM'); return { s: m.clone().startOf('month'), e: m.clone().endOf('month') }; })() : null,
      quarter: () => (cfg.qyear && cfg.quarter) ? (() => { const m = moment({year:Number(cfg.qyear), month:(Number(cfg.quarter)-1)*3, day:1}); return { s: m.clone().startOf('quarter'), e: m.clone().endOf('quarter') }; })() : null,
      year: () => cfg.year ? (() => { const m = moment({year:Number(cfg.year), month:0, day:1}); return { s: m.clone().startOf('year'), e: m.clone().endOf('year') }; })() : null,
      range: () => {
        const s = cfg.start ? moment(cfg.start,'YYYY-MM-DD').startOf('day') : moment('1900-01-01');
        const e = cfg.end ? moment(cfg.end,'YYYY-MM-DD').endOf('day') : now;
        return e.isBefore(s) ? { s:e, e:s } : { s, e };
      }
    };
    const handler = modes[cfg.mode] || modes.all;
    const range = handler() || modes.all();
    return range;
  }

  async function loadPageMeta(path){
    try { return dv.page(path) || {}; } catch(_) { return {}; }
  }

  async function readAllRows(){
    if (cache.all) return cache.all;
    const rows = [];
    const pages = dv.pages('"60_Finance"');
    for (const p of pages){
      const txt = await dv.io.load(p.file.path);
      const meta = await loadPageMeta(p.file.path);
      const tagsMeta = Array.isArray(meta.tags) ? meta.tags : (meta.file && Array.isArray(meta.file.tags) ? meta.file.tags : []);
      const tags = uniq(tagsMeta.map(normaliseTag));
      const typeRaw = TYPE_ALIAS[meta.type] || meta.type || (tags.map(t => t.replace('#','')).find(t => t.startsWith('type/')) || '').replace('type/','');
      const type = TYPE_ALIAS[typeRaw] || typeRaw || 'other';
      const amountFM = meta.amount ?? meta.sum ?? null;
      const amount = cleanNumber(amountFM) ?? cleanNumber((txt.match(/-\s*Сумма[^:]*:\s*\*{0,2}([\d\s.,+-]+)/i)||[])[1]) ?? 0;
      const dateCandidate = meta.date || (txt.match(/-\s*Дата[^:]*:\s*\*{0,2}(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2})?)/i)||[])[1] || moment(p.file.ctime).format('YYYY-MM-DD');
      const dt = moment(dateCandidate, ['YYYY-MM-DD HH:mm','YYYY-MM-DD']);
      const category = meta.category || (txt.match(/-\s*Категория:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const subcategory = meta.subcategory || (txt.match(/-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const source = meta.source || (txt.match(/-\s*Источник:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const from = meta.from || (txt.match(/-\s*Откуда:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const to = meta.to || (txt.match(/-\s*Куда:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const account = meta.account || (txt.match(/-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const asset = meta.asset || (txt.match(/-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const goal = meta.goal || (txt.match(/-\s*Цель:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      const quantity = meta.quantity ?? cleanNumber((txt.match(/-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i)||[])[1]) ?? null;
      const price = meta.price ?? cleanNumber((txt.match(/-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i)||[])[1]) ?? null;
      const note = meta.note || (txt.match(/-\s*Описание[^:]*:\s*\*{0,2}([^\n*]+)/i)||[])[1] || '';
      rows.push({
        file: p.file,
        link: p.file.link,
        title: p.file.name,
        folder: p.file.folder,
        type,
        tags,
        amount: Number(amount || 0),
        currency: meta.currency || 'RUB',
        category: category.trim(),
        subcategory: subcategory.trim(),
        source: source.trim(),
        from: from.trim(),
        to: to.trim(),
        account: account.trim(),
        asset: asset.trim(),
        goal: goal.trim(),
        quantity,
        price,
        note: note.trim(),
        date: dt.isValid() ? dt.format('YYYY-MM-DD') : moment(p.file.ctime).format('YYYY-MM-DD'),
        datetime: dt.isValid() ? dt : moment(p.file.ctime)
      });
    }
    rows.sort((a,b)=> a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    cache.all = rows;
    return rows;
  }

  window.financeAllRows = readAllRows;

  window.financeCurrentRange = () => {
    const range = currentRange();
    return { from: range.s.format('YYYY-MM-DD'), to: range.e.format('YYYY-MM-DD') };
  };

  window.financeRows = async () => {
    const { s, e } = currentRange();
    const rows = await readAllRows();
    return rows.filter(r => {
      const m = moment(r.date, 'YYYY-MM-DD');
      return (!m.isBefore(s) && !m.isAfter(e));
    }).map(r => Object.assign({}, r));
  };

  window.financeAnalytics = async () => {
    const rangeKey = JSON.stringify(window.financeCurrentRange());
    if (cache.analytics && cache.key === rangeKey) return cache.analytics;
    const rows = await window.financeRows();
    const daily = new Map();
    const monthly = new Map();
    const weekly = new Map();
    const categories = new Map();
    const buckets = new Map();
    const accounts = new Map();
    const sources = new Map();
    const goals = new Map();
    const heat = new Map();
    const sankey = new Map();
    const topExpenses = [];

    const totals = { income:0, expense:0, savings:0, investment:0, transfers:0, other:0 };
    const typeTotals = { income:0, expense:0, savings:0, investment:0, net:0 };

    for (const row of rows){
      const meta = FINANCE_META[row.type] || FINANCE_META[TYPE_ALIAS[row.type]] || FINANCE_META.other;
      const bucket = meta.bucket || 'Прочее';
      const sign = meta.sign;
      const signed = sign * Number(row.amount || 0);
      const abs = Math.abs(signed);
      row.signed = signed;
      row.bucket = bucket;
      row.label = meta.label || row.type;
      row.direction = sign < 0 ? 'out' : (sign > 0 ? 'in' : 'neutral');

      if (bucket === 'Доходы') { totals.income += abs; typeTotals.income += abs; }
      else if (bucket === 'Расходы') { totals.expense += abs; typeTotals.expense += abs; }
      else if (bucket === 'Сбережения') { totals.savings += abs; typeTotals.savings += abs; }
      else if (bucket === 'Инвестиции') { totals.investment += abs; typeTotals.investment += signed; }
      else if (bucket === 'Переводы') { totals.transfers += abs; }
      else { totals.other += abs; }
      typeTotals.net += signed;

      const dKey = row.date;
      if (!daily.has(dKey)) daily.set(dKey, { income:0, expense:0, net:0 });
      const dEntry = daily.get(dKey);
      if (sign >= 0) dEntry.income += abs; else dEntry.expense += abs;
      dEntry.net = dEntry.income - dEntry.expense;

      const mKey = moment(row.date,'YYYY-MM-DD').format('YYYY-MM');
      if (!monthly.has(mKey)) monthly.set(mKey, { income:0, expense:0, savings:0, investment:0 });
      const mEntry = monthly.get(mKey);
      if (bucket === 'Доходы') mEntry.income += abs;
      if (bucket === 'Расходы') mEntry.expense += abs;
      if (bucket === 'Сбережения') mEntry.savings += abs;
      if (bucket === 'Инвестиции') mEntry.investment += signed;

      const wKey = moment(row.date,'YYYY-MM-DD').startOf('isoWeek').format('GGGG-[W]WW');
      if (!weekly.has(wKey)) weekly.set(wKey, { income:0, expense:0 });
      const wEntry = weekly.get(wKey);
      if (bucket === 'Доходы') wEntry.income += abs;
      if (bucket === 'Расходы') wEntry.expense += abs;

      if (bucket === 'Расходы') {
        const catKey = row.category || 'Без категории';
        categories.set(catKey, (categories.get(catKey) || 0) + abs);
      }
      buckets.set(bucket, (buckets.get(bucket) || 0) + abs);

      if (row.account) accounts.set(row.account, (accounts.get(row.account) || 0) + signed);
      if (row.source && bucket === 'Доходы') sources.set(row.source, (sources.get(row.source) || 0) + abs);
      if (row.goal) goals.set(row.goal, (goals.get(row.goal) || 0) + abs);

      const day = moment(row.date,'YYYY-MM-DD');
      const heatKey = `${day.isoWeekday()}|${day.format('YYYY-MM')}`;
      heat.set(heatKey, (heat.get(heatKey) || 0) + abs);

      if (row.from || row.to) {
        const key = `${row.from || 'Не указано'}→${row.to || 'Не указано'}`;
        sankey.set(key, (sankey.get(key) || 0) + abs);
      }

      if (bucket === 'Расходы') {
        topExpenses.push({ name: row.category || row.note || row.title, amount: abs });
      }
    }

    topExpenses.sort((a,b)=>b.amount-a.amount);
    const top5Expenses = topExpenses.slice(0,7);

    const analytics = {
      rows,
      totals,
      typeTotals,
      daily: Array.from(daily.entries()).map(([date,v])=>({date,...v})).sort((a,b)=>a.date.localeCompare(b.date)),
      monthly: Array.from(monthly.entries()).map(([month,v])=>({month,...v})).sort((a,b)=>a.month.localeCompare(b.month)),
      weekly: Array.from(weekly.entries()).map(([week,v])=>({week,...v})).sort((a,b)=>a.week.localeCompare(b.week)),
      categories: Array.from(categories.entries()).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      buckets: Array.from(buckets.entries()).map(([name,value])=>({name,value})),
      accounts: Array.from(accounts.entries()).map(([name,value])=>({name,value})),
      sources: Array.from(sources.entries()).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      goals: Array.from(goals.entries()).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value),
      heat,
      sankey,
      topExpenses: top5Expenses
    };

    cache.analytics = analytics;
    cache.key = rangeKey;
    return analytics;
  };

  window.financeHelpers = { fmtCurrency, palette, FINANCE_META };

  window.financeRenderChart = (config, mount) => {
    const holder = mount || document.createElement('div');
    holder.style.position = 'relative';
    holder.style.minHeight = (config._height || 280) + 'px';
    const canvas = document.createElement('canvas');
    holder.innerHTML = '';
    holder.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    config.options = Object.assign({ responsive: true, maintainAspectRatio: false }, config.options || {});
    config.options.plugins = Object.assign({ legend: { display: true, position: 'bottom' } }, config.options.plugins || {});
    new Chart(ctx, config);
    return holder;
  };

  window.financeOnRangeChange = (cb) => {
    window.addEventListener('finance-range-changed', () => {
      cache.analytics = null;
      cache.key = null;
      cb();
    });
  };

  window.financeRenderTable = async (mount) => {
    const analytics = await window.financeAnalytics();
    const rows = analytics.rows.map(row => ({
      date: row.date,
      type: FINANCE_META[row.type]?.label || row.type,
      bucket: row.bucket,
      category: row.category || '—',
      subcategory: row.subcategory || row.goal || '—',
      account: row.account || '—',
      source: row.source || row.from || '—',
      amount: row.signed,
      absAmount: Math.abs(row.signed),
      note: row.note || '',
      link: row.link
    }));
    const table = document.createElement('div');
    table.className = 'finance-table';
    mount.innerHTML = '';
    mount.appendChild(table);
    if (!window.Tabulator) return;
    const tab = new Tabulator(table, {
      data: rows,
      layout: 'fitColumns',
      height: 420,
      reactiveData: false,
      columnDefaults: { tooltip: true },
      columns: [
        { title: 'Дата', field: 'date', sorter: 'date', headerFilter: true, width: 110 },
        { title: 'Тип', field: 'type', sorter: 'string', headerFilter: true },
        { title: 'Бакет', field: 'bucket', sorter: 'string', headerFilter: true },
        { title: 'Категория', field: 'category', sorter: 'string', headerFilter: true },
        { title: 'Подкатегория/Цель', field: 'subcategory', sorter: 'string', headerFilter: true },
        { title: 'Счёт', field: 'account', sorter: 'string', headerFilter: true },
        { title: 'Источник/Откуда', field: 'source', sorter: 'string', headerFilter: true },
        { title: 'Сумма', field: 'amount', sorter: 'number', formatter: cell => {
            const v = cell.getValue();
            const cls = v>0? 'positive' : (v<0? 'negative':'neutral');
            return `<span class="${cls}">${fmtCurrency(v)}</span>`;
          }, bottomCalc: values => fmtCurrency(values.reduce((acc, v)=>acc+(Number(v)||0),0)) },
        { title: 'Сумма abs', field: 'absAmount', sorter: 'number', visible: false },
        { title: 'Ссылка', field: 'link', formatter: cell => {
            const link = cell.getValue();
            return link ? dv.fileLink(link.path, link.display) : '';
          } }
      ],
      initialSort: [
        { column: 'date', dir: 'desc' },
        { column: 'absAmount', dir: 'desc' }
      ]
    });
    return tab;
  };
})();
```

## 0) Фильтр периода (ключ `finance_range2`)
```dataviewjs
(() => {
  const KEY = 'finance_range2';
  const root = dv.el('div','');
  root.style.display = 'grid';
  root.style.gap = '8px';
  root.style.maxWidth = '640px';

  const cfg = (() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { mode:'all' }; }
    catch(_) { return { mode:'all' }; }
  })();

  const setCfg = (patch) => {
    const next = Object.assign({}, cfg, patch || {});
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('finance-range-changed'));
  };

  function row(label){
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '8px';
    const strong = document.createElement('strong');
    strong.textContent = label + ':';
    div.appendChild(strong);
    root.appendChild(div);
    return div;
  }

  const rMode = row('Режим');
  const selectMode = document.createElement('select');
  [['all','Всё'],['day','День'],['week','Неделя'],['month','Месяц'],['quarter','Квартал'],['year','Год'],['range','Диапазон']]
    .forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value; opt.textContent = label;
      if (cfg.mode === value) opt.selected = true;
      selectMode.appendChild(opt);
    });
  rMode.appendChild(selectMode);

  const rDay = row('День'); const inputDay = Object.assign(document.createElement('input'), { type:'date', value: cfg.day || '' }); rDay.appendChild(inputDay);
  const rWeek = row('Неделя'); const inputWeek = Object.assign(document.createElement('input'), { type:'week', value: cfg.week || '' }); rWeek.appendChild(inputWeek);
  const rMonth = row('Месяц'); const inputMonth = Object.assign(document.createElement('input'), { type:'month', value: cfg.month || '' }); rMonth.appendChild(inputMonth);
  const rQuarter = row('Квартал');
  const inputQuarterYear = Object.assign(document.createElement('input'), { type:'number', placeholder:'YYYY', value: cfg.qyear || '' });
  const selectQuarter = document.createElement('select'); ['1','2','3','4'].forEach((val,i)=>{
    const opt = document.createElement('option'); opt.value = val; opt.textContent = ['I','II','III','IV'][i];
    if (String(cfg.quarter||'') === val) opt.selected = true;
    selectQuarter.appendChild(opt);
  });
  rQuarter.append(inputQuarterYear, selectQuarter);
  const rYear = row('Год'); const inputYear = Object.assign(document.createElement('input'), { type:'number', placeholder:'YYYY', value: cfg.year || '' }); rYear.appendChild(inputYear);
  const rRange = row('Диапазон');
  const inputStart = Object.assign(document.createElement('input'), { type:'date', value: cfg.start || '' });
  const inputEnd = Object.assign(document.createElement('input'), { type:'date', value: cfg.end || '' });
  rRange.append(inputStart, document.createTextNode('—'), inputEnd);

  function updateVisibility(){
    const value = selectMode.value;
    rDay.style.display = value === 'day' ? 'flex' : 'none';
    rWeek.style.display = value === 'week' ? 'flex' : 'none';
    rMonth.style.display = value === 'month' ? 'flex' : 'none';
    rQuarter.style.display = value === 'quarter' ? 'flex' : 'none';
    rYear.style.display = value === 'year' ? 'flex' : 'none';
    rRange.style.display = value === 'range' ? 'flex' : 'none';
  }

  selectMode.addEventListener('change', () => {
    setCfg({ mode: selectMode.value, day:null, week:null, month:null, qyear:null, quarter:1, year:null, start:null, end:null });
    updateVisibility();
  });

  [inputDay,inputWeek,inputMonth,inputQuarterYear,selectQuarter,inputYear,inputStart,inputEnd].forEach(el => {
    el.addEventListener('change', () => {
      const payload = {
        mode: selectMode.value,
        day: inputDay.value || null,
        week: inputWeek.value || null,
        month: inputMonth.value || null,
        qyear: inputQuarterYear.value || null,
        quarter: Number(selectQuarter.value || 1),
        year: inputYear.value || null,
        start: inputStart.value || null,
        end: inputEnd.value || null
      };
      if (payload.mode === 'range' && payload.start && payload.end && payload.start > payload.end) {
        const tmp = payload.start; payload.start = payload.end; payload.end = tmp;
      }
      setCfg(payload);
    });
  });

  updateVisibility();
})();
```

## 1) Быстрые показатели
```dataviewjs
(async () => {
  const mount = dv.el('div','', { cls: 'finance-grid' });
  const { totals, typeTotals, rows } = await window.financeAnalytics();
  const { fmtCurrency } = window.financeHelpers;
  const range = window.financeCurrentRange();
  const days = Math.max(1, moment(range.to,'YYYY-MM-DD').diff(moment(range.from,'YYYY-MM-DD'), 'days') + 1);
  const avgNet = typeTotals.net / days;
  const avgExpense = totals.expense / days;
  const cardData = [
    { title:'Доходы', value:`${fmtCurrency(totals.income)} ₽`, subtitle:`Всего за период (${days} дн.)` },
    { title:'Расходы', value:`${fmtCurrency(totals.expense)} ₽`, subtitle:`Среднедневной расход: ${fmtCurrency(avgExpense)} ₽` },
    { title:'Чистый поток', value:`${fmtCurrency(typeTotals.net)} ₽`, subtitle:`Средний день: ${fmtCurrency(avgNet)} ₽` },
    { title:'Инвестиции', value:`${fmtCurrency(totals.investment)} ₽`, subtitle:`Сальдо инвестиций: ${fmtCurrency(typeTotals.investment)} ₽` }
  ];
  mount.innerHTML = '';
  for (const card of cardData){
    const div = document.createElement('div');
    div.className = 'finance-card';
    div.innerHTML = `<h3>${card.title}</h3><div class="value">${card.value}</div><small>${card.subtitle}</small>`;
    mount.appendChild(div);
  }
  window.financeOnRangeChange(async () => {
    const { totals, typeTotals } = await window.financeAnalytics();
    const range = window.financeCurrentRange();
    const days = Math.max(1, moment(range.to,'YYYY-MM-DD').diff(moment(range.from,'YYYY-MM-DD'), 'days') + 1);
    const avgNet = typeTotals.net / days;
    const avgExpense = totals.expense / days;
    mount.querySelectorAll('.finance-card').forEach((cardEl, idx) => {
      const update = [
        { value:`${fmtCurrency(totals.income)} ₽`, subtitle:`Всего за период (${days} дн.)` },
        { value:`${fmtCurrency(totals.expense)} ₽`, subtitle:`Среднедневной расход: ${fmtCurrency(avgExpense)} ₽` },
        { value:`${fmtCurrency(typeTotals.net)} ₽`, subtitle:`Средний день: ${fmtCurrency(avgNet)} ₽` },
        { value:`${fmtCurrency(totals.investment)} ₽`, subtitle:`Сальдо инвестиций: ${fmtCurrency(typeTotals.investment)} ₽` }
      ][idx];
      if (!update) return;
      cardEl.querySelector('.value').textContent = update.value;
      cardEl.querySelector('small').textContent = update.subtitle;
    });
  });
})();
```

## 2) Основные графики
```dataviewjs
(async () => {
  const mount = dv.el('div','', { cls: 'finance-charts' });
  const { financeRenderChart, financeAnalytics, financeHelpers } = window;
  const render = async () => {
    const { categories, daily, monthly, buckets, accounts, typeTotals } = await financeAnalytics();
    const { fmtCurrency, palette } = financeHelpers;
    mount.innerHTML = '';

    // Расходы по категориям (doughnut)
    const catDiv = document.createElement('div');
    catDiv.innerHTML = '<h4>Расходы по категориям</h4>';
    const catData = categories.length ? categories.slice(0,8) : [{name:'Нет данных', value:1}];
    const rest = categories.slice(8).reduce((acc,c)=>acc+c.value,0);
    const labels = catData.map(c=>c.name);
    const values = catData.map(c=>c.value);
    if (rest>0){ labels.push('Прочее'); values.push(rest); }
    catDiv.appendChild(financeRenderChart({
      type:'doughnut',
      data:{ labels, datasets:[{ data: values, backgroundColor: palette }] },
      options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.label}: ${fmtCurrency(ctx.parsed)} ₽` } } } }
    }));
    mount.appendChild(catDiv);

    // Доходы vs расходы по месяцам (stacked bar)
    const monthDiv = document.createElement('div');
    monthDiv.innerHTML = '<h4>Доходы vs Расходы по месяцам</h4>';
    const lastMonths = monthly.slice(-6);
    monthDiv.appendChild(financeRenderChart({
      type:'bar',
      data:{
        labels: lastMonths.map(m=>m.month),
        datasets:[
          { label:'Доходы', data:lastMonths.map(m=>m.income), backgroundColor:'#1dd1a1' },
          { label:'Расходы', data:lastMonths.map(m=>-m.expense), backgroundColor:'#ff6f91' }
        ]
      },
      options:{
        scales:{
          y:{ stacked:false, ticks:{ callback:v=>fmtCurrency(v) } },
          x:{ stacked:false }
        },
        plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${fmtCurrency(Math.abs(ctx.parsed.y))} ₽` } } }
      }
    }));
    mount.appendChild(monthDiv);

    // Денежный поток (дневной)
    const flowDiv = document.createElement('div');
    flowDiv.innerHTML = '<h4>Динамика кэшфлоу (день)</h4>';
    const labelsFlow = daily.map(d=>d.date);
    const incomeFlow = daily.map(d=>d.income);
    const expenseFlow = daily.map(d=>-d.expense);
    const netFlow = daily.map(d=>d.net);
    const ma = (arr, w) => arr.map((_,idx)=>{
      const start = Math.max(0, idx - w + 1);
      const slice = arr.slice(start, idx+1);
      const avg = slice.reduce((acc,v)=>acc+v,0)/slice.length;
      return Number(avg.toFixed(2));
    });
    flowDiv.appendChild(financeRenderChart({
      type:'line',
      data:{
        labels: labelsFlow,
        datasets:[
          { label:'Доходы', data: incomeFlow, fill:false, borderColor:'#1dd1a1', tension:.25 },
          { label:'Расходы', data: expenseFlow, fill:false, borderColor:'#ff6f91', tension:.25 },
          { label:'Net', data: netFlow, fill:false, borderColor:'#54a0ff', tension:.25 },
          { label:'MA7 (Net)', data: ma(netFlow,7), fill:false, borderDash:[6,4], borderColor:'#341f97', tension:.2 },
          { label:'MA30 (Net)', data: ma(netFlow,30), fill:false, borderDash:[2,6], borderColor:'#8395a7', tension:.2 }
        ]
      },
      options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)} ₽` } } } }
    }));
    mount.appendChild(flowDiv);

    // Структура по бакетам (radar)
    const bucketDiv = document.createElement('div');
    bucketDiv.innerHTML = '<h4>Структура потоков</h4>';
    bucketDiv.appendChild(financeRenderChart({
      type:'radar',
      data:{
        labels: buckets.map(b=>b.name),
        datasets:[{ label:'Объем', data: buckets.map(b=>b.value), backgroundColor:'rgba(91,139,247,0.2)', borderColor:'#5b8bf7' }]
      },
      options:{ scales:{ r:{ ticks:{ callback:v=>fmtCurrency(v) } } } }
    }));
    mount.appendChild(bucketDiv);

    // Баланс счетов (horizontal bar)
    const accountDiv = document.createElement('div');
    accountDiv.innerHTML = '<h4>Сальдо по счетам</h4>';
    accountDiv.appendChild(financeRenderChart({
      type:'bar',
      data:{
        labels: accounts.map(a=>a.name),
        datasets:[{ label:'Сальдо', data: accounts.map(a=>a.value), backgroundColor: accounts.map(a=>a.value>=0?'#1dd1a1':'#ff6f91') }]
      },
      options:{
        indexAxis:'y',
        plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.x)} ₽` } } },
        scales:{ x:{ ticks:{ callback:v=>fmtCurrency(v) } } }
      }
    }));
    mount.appendChild(accountDiv);

    // Инвестиции тренд
    const investDiv = document.createElement('div');
    investDiv.innerHTML = '<h4>Инвестиционный поток по месяцам</h4>';
    investDiv.appendChild(financeRenderChart({
      type:'line',
      data:{
        labels: monthly.map(m=>m.month),
        datasets:[{ label:'Инвестиции (нетто)', data: monthly.map(m=>m.investment), borderColor:'#a29bfe', tension:.25, fill:false }]
      },
      options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)} ₽` } } } }
    }));
    mount.appendChild(investDiv);
  };

  await render();
  window.financeOnRangeChange(render);
})();
```

## 3) Цели накоплений и резервов
```dataviewjs
(async () => {
  const mount = dv.el('div','', { cls: 'finance-goals' });
  const { fmtCurrency } = window.financeHelpers;
  const plans = dv.pages('"60_Finance/63_Plans"').sort(p => p.priority || 0, 'asc');
  if (!plans.length) {
    mount.textContent = 'Добавьте заметки в 60_Finance/63_Plans с полями `goal`, `target`, `current`, `emoji`, `deadline`.';
    return;
  }
  mount.innerHTML = '';
  plans.forEach(p => {
    const target = Number(p.target || 0);
    const current = Number(p.current || 0);
    const percent = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
    const div = document.createElement('div');
    div.className = 'goal';
    const header = document.createElement('div');
    header.className = 'goal-header';
    header.innerHTML = `<span>${p.emoji || '💰'} <strong>${p.goal || p.file.name}</strong></span><span>${percent}%</span>`;
    const body = document.createElement('div');
    body.innerHTML = `<div class="progress-bar"><span style="width:${percent}%"></span></div><small>Сейчас: ${fmtCurrency(current)} ₽ / Цель: ${fmtCurrency(target)} ₽${p.deadline ? ' • дедлайн: ' + moment(p.deadline).format('DD.MM.YYYY') : ''}</small>`;
    div.append(header, body);
    mount.appendChild(div);
  });
  window.financeOnRangeChange(() => {});
})();
```

## 4) Расширенная аналитика
```dataviewjs
(async () => {
  const mount = dv.el('div','', { cls: 'finance-subgrid' });
  const { financeRenderChart, financeAnalytics, financeHelpers } = window;
  const render = async () => {
    const { daily, sources, goals, heat, sankey, topExpenses } = await financeAnalytics();
    const { fmtCurrency, palette } = financeHelpers;
    mount.innerHTML = '';

    // Топ расходов
    const topDiv = document.createElement('div');
    topDiv.innerHTML = '<h4>Топ статей расхода</h4>';
    const labels = topExpenses.map(t=>t.name);
    const data = topExpenses.map(t=>t.amount);
    if (!labels.length) {
      topDiv.appendChild(document.createTextNode('Нет расходов за выбранный период.'));
    } else {
      topDiv.appendChild(financeRenderChart({
        type:'bar',
        data:{ labels, datasets:[{ label:'Сумма', data, backgroundColor: palette }] },
        options:{ indexAxis:'y', plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.label}: ${fmtCurrency(ctx.parsed.x)} ₽` } } } }
      }));
    }
    mount.appendChild(topDiv);

    // Источники дохода
    const srcDiv = document.createElement('div');
    srcDiv.innerHTML = '<h4>Источники доходов</h4>';
    if (!sources.length) {
      srcDiv.appendChild(document.createTextNode('Нет доходов за выбранный период.'));
    } else {
      srcDiv.appendChild(financeRenderChart({
        type:'polarArea',
        data:{ labels: sources.slice(0,8).map(s=>s.name), datasets:[{ data: sources.slice(0,8).map(s=>s.value), backgroundColor: palette }] },
        options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.label}: ${fmtCurrency(ctx.parsed)} ₽` } } } }
      }));
    }
    mount.appendChild(srcDiv);

    // Тепловая карта расходов по неделям
    const heatDiv = document.createElement('div');
    heatDiv.innerHTML = '<h4>Расходы: неделя × месяц</h4>';
    const heatData = Array.from(heat.entries()).map(([key,value]) => {
      const [weekday, month] = key.split('|');
      return { x: month, y: Number(weekday), v: value };
    });
    const months = uniq(heatData.map(d=>d.x));
    heatDiv.appendChild(financeRenderChart({
      type:'matrix',
      data:{ datasets:[{
        label:'Heat',
        data: heatData,
        width: ({chart}) => chart.chartArea.width / Math.max(1, months.length),
        height: ({chart}) => chart.chartArea.height / 7,
        backgroundColor: ctx => {
          const v = ctx.raw.v || 0;
          const max = Math.max(...heatData.map(d=>d.v || 1));
          const alpha = max ? Math.min(1, v/max) : 0;
          return `rgba(91,139,247,${alpha})`;
        }
      }]},
      options:{
        scales:{
          x:{ type:'category', labels: months },
          y:{ type:'category', labels:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] }
        },
        plugins:{ tooltip:{ callbacks:{ title: ctx => `Неделя: ${ctx[0].raw.y}`, label: ctx => `Сумма: ${fmtCurrency(ctx.raw.v)} ₽` } } }
      }
    }));
    mount.appendChild(heatDiv);

    // Потоки переводов (sankey)
    const sankeyDiv = document.createElement('div');
    sankeyDiv.innerHTML = '<h4>Перетоки средств</h4>';
    const sankeyData = Array.from(sankey.entries()).map(([key,value]) => {
      const [from,to] = key.split('→');
      return { from, to, flow: value };
    });
    if (!sankeyData.length) {
      sankeyDiv.appendChild(document.createTextNode('Нет переводов за период.'));
    } else {
      sankeyDiv.appendChild(financeRenderChart({
        type:'sankey',
        data:{ datasets:[{ label:'Переводы', data: sankeyData }] },
        options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.raw.from} → ${ctx.raw.to}: ${fmtCurrency(ctx.raw.flow)} ₽` } } } }
      }));
    }
    mount.appendChild(sankeyDiv);

    // Сбережения по целям (sunburst)
    const goalDiv = document.createElement('div');
    goalDiv.innerHTML = '<h4>Сбережения по целям</h4>';
    if (!goals.length) {
      goalDiv.appendChild(document.createTextNode('Операций со сбережениями не было.'));
    } else {
      goalDiv.appendChild(financeRenderChart({
        type:'sunburst',
        data:{ labels: goals.map(g=>g.name), datasets:[{ data: goals.map(g=>g.value) }] },
        options:{ plugins:{ tooltip:{ callbacks:{ label: ctx => `${ctx.label}: ${fmtCurrency(ctx.raw)} ₽` } } } }
      }));
    }
    mount.appendChild(goalDiv);
  };

  await render();
  window.financeOnRangeChange(render);
})();
```

## 5) Универсальная таблица операций
```dataviewjs
(async () => {
  const mount = dv.el('div','');
  await window.financeRenderTable(mount);
  window.financeOnRangeChange(async () => {
    await window.financeRenderTable(mount);
  });
})();
```
