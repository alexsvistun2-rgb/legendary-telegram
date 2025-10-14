---
cssClass: dashboard finance-dashboard
---

# 💼 Finance — Единая доска (фильтр → графики → таблица)

> Папка фиксирована: **60_Finance**. Фильтр времени меняет все графики и таблицы. Ниже — основная аналитика, затем дополнительные инсайты и конструктор таблиц.

## Служебные скрипты (Chart.js + плагины + helper)
```dataviewjs
(async function(){
  async function loadOnce(url, isReady){
    try{ if(isReady()) return; }catch(_){ }
    await new Promise(function(resolve, reject){
      const s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('Load fail '+url));
      document.head.appendChild(s);
    });
  }
  function injectCss(url, id){
    if(id && document.querySelector(`link[data-${id}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    if(id) link.dataset[id] = '1';
    document.head.appendChild(link);
  }
  function hasChart(){ try{ return !!window.Chart; }catch(_){ return false; } }
  function hasCtrl(name){ try{ return !!(Chart && Chart.controllers && Chart.controllers[name]); }catch(_){ return false; } }
  await loadOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', hasChart);
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js', function(){ return hasCtrl('matrix'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js', function(){ return hasCtrl('sankey'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-hierarchy@2.0.1/dist/chartjs-chart-hierarchy.min.js', function(){ return !!Chart.registry.getScale('category'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js', function(){ return hasCtrl('treemap'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js', function(){ try{ return !!Chart.registry.plugins.get('datalabels'); }catch(_){ return false; } });
  await loadOnce('https://cdn.jsdelivr.net/npm/gridjs@6.0.6/dist/gridjs.umd.js', function(){ return !!window.gridjs; });
  injectCss('https://cdn.jsdelivr.net/npm/gridjs@6.0.6/dist/theme/mermaid.min.css', 'gridjs');

  if(window.Chart && window.ChartDataLabels){
    try{ Chart.register(window.ChartDataLabels); }catch(_){ }
  }
  if(!window.renderChart){
    window.renderChart = function(cfg, mount){
      const holder = mount || document.createElement('div');
      holder.style.width = '100%';
      holder.style.minHeight = (cfg._height || 280) + 'px';
      const canvas = document.createElement('canvas');
      holder.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      cfg.options = cfg.options || {};
      cfg.options.maintainAspectRatio = false;
      cfg.options.responsive = true;
      cfg.options.plugins = Object.assign({legend:{display:true}, tooltip:{}}, cfg.options.plugins||{});
      new Chart(ctx, cfg);
      return holder;
    };
  }
})();
```

## 0) Фильтр периода (КЛЮЧ `finance_range2`)
```dataviewjs
(()=>{
  const KEYR = 'finance_range2';
  const root = dv.el('div',''); root.classList.add('finance-range');

  const get = ()=>{ try{ const r=localStorage.getItem(KEYR); return r?JSON.parse(r):{mode:'all'}; }catch(_){ return {mode:'all'}; } };
  const set = (patch)=>{
    const merged = Object.assign(get(), patch||{});
    localStorage.setItem(KEYR, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('finance-range-changed'));
  };

  const cfg = get();
  function row(label){
    const r=document.createElement('div'); r.className='finance-range__row';
    const strong=document.createElement('strong'); strong.textContent=label+':';
    r.append(strong);
    root.append(r);
    return r;
  }

  const rMode = row('Режим');
  const mode = document.createElement('select');
  [['all','Всё'],['day','День'],['week','Неделя'],['month','Месяц'],['quarter','Квартал'],['year','Год'],['range','Диапазон']]
    .forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; if(cfg.mode===v) o.selected=true; mode.appendChild(o); });
  rMode.append(mode);

  const rDay=row('День');   const d=document.createElement('input'); d.type='date';  d.value=cfg.day||'';  rDay.append(d);
  const rW=row('Неделя');   const w=document.createElement('input'); w.type='week';  w.value=cfg.week||''; rW.append(w);
  const rM=row('Месяц');    const m=document.createElement('input'); m.type='month'; m.value=cfg.month||'';rM.append(m);
  const rQ=row('Квартал');  const qy=document.createElement('input'); qy.type='number'; qy.placeholder='YYYY'; qy.value=cfg.qyear||'';
                            const q=document.createElement('select'); ['1','2','3','4'].forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=['I','II','III','IV'][n-1]; if(String(cfg.quarter||'')===n) o.selected=true; q.append(o); });
                            rQ.append(qy,q);
  const rY=row('Год');      const y=document.createElement('input'); y.type='number'; y.placeholder='YYYY'; y.value=cfg.year||''; rY.append(y);
  const rR=row('Диапазон'); const s=document.createElement('input'); s.type='date'; s.value=cfg.start||''; const e=document.createElement('input'); e.type='date'; e.value=cfg.end||''; rR.append(s,document.createTextNode('—'),e);

  function show(){ const v=mode.value; rDay.style.display=v==='day'?'flex':'none'; rW.style.display=v==='week'?'flex':'none'; rM.style.display=v==='month'?'flex':'none'; rQ.style.display=v==='quarter'?'flex':'none'; rY.style.display=v==='year'?'flex':'none'; rR.style.display=v==='range'?'flex':'none'; }
  mode.addEventListener('change', ()=>{ set({mode:mode.value, day:null, week:null, month:null, qyear:null, quarter:null, year:null, start:null, end:null}); show(); });
  [d,w,m,qy,q,y,s,e].forEach(el=> el.addEventListener('change', ()=>{
    let out={ mode: mode.value, day:d.value||null, week:w.value||null, month:m.value||null, qyear:qy.value||null, quarter:Number(q.value||1), year:y.value||null, start:s.value||null, end:e.value||null };
    if(out.mode==='range' && out.start && out.end && out.start>out.end){ const t=out.start; out.start=out.end; out.end=t; }
    set(out);
  }));
  show();
})();
```

## 1) Общий провайдер данных (экспортирует `window.financeRows()`)
```dataviewjs
(() => {
  function cfg(){ const r=localStorage.getItem('finance_range2'); return (r&&r[0]==='{'&&r.at(-1)==='}')?JSON.parse(r):{mode:'all'}; }
  function rng(){
    const c=cfg(), now=moment().endOf('day');
    if(!c.mode || c.mode==='all') return {s:moment('1900-01-01'), e:now};
    if(c.mode==='day'    && c.day   ){ const d=moment(c.day,'YYYY-MM-DD'); return {s:d.clone().startOf('day'), e:d.clone().endOf('day')}; }
    if(c.mode==='week'   && c.week  ){ const w=moment(c.week+'-1','GGGG-[W]WW-E'); return {s:w.clone().startOf('isoWeek'), e:w.clone().endOf('isoWeek')}; }
    if(c.mode==='month'  && c.month ){ const m=moment(c.month,'YYYY-MM'); return {s:m.clone().startOf('month'), e:m.clone().endOf('month')}; }
    if(c.mode==='quarter'&& c.qyear ){ const q=Number(c.quarter||1), y=Number(c.qyear); const m=moment({year:y, month:(q-1)*3, day:1}); return {s:m.clone().startOf('quarter'), e:m.clone().endOf('quarter')}; }
    if(c.mode==='year'   && c.year  ){ const y=Number(c.year); const m=moment({year:y, month:0, day:1}); return {s:m.clone().startOf('year'), e:m.clone().endOf('year')}; }
    if(c.mode==='range'             ){ let s=c.start?moment(c.start,'YYYY-MM-DD').startOf('day'):moment('1900-01-01'); let e=c.end?moment(c.end,'YYYY-MM-DD').endOf('day'):now; if(e.isBefore(s)){ const t=s;s=e;e=t; } return {s,e}; }
    return {s:moment('1900-01-01'), e:now};
  }
  const R=rng();
  window.financeCurrentRange = () => ({from:R.s.format('YYYY-MM-DD'), to:R.e.format('YYYY-MM-DD')});

  if(!window.financeAllRows){
    window.financeAllRows = async () => {
      const rows=[], pages=dv.pages('"60_Finance"');
      for (const p of pages){
        const txt=await dv.io.load(p.file.path);
        const dm=(txt.match(/-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/i)||[]);
        const dt=dm[1]? moment(dm[1]+(dm[2]?(' '+dm[2]):''), ['YYYY-MM-DD HH:mm','YYYY-MM-DD']) : moment(p.file.ctime);
        if(!dt.isValid()) continue;
        const date=dt.format('YYYY-MM-DD');
        function g(re){ const m=(txt.match(re)||[]); return (m[1]||'').trim(); }
        const amt=((txt.match(/-\s*Сумма:\s*\*{0,2}([\d\s.,+-]+)/i)||[])[1]||'').replace(/\s+/g,'').replace(',','.');
        rows.push([
          date,
          g(/#type\/([A-Za-z_]+)/g),
          amt||'',
          g(/-\s*Категория:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Источник:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Откуда:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Куда:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i),
          g(/-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i),
          p.file.link
        ]);
      }
      rows.sort((a,b)=>a[0].localeCompare(b[0])||String(a[1]).localeCompare(String(b[1])));
      return rows;
    };
  }
  window.financeRows = async () => {
    const rows = await window.financeAllRows(), out=[], r=rng();
    for (const rr of rows){ const m=moment(rr[0],'YYYY-MM-DD'); if(m.isBefore(r.s)||m.isAfter(r.e)) continue; out.push(rr); }
    return out;
  };
})();
```

## 2) Финансовая аналитика 360°
```dataviewjs
(()=>{
  const mount = dv.el('div','');
  mount.classList.add('finance-dashboard-root');

  const money = (v, opts={}) => {
    if(!isFinite(v)) return '—';
    const digits = opts.digits ?? 0;
    const fmt = new Intl.NumberFormat('ru-RU', {minimumFractionDigits:digits, maximumFractionDigits:digits});
    const unit = opts.unit ?? '₽';
    return `${fmt.format(v)} ${unit}`.trim();
  };
  const perc = (value) => `${(value*100).toFixed(1)}%`;

  const TYPE_INFO = {
    expense:    {label:'Расход', group:'expense',      sign:-1},
    tax:        {label:'Налог',  group:'expense',      sign:-1},
    fee:        {label:'Комиссия',group:'expense',     sign:-1},
    income:     {label:'Доход',  group:'income',       sign: 1},
    refund:     {label:'Возврат',group:'income',       sign: 1},
    transfer:   {label:'Перевод',group:'transfer',     sign: 0},
    sinking:    {label:'Сбережение',group:'saving',    sign:-1},
    invest_buy: {label:'Инвест покупка',group:'invest_out', sign:-1},
    invest_sell:{label:'Инвест продажа',group:'invest_in',  sign: 1},
    divint:     {label:'Дивиденды',group:'invest_in',   sign: 1},
    other:      {label:'Прочее', group:'other',        sign: 0}
  };

  const groupBy = (arr, fn) => {
    const map = new Map();
    for(const item of arr){
      const key = fn(item);
      if(!key) continue;
      const bucket = map.get(key) || {key, total:0, count:0, items:[]};
      bucket.total += item.amount;
      bucket.count += 1;
      bucket.items.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.values());
  };

  const sum = (arr, fn) => arr.reduce((acc, item) => acc + fn(item), 0);

  const parseRows = async () => {
    const raw = await window.financeRows();
    return raw.map(r => {
      const [date, typeRaw, amountRaw, category, subcategory, source, from, to, account, asset, qty, price, link] = r;
      const info = TYPE_INFO[typeRaw] || TYPE_INFO.other;
      const numeric = Number(String(amountRaw || '').replace(/\s+/g,'').replace(',','.')) || 0;
      const amountAbs = Math.abs(numeric);
      const signed = numeric !== 0 ? numeric : info.sign * amountAbs;
      return {
        date,
        type: typeRaw || 'other',
        label: info.label,
        group: info.group,
        amount: amountAbs,
        signed: info.sign === 0 ? 0 : signed,
        category: category || 'Без категории',
        subcategory: subcategory || '—',
        source: source || '',
        from: from || '',
        to: to || '',
        account: account || '',
        asset: asset || '',
        qty: Number(String(qty||'').replace(/\s+/g,'').replace(',','.')) || null,
        price: Number(String(price||'').replace(/\s+/g,'').replace(',','.')) || null,
        link
      };
    });
  };

  const render = async () => {
    mount.innerHTML = '<div class="finance-loading">⏳ Считаю показатели…</div>';
    const rows = await parseRows();
    if(window.financeDashboardListener){
      window.removeEventListener('finance-range-changed', window.financeDashboardListener);
    }
    window.financeDashboardListener = () => render();
    window.addEventListener('finance-range-changed', window.financeDashboardListener);

    if(!rows.length){
      mount.innerHTML = '<div class="finance-empty">За выбранный период операции не найдены.</div>';
      return;
    }

    mount.innerHTML = '';

    const nowRange = window.financeCurrentRange ? window.financeCurrentRange() : null;

    const section = (title, subtitle) => {
      const box = document.createElement('section');
      box.className = 'finance-section';
      const head = document.createElement('header');
      head.className = 'finance-section__head';
      const h2 = document.createElement('h2'); h2.textContent = title; head.appendChild(h2);
      if(subtitle){ const p=document.createElement('p'); p.textContent = subtitle; head.appendChild(p); }
      box.appendChild(head);
      mount.appendChild(box);
      return box;
    };

    const statsBox = section('Быстрый обзор', nowRange ? `Период: ${nowRange.from} → ${nowRange.to}` : '');
    const statsGrid = document.createElement('div'); statsGrid.className='finance-stats'; statsBox.appendChild(statsGrid);

    const expenses = rows.filter(r => ['expense','invest_out','saving'].includes(r.group));
    const expenseTotal = sum(expenses, r => r.amount);
    const incomes = rows.filter(r => ['income','invest_in'].includes(r.group));
    const incomeTotal = sum(incomes, r => r.signed > 0 ? r.signed : r.amount);
    const net = sum(rows.filter(r => r.group!=='transfer'), r => r.signed);
    const investNet = sum(rows.filter(r => ['invest_in','invest_out'].includes(r.group)), r => r.signed);
    const savingsTotal = sum(rows.filter(r => r.group==='saving'), r => r.amount);
    const transferVolume = sum(rows.filter(r => r.group==='transfer'), r => r.amount);
    const avgExpense = expenses.length ? expenseTotal/expenses.length : 0;

    const statCard = (label, value, extra, tone) => {
      const card = document.createElement('article');
      card.className = `finance-stat finance-stat--${tone||'default'}`;
      const h3 = document.createElement('h3'); h3.textContent = label; card.appendChild(h3);
      const strong = document.createElement('strong'); strong.textContent = value; card.appendChild(strong);
      if(extra){ const span=document.createElement('span'); span.textContent = extra; card.appendChild(span); }
      statsGrid.appendChild(card);
    };

    statCard('Доходы', money(incomeTotal), `${incomes.length} операций`, 'income');
    statCard('Расходы', money(expenseTotal), `${expenses.length} операций`, 'expense');
    statCard('Кэш-флоу', money(net), net>=0?'положительно':'отток', net>=0?'positive':'negative');
    statCard('Инвестиции', `${investNet>=0?'+':''}${money(investNet)}`, 'приток − продажи и дивиденды', 'invest');
    statCard('Сбережения', money(savingsTotal), 'отложено в копилки', 'saving');
    statCard('Средний чек', money(avgExpense, {digits:0}), expenses.length?`${expenses.length} покупок`:'нет расходов', 'average');

    const chartsBox = section('Основные графики', 'Линия, радиальная диаграмма, древовидная структура и сравнение по месяцам');
    const chartsGrid = document.createElement('div'); chartsGrid.className='finance-grid'; chartsBox.appendChild(chartsGrid);

    const addChart = (title, description, cfg, height) => {
      if(!cfg) return;
      const wrap = document.createElement('figure'); wrap.className='finance-chart';
      const h3 = document.createElement('h3'); h3.textContent = title; wrap.appendChild(h3);
      if(description){ const p=document.createElement('p'); p.textContent = description; wrap.appendChild(p); }
      cfg._height = height || 320;
      const canvasHolder = window.renderChart(cfg);
      wrap.appendChild(canvasHolder);
      chartsGrid.appendChild(wrap);
    };

    const byDay = (()=>{
      const map = new Map();
      for(const r of rows){
        if(!map.has(r.date)) map.set(r.date,{income:0, expense:0, net:0});
        const bucket = map.get(r.date);
        if(r.signed >= 0) bucket.income += r.signed;
        if(r.signed < 0) bucket.expense += Math.abs(r.signed);
        bucket.net += r.signed;
      }
      const labels = Array.from(map.keys()).sort();
      const income = labels.map(d => +(map.get(d).income.toFixed(2)));
      const expense = labels.map(d => +(map.get(d).expense.toFixed(2)));
      const netArr = labels.map(d => +(map.get(d).net.toFixed(2)));
      const ma = (src, w) => src.map((_,i)=>{
        const slice = src.slice(Math.max(0,i-w+1), i+1);
        return +(slice.reduce((a,b)=>a+b,0)/slice.length).toFixed(2);
      });
      return {labels, income, expense, netArr, ma7:ma(netArr,7), ma30:ma(netArr,30)};
    })();

    if(byDay.labels.length){
      addChart('Кэш-флоу по дням', 'Доходы, расходы и MA7/MA30', {
        type:'line',
        data:{
          labels: byDay.labels,
          datasets:[
            {label:'Доходы', data:byDay.income, borderColor:'rgba(34,197,94,0.9)', backgroundColor:'rgba(34,197,94,0.25)', tension:0.3, fill:false},
            {label:'Расходы', data:byDay.expense, borderColor:'rgba(239,68,68,0.9)', backgroundColor:'rgba(239,68,68,0.25)', tension:0.3, fill:false},
            {label:'Чистый поток', data:byDay.netArr, type:'bar', order:0, borderColor:'rgba(59,130,246,0.9)', backgroundColor:'rgba(59,130,246,0.35)'}
          ]
        },
        options:{
          plugins:{ legend:{position:'top'}, tooltip:{callbacks:{ label(ctx){ return `${ctx.dataset.label}: ${money(ctx.parsed.y)}`; } } } },
          scales:{ y:{ ticks:{ callback:(v)=>money(v) } }, x:{ ticks:{ maxRotation:45, autoSkip:true } } }
        }
      });
    }

    const expenseCats = groupBy(expenses, r => r.category).sort((a,b)=>b.total-a.total);
    if(expenseCats.length){
      addChart('Расходы по категориям', 'Доля в выбранном периоде', {
        type:'doughnut',
        data:{
          labels: expenseCats.map(x=>x.key),
          datasets:[{
            data: expenseCats.map(x=>+x.total.toFixed(2)),
            backgroundColor: expenseCats.map((_,i)=>[`#f97316','#ef4444','#8b5cf6','#0ea5e9','#22c55e','#facc15','#ec4899','#14b8a6'][i%8])
          }]
        },
        options:{ plugins:{ legend:{position:'left'}, tooltip:{callbacks:{ label(ctx){ const total = ctx.dataset.data.reduce((a,b)=>a+b,0); const val = ctx.parsed; return `${ctx.label}: ${money(val)} (${perc(val/total)})`; } } } } }
      }, 320);
    }

    if(expenses.length){
      const tree = expenses.map(r => ({category:r.category, subcategory:r.subcategory, value:+r.amount.toFixed(2)}));
      addChart('Структура расходов (treemap)', 'Категория → подкатегория', {
        type:'treemap',
        data:{ datasets:[{ tree, key:'value', groups:['category','subcategory'], spacing:0.8, borderWidth:1, borderColor:'rgba(15,23,42,0.1)', backgroundColor:(ctx)=>{
          const palette = ['#0ea5e9','#22d3ee','#8b5cf6','#f97316','#facc15','#f472b6','#10b981','#60a5fa'];
          return palette[ctx.index % palette.length] + '33';
        } }] },
        options:{ plugins:{ legend:{display:false}, tooltip:{callbacks:{ title:(items)=>items[0].raw.category+' → '+items[0].raw.subcategory, label:(ctx)=>money(ctx.raw.v) } } } }
      }, 320);
    }

    const byMonth = (()=>{
      const map = new Map();
      for(const r of rows){
        const key = moment(r.date,'YYYY-MM-DD').format('YYYY-MM');
        if(!map.has(key)) map.set(key,{income:0, expense:0});
        const bucket = map.get(key);
        if(r.signed >=0) bucket.income += r.signed; else bucket.expense += Math.abs(r.signed);
      }
      const labels = Array.from(map.keys()).sort();
      return {labels, income:labels.map(k=>+map.get(k).income.toFixed(2)), expense:labels.map(k=>+map.get(k).expense.toFixed(2))};
    })();
    if(byMonth.labels.length){
      addChart('Доходы vs Расходы по месяцам', 'Столбики в рублях', {
        type:'bar',
        data:{ labels: byMonth.labels, datasets:[
          {label:'Доходы', data:byMonth.income, backgroundColor:'rgba(34,197,94,0.75)'},
          {label:'Расходы', data:byMonth.expense, backgroundColor:'rgba(239,68,68,0.75)'}
        ] },
        options:{ plugins:{ tooltip:{callbacks:{ label:(ctx)=>`${ctx.dataset.label}: ${money(ctx.parsed.y)}` } }, legend:{position:'top'} }, scales:{ y:{ ticks:{ callback:(v)=>money(v) } } } }
      });
    }

    const savingsBox = section('Цели и накопления', 'Данные берутся из папки 60_Finance/64_Goals');
    const goals = Array.from(dv.pages('"60_Finance/64_Goals"').values ?? []).filter(p => p.target || p.goal);
    if(!goals.length){
      const note = document.createElement('div'); note.className='finance-empty'; note.textContent='Создайте заметки-цели с полями target, current, deadline, account.';
      savingsBox.appendChild(note);
    } else {
      const list = document.createElement('div'); list.className='finance-goals';
      savingsBox.appendChild(list);
      goals.forEach(page => {
        const target = Number(page.target ?? page.goal ?? 0);
        const current = Number(page.current ?? page.progress ?? 0);
        const deadline = page.deadline ? moment(page.deadline).format('YYYY-MM-DD') : '—';
        const ratio = target>0 ? Math.min(current/target, 1) : 0;
        const card = document.createElement('article'); card.className='finance-goal';
        const title = document.createElement('h3'); title.textContent = page.file?.name ?? 'Цель'; card.appendChild(title);
        const bar = document.createElement('div'); bar.className='finance-goal__bar';
        const fill = document.createElement('div'); fill.style.width = (ratio*100).toFixed(1)+'%'; fill.textContent = perc(ratio); bar.appendChild(fill);
        card.appendChild(bar);
        const meta = document.createElement('p'); meta.innerHTML = `${money(current)} из ${money(target)} · дедлайн: <strong>${deadline}</strong>`; card.appendChild(meta);
        list.appendChild(card);
      });
    }

    const insightBox = section('Расширенные инсайты', 'Матрицы, горизонтальные диаграммы и Sankey для потоков');
    const insightGrid = document.createElement('div'); insightGrid.className='finance-grid'; insightBox.appendChild(insightGrid);

    const addInsightChart = (title, description, cfg, height) => {
      if(!cfg) return;
      const wrap = document.createElement('figure'); wrap.className='finance-chart';
      const h3 = document.createElement('h3'); h3.textContent = title; wrap.appendChild(h3);
      if(description){ const p=document.createElement('p'); p.textContent = description; wrap.appendChild(p); }
      cfg._height = height || 320;
      wrap.appendChild(window.renderChart(cfg));
      insightGrid.appendChild(wrap);
    };

    const cumFlow = (()=>{
      const labels = byDay.labels;
      if(!labels.length) return null;
      const cumulative = [];
      let acc = 0;
      for(const v of byDay.netArr){ acc += v; cumulative.push(+acc.toFixed(2)); }
      return {labels, cumulative};
    })();
    if(cumFlow){
      addInsightChart('Кумулятивный поток', 'Показывает тренд за период', {
        type:'line', data:{ labels:cumFlow.labels, datasets:[{ label:'Накопленный итог', data:cumFlow.cumulative, borderColor:'rgba(147,51,234,0.9)', backgroundColor:'rgba(147,51,234,0.25)', tension:0.3, fill:false }] },
        options:{ plugins:{ tooltip:{callbacks:{ label:(ctx)=>money(ctx.parsed.y) } } }, scales:{ y:{ ticks:{ callback:(v)=>money(v) } } } }
      });
    }

    const avgByCat = expenseCats.filter(x=>x.count>=2).slice(0,10).map(x=>({label:x.key, avg:x.total/x.count}));
    if(avgByCat.length){
      addInsightChart('Средний чек по категориям', 'Топ-10 по сумме операций', {
        type:'bar',
        data:{ labels: avgByCat.map(x=>x.label), datasets:[{ label:'Средний чек', data:avgByCat.map(x=>+x.avg.toFixed(2)), backgroundColor:'rgba(14,116,144,0.75)' }] },
        options:{ indexAxis:'y', plugins:{ tooltip:{callbacks:{ label:(ctx)=>money(ctx.parsed.x || ctx.parsed) } }, legend:{display:false} }, scales:{ x:{ ticks:{ callback:(v)=>money(v) } } } }
      });
    }

    const matrixData = (()=>{
      if(!expenses.length) return null;
      const cats = Array.from(new Set(expenses.map(r=>r.category)));
      const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
      const index = (cat, day) => `${cat}__${day}`;
      const map = new Map();
      for(const r of expenses){
        const dayIdx = moment(r.date,'YYYY-MM-DD').isoWeekday()-1;
        const key = index(r.category, dayIdx);
        map.set(key, (map.get(key)||0) + r.amount);
      }
      const data = [];
      map.forEach((value, key) => {
        const [cat, dayIdx] = key.split('__');
        data.push({x:cats.indexOf(cat), y:Number(dayIdx), v:+value.toFixed(2)});
      });
      return {cats, days, data};
    })();
    if(matrixData && matrixData.data.length){
      addInsightChart('Тепловая карта расходов', 'Категории vs день недели', {
        type:'matrix',
        data:{ datasets:[{
          label:'Расходы',
          data: matrixData.data,
          width: ({chart}) => (chart.chartArea||{}).width ? (chart.chartArea.width / matrixData.cats.length) - 6 : 40,
          height: ({chart}) => (chart.chartArea||{}).height ? (chart.chartArea.height / matrixData.days.length) - 6 : 30,
          backgroundColor: ctx => {
            const value = ctx.raw.v;
            const alpha = Math.min(0.85, 0.2 + value / (expenseTotal || 1) * 4);
            return `rgba(239,68,68,${alpha})`;
          },
          borderWidth:1,
          borderColor:'rgba(15,23,42,0.08)'
        }] },
        options:{
          scales:{
            x:{ type:'category', labels:matrixData.cats },
            y:{ type:'category', labels:matrixData.days, reverse:true }
          },
          plugins:{ legend:{display:false}, tooltip:{callbacks:{ title:(items)=>`${matrixData.cats[items[0].raw.x]} · ${matrixData.days[items[0].raw.y]}`, label:(ctx)=>money(ctx.raw.v) } } }
        }
      }, 360);
    }

    const flowData = (()=>{
      const flows = [];
      for(const r of rows){
        if(r.group==='transfer'){ if(r.from && r.to) flows.push({from:r.from, to:r.to, value:r.amount}); }
        else if(r.group==='expense' && r.account){ flows.push({from:r.account, to:r.category, value:r.amount}); }
      }
      if(!flows.length) return null;
      const map = new Map();
      for(const f of flows){
        const key = `${f.from}→${f.to}`;
        map.set(key, (map.get(key)||0) + f.value);
      }
      return Array.from(map.entries()).map(([key,value])=>{
        const [from,to] = key.split('→');
        return {from,to,value:+value.toFixed(2)};
      });
    })();
    if(flowData && flowData.length){
      addInsightChart('Потоки средств (Sankey)', 'Переводы и расходы по счетам', {
        type:'sankey',
        data:{ datasets:[{ label:'Поток', data: flowData.map(f=>({from:f.from, to:f.to, flow:f.value})), colorFrom:'rgba(14,165,233,0.75)', colorTo:'rgba(236,72,153,0.75)', colorMode:'gradient' }] },
        options:{ plugins:{ tooltip:{callbacks:{ label:(ctx)=>`${ctx.raw.from} → ${ctx.raw.to}: ${money(ctx.raw.flow)}` } } } }
      }, 360);
    }

    const investAssets = rows.filter(r => ['invest_out','invest_in'].includes(r.group) && r.asset).reduce((acc,r)=>{
      acc[r.asset] = (acc[r.asset]||0) + r.signed;
      return acc;
    },{});
    const investEntries = Object.entries(investAssets).map(([asset,value])=>({asset,value:+value.toFixed(2)})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
    if(investEntries.length){
      addInsightChart('Инвестиции по активам', 'Положительное → приток, отрицательное → вложение', {
        type:'bar',
        data:{ labels: investEntries.map(x=>x.asset), datasets:[{ label:'Нетто', data:investEntries.map(x=>x.value), backgroundColor:investEntries.map(x=> x.value>=0 ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)') }] },
        options:{ indexAxis:'y', plugins:{ tooltip:{callbacks:{ label:(ctx)=>money(ctx.parsed.x || ctx.parsed) } }, legend:{display:false} }, scales:{ x:{ ticks:{ callback:(v)=>money(v) } } } }
      });
    }

    const tableBox = section('Полная таблица операций', 'Сортировка, поиск и пагинация');
    const tableMount = document.createElement('div'); tableMount.className='finance-table'; tableBox.appendChild(tableMount);
    const tableData = rows.map(r => [
      r.date,
      r.label,
      r.category,
      r.subcategory,
      money(r.amount),
      money(r.signed),
      r.account || '—',
      r.source || '—',
      r.from || '—',
      r.to || '—',
      r.asset || '—',
      r.qty!=null ? r.qty : '—',
      r.price!=null ? money(r.price) : '—',
      r.link ? r.link : ''
    ]);

    if(window.gridjs){
      new gridjs.Grid({
        columns: [
          {id:'date', name:'Дата', width:'110px'},
          {id:'type', name:'Тип'},
          {id:'category', name:'Категория'},
          {id:'sub', name:'Подкатегория'},
          {id:'amount', name:'Сумма'},
          {id:'cash', name:'Движение'},
          {id:'account', name:'Счёт'},
          {id:'source', name:'Источник'},
          {id:'from', name:'Откуда'},
          {id:'to', name:'Куда'},
          {id:'asset', name:'Актив'},
          {id:'qty', name:'Кол-во'},
          {id:'price', name:'Цена'},
          {id:'link', name:'Заметка'}
        ],
        data: tableData,
        sort: {multiColumn:true},
        search: true,
        pagination: {enabled:true, limit:15},
        style: { th:{'text-transform':'uppercase','font-size':'0.7rem','letter-spacing':'0.08em'}, td:{'font-size':'0.85rem'} }
      }).render(tableMount);
    } else {
      tableMount.innerHTML = '<div class="finance-empty">Grid.js не загрузился. Проверьте интернет.</div>';
    }
  };

  render();
})();
```
