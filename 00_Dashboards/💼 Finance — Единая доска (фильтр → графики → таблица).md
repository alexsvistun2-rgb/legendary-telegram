---
cssClass: dashboard
---

# 💼 Finance — Универсальная аналитика

> Комплексный финансовый центр: выбери период, следи за ключевыми показателями, графиками и детальной таблицей. Все данные берутся из папки **60_Finance** и обновляются автоматически.

## 0. Библиотеки и вспомогательные функции
```dataviewjs
(async function(){
  async function loadOnce(url, ready){
    try { if (ready && ready()) return; } catch(_) {}
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Не удалось загрузить ' + url));
      document.head.appendChild(s);
    });
  }
  function hasChart(){ try { return !!window.Chart; } catch(_) { return false; } }
  await loadOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', hasChart);
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0', () => {
    try { return !!(window.Chart && Chart.registry.getPlugin('datalabels')); } catch(_) { return false; }
  });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js', () => {
    try { return !!(Chart && Chart.controllers && Chart.controllers.matrix); } catch(_) { return false; }
  });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js', () => {
    try { return !!(Chart && Chart.controllers && Chart.controllers.sankey); } catch(_) { return false; }
  });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js', () => {
    try { return !!(Chart && Chart.controllers && Chart.controllers.treemap); } catch(_) { return false; }
  });

  if (window.Chart && window.Chart.register && window.ChartDataLabels) {
    try { Chart.register(window.ChartDataLabels); } catch(_) {}
  }

  if (!window.renderChart) {
    window.renderChart = function(cfg, mount){
      const holder = mount || document.createElement('div');
      holder.innerHTML = '';
      const canvas = document.createElement('canvas');
      holder.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      cfg.options = cfg.options || {};
      cfg.options.maintainAspectRatio = false;
      cfg.options.responsive = true;
      cfg.options.plugins = cfg.options.plugins || {};
      if (!cfg.options.plugins.legend) cfg.options.plugins.legend = { display: true };
      if (!cfg.options.plugins.tooltip) cfg.options.plugins.tooltip = { enabled: true };
      new Chart(ctx, cfg);
      return holder;
    };
  }

  if (!window.financeFormat) {
    window.financeFormat = {
      money: (value, digits = 0) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0),
      number: (value, digits = 1) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value || 0),
      percent: (value, digits = 1) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value || 0)}%`
    };
  }

  window.financePalette = window.financePalette || {
    positive: '#2ecc71',
    negative: '#e74c3c',
    accent: '#2980b9',
    muted: '#7f8c8d',
    warning: '#f1c40f'
  };
})();
```

## 1. Фильтр периода
```dataviewjs
(() => {
  const KEY = 'finance_range3';
  const root = dv.el('div', '');
  root.className = 'finance-range-filter';
  root.style.display = 'grid';
  root.style.gap = '8px';
  root.style.padding = '8px 12px';
  root.style.border = '1px solid var(--background-modifier-border)';
  root.style.borderRadius = '8px';
  root.style.background = 'var(--background-primary-alt)';

  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { mode: 'month', month: moment().format('YYYY-MM') };
      return JSON.parse(raw);
    } catch(_) {
      return { mode: 'month', month: moment().format('YYYY-MM') };
    }
  };
  const write = (patch) => {
    const current = Object.assign({}, read(), patch || {});
    localStorage.setItem(KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('finance-range-changed'));
  };

  const cfg = read();
  const makeRow = (label) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.alignItems = 'center';
    const strong = document.createElement('strong');
    strong.textContent = label;
    row.appendChild(strong);
    root.appendChild(row);
    return row;
  };

  const rowMode = makeRow('Режим');
  const selectMode = document.createElement('select');
  [["all","Всё"],["day","День"],["week","Неделя"],["month","Месяц"],["quarter","Квартал"],["year","Год"],["range","Диапазон"]]
    .forEach(([value,label]) => {
      const opt = document.createElement('option');
      opt.value = value; opt.textContent = label; if (cfg.mode === value) opt.selected = true; selectMode.appendChild(opt);
    });
  rowMode.appendChild(selectMode);

  const rowDay = makeRow('День');
  const inputDay = document.createElement('input'); inputDay.type = 'date'; inputDay.value = cfg.day || '';
  rowDay.appendChild(inputDay);

  const rowWeek = makeRow('Неделя');
  const inputWeek = document.createElement('input'); inputWeek.type = 'week'; inputWeek.value = cfg.week || '';
  rowWeek.appendChild(inputWeek);

  const rowMonth = makeRow('Месяц');
  const inputMonth = document.createElement('input'); inputMonth.type = 'month'; inputMonth.value = cfg.month || moment().format('YYYY-MM');
  rowMonth.appendChild(inputMonth);

  const rowQuarter = makeRow('Квартал');
  const inputQuarterYear = document.createElement('input'); inputQuarterYear.type = 'number'; inputQuarterYear.placeholder = 'Год'; inputQuarterYear.value = cfg.qyear || moment().year();
  const inputQuarter = document.createElement('select');
  ['1','2','3','4'].forEach((q,i) => {
    const opt = document.createElement('option');
    opt.value = q; opt.textContent = ['I','II','III','IV'][i];
    if (String(cfg.quarter || '1') === q) opt.selected = true;
    inputQuarter.appendChild(opt);
  });
  rowQuarter.append(inputQuarterYear, inputQuarter);

  const rowYear = makeRow('Год');
  const inputYear = document.createElement('input'); inputYear.type = 'number'; inputYear.placeholder = 'Год'; inputYear.value = cfg.year || moment().year();
  rowYear.appendChild(inputYear);

  const rowRange = makeRow('Диапазон');
  const inputStart = document.createElement('input'); inputStart.type = 'date'; inputStart.value = cfg.start || '';
  const inputEnd = document.createElement('input'); inputEnd.type = 'date'; inputEnd.value = cfg.end || '';
  rowRange.append(inputStart, document.createTextNode('—'), inputEnd);

  const syncVisibility = () => {
    const mode = selectMode.value;
    rowDay.style.display = mode === 'day' ? 'flex' : 'none';
    rowWeek.style.display = mode === 'week' ? 'flex' : 'none';
    rowMonth.style.display = mode === 'month' ? 'flex' : 'none';
    rowQuarter.style.display = mode === 'quarter' ? 'flex' : 'none';
    rowYear.style.display = mode === 'year' ? 'flex' : 'none';
    rowRange.style.display = mode === 'range' ? 'flex' : 'none';
  };

  selectMode.addEventListener('change', () => {
    write({ mode: selectMode.value, day: null, week: null, month: null, qyear: null, quarter: null, year: null, start: null, end: null });
    syncVisibility();
  });

  [inputDay, inputWeek, inputMonth, inputQuarterYear, inputQuarter, inputYear, inputStart, inputEnd].forEach(el => {
    el.addEventListener('change', () => {
      const next = {
        mode: selectMode.value,
        day: inputDay.value || null,
        week: inputWeek.value || null,
        month: inputMonth.value || null,
        qyear: inputQuarterYear.value || null,
        quarter: Number(inputQuarter.value || 1),
        year: inputYear.value || null,
        start: inputStart.value || null,
        end: inputEnd.value || null
      };
      if (next.mode === 'range' && next.start && next.end && next.start > next.end) {
        const tmp = next.start; next.start = next.end; next.end = tmp;
      }
      write(next);
    });
  });

  syncVisibility();
})();
```

## 2. Провайдер данных и кэширование
```dataviewjs
(() => {
  const KEY = 'finance_range3';
  const FOLDER = '60_Finance';
  const IN_TYPES = new Set(['income','refund','dividend','invest_sell']);
  const ZERO_TYPES = new Set(['transfer']);
  window.financeInflowTypes = IN_TYPES;
  const RX = {
    DATE: /-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/i,
    TYPE: /#type\/([A-Za-z_]+)/,
    AMOUNT: /-\s*Сумма:\s*\*{0,2}([\d\s.,+-]+)/i,
    CATEGORY: /-\s*Категория:\s*\*{0,2}([^\n*]+)/i,
    SUBCATEGORY: /-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i,
    SOURCE: /-\s*Источник:\s*\*{0,2}([^\n*]+)/i,
    FROM: /-\s*Откуда:\s*\*{0,2}([^\n*]+)/i,
    TO: /-\s*Куда:\s*\*{0,2}([^\n*]+)/i,
    ACCOUNT: /-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i,
    TICKER: /-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i,
    QTY: /-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i,
    PRICE: /-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i
  };

  const parseNumber = (value) => {
    if (value == null) return 0;
    const cleaned = String(value).replace(/\s+/g,'').replace(',', '.');
    const matched = cleaned.match(/[-+]?\d*(?:\.\d+)?/);
    if (!matched || matched[0] === '' || matched[0] === '-' || matched[0] === '+') return 0;
    return Number(matched[0]);
  };

  const readCfg = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { mode: 'month', month: moment().format('YYYY-MM') };
      return JSON.parse(raw);
    } catch(_) {
      return { mode: 'month', month: moment().format('YYYY-MM') };
    }
  };

  const computeRange = () => {
    const cfg = readCfg();
    const now = moment().endOf('day');
    if (!cfg.mode || cfg.mode === 'all') return { start: moment('1900-01-01'), end: now };
    if (cfg.mode === 'day' && cfg.day) {
      const d = moment(cfg.day, 'YYYY-MM-DD');
      return { start: d.clone().startOf('day'), end: d.clone().endOf('day') };
    }
    if (cfg.mode === 'week' && cfg.week) {
      const w = moment(cfg.week + '-1', 'GGGG-[W]WW-E');
      return { start: w.clone().startOf('isoWeek'), end: w.clone().endOf('isoWeek') };
    }
    if (cfg.mode === 'month' && cfg.month) {
      const m = moment(cfg.month, 'YYYY-MM');
      return { start: m.clone().startOf('month'), end: m.clone().endOf('month') };
    }
    if (cfg.mode === 'quarter' && cfg.qyear) {
      const q = Number(cfg.quarter || 1) - 1;
      const y = Number(cfg.qyear);
      const m = moment({ year: y, month: q * 3, day: 1 });
      return { start: m.clone().startOf('quarter'), end: m.clone().endOf('quarter') };
    }
    if (cfg.mode === 'year' && cfg.year) {
      const y = Number(cfg.year);
      const m = moment({ year: y, month: 0, day: 1 });
      return { start: m.clone().startOf('year'), end: m.clone().endOf('year') };
    }
    if (cfg.mode === 'range') {
      let start = cfg.start ? moment(cfg.start, 'YYYY-MM-DD').startOf('day') : moment('1900-01-01');
      let end = cfg.end ? moment(cfg.end, 'YYYY-MM-DD').endOf('day') : now;
      if (end.isBefore(start)) { const tmp = start; start = end; end = tmp; }
      return { start, end };
    }
    return { start: moment('1900-01-01'), end: now };
  };

  let allRowsPromise = null;
  const rangeCache = new Map();
  const metricsCache = new Map();
  const shouldSkip = (path) => /60\.2_Goals|60\.3_Reports|60\.0_/.test(path || '');

  const loadAllRows = async () => {
    const rows = [];
    const pages = dv.pages(`"${FOLDER}"`);
    for (const page of pages) {
      const path = page.file.path;
      if (shouldSkip(path)) continue;
      const raw = await dv.io.load(path).catch(() => '');
      if (!raw) continue;
      const matchDate = raw.match(RX.DATE);
      let dt = matchDate ? moment(matchDate[1], 'YYYY-MM-DD') : moment(page.file.ctime);
      if (matchDate && matchDate[2]) {
        dt = moment(matchDate[1] + ' ' + matchDate[2], 'YYYY-MM-DD HH:mm');
      }
      if (!dt.isValid()) dt = moment(page.file.ctime);
      if (!dt.isValid()) continue;
      const type = (raw.match(RX.TYPE) || [])[1] || 'other';
      const amountAbs = Math.abs(parseNumber((raw.match(RX.AMOUNT) || [])[1] || 0));
      if (!amountAbs) continue;
      let signedAmount = amountAbs;
      if (ZERO_TYPES.has(type)) signedAmount = 0;
      else if (!IN_TYPES.has(type)) signedAmount = -amountAbs;
      const read = (rx) => {
        const m = raw.match(rx);
        return m ? String(m[1]).trim() : '';
      };
      const quantity = parseNumber(read(RX.QTY));
      const price = parseNumber(read(RX.PRICE));
      rows.push({
        date: dt.format('YYYY-MM-DD'),
        time: dt.format('HH:mm'),
        timestamp: dt.valueOf(),
        type,
        amount: signedAmount,
        abs: amountAbs,
        category: read(RX.CATEGORY),
        subcategory: read(RX.SUBCATEGORY),
        source: read(RX.SOURCE),
        from: read(RX.FROM),
        to: read(RX.TO),
        account: read(RX.ACCOUNT),
        ticker: read(RX.TICKER),
        quantity: quantity || null,
        price: price || null,
        link: page.file.link
      });
    }
    rows.sort((a,b) => a.timestamp - b.timestamp || a.type.localeCompare(b.type));
    return rows;
  };

  const getAllRows = async () => {
    if (!allRowsPromise) allRowsPromise = loadAllRows();
    return allRowsPromise;
  };

  const rangeKey = (range) => `${range.start.format('YYYY-MM-DD')}__${range.end.format('YYYY-MM-DD')}`;

  const getRowsForRange = async (range) => {
    const key = rangeKey(range);
    if (rangeCache.has(key)) return rangeCache.get(key);
    const all = await getAllRows();
    const filtered = all.filter(row => row.timestamp >= range.start.valueOf() && row.timestamp <= range.end.valueOf());
    rangeCache.set(key, filtered);
    return filtered;
  };

  const computeMetrics = (range, rows) => {
    const daysCount = Math.max(1, range.end.diff(range.start, 'days') + 1);
    const totals = { income: 0, expense: 0, transfer: 0, net: 0 };
    const counts = { total: rows.length, income: 0, expense: 0, transfer: 0 };
    const dayMap = new Map();
    const monthMap = new Map();
    const categoryMap = new Map();
    const accountMap = new Map();
    const sourceMap = new Map();
    const heatMap = new Map();
    const sankeyMap = new Map();
    const topExpenses = [];
    let cumulative = 0;

    const ensure = (map, key, init) => {
      if (!map.has(key)) map.set(key, init());
      return map.get(key);
    };

    rows.forEach(row => {
      const day = row.date;
      const month = row.date.slice(0,7);
      const abs = row.abs;
      const dayEntry = ensure(dayMap, day, () => ({ income: 0, expense: 0 }));
      const monthEntry = ensure(monthMap, month, () => ({ income: 0, expense: 0 }));

      if (window.financeInflowTypes?.has?.(row.type)) {
        totals.income += abs;
        totals.net += abs;
        counts.income += 1;
        dayEntry.income += abs;
        monthEntry.income += abs;
        if (row.source) sourceMap.set(row.source, (sourceMap.get(row.source) || 0) + abs);
        if (row.to) accountMap.set(row.to, (accountMap.get(row.to) || 0) + abs);
        const from = row.source || 'Источник';
        const to = row.to || row.category || 'Счёт';
        sankeyMap.set(`${from}|${to}`, (sankeyMap.get(`${from}|${to}`) || 0) + abs);
      } else if (ZERO_TYPES.has(row.type)) {
        totals.transfer += abs;
        counts.transfer += 1;
        if (row.from) accountMap.set(row.from, (accountMap.get(row.from) || 0) - abs);
        if (row.to) accountMap.set(row.to, (accountMap.get(row.to) || 0) + abs);
        if (row.from && row.to) {
          sankeyMap.set(`${row.from}|${row.to}`, (sankeyMap.get(`${row.from}|${row.to}`) || 0) + abs);
        }
      } else {
        totals.expense += abs;
        totals.net -= abs;
        counts.expense += 1;
        dayEntry.expense += abs;
        monthEntry.expense += abs;
        const cat = row.category || '—';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + abs);
        heatMap.set(day, (heatMap.get(day) || 0) + abs);
        if (row.from) accountMap.set(row.from, (accountMap.get(row.from) || 0) - abs);
        const from = row.from || 'Счёт';
        const to = row.category || 'Расходы';
        sankeyMap.set(`${from}|${to}`, (sankeyMap.get(`${from}|${to}`) || 0) + abs);
        topExpenses.push({ amount: abs, date: row.date, category: cat, link: row.link });
      }

      cumulative += row.amount;
      row.cumulative = cumulative;
    });

    const cashflowByDay = Array.from(dayMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date,val]) => ({ date, income: +val.income.toFixed(2), expense: +val.expense.toFixed(2), net: +(val.income - val.expense).toFixed(2) }));
    const monthlyFlow = Array.from(monthMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([month,val]) => ({ month, income: +val.income.toFixed(2), expense: +val.expense.toFixed(2), net: +(val.income - val.expense).toFixed(2) }));
    const categories = Array.from(categoryMap.entries()).sort((a,b) => b[1] - a[1]).map(([category,value]) => ({ category, value: +value.toFixed(2) }));
    const totalExpense = categories.reduce((acc, item) => acc + item.value, 0);
    categories.forEach(item => { item.share = totalExpense ? +(item.value / totalExpense * 100).toFixed(2) : 0; });
    const cumulativeSeries = rows.map(row => ({ date: row.date, value: +row.cumulative.toFixed(2) }));
    const accounts = Array.from(accountMap.entries()).sort((a,b) => Math.abs(b[1]) - Math.abs(a[1])).map(([name,value]) => ({ name, value: +value.toFixed(2) }));
    const sources = Array.from(sourceMap.entries()).sort((a,b) => b[1] - a[1]).map(([name,value]) => ({ name, value: +value.toFixed(2) }));
    const heatmap = Array.from(heatMap.entries()).map(([date,value]) => ({ date, value: +value.toFixed(2) }));
    const sankey = Array.from(sankeyMap.entries()).map(([key,value]) => {
      const [from,to] = key.split('|');
      return { from, to, value: +value.toFixed(2) };
    });
    const top = topExpenses.sort((a,b) => b.amount - a.amount).slice(0,5).map(item => ({ amount: +item.amount.toFixed(2), date: item.date, category: item.category, link: item.link }));

    return {
      range: { from: range.start.format('YYYY-MM-DD'), to: range.end.format('YYYY-MM-DD'), days: daysCount },
      totals: {
        income: +totals.income.toFixed(2),
        expense: +totals.expense.toFixed(2),
        transfer: +totals.transfer.toFixed(2),
        net: +totals.net.toFixed(2)
      },
      counts,
      perDay: {
        avgIncome: totals.income / daysCount,
        avgExpense: totals.expense / daysCount,
        avgNet: totals.net / daysCount
      },
      cashflowByDay,
      monthlyFlow,
      categories,
      totalExpense,
      cumulative: cumulativeSeries,
      accounts,
      sources,
      heatmap,
      sankey,
      topExpenses: top
    };
  };

  const getMetricsForRange = async (range) => {
    const key = rangeKey(range);
    if (metricsCache.has(key)) return metricsCache.get(key);
    const rows = await getRowsForRange(range);
    const metrics = computeMetrics(range, rows);
    metricsCache.set(key, metrics);
    return metrics;
  };

  window.financeCurrentRange = () => {
    const range = computeRange();
    return { from: range.start.format('YYYY-MM-DD'), to: range.end.format('YYYY-MM-DD') };
  };

  window.financeRows = async () => {
    const range = computeRange();
    const rows = await getRowsForRange(range);
    return rows.map(row => Object.assign({}, row));
  };

  window.financeMetrics = async () => {
    const range = computeRange();
    const metrics = await getMetricsForRange(range);
    return JSON.parse(JSON.stringify(metrics));
  };

  window.financeGetData = async () => {
    const range = computeRange();
    const rows = await getRowsForRange(range);
    const metrics = await getMetricsForRange(range);
    return {
      range: { from: range.start.clone(), to: range.end.clone() },
      rows: rows.map(row => Object.assign({}, row)),
      metrics: JSON.parse(JSON.stringify(metrics))
    };
  };

  window.financeRefreshAll = () => {
    allRowsPromise = null;
    rangeCache.clear();
    metricsCache.clear();
    window.dispatchEvent(new CustomEvent('finance-data-changed'));
  };

  const notifyRange = () => window.dispatchEvent(new CustomEvent('finance-data-changed'));
  window.addEventListener('finance-range-changed', notifyRange);

  try { app?.vault?.on?.('modify', window.financeRefreshAll); } catch(_) {}
  try { app?.metadataCache?.on?.('dataview:metadata-change', window.financeRefreshAll); } catch(_) {}
})();
```

## 3. Быстрая сводка периода
```dataviewjs
(() => {
  const wrap = dv.el('div','');
  const header = document.createElement('div');
  header.style.fontWeight = '600';
  header.style.marginBottom = '8px';
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  grid.style.gap = '12px';
  wrap.append(header, grid);

  const render = async () => {
    const data = await window.financeGetData();
    const metrics = data.metrics;
    const fmt = window.financeFormat;
    const palette = window.financePalette;
    header.textContent = `Диапазон: ${metrics.range.from} — ${metrics.range.to} (${metrics.range.days} дн.)`;
    grid.innerHTML = '';
    const cards = [
      {
        label: 'Доходы',
        value: fmt.money(metrics.totals.income, 0),
        note: `${metrics.counts.income} операций`,
        color: palette.positive
      },
      {
        label: 'Расходы',
        value: fmt.money(metrics.totals.expense, 0),
        note: `Среднее ${fmt.money(metrics.perDay.avgExpense, 0)} в день`,
        color: palette.negative
      },
      {
        label: 'Чистый результат',
        value: fmt.money(metrics.totals.net, 0),
        note: metrics.totals.net >= 0 ? 'Профицит' : 'Дефицит',
        color: metrics.totals.net >= 0 ? palette.positive : palette.negative
      },
      {
        label: 'Средний день',
        value: fmt.money(metrics.perDay.avgNet, 0),
        note: `Доход ${fmt.money(metrics.perDay.avgIncome,0)} / расход ${fmt.money(metrics.perDay.avgExpense,0)}`,
        color: palette.accent
      },
      {
        label: 'Операции',
        value: metrics.counts.total.toString(),
        note: `Расходы ${metrics.counts.expense} · Доходы ${metrics.counts.income} · Переводы ${metrics.counts.transfer}`,
        color: palette.muted
      },
      metrics.categories.length ? {
        label: `Топ категория: ${metrics.categories[0].category}`,
        value: fmt.money(metrics.categories[0].value, 0),
        note: `Доля ${window.financeFormat.percent(metrics.categories[0].share, 1)}`,
        color: palette.warning
      } : null
    ].filter(Boolean);

    cards.forEach(card => {
      const el = document.createElement('div');
      el.style.border = '1px solid var(--background-modifier-border)';
      el.style.borderRadius = '12px';
      el.style.padding = '14px';
      el.style.display = 'grid';
      el.style.gap = '6px';
      const label = document.createElement('div');
      label.textContent = card.label;
      label.style.fontSize = '0.9rem';
      label.style.color = 'var(--text-muted)';
      const value = document.createElement('div');
      value.textContent = card.value;
      value.style.fontSize = '1.4rem';
      value.style.fontWeight = '700';
      value.style.color = card.color;
      const note = document.createElement('div');
      note.textContent = card.note;
      note.style.fontSize = '0.85rem';
      note.style.color = 'var(--text-muted)';
      el.append(label, value, note);
      grid.appendChild(el);
    });
  };

  const refresh = () => render();
  window.addEventListener('finance-data-changed', refresh);
  dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
  render();
})();
```

## 4. Ключевые графики (2 колонки)
> [!multi-column|2]
>
>> [!info] Кэш-флоу по дням и скользящее среднее
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '320px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const movingAverage = (arr, windowSize) => {
>>     const out = [];
>>     for (let i = 0; i < arr.length; i++) {
>>       const start = Math.max(0, i - windowSize + 1);
>>       let sum = 0;
>>       let count = 0;
>>       for (let j = start; j <= i; j++) { sum += arr[j]; count++; }
>>       out.push(count ? +(sum / count).toFixed(2) : 0);
>>     }
>>     return out;
>>   };
>>   const render = async () => {
>>     const data = await window.financeMetrics();
>>     const series = data.cashflowByDay;
>>     mount.innerHTML = '';
>>     if (!series.length) {
>>       mount.textContent = 'Нет операций в выбранном диапазоне.';
>>       return;
>>     }
>>     const labels = series.map(s => s.date);
>>     const income = series.map(s => +s.income.toFixed(2));
>>     const expense = series.map(s => -Number(s.expense.toFixed(2)));
>>     const net = series.map(s => +s.net.toFixed(2));
>>     const ma7 = movingAverage(net, 7);
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels,
>>         datasets: [
>>           { label: 'Доходы', data: income, backgroundColor: palette.positive, stack: 'flows' },
>>           { label: 'Расходы', data: expense, backgroundColor: palette.negative, stack: 'flows' },
>>           { label: 'Net', data: net, type: 'line', borderColor: palette.accent, backgroundColor: palette.accent, borderWidth: 2, tension: 0.3, fill: false, yAxisID: 'y' },
>>           { label: 'MA7', data: ma7, type: 'line', borderColor: palette.warning, borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false, yAxisID: 'y' }
>>         ]
>>       },
>>       options: {
>>         scales: {
>>           x: { stacked: true },
>>           y: {
>>             stacked: true,
>>             ticks: { callback: (value) => fmt.money(value, 0) }
>>           }
>>         },
>>         plugins: {
>>           tooltip: {
>>             callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt.money(ctx.parsed.y, 0)}` }
>>           }
>>         }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Структура расходов по категориям
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '300px';
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const categories = metrics.categories;
>>     mount.innerHTML = '';
>>     if (!categories.length) {
>>       mount.textContent = 'Нет расходов в выбранном диапазоне.';
>>       return;
>>     }
>>     const colors = categories.map((_, idx) => `hsl(${(idx * 47) % 360} 65% 55% / 0.85)`);
>>     window.renderChart({
>>       type: 'doughnut',
>>       data: {
>>         labels: categories.map(c => `${c.category}`),
>>         datasets: [{ data: categories.map(c => c.value), backgroundColor: colors }]
>>       },
>>       options: {
>>         plugins: {
>>           datalabels: {
>>             formatter: (value, ctx) => {
>>               const total = ctx.chart.data.datasets[0].data.reduce((a,b) => a + b, 0) || 1;
>>               const share = value / total * 100;
>>               return share >= 5 ? `${share.toFixed(1)}%` : '';
>>             }
>>           },
>>           tooltip: {
>>             callbacks: { label: (ctx) => `${ctx.label}: ${fmt.money(ctx.parsed,0)}` }
>>           }
>>         }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

> [!multi-column|2]
>
>> [!info] Кумулятивный результат периода
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '300px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const series = metrics.cumulative;
>>     mount.innerHTML = '';
>>     if (!series.length) {
>>       mount.textContent = 'Нет данных.';
>>       return;
>>     }
>>     window.renderChart({
>>       type: 'line',
>>       data: {
>>         labels: series.map(s => s.date),
>>         datasets: [{
>>           label: 'Кумулятивный итог',
>>           data: series.map(s => s.value),
>>           borderColor: palette.accent,
>>           backgroundColor: palette.accent,
>>           fill: 'origin',
>>           pointRadius: 0,
>>           tension: 0.25
>>         }]
>>       },
>>       options: {
>>         plugins: {
>>           tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt.money(ctx.parsed.y, 0)}` } }
>>         },
>>         scales: { y: { ticks: { callback: (value) => fmt.money(value, 0) } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Доходы и расходы по месяцам
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '300px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const flow = metrics.monthlyFlow;
>>     mount.innerHTML = '';
>>     if (!flow.length) {
>>       mount.textContent = 'Нет данных.';
>>       return;
>>     }
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels: flow.map(f => f.month),
>>         datasets: [
>>           { label: 'Доходы', data: flow.map(f => f.income), backgroundColor: palette.positive, stack: 'monthly' },
>>           { label: 'Расходы', data: flow.map(f => -f.expense), backgroundColor: palette.negative, stack: 'monthly' },
>>           { label: 'Net', data: flow.map(f => f.net), type: 'line', borderColor: palette.accent, backgroundColor: palette.accent, borderWidth: 2, tension: 0.2, fill: false }
>>         ]
>>       },
>>       options: {
>>         scales: { y: { ticks: { callback: (value) => fmt.money(value, 0) } } },
>>         plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt.money(ctx.parsed.y,0)}` } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

## 5. Цели и накопления
```dataviewjs
(async () => {
  const pages = dv.pages('"60_Finance/60.2_Goals"').where(p => p.goal && p.saved);
  const container = dv.el('div','');
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
  container.style.gap = '12px';
  if (!pages.length) {
    container.textContent = 'Добавь заметки с полями goal/saved в папке 60_Finance/60.2_Goals, чтобы видеть прогресс.';
    return;
  }
  pages.forEach(page => {
    const goal = Number(page.goal || 0);
    const saved = Number(page.saved || 0);
    const percent = goal ? Math.min(100, Math.round(saved / goal * 100)) : 0;
    const card = document.createElement('div');
    card.style.border = '1px solid var(--background-modifier-border)';
    card.style.borderRadius = '12px';
    card.style.padding = '14px';
    card.style.display = 'grid';
    card.style.gap = '8px';
    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = page.name || page.file.name;
    const numbers = document.createElement('div');
    numbers.style.fontSize = '0.9rem';
    numbers.style.color = 'var(--text-muted)';
    numbers.innerHTML = `Накоплено: <strong>${window.financeFormat.money(saved,0)}</strong> из ${window.financeFormat.money(goal,0)}`;
    const bar = document.createElement('div');
    bar.style.height = '12px';
    bar.style.borderRadius = '6px';
    bar.style.background = 'var(--background-modifier-border)';
    const fill = document.createElement('div');
    fill.style.height = '100%';
    fill.style.width = percent + '%';
    fill.style.borderRadius = '6px';
    fill.style.background = percent >= 100 ? '#2ecc71' : '#2980b9';
    bar.appendChild(fill);
    const footer = document.createElement('div');
    footer.style.fontSize = '0.85rem';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.innerHTML = `<span>${percent}%</span><span>${page.updated ? 'Обновлено: ' + page.updated : ''}</span>`;
    card.append(title, numbers, bar, footer);
    container.appendChild(card);
  });
})();
```

## 6. Глубокий анализ (2 колонки)
> [!multi-column|2]
>
>> [!info] Pareto расходов по категориям
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '320px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const categories = metrics.categories;
>>     mount.innerHTML = '';
>>     if (!categories.length) { mount.textContent = 'Нет расходов.'; return; }
>>     const cumulative = [];
>>     let acc = 0;
>>     categories.forEach(item => {
>>       acc += item.value;
>>       cumulative.push(metrics.totalExpense ? +(acc / metrics.totalExpense * 100).toFixed(2) : 0);
>>     });
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels: categories.map(c => c.category),
>>         datasets: [
>>           { label: 'Расходы', data: categories.map(c => c.value), backgroundColor: palette.negative, yAxisID: 'y' },
>>           { label: 'Накопленный %', data: cumulative, type: 'line', borderColor: palette.warning, borderWidth: 2, tension: 0.2, pointRadius: 2, yAxisID: 'y1' }
>>         ]
>>       },
>>       options: {
>>         scales: {
>>           y: { ticks: { callback: (value) => fmt.money(value,0) } },
>>           y1: { position: 'right', min: 0, max: 100, ticks: { callback: (value) => `${value}%` }, grid: { drawOnChartArea: false } }
>>         }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Контрольная диаграмма расходов
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '320px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const flow = metrics.monthlyFlow.filter(m => m.expense > 0);
>>     mount.innerHTML = '';
>>     if (!flow.length) { mount.textContent = 'Недостаточно данных.'; return; }
>>     const values = flow.map(m => m.expense);
>>     const mean = values.reduce((a,b) => a + b, 0) / values.length;
>>     const variance = values.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / values.length;
>>     const sd = Math.sqrt(variance);
>>     const line = (val) => flow.map(() => +val.toFixed(2));
>>     window.renderChart({
>>       type: 'line',
>>       data: {
>>         labels: flow.map(m => m.month),
>>         datasets: [
>>           { label: 'Расходы', data: flow.map(m => m.expense), borderColor: palette.negative, backgroundColor: palette.negative, tension: 0.3, pointRadius: 3, fill: false },
>>           { label: 'Среднее', data: line(mean), borderColor: palette.muted, borderDash: [6,4], pointRadius: 0 },
>>           { label: '+1σ', data: line(mean + sd), borderColor: palette.warning, borderDash: [4,4], pointRadius: 0 },
>>           { label: '-1σ', data: line(Math.max(0, mean - sd)), borderColor: palette.warning, borderDash: [4,4], pointRadius: 0 }
>>         ]
>>       },
>>       options: {
>>         scales: { y: { ticks: { callback: (value) => fmt.money(value,0) } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

> [!multi-column|2]
>
>> [!info] Тепловая карта расходов по дням
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '320px';
>>   const render = async () => {
>>     if (!(Chart && Chart.controllers && Chart.controllers.matrix)) {
>>       mount.textContent = 'Matrix chart не загружен.';
>>       return;
>>     }
>>     const metrics = await window.financeMetrics();
>>     const data = metrics.heatmap;
>>     mount.innerHTML = '';
>>     if (!data.length) { mount.textContent = 'Нет расходов.'; return; }
>>     const dataset = data.map(item => ({ x: item.date, y: moment(item.date, 'YYYY-MM-DD').format('ddd'), v: item.value }));
>>     window.renderChart({
>>       type: 'matrix',
>>       data: {
>>         datasets: [{
>>           label: 'Расходы',
>>           data: dataset,
>>           width: (ctx) => {
>>             const area = ctx.chart.chartArea;
>>             return area ? area.width / Math.min(dataset.length, 60) : 10;
>>           },
>>           height: (ctx) => {
>>             const area = ctx.chart.chartArea;
>>             return area ? area.height / 7 : 10;
>>           },
>>           backgroundColor: (ctx) => {
>>             const value = ctx.raw.v;
>>             const light = Math.max(25, 90 - Math.min(70, value / 50));
>>             return `hsl(0 70% ${light}% / 0.9)`;
>>           }
>>         }]
>>       },
>>       options: {
>>         scales: {
>>           y: { type: 'category', offset: true, reverse: true },
>>           x: { type: 'time', time: { unit: 'day' } }
>>         },
>>         plugins: { legend: { display: false } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Потоки «откуда → куда» (Sankey)
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '360px';
>>   const render = async () => {
>>     if (!(Chart && Chart.controllers && Chart.controllers.sankey)) {
>>       mount.textContent = 'Sankey chart не загружен.';
>>       return;
>>     }
>>     const metrics = await window.financeMetrics();
>>     const data = metrics.sankey;
>>     mount.innerHTML = '';
>>     if (!data.length) { mount.textContent = 'Нет данных.'; return; }
>>     window.renderChart({
>>       type: 'sankey',
>>       data: {
>>         datasets: [{
>>           label: 'Потоки',
>>           data: data.map(item => ({ from: item.from, to: item.to, flow: item.value })),
>>           colorFrom: '#2ecc71',
>>           colorTo: '#e74c3c',
>>           colorMode: 'gradient'
>>         }]
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

## 7. Активы и счета (2 колонки)
> [!multi-column|2]
>
>> [!info] Динамика стоимости портфеля (операции с тикерами)
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '300px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const rows = await window.financeRows();
>>     const byDay = new Map();
>>     rows.forEach(row => {
>>       if (!row.ticker || row.quantity == null || row.price == null) return;
>>       const value = Number(row.quantity) * Number(row.price);
>>       if (!Number.isFinite(value)) return;
>>       byDay.set(row.date, (byDay.get(row.date) || 0) + value);
>>     });
>>     mount.innerHTML = '';
>>     const series = Array.from(byDay.entries()).sort((a,b) => a[0].localeCompare(b[0]));
>>     if (!series.length) { mount.textContent = 'Добавь операции с тикерами, ценой и количеством.'; return; }
>>     window.renderChart({
>>       type: 'line',
>>       data: {
>>         labels: series.map(s => s[0]),
>>         datasets: [{
>>           label: 'Стоимость портфеля',
>>           data: series.map(s => +s[1].toFixed(2)),
>>           borderColor: palette.accent,
>>           backgroundColor: palette.accent,
>>           tension: 0.25,
>>           pointRadius: 0,
>>           fill: false
>>         }]
>>       },
>>       options: { scales: { y: { ticks: { callback: (value) => fmt.money(value,0) } } } }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Баланс по счетам (притоки – оттоки)
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '300px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const accounts = metrics.accounts;
>>     mount.innerHTML = '';
>>     if (!accounts.length) { mount.textContent = 'Нет данных по счетам.'; return; }
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels: accounts.map(a => a.name || '—'),
>>         datasets: [{
>>           label: 'Δ Баланс',
>>           data: accounts.map(a => a.value),
>>           backgroundColor: accounts.map(a => a.value >= 0 ? palette.positive : palette.negative)
>>         }]
>>       },
>>       options: {
>>         indexAxis: 'y',
>>         scales: { x: { ticks: { callback: (value) => fmt.money(value,0) } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

> [!multi-column|2]
>
>> [!info] Источники доходов
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '280px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const metrics = await window.financeMetrics();
>>     const sources = metrics.sources;
>>     mount.innerHTML = '';
>>     if (!sources.length) { mount.textContent = 'Нет данных по источникам.'; return; }
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels: sources.map(s => s.name || '—'),
>>         datasets: [{ label: 'Доходы', data: sources.map(s => s.value), backgroundColor: palette.positive }]
>>       },
>>       options: {
>>         indexAxis: 'y',
>>         scales: { x: { ticks: { callback: (value) => fmt.money(value,0) } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```
>
>> [!info] Подкатегории расходов (топ-10)
>> ```dataviewjs
>> (() => {
>>   const mount = dv.el('div','');
>>   mount.style.height = '280px';
>>   const palette = window.financePalette;
>>   const fmt = window.financeFormat;
>>   const render = async () => {
>>     const rows = await window.financeRows();
>>     const map = new Map();
>>     rows.forEach(row => {
>>       if (row.abs <= 0 || window.financeInflowTypes?.has?.(row.type)) return;
>>       const key = `${row.category || '—'} / ${row.subcategory || '—'}`;
>>       map.set(key, (map.get(key) || 0) + row.abs);
>>     });
>>     const items = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0,10);
>>     mount.innerHTML = '';
>>     if (!items.length) { mount.textContent = 'Нет данных по подкатегориям.'; return; }
>>     window.renderChart({
>>       type: 'bar',
>>       data: {
>>         labels: items.map(i => i[0]),
>>         datasets: [{ label: 'Расходы', data: items.map(i => +i[1].toFixed(2)), backgroundColor: palette.negative }]
>>       },
>>       options: {
>>         indexAxis: 'y',
>>         scales: { x: { ticks: { callback: (value) => fmt.money(value,0) } } }
>>       }
>>     }, mount);
>>   };
>>   const refresh = () => render();
>>   window.addEventListener('finance-data-changed', refresh);
>>   dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
>>   render();
>> })();
>> ```

## 8. Таблица транзакций (источник)
```dataviewjs
(() => {
  const mount = dv.el('div','');
  mount.style.display = 'grid';
  mount.style.gap = '12px';
  const palette = window.financePalette;
  const fmt = window.financeFormat;

  const summary = document.createElement('div');
  summary.style.fontSize = '0.9rem';
  summary.style.color = 'var(--text-muted)';
  mount.appendChild(summary);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '0.95rem';
  table.style.border = '1px solid var(--background-modifier-border)';
  table.style.borderRadius = '8px';
  table.style.overflow = 'hidden';
  mount.appendChild(table);

  const columns = [
    { key: 'date', label: 'Дата', width: '110px' },
    { key: 'time', label: 'Время', width: '70px' },
    { key: 'type', label: 'Тип', width: '110px' },
    { key: 'amount', label: 'Сумма', width: '120px', numeric: true },
    { key: 'category', label: 'Категория', width: '160px' },
    { key: 'subcategory', label: 'Подкатегория', width: '160px' },
    { key: 'source', label: 'Источник', width: '140px' },
    { key: 'from', label: 'Откуда', width: '140px' },
    { key: 'to', label: 'Куда', width: '140px' },
    { key: 'account', label: 'Счёт', width: '140px' },
    { key: 'ticker', label: 'Тикер', width: '100px' },
    { key: 'quantity', label: 'Кол-во', width: '90px', numeric: true },
    { key: 'price', label: 'Цена', width: '90px', numeric: true },
    { key: 'link', label: 'Файл', width: '160px' }
  ];

  let sortKey = 'date';
  let sortDir = 'desc';

  const renderHeader = () => {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.style.padding = '6px 10px';
      th.style.cursor = 'pointer';
      th.style.background = 'var(--background-primary-alt)';
      th.style.borderBottom = '1px solid var(--background-modifier-border)';
      if (col.width) th.style.width = col.width;
      th.addEventListener('click', () => {
        if (sortKey === col.key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = col.key;
          sortDir = col.numeric ? 'desc' : 'asc';
        }
        render();
      });
      const indicator = document.createElement('span');
      indicator.style.marginLeft = '6px';
      indicator.style.fontSize = '0.8rem';
      if (sortKey === col.key) indicator.textContent = sortDir === 'asc' ? '▲' : '▼';
      th.appendChild(indicator);
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    return thead;
  };

  const renderBody = (rows) => {
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--background-modifier-border)';
      columns.forEach(col => {
        const td = document.createElement('td');
        td.style.padding = '6px 10px';
        td.style.verticalAlign = 'top';
        if (col.numeric) td.style.textAlign = 'right';
        let value = row[col.key];
        if (col.key === 'amount') {
          td.textContent = fmt.money(row.amount, 2);
          td.style.color = row.amount >= 0 ? palette.positive : palette.negative;
        } else if (col.key === 'quantity') {
          td.textContent = value != null ? fmt.number(value, 2) : '';
        } else if (col.key === 'price') {
          td.textContent = value != null ? fmt.money(value, 2) : '';
        } else if (col.key === 'link') {
          try { td.appendChild(dv.el('span', row.link)); }
          catch(_) { td.textContent = row.link || ''; }
        } else {
          td.textContent = value || '';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    return tbody;
  };

  const compareRows = (a, b, key) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (key === 'amount' || key === 'quantity' || key === 'price') {
      const av = Number(a[key] || 0);
      const bv = Number(b[key] || 0);
      return dir * (av - bv);
    }
    const av = (a[key] || '').toString();
    const bv = (b[key] || '').toString();
    return dir * av.localeCompare(bv, 'ru', { numeric: true });
  };

  const render = async () => {
    const data = await window.financeGetData();
    const metrics = data.metrics;
    summary.textContent = `Операций: ${metrics.counts.total} · Доходы ${fmt.money(metrics.totals.income,0)} · Расходы ${fmt.money(metrics.totals.expense,0)} · Net ${fmt.money(metrics.totals.net,0)}`;
    const rows = data.rows.slice().sort((a,b) => compareRows(a,b,sortKey));
    table.innerHTML = '';
    table.appendChild(renderHeader());
    table.appendChild(renderBody(rows));
  };

  const refresh = () => render();
  window.addEventListener('finance-data-changed', refresh);
  dv.current().onunload(() => window.removeEventListener('finance-data-changed', refresh));
  render();
})();
```
