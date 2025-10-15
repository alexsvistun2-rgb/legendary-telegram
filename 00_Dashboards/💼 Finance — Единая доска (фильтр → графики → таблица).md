---
cssClass: dashboard
---

<style>
.finance-grid {
  display: grid;
  gap: 1.2rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 1.5rem;
}
.finance-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(246,250,255,0.98) 100%);
  border: 1px solid rgba(38, 66, 91, 0.08);
  border-radius: 20px;
  box-shadow: 0 18px 35px rgba(38, 66, 91, 0.12);
  padding: 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.finance-card--table {
  overflow: hidden;
}
.finance-card__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
}
.finance-card__icon {
  background: linear-gradient(135deg, #69c0ff, #b37feb);
  border-radius: 14px;
  color: #fff;
  font-size: 1.2rem;
  padding: 0.35rem 0.65rem;
  box-shadow: 0 6px 16px rgba(105, 192, 255, 0.3);
}
.finance-card__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f3a60;
}
.finance-card__meta {
  color: #5a7184;
  font-size: 0.85rem;
}
.finance-card__body {
  flex: 1;
}
.finance-empty {
  background: rgba(38, 66, 91, 0.06);
  border-radius: 14px;
  color: #455d73;
  font-size: 0.95rem;
  padding: 1.1rem;
  text-align: center;
}
.finance-chart {
  position: relative;
  width: 100%;
  height: 100%;
}
.finance-filter__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.8rem 1rem;
}
.finance-filter__group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #425b72;
  font-size: 0.9rem;
}
.finance-filter__group strong {
  font-weight: 600;
  color: #1f3a60;
}
.finance-filter__group select,
.finance-filter__group input {
  border: 1px solid rgba(38, 66, 91, 0.18);
  border-radius: 12px;
  padding: 0.45rem 0.65rem;
  background: rgba(255,255,255,0.95);
  color: #1f3a60;
  font-size: 0.95rem;
}
.finance-progress-card {
  background: linear-gradient(135deg, rgba(233,248,255,0.96) 0%, rgba(246,240,255,0.96) 100%);
}
.finance-progress__bar {
  height: 12px;
  border-radius: 999px;
  background: rgba(38, 66, 91, 0.1);
  overflow: hidden;
  position: relative;
}
.finance-progress__value {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6dd5fa 0%, #8360c3 100%);
  transition: width 0.4s ease;
}
.finance-progress__label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #425b72;
  margin-top: 0.45rem;
}
.finance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  color: #1f3a60;
}
.finance-table thead {
  background: rgba(38, 66, 91, 0.08);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.75rem;
}
.finance-table th,
.finance-table td {
  padding: 0.55rem 0.7rem;
  border-bottom: 1px solid rgba(38, 66, 91, 0.12);
  text-align: left;
}
.finance-table tbody tr:hover {
  background: rgba(105, 192, 255, 0.08);
}
.finance-tech {
  display: grid;
  gap: 0.4rem;
  color: #425b72;
}
.finance-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(105, 192, 255, 0.18);
  color: #1f3a60;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>

```dataviewjs
(async () => {
  const hidden = dv.el('div', '');
  hidden.style.display = 'none';

  const ctx = window.financeDashboard = window.financeDashboard || {};
  if (ctx.ready) return;
  if (ctx.promise) { await ctx.promise; return; }

  const comp = dv.current?.();
  const { pages, io } = dv;

  const build = async () => {
    const subscribers = ctx.subscribers = ctx.subscribers || new Set();
    ctx.subscribe = ctx.subscribe || function (fn) {
      if (typeof fn !== 'function') return () => {};
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    };
    ctx.notify = ctx.notify || function () {
      subscribers.forEach(fn => {
        try { fn(); } catch (err) { console.error('[Finance dashboard] subscriber error', err); }
      });
    };

    async function loadOnce(url, checker) {
      try { if (checker()) return; } catch (_) {}
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Не удалось загрузить ' + url));
        document.head.appendChild(s);
      });
    }
    const hasChart = () => typeof Chart !== 'undefined';
    await loadOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', hasChart);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js', () => {
      try { return !!Chart.controllers?.matrix; } catch (_) { return false; }
    });
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js', () => {
      try { return !!Chart.controllers?.sankey; } catch (_) { return false; }
    });
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-hierarchy@2.0.1/dist/chartjs-chart-hierarchy.min.js', () => {
      try { return !!Chart.registry?.getScale('category'); } catch (_) { return false; }
    });
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js', () => {
      try { return !!Chart.controllers?.treemap; } catch (_) { return false; }
    });

    const IN_TYPES = new Set(['income', 'refund', 'dividend', 'invest_sell']);
    ctx.isIncome = type => IN_TYPES.has(String(type || '').toLowerCase());
    ctx.toNumber = value => {
      if (value == null) return 0;
      const cleaned = String(value).replace(/\s+/g, '').replace(',', '.');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };
    ctx.formatCurrency = value => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
    ctx.palette = ['#5B8FF9', '#61DDAA', '#65789B', '#F6BD16', '#7262FD', '#78D3F8', '#9661BC', '#F6903D', '#008685', '#F08BB4'];
    ctx.colors = {
      income: '#4caf50',
      expense: '#ff6b6b',
      net: '#3b82f6',
      accent: '#9b59b6',
      muted: '#8395a7',
      warning: '#f6ad55',
      positive: '#2ecc71',
      negative: '#e74c3c'
    };

    const RANGE_KEY = 'finance_range2';
    const FOLDER = '60_Finance';
    const state = { all: null, filtered: null };

    function readRangeCfg() {
      try {
        const raw = localStorage.getItem(RANGE_KEY);
        return raw ? JSON.parse(raw) : { mode: 'all' };
      } catch (_) {
        return { mode: 'all' };
      }
    }

    function computeRange() {
      const cfg = readRangeCfg();
      const now = moment().endOf('day');
      const mode = cfg.mode || 'all';
      if (mode === 'all') return { s: moment('1900-01-01'), e: now };
      if (mode === 'day' && cfg.day) {
        const d = moment(cfg.day, 'YYYY-MM-DD');
        return { s: d.clone().startOf('day'), e: d.clone().endOf('day') };
      }
      if (mode === 'week' && cfg.week) {
        const w = moment(cfg.week + '-1', 'GGGG-[W]WW-E');
        return { s: w.clone().startOf('isoWeek'), e: w.clone().endOf('isoWeek') };
      }
      if (mode === 'month' && cfg.month) {
        const m = moment(cfg.month, 'YYYY-MM');
        return { s: m.clone().startOf('month'), e: m.clone().endOf('month') };
      }
      if (mode === 'quarter' && cfg.qyear) {
        const q = Number(cfg.quarter || 1);
        const y = Number(cfg.qyear);
        const m = moment({ year: y, month: (q - 1) * 3, day: 1 });
        return { s: m.clone().startOf('quarter'), e: m.clone().endOf('quarter') };
      }
      if (mode === 'year' && cfg.year) {
        const y = Number(cfg.year);
        const m = moment({ year: y, month: 0, day: 1 });
        return { s: m.clone().startOf('year'), e: m.clone().endOf('year') };
      }
      if (mode === 'range') {
        let s = cfg.start ? moment(cfg.start, 'YYYY-MM-DD').startOf('day') : moment('1900-01-01');
        let e = cfg.end ? moment(cfg.end, 'YYYY-MM-DD').endOf('day') : now;
        if (e.isBefore(s)) {
          const t = s;
          s = e;
          e = t;
        }
        return { s, e };
      }
      return { s: moment('1900-01-01'), e: now };
    }

    const RX = {
      date: /-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?/i,
      type: /#type\/([A-Za-z_]+)/,
      amount: /-\s*Сумма:\s*\*{0,2}([\d\s.,+-]+)/i,
      category: /-\s*Категория:\s*\*{0,2}([^\n*]+)/i,
      subcategory: /-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i,
      source: /-\s*Источник:\s*\*{0,2}([^\n*]+)/i,
      from: /-\s*Откуда:\s*\*{0,2}([^\n*]+)/i,
      to: /-\s*Куда:\s*\*{0,2}([^\n*]+)/i,
      account: /-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i,
      ticker: /-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i,
      qty: /-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i,
      price: /-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i
    };

    function pick(rx, txt) {
      const m = (txt || '').match(rx);
      return m ? String(m[1]).trim() : '';
    }

    async function loadAllRows() {
      const out = [];
      const allPages = pages(`"${FOLDER}"`);
      for (const p of allPages) {
        const txt = await io.load(p.file.path).catch(() => '');
        const dateMatch = txt.match(RX.date);
        let dt = dateMatch ? moment(dateMatch[1], 'YYYY-MM-DD') : moment(p.file.ctime);
        if (!dt.isValid()) continue;
        const row = [
          dt.format('YYYY-MM-DD'),
          pick(RX.type, txt),
          pick(RX.amount, txt).replace(/\s+/g, '').replace(',', '.'),
          pick(RX.category, txt),
          pick(RX.subcategory, txt),
          pick(RX.source, txt),
          pick(RX.from, txt),
          pick(RX.to, txt),
          pick(RX.account, txt),
          pick(RX.ticker, txt),
          pick(RX.qty, txt),
          pick(RX.price, txt),
          p.file.link
        ];
        out.push(row);
      }
      out.sort((a, b) => a[0].localeCompare(b[0]) || String(a[12]).localeCompare(String(b[12])));
      return out;
    }

    ctx.range = () => computeRange();
    ctx.allRows = async () => {
      if (!state.all) state.all = await loadAllRows();
      return state.all.map(r => r.slice());
    };
    ctx.rows = async () => {
      const { s, e } = computeRange();
      if (!state.filtered) {
        const all = await ctx.allRows();
        state.filtered = all.filter(row => {
          const d = moment(row[0], 'YYYY-MM-DD');
          return d.isBetween(s, e, undefined, '[]');
        });
      }
      return state.filtered.map(r => r.slice());
    };

    ctx.renderChart = (cfg, mount, minHeight = 280) => {
      const holder = mount || document.createElement('div');
      holder.classList.add('finance-chart');
      holder.style.minHeight = (cfg._height || minHeight) + 'px';
      const canvas = document.createElement('canvas');
      holder.innerHTML = '';
      holder.appendChild(canvas);
      const c = canvas.getContext('2d');
      cfg.options = cfg.options || {};
      cfg.options.maintainAspectRatio = false;
      cfg.options.responsive = true;
      cfg.options.plugins = cfg.options.plugins || {};
      cfg.options.plugins.legend = cfg.options.plugins.legend || { display: true, labels: { color: '#425b72' } };
      if (cfg.options.scales) {
        for (const key of Object.keys(cfg.options.scales)) {
          const scale = cfg.options.scales[key] || {};
          scale.grid = scale.grid || {};
          scale.grid.color = scale.grid.color || 'rgba(38,66,91,0.1)';
          scale.ticks = scale.ticks || {};
          scale.ticks.color = scale.ticks.color || '#425b72';
          cfg.options.scales[key] = scale;
        }
      }
      new Chart(c, cfg);
      return holder;
    };

    ctx.mountChartCard = function (dvObj, parent, options = {}) {
      const card = document.createElement('div');
      card.className = 'finance-card' + (options.className ? ' ' + options.className : '');
      const header = document.createElement('div');
      header.className = 'finance-card__header';
      const icon = document.createElement('span');
      icon.className = 'finance-card__icon';
      icon.textContent = options.icon || '📊';
      header.appendChild(icon);
      const title = document.createElement('span');
      title.className = 'finance-card__title';
      title.textContent = options.title || '';
      header.appendChild(title);
      if (options.subtitle) {
        const sub = document.createElement('span');
        sub.className = 'finance-card__meta';
        sub.textContent = options.subtitle;
        header.appendChild(sub);
      }
      card.appendChild(header);
      const body = document.createElement('div');
      body.className = 'finance-card__body';
      card.appendChild(body);
      (parent || dvObj.containerEl).appendChild(card);

      const emptyText = options.emptyText || 'Нет данных за выбранный период';
      const height = options.height || 280;

      const rerender = async () => {
        const rows = await ctx.rows();
        if (!rows.length) {
          body.innerHTML = `<div class="finance-empty">${emptyText}</div>`;
          return;
        }
        body.innerHTML = '';
        try {
          const mount = document.createElement('div');
          mount.style.height = height + 'px';
          mount.className = 'finance-chart';
          body.appendChild(mount);
          const cfg = await options.build(rows, mount, ctx);
          if (!cfg) {
            body.innerHTML = `<div class="finance-empty">${options.fallbackText || 'Недостаточно данных для визуализации'}</div>`;
            return;
          }
          ctx.renderChart(cfg, mount, height);
        } catch (err) {
          body.innerHTML = `<div class="finance-empty">${options.errorText || ('Ошибка визуализации: ' + err.message)}</div>`;
        }
      };

      rerender();
      let unsubscribe = () => {};
      if (ctx.subscribe) unsubscribe = ctx.subscribe(() => rerender());
      try {
        const compLocal = dvObj.current?.();
        if (compLocal && typeof compLocal.onunload === 'function') compLocal.onunload(() => unsubscribe());
      } catch (_) {}

      return { card, body, rerender };
    };

    window.renderChart = ctx.renderChart;
    window.financeRows = ctx.rows;
    window.financeCurrentRange = () => {
      const { s, e } = computeRange();
      return { from: s.format('YYYY-MM-DD'), to: e.format('YYYY-MM-DD') };
    };

    const onRangeChange = () => {
      state.filtered = null;
      ctx.notify?.();
    };
    const onDataChange = () => {
      state.all = null;
      state.filtered = null;
      ctx.notify?.();
    };

    window.addEventListener('finance-range-changed', onRangeChange);
    try { app?.vault?.on?.('modify', onDataChange); } catch (_) {}
    try { app?.metadataCache?.on?.('dataview:metadata-change', onDataChange); } catch (_) {}
    try { app?.workspace?.on?.('file-open', onRangeChange); } catch (_) {}

    ctx.ready = true;
  };

  ctx.ensure = async () => {
    if (ctx.ready) return ctx;
    if (!ctx.promise) ctx.promise = build();
    await ctx.promise;
    return ctx;
  };

  await ctx.ensure();
})();
```

# 💼 Finance — Единая доска (фильтр → графики → таблица)

> Управляй финансами из одного окна: сверху — фильтр периода, ниже — визуализации и прогресс целей, завершает блок исходная таблица транзакций.

## 1) Фильтр периода
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const card = dv.el('div', '');
  card.className = 'finance-card finance-card--filter';

  const header = document.createElement('div');
  header.className = 'finance-card__header';
  const icon = document.createElement('span');
  icon.className = 'finance-card__icon';
  icon.textContent = '🎚️';
  header.appendChild(icon);
  const title = document.createElement('span');
  title.className = 'finance-card__title';
  title.textContent = 'Фильтр периода';
  header.appendChild(title);
  const meta = document.createElement('span');
  meta.className = 'finance-card__meta';
  header.appendChild(meta);
  card.appendChild(header);

  const form = document.createElement('div');
  form.className = 'finance-filter__form';
  card.appendChild(form);

  const KEY = 'finance_range2';
  const cfg = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { mode: 'all' };
    } catch (_) { return { mode: 'all' }; }
  })();

  const value = (key, fallback = '') => cfg[key] ?? fallback;

  function row(label) {
    const wrap = document.createElement('div');
    wrap.className = 'finance-filter__group';
    const strong = document.createElement('strong');
    strong.textContent = label;
    wrap.appendChild(strong);
    form.appendChild(wrap);
    return wrap;
  }

  function persist(patch) {
    const merged = Object.assign({}, cfg, patch || {});
    localStorage.setItem(KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('finance-range-changed'));
    updateMeta();
  }

  const range = () => {
    const { from, to } = window.financeCurrentRange();
    return `${from} → ${to}`;
  };

  function updateMeta() {
    meta.textContent = `Показаны операции за ${range()}`;
  }

  const modeWrap = row('Режим');
  const select = document.createElement('select');
  [['all','Всё'],['day','День'],['week','Неделя'],['month','Месяц'],['quarter','Квартал'],['year','Год'],['range','Диапазон']]
    .forEach(([val, label]) => {
      const option = document.createElement('option');
      option.value = val;
      option.textContent = label;
      if (cfg.mode === val) option.selected = true;
      select.appendChild(option);
    });
  select.addEventListener('change', () => {
    cfg.mode = select.value;
    ['day','week','month','qyear','quarter','year','start','end'].forEach(key => delete cfg[key]);
    persist({ mode: cfg.mode });
    toggle();
  });
  modeWrap.appendChild(select);

  const dayWrap = row('День');
  const dayInput = document.createElement('input');
  dayInput.type = 'date';
  dayInput.value = value('day');
  dayInput.addEventListener('change', () => persist({ mode: cfg.mode, day: dayInput.value || null }));
  dayWrap.appendChild(dayInput);

  const weekWrap = row('Неделя');
  const weekInput = document.createElement('input');
  weekInput.type = 'week';
  weekInput.value = value('week');
  weekInput.addEventListener('change', () => persist({ mode: cfg.mode, week: weekInput.value || null }));
  weekWrap.appendChild(weekInput);

  const monthWrap = row('Месяц');
  const monthInput = document.createElement('input');
  monthInput.type = 'month';
  monthInput.value = value('month');
  monthInput.addEventListener('change', () => persist({ mode: cfg.mode, month: monthInput.value || null }));
  monthWrap.appendChild(monthInput);

  const quarterWrap = row('Квартал');
  const quarterYear = document.createElement('input');
  quarterYear.type = 'number';
  quarterYear.placeholder = 'Год';
  quarterYear.value = value('qyear');
  quarterYear.addEventListener('change', () => persist({ mode: cfg.mode, qyear: quarterYear.value || null, quarter: quarterSelect.value || '1' }));
  quarterWrap.appendChild(quarterYear);
  const quarterSelect = document.createElement('select');
  ['1','2','3','4'].forEach((val, idx) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = ['I','II','III','IV'][idx];
    if (String(value('quarter','1')) === val) opt.selected = true;
    quarterSelect.appendChild(opt);
  });
  quarterSelect.addEventListener('change', () => persist({ mode: cfg.mode, qyear: quarterYear.value || null, quarter: quarterSelect.value }));
  quarterWrap.appendChild(quarterSelect);

  const yearWrap = row('Год');
  const yearInput = document.createElement('input');
  yearInput.type = 'number';
  yearInput.placeholder = 'YYYY';
  yearInput.value = value('year');
  yearInput.addEventListener('change', () => persist({ mode: cfg.mode, year: yearInput.value || null }));
  yearWrap.appendChild(yearInput);

  const rangeWrap = row('Диапазон');
  const startInput = document.createElement('input');
  startInput.type = 'date';
  startInput.value = value('start');
  startInput.addEventListener('change', () => {
    const start = startInput.value || null;
    const end = endInput.value || null;
    persist({ mode: cfg.mode, start, end });
  });
  rangeWrap.appendChild(startInput);
  const endInput = document.createElement('input');
  endInput.type = 'date';
  endInput.value = value('end');
  endInput.addEventListener('change', () => {
    const start = startInput.value || null;
    const end = endInput.value || null;
    persist({ mode: cfg.mode, start, end });
  });
  rangeWrap.appendChild(endInput);

  function toggle() {
    const mode = select.value;
    dayWrap.style.display = mode === 'day' ? 'flex' : 'none';
    weekWrap.style.display = mode === 'week' ? 'flex' : 'none';
    monthWrap.style.display = mode === 'month' ? 'flex' : 'none';
    quarterWrap.style.display = mode === 'quarter' ? 'flex' : 'none';
    yearWrap.style.display = mode === 'year' ? 'flex' : 'none';
    rangeWrap.style.display = mode === 'range' ? 'flex' : 'none';
  }

  toggle();
  updateMeta();

  if (ctx.subscribe) {
    const unsub = ctx.subscribe(updateMeta);
    try {
      const compLocal = dv.current?.();
      if (compLocal && typeof compLocal.onunload === 'function') compLocal.onunload(() => unsub());
    } catch (_) {}
  }
})();
```

## 2) Быстрая сводка периода
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const grid = dv.el('div', '');
  grid.className = 'finance-grid';
  const colors = ctx.colors;

  const mount = options => ctx.mountChartCard(dv, grid, options);

  mount({
    icon: '💧',
    title: 'Кэш-флоу по дням + MA7/MA30',
    height: 300,
    build(rows) {
      const byDay = {};
      rows.forEach(r => {
        const date = r[0];
        if (!date) return;
        const bucket = byDay[date] = byDay[date] || { inc: 0, exp: 0 };
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        if (ctx.isIncome(r[1])) bucket.inc += amount; else bucket.exp += amount;
      });
      const labels = Object.keys(byDay).sort();
      if (!labels.length) return null;
      const inc = labels.map(d => +byDay[d].inc.toFixed(2));
      const exp = labels.map(d => +byDay[d].exp.toFixed(2));
      const net = labels.map((_, idx) => +(inc[idx] - exp[idx]).toFixed(2));
      const MA = (arr, w) => arr.map((_, idx) => {
        const start = Math.max(0, idx - w + 1);
        const slice = arr.slice(start, idx + 1);
        const avg = slice.reduce((sum, val) => sum + val, 0) / (slice.length || 1);
        return +avg.toFixed(2);
      });
      const ma7 = MA(net, 7);
      const ma30 = MA(net, 30);
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Доходы', data: inc, borderColor: colors.income, backgroundColor: colors.income, tension: 0.35, fill: false, pointRadius: 0 },
            { label: 'Расходы', data: exp, borderColor: colors.expense, backgroundColor: colors.expense, tension: 0.35, fill: false, pointRadius: 0 },
            { label: 'Net', data: net, borderColor: colors.net, backgroundColor: 'rgba(59,130,246,0.18)', tension: 0.35, fill: true, pointRadius: 0 },
            { label: 'MA7', data: ma7, borderColor: colors.accent, borderDash: [6,6], tension: 0.4, pointRadius: 0, fill: false },
            { label: 'MA30', data: ma30, borderColor: colors.muted, borderDash: [12,6], tension: 0.4, pointRadius: 0, fill: false }
          ]
        }
      };
    }
  });

  mount({
    icon: '📅',
    title: 'Доходы vs расходы по месяцам',
    height: 300,
    build(rows) {
      const byMonth = {};
      rows.forEach(r => {
        const month = (r[0] || '').slice(0, 7);
        if (!month) return;
        const bucket = byMonth[month] = byMonth[month] || { inc: 0, exp: 0 };
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        if (ctx.isIncome(r[1])) bucket.inc += amount; else bucket.exp += amount;
      });
      const labels = Object.keys(byMonth).sort();
      if (!labels.length) return null;
      const inc = labels.map(m => +byMonth[m].inc.toFixed(2));
      const exp = labels.map(m => +byMonth[m].exp.toFixed(2));
      const net = labels.map((_, idx) => +(inc[idx] - exp[idx]).toFixed(2));
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Доходы', data: inc, backgroundColor: 'rgba(76, 175, 80, 0.75)', stack: 'flows' },
            { label: 'Расходы', data: exp, backgroundColor: 'rgba(255, 107, 107, 0.75)', stack: 'flows' },
            { label: 'Net', data: net, backgroundColor: 'rgba(59, 130, 246, 0.35)', type: 'line', borderColor: colors.net, tension: 0.3, pointRadius: 4, fill: false, yAxisID: 'y1' }
          ]
        },
        options: {
          scales: {
            y: { stacked: true },
            x: { stacked: true },
            y1: { position: 'right', grid: { drawOnChartArea: false } }
          }
        }
      };
    }
  });

  mount({
    icon: '🥧',
    title: 'Структура расходов по категориям',
    height: 280,
    build(rows) {
      const sums = {};
      rows.forEach(r => {
        if (ctx.isIncome(r[1])) return;
        const cat = r[3] || 'Без категории';
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        sums[cat] = (sums[cat] || 0) + amount;
      });
      const labels = Object.keys(sums);
      if (!labels.length) return null;
      const values = labels.map(l => +sums[l].toFixed(2));
      const palette = labels.map((_, idx) => `hsl(${(idx * 47) % 360} 70% 55% / 0.9)`);
      return {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: palette }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      };
    }
  });
})();
```

## 3) Ключевые графики (2 колонки)
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const grid = dv.el('div', '');
  grid.className = 'finance-grid';
  const colors = ctx.colors;

  const defs = [
    {
      icon: '📈',
      title: 'Кумулятивный финансовый результат',
      height: 300,
      build(rows) {
        const byDay = {};
        rows.forEach(r => {
          const date = r[0];
          if (!date) return;
          const amount = ctx.toNumber(r[2]);
          if (!amount) return;
          const delta = ctx.isIncome(r[1]) ? Math.abs(amount) : -Math.abs(amount);
          byDay[date] = (byDay[date] || 0) + delta;
        });
        const labels = Object.keys(byDay).sort();
        if (!labels.length) return null;
        let acc = 0;
        const values = labels.map(d => {
          acc += byDay[d];
          return +acc.toFixed(2);
        });
        return {
          type: 'line',
          data: {
            labels,
            datasets: [{ label: 'Кумулятивно', data: values, borderColor: colors.net, backgroundColor: 'rgba(59,130,246,0.2)', tension: 0.35, fill: true, pointRadius: 0 }]
          }
        };
      }
    },
    {
      icon: '🗂️',
      title: 'Расходы по категориям (топ-8)',
      height: 320,
      build(rows) {
        const sums = {};
        rows.forEach(r => {
          if (ctx.isIncome(r[1])) return;
          const cat = r[3] || 'Без категории';
          const amount = Math.abs(ctx.toNumber(r[2]));
          if (!amount) return;
          sums[cat] = (sums[cat] || 0) + amount;
        });
        const items = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 8);
        if (!items.length) return null;
        const labels = items.map(i => i[0]);
        const values = items.map(i => +i[1].toFixed(2));
        return {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Расходы', data: values, backgroundColor: 'rgba(255, 107, 107, 0.8)' }]
          },
          options: {
            indexAxis: 'y'
          }
        };
      }
    },
    {
      icon: '💼',
      title: 'Доходы по источникам (топ-8)',
      height: 320,
      build(rows) {
        const sums = {};
        rows.forEach(r => {
          if (!ctx.isIncome(r[1])) return;
          const src = r[5] || 'Источник не указан';
          const amount = Math.abs(ctx.toNumber(r[2]));
          if (!amount) return;
          sums[src] = (sums[src] || 0) + amount;
        });
        const items = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 8);
        if (!items.length) return null;
        const labels = items.map(i => i[0]);
        const values = items.map(i => +i[1].toFixed(2));
        return {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Доходы', data: values, backgroundColor: 'rgba(76, 175, 80, 0.8)' }]
          },
          options: {
            indexAxis: 'y'
          }
        };
      }
    },
    {
      icon: '📊',
      title: 'Net по месяцам',
      height: 300,
      build(rows) {
        const byMonth = {};
        rows.forEach(r => {
          const month = (r[0] || '').slice(0, 7);
          if (!month) return;
          const amount = ctx.toNumber(r[2]);
          if (!amount) return;
          const delta = ctx.isIncome(r[1]) ? Math.abs(amount) : -Math.abs(amount);
          byMonth[month] = (byMonth[month] || 0) + delta;
        });
        const labels = Object.keys(byMonth).sort();
        if (!labels.length) return null;
        const values = labels.map(m => +byMonth[m].toFixed(2));
        return {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Net', data: values, backgroundColor: values.map(v => v >= 0 ? 'rgba(76,175,80,0.8)' : 'rgba(255,107,107,0.8)') }]
          },
          options: {
            scales: {
              y: { ticks: { callback: value => ctx.formatCurrency(value) } }
            }
          }
        };
      }
    }
  ];

  defs.forEach(def => ctx.mountChartCard(dv, grid, def));
})();
```

## 4) Глубокий анализ (2 колонки)
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const grid = dv.el('div', '');
  grid.className = 'finance-grid';
  const colors = ctx.colors;

  ctx.mountChartCard(dv, grid, {
    icon: '🎯',
    title: 'Pareto расходов',
    height: 320,
    build(rows) {
      const sums = {};
      rows.forEach(r => {
        if (ctx.isIncome(r[1])) return;
        const cat = r[3] || 'Без категории';
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        sums[cat] = (sums[cat] || 0) + amount;
      });
      const entries = Object.entries(sums).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return null;
      const labels = entries.map(e => e[0]);
      const values = entries.map(e => +e[1].toFixed(2));
      const total = values.reduce((sum, val) => sum + val, 0) || 1;
      let acc = 0;
      const cum = values.map(v => {
        acc += v;
        return +((acc / total) * 100).toFixed(2);
      });
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Расходы', data: values, yAxisID: 'y', backgroundColor: 'rgba(255, 107, 107, 0.7)' },
            { label: 'Кумулятивно, %', data: cum, yAxisID: 'y1', type: 'line', tension: 0.3, pointRadius: 0, borderColor: colors.net }
          ]
        },
        options: {
          scales: {
            y: { beginAtZero: true },
            y1: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false } }
          }
        }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '🧭',
    title: 'Контрольная диаграмма расходов',
    height: 300,
    build(rows) {
      const byMonth = {};
      rows.forEach(r => {
        if (ctx.isIncome(r[1])) return;
        const month = (r[0] || '').slice(0, 7);
        if (!month) return;
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        byMonth[month] = (byMonth[month] || 0) + amount;
      });
      const labels = Object.keys(byMonth).sort();
      if (!labels.length) return null;
      const values = labels.map(l => +byMonth[l].toFixed(2));
      const mean = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length || 1);
      const sd = Math.sqrt(variance);
      const flat = (v) => labels.map(() => +v.toFixed(2));
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Расходы', data: values, borderColor: colors.expense, backgroundColor: 'rgba(255,107,107,0.18)', tension: 0.35, fill: true, pointRadius: 0 },
            { label: 'Среднее', data: flat(mean), borderColor: colors.muted, borderDash: [6,6], pointRadius: 0, fill: false },
            { label: '+1σ', data: flat(mean + sd), borderColor: colors.warning, borderDash: [4,4], pointRadius: 0, fill: false },
            { label: '-1σ', data: flat(mean - sd), borderColor: colors.warning, borderDash: [4,4], pointRadius: 0, fill: false }
          ]
        }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '🗓️',
    title: 'Тепловая карта расходов по дням',
    height: 320,
    build(rows) {
      if (!(window.Chart && Chart.controllers && Chart.controllers.matrix)) throw new Error('Плагин matrix не загружен');
      const byDay = {};
      rows.forEach(r => {
        if (ctx.isIncome(r[1])) return;
        const date = r[0];
        if (!date) return;
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        byDay[date] = (byDay[date] || 0) + amount;
      });
      const days = Object.keys(byDay).sort();
      if (!days.length) return null;
      const data = days.map(d => ({ x: d, y: moment(d, 'YYYY-MM-DD').format('ddd'), v: +byDay[d].toFixed(2) }));
      return {
        type: 'matrix',
        data: {
          datasets: [{
            label: 'Расходы',
            data,
            width: (ctx) => (ctx.chartArea || {}).width / Math.min(days.length, 60),
            height: (ctx) => (ctx.chartArea || {}).height / 7,
            backgroundColor: context => {
              const value = context.raw?.v || 0;
              const light = Math.max(20, 90 - Math.min(70, value / 10));
              return `hsl(4 80% ${light}% / 0.9)`;
            }
          }]
        },
        options: {
          scales: {
            y: { type: 'category', offset: true, reverse: true },
            x: { type: 'time', time: { unit: 'day' } }
          },
          plugins: { legend: { display: false } }
        }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '🔀',
    title: 'Потоки «откуда → куда» (Sankey)',
    height: 360,
    build(rows) {
      if (!(window.Chart && Chart.controllers && Chart.controllers.sankey)) throw new Error('Sankey-плагин не загружен');
      const links = {};
      rows.forEach(r => {
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        if (ctx.isIncome(r[1])) {
          const from = r[5] || 'Источник';
          const to = r[7] || 'Счёт';
          links[`${from}|${to}`] = (links[`${from}|${to}`] || 0) + amount;
        } else {
          const from = r[6] || 'Счёт';
          const to = r[3] || 'Категория';
          links[`${from}|${to}`] = (links[`${from}|${to}`] || 0) + amount;
        }
      });
      const data = Object.entries(links).map(([key, flow]) => {
        const [from, to] = key.split('|');
        return { from, to, flow: +flow.toFixed(2) };
      });
      if (!data.length) return null;
      return {
        type: 'sankey',
        data: { datasets: [{ label: 'Потоки', data, colorFrom: '#5B8FF9', colorTo: '#F6903D', colorMode: 'gradient' }] },
        options: {
          plugins: { legend: { display: false } }
        }
      };
    }
  });
})();
```

## 5) Активы и счета (2 колонки)
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const grid = dv.el('div', '');
  grid.className = 'finance-grid';
  const colors = ctx.colors;

  ctx.mountChartCard(dv, grid, {
    icon: '💹',
    title: 'Динамика стоимости портфеля',
    height: 300,
    build(rows) {
      const byDate = {};
      rows.forEach(r => {
        const date = r[0];
        if (!date) return;
        const ticker = r[9];
        const qty = ctx.toNumber(r[10]);
        const price = ctx.toNumber(r[11]);
        if (!ticker || !qty || !price) return;
        byDate[date] = (byDate[date] || 0) + qty * price;
      });
      const labels = Object.keys(byDate).sort();
      if (!labels.length) return null;
      const values = labels.map(d => +byDate[d].toFixed(2));
      return {
        type: 'line',
        data: {
          labels,
          datasets: [{ label: 'Стоимость портфеля', data: values, borderColor: colors.accent, backgroundColor: 'rgba(155,89,182,0.18)', tension: 0.35, fill: true, pointRadius: 0 }]
        }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '🏦',
    title: 'Баланс по счетам (притоки−оттоки)',
    height: 320,
    build(rows) {
      const byAcc = {};
      rows.forEach(r => {
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        if (ctx.isIncome(r[1])) {
          const to = r[7] || 'Счёт';
          byAcc[to] = (byAcc[to] || 0) + amount;
        } else {
          const from = r[6] || 'Счёт';
          byAcc[from] = (byAcc[from] || 0) - amount;
        }
      });
      const labels = Object.keys(byAcc);
      if (!labels.length) return null;
      const values = labels.map(l => +byAcc[l].toFixed(2));
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Δ Баланс', data: values, backgroundColor: values.map(v => v >= 0 ? 'rgba(76,175,80,0.8)' : 'rgba(255,107,107,0.8)') }]
        }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '💰',
    title: 'Источники доходов (итог)',
    height: 320,
    build(rows) {
      const bySource = {};
      rows.forEach(r => {
        if (!ctx.isIncome(r[1])) return;
        const src = r[5] || 'Источник';
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        bySource[src] = (bySource[src] || 0) + amount;
      });
      const items = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (!items.length) return null;
      const labels = items.map(i => i[0]);
      const values = items.map(i => +i[1].toFixed(2));
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Доходы', data: values, backgroundColor: 'rgba(76,175,80,0.8)' }]
        },
        options: { indexAxis: 'y' }
      };
    }
  });

  ctx.mountChartCard(dv, grid, {
    icon: '🧾',
    title: 'Подкатегории расходов (топ-10)',
    height: 320,
    build(rows) {
      const sums = {};
      rows.forEach(r => {
        if (ctx.isIncome(r[1])) return;
        const key = `${r[3] || 'Категория'} — ${r[4] || 'Без подкатегории'}`;
        const amount = Math.abs(ctx.toNumber(r[2]));
        if (!amount) return;
        sums[key] = (sums[key] || 0) + amount;
      });
      const items = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (!items.length) return null;
      const labels = items.map(i => i[0]);
      const values = items.map(i => +i[1].toFixed(2));
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Расходы', data: values, backgroundColor: 'rgba(255,107,107,0.8)' }]
        },
        options: { indexAxis: 'y' }
      };
    }
  });
})();
```

## 6) Цели и накопления
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const grid = dv.el('div', '');
  grid.className = 'finance-grid';

  const candidates = dv.pages('"60_Finance"').where(p => {
    const target = p.goal_target ?? p.goalTarget ?? p.target ?? p.goal?.target ?? p.goal?.amount;
    const current = p.goal_current ?? p.goalCurrent ?? p.current ?? p.balance ?? p.goal?.current;
    return target && Number(target) > 0 || current && Number(current) > 0;
  }).array();

  if (!candidates.length) {
    const card = document.createElement('div');
    card.className = 'finance-card finance-progress-card';
    const header = document.createElement('div');
    header.className = 'finance-card__header';
    const icon = document.createElement('span');
    icon.className = 'finance-card__icon';
    icon.textContent = '🌱';
    header.appendChild(icon);
    const title = document.createElement('span');
    title.className = 'finance-card__title';
    title.textContent = 'Цели пока не заданы';
    header.appendChild(title);
    card.appendChild(header);
    const body = document.createElement('div');
    body.className = 'finance-card__body';
    body.innerHTML = '<div class="finance-empty">Добавь заметки в папку 60_Finance/02_Goals с полями goal_target и goal_current.</div>';
    card.appendChild(body);
    grid.appendChild(card);
    return;
  }

  candidates.sort((a, b) => (a.goal_priority ?? a.priority ?? 0) - (b.goal_priority ?? b.priority ?? 0));

  candidates.forEach(page => {
    const card = document.createElement('div');
    card.className = 'finance-card finance-progress-card';
    const header = document.createElement('div');
    header.className = 'finance-card__header';
    const icon = document.createElement('span');
    icon.className = 'finance-card__icon';
    icon.textContent = page.goal_icon || '🎯';
    header.appendChild(icon);
    const title = document.createElement('span');
    title.className = 'finance-card__title';
    title.textContent = page.goal_name || page.file.name;
    header.appendChild(title);
    const meta = document.createElement('span');
    meta.className = 'finance-card__meta';
    const deadline = page.goal_deadline ?? page.deadline;
    meta.textContent = deadline ? `Дедлайн: ${deadline}` : 'Срок не задан';
    header.appendChild(meta);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'finance-card__body';
    const targetRaw = page.goal_target ?? page.goalTarget ?? page.target ?? page.goal?.target ?? page.goal?.amount ?? 0;
    const currentRaw = page.goal_current ?? page.goalCurrent ?? page.current ?? page.balance ?? page.goal?.current ?? 0;
    const target = Number(targetRaw) || 0;
    const current = Number(currentRaw) || 0;
    const percent = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;

    const bar = document.createElement('div');
    bar.className = 'finance-progress__bar';
    const value = document.createElement('div');
    value.className = 'finance-progress__value';
    value.style.width = (percent * 100).toFixed(1) + '%';
    bar.appendChild(value);
    body.appendChild(bar);

    const label = document.createElement('div');
    label.className = 'finance-progress__label';
    label.innerHTML = `<span>Собрано: ${ctx.formatCurrency(current)}</span><span>Цель: ${ctx.formatCurrency(target)}</span>`;
    body.appendChild(label);

    if (page.goal_notes || page.summary) {
      const notes = document.createElement('div');
      notes.style.color = '#425b72';
      notes.style.fontSize = '0.85rem';
      notes.textContent = page.goal_notes || page.summary;
      body.appendChild(notes);
    }

    card.appendChild(body);
    grid.appendChild(card);
  });
})();
```

## 7) Технический блок (библиотеки, провайдер, кэш)
> [!tip]
> ```dataviewjs
> (async () => {
>   const ctx = await window.financeDashboard.ensure();
>   const info = dv.el('div', '');
>   info.className = 'finance-tech';
>   const range = window.financeCurrentRange();
>   const all = await ctx.allRows();
>   const filtered = await ctx.rows();
>   info.innerHTML = `
>     <span class="finance-chip">⚙️ Провайдер активен</span>
>     <div>Всего в папке: <strong>${all.length}</strong> заметок.</div>
>     <div>В фильтре: <strong>${filtered.length}</strong> операций (${range.from} → ${range.to}).</div>
>     <div>Плагины Chart.js: matrix — ${Chart?.controllers?.matrix ? '✅' : '⚠️'}, sankey — ${Chart?.controllers?.sankey ? '✅' : '⚠️'}.</div>
>   `;
> })();
> ```

## 8) Таблица транзакций (источник)
```dataviewjs
(async () => {
  const ctx = await window.financeDashboard.ensure();
  const card = dv.el('div', '');
  card.className = 'finance-card finance-card--table';

  const header = document.createElement('div');
  header.className = 'finance-card__header';
  const icon = document.createElement('span');
  icon.className = 'finance-card__icon';
  icon.textContent = '📄';
  header.appendChild(icon);
  const title = document.createElement('span');
  title.className = 'finance-card__title';
  title.textContent = 'Исходная таблица транзакций';
  header.appendChild(title);
  const meta = document.createElement('span');
  meta.className = 'finance-card__meta';
  header.appendChild(meta);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'finance-card__body';
  const table = document.createElement('table');
  table.className = 'finance-table';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  const columns = ['Дата','Тип','Сумма','Категория','Подкатегория','Источник','Откуда','Куда','Счёт','Тикер','Кол-во','Цена','Файл'];
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  body.appendChild(table);
  card.appendChild(body);

  function renderRows(rows) {
    tbody.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.slice(0, 12).forEach((cell, idx) => {
        const td = document.createElement('td');
        td.textContent = idx === 2 ? ctx.formatCurrency(ctx.toNumber(cell)) : (cell || '');
        tr.appendChild(td);
      });
      const tdLink = document.createElement('td');
      try {
        tdLink.appendChild(dv.el('span', row[12]));
      } catch (_) {
        tdLink.textContent = String(row[12] || '');
      }
      tr.appendChild(tdLink);
      tbody.appendChild(tr);
    });
  }

  async function refresh() {
    const rows = await ctx.rows();
    const range = window.financeCurrentRange();
    meta.textContent = `Показано ${rows.length} записей (${range.from} → ${range.to})`;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="finance-empty">Нет данных в выбранном диапазоне.</td></tr>';
    } else {
      renderRows(rows);
    }
  }

  await refresh();
  let unsubscribe = () => {};
  if (ctx.subscribe) unsubscribe = ctx.subscribe(() => refresh());
  try {
    const comp = dv.current?.();
    if (comp && typeof comp.onunload === 'function') comp.onunload(() => unsubscribe());
  } catch (_) {}
})();
```
