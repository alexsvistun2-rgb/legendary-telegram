---
cssClass: dashboard
---

# 💼 Finance — Единая доска (фильтр → графики → таблица)

> Папка данных: **30_Areas/33_Finance**. Сверху — **фильтр периода**, ниже — **аналитика** (графики, накопления, инвестиции), внизу — **таблицы**.

## 0) Служебные скрипты (Chart.js, плагины, Tabulator, helper)
```dataviewjs
await dv.view('90_System/92_File/Views/finance-bootstrap');
```

## 1) Фильтр периода (ключ `finance_range2`)
```dataviewjs
(()=>{
  const KEY = 'finance_range2';
  const root = dv.el('div','');
  root.className = 'finance-filter';
  const store = {
    load(){ try { const raw = localStorage.getItem(KEY); return raw?JSON.parse(raw):{mode:'month'}; } catch(_) { return {mode:'month'}; } },
    save(patch){
      const val = Object.assign(store.load(), patch||{});
      localStorage.setItem(KEY, JSON.stringify(val));
      if (window.dispatchFinanceRangeChanged) {
        window.dispatchFinanceRangeChanged();
      }
    }
  };
  const cfg = store.load();
  function row(label){ const r=document.createElement('div'); r.className='finance-filter-row'; r.append(Object.assign(document.createElement('span'),{textContent:label})); root.append(r); return r; }
  const selRow = row('Режим');
  const select = document.createElement('select');
  [['all','Всё'],['day','День'],['week','Неделя'],['month','Месяц'],['quarter','Квартал'],['year','Год'],['range','Диапазон']]
    .forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; if(cfg.mode===v) o.selected=true; select.append(o); });
  selRow.append(select);
  const dateRow = row('Дата'); const day = Object.assign(document.createElement('input'),{type:'date', value:cfg.day||''}); dateRow.append(day);
  const weekRow = row('Неделя'); const week = Object.assign(document.createElement('input'),{type:'week', value:cfg.week||''}); weekRow.append(week);
  const monthRow = row('Месяц'); const month = Object.assign(document.createElement('input'),{type:'month', value:cfg.month||''}); monthRow.append(month);
  const quarterRow = row('Квартал'); const qYear = Object.assign(document.createElement('input'),{type:'number', placeholder:'YYYY', value:cfg.qyear||''}); const qSel=document.createElement('select'); ['1','2','3','4'].forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=['I','II','III','IV'][n-1];if(String(cfg.quarter||1)===n) o.selected=true;qSel.append(o);}); quarterRow.append(qYear,qSel);
  const yearRow = row('Год'); const year = Object.assign(document.createElement('input'),{type:'number', placeholder:'YYYY', value:cfg.year||''}); yearRow.append(year);
  const rangeRow = row('Диапазон'); const start = Object.assign(document.createElement('input'),{type:'date', value:cfg.start||''}); const end = Object.assign(document.createElement('input'),{type:'date', value:cfg.end||''}); rangeRow.append(start, document.createTextNode(' — '), end);
  function sync(){ const mode=select.value; dateRow.style.display=mode==='day'?'flex':'none'; weekRow.style.display=mode==='week'?'flex':'none'; monthRow.style.display=mode==='month'?'flex':'none'; quarterRow.style.display=mode==='quarter'?'flex':'none'; yearRow.style.display=mode==='year'?'flex':'none'; rangeRow.style.display=mode==='range'?'flex':'none'; }
  select.addEventListener('change', ()=>{ store.save({mode:select.value, day:null,week:null,month:null,qyear:null,quarter:1,year:null,start:null,end:null}); sync(); });
  [day,week,month,qYear,qSel,year,start,end].forEach(el => el.addEventListener('change', ()=>{
    const out={ mode:select.value, day:day.value||null, week:week.value||null, month:month.value||null, qyear:qYear.value||null, quarter:Number(qSel.value||1), year:year.value||null, start:start.value||null, end:end.value||null };
    if(out.mode==='range' && out.start && out.end && out.start>out.end){ const t=out.start; out.start=out.end; out.end=t; }
    store.save(out);
  }));
  sync();
})();
```

## 2) Провайдер данных (`window.financeRows()` + helpers)
```dataviewjs
(async ()=>{
  await dv.view('90_System/92_File/Views/finance-bootstrap');
  function readConfig(){
    try { const raw = localStorage.getItem('finance_range2'); return raw?JSON.parse(raw):{mode:'month'}; } catch(_) { return {mode:'month'}; }
  }
  function computeRange(){
    const cfg = readConfig();
    const now = moment().endOf('day');
    if(!cfg.mode || cfg.mode==='all') return {s: moment('1900-01-01'), e: now};
    if(cfg.mode==='day' && cfg.day){ const d=moment(cfg.day,'YYYY-MM-DD'); return {s:d.clone().startOf('day'), e:d.clone().endOf('day')}; }
    if(cfg.mode==='week' && cfg.week){ const w=moment(cfg.week+'-1','GGGG-[W]WW-E'); return {s:w.clone().startOf('isoWeek'), e:w.clone().endOf('isoWeek')}; }
    if(cfg.mode==='month' && cfg.month){ const m=moment(cfg.month,'YYYY-MM'); return {s:m.clone().startOf('month'), e:m.clone().endOf('month')}; }
    if(cfg.mode==='quarter' && cfg.qyear){ const q=Number(cfg.quarter||1); const y=Number(cfg.qyear); const m=moment({year:y, month:(q-1)*3, day:1}); return {s:m.clone().startOf('quarter'), e:m.clone().endOf('quarter')}; }
    if(cfg.mode==='year' && cfg.year){ const y=Number(cfg.year); const m=moment({year:y, month:0, day:1}); return {s:m.clone().startOf('year'), e:m.clone().endOf('year')}; }
    if(cfg.mode==='range'){ const s=cfg.start?moment(cfg.start,'YYYY-MM-DD').startOf('day'):moment('1900-01-01'); const e=cfg.end?moment(cfg.end,'YYYY-MM-DD').endOf('day'):now; return e.isBefore(s)?{s:e,e:s}:{s,e}; }
    return {s:moment('1900-01-01'), e:now};
  }
  async function loadAll(){
    if(window.__financeAllCache) return window.__financeAllCache;
    const pages = dv.pages('"30_Areas/33_Finance"');
    const rows=[];
    for(const page of pages){
      if(!page.file || !page.file.path.endsWith('.md')) continue;
      const txt = await dv.io.load(page.file.path);
      const dm = txt.match(/-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/i);
      const dt = dm ? moment(dm[1]+(dm[2]?(' '+dm[2]):''), ['YYYY-MM-DD HH:mm','YYYY-MM-DD']) : moment(page.file.ctime);
      if(!dt.isValid()) continue;
      const num = (txt.match(/-\s*Сумма:\s*\*{0,2}([-+\d\s.,]+)/i)||[])[1]||'0';
      const amount = Number(num.replace(/\s+/g,'').replace(',','.')) || 0;
      function grab(re){ const m = txt.match(re); return m?m[1].trim():''; }
      const item = {
        date: dt.format('YYYY-MM-DD'),
        time: dt.format('HH:mm'),
        type: (txt.match(/#type\/([\w_-]+)/)||[])[1] || (page.type||'other'),
        amount,
        category: grab(/-\s*Категория:\s*\*{0,2}([^\n*]+)/i),
        subcategory: grab(/-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i),
        source: grab(/-\s*Источник:\s*\*{0,2}([^\n*]+)/i),
        from: grab(/-\s*Откуда:\s*\*{0,2}([^\n*]+)/i),
        to: grab(/-\s*Куда:\s*\*{0,2}([^\n*]+)/i),
        account: grab(/-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i),
        asset: grab(/-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i),
        quantity: grab(/-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i),
        price: grab(/-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i),
        tags: page.file?.tags || [],
        link: page.file.link
      };
      item.direction = window.financeIN.test(item.type) ? 'in' : 'out';
      item.absAmount = Math.abs(item.amount);
      item.signed = item.direction==='in' ? Math.abs(item.amount) : -Math.abs(item.amount || 0);
      rows.push(item);
    }
    rows.sort((a,b)=> a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
    window.__financeAllCache = rows;
    return rows;
  }
  window.financeCurrentRange = () => {
    const r = computeRange();
    return { from: r.s.format('YYYY-MM-DD'), to: r.e.format('YYYY-MM-DD') };
  };
  window.financeAllRows = loadAll;
  window.financeRows = async () => {
    const rows = await loadAll();
    const r = computeRange();
    return rows.filter(row => {
      const d = moment(row.date,'YYYY-MM-DD');
      return !d.isBefore(r.s) && !d.isAfter(r.e);
    });
  };
  window.financeRowsDetailed = window.financeRows;
  window.financeRegister = (fn) => {
    if(typeof fn === 'function' && !window.financeListeners.includes(fn)){
      window.financeListeners.push(fn);
    }
  };
})();
```

## 3) Быстрый обзор
```dataviewjs
(async function(){
  await dv.view('90_System/92_File/Views/finance-bootstrap');
  const mount = dv.el('div','');
  mount.className = 'finance-summary-grid';
  async function render(){
    const rows = await window.financeRows();
    const IN = window.financeIN;
    let income=0, expense=0;
    const byCat = {};
    const byDay = {};
    rows.forEach(r => {
      const amt = Math.abs(Number(r.amount||0));
      if(IN.test(r.type)) income += amt; else expense += amt;
      const day = r.date;
      if(!byDay[day]) byDay[day]=0;
      byDay[day] += IN.test(r.type)?amt:-amt;
      if(!byCat[r.category||'—']) byCat[r.category||'—']=0;
      if(!IN.test(r.type)) byCat[r.category||'—'] += amt;
    });
    const net = income - expense;
    const avgDaily = rows.length ? (income+expense)/(Object.keys(byDay).length||1) : 0;
    const worstCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
    const cards = [
      {label:'Доходы', value: income, accent:'#2ecc71'},
      {label:'Расходы', value: expense, accent:'#e74c3c'},
      {label:'Net', value: net, accent: net>=0?'#3498db':'#d35400'},
      {label:'Средний оборот/день', value: avgDaily, accent:'#9b59b6', format:'currency', helper:'(доходы+расходы)/день'},
    ];
    if(worstCat){ cards.push({label:`Топ расход: ${worstCat[0]}`, value: worstCat[1], accent:'#c0392b'}); }
    mount.innerHTML='';
    cards.forEach(card => {
      const el=document.createElement('div'); el.className='finance-summary-card'; el.style.setProperty('--accent',card.accent);
      const value = card.format==='currency'?card.value:`${card.value}`;
      el.innerHTML=`<header>${card.label}</header><strong>${Number(value).toLocaleString('ru-RU',{minimumFractionDigits:2, maximumFractionDigits:2})} ₽</strong>${card.helper?`<span>${card.helper}</span>`:''}`;
      mount.append(el);
    });
  }
  await render();
  window.financeRegister(render);
})();
```

## 4) Динамика потоков
> [!multi-column]
>
>> [!info] Net по дням + MA7/MA30
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount = dv.el('div','');
>>   mount.style.height='320px';
>>   async function render(){
>>     const rows = await window.financeRows();
>>     const byDay={};
>>     rows.forEach(r=>{
>>       const day=r.date; if(!byDay[day]) byDay[day]={in:0,out:0};
>>       const amt=Math.abs(Number(r.amount||0));
>>       if(window.financeIN.test(r.type)) byDay[day].in+=amt; else byDay[day].out+=amt;
>>     });
>>     const labels=Object.keys(byDay).sort();
>>     const inc=labels.map(d=>+byDay[d].in.toFixed(2));
>>     const exp=labels.map(d=>+byDay[d].out.toFixed(2));
>>     const net=labels.map((_,i)=>+(inc[i]-exp[i]).toFixed(2));
>>     function ma(arr,w){ return arr.map((_,i)=>{ const slice=arr.slice(Math.max(0,i-w+1),i+1); const sum=slice.reduce((a,b)=>a+b,0); return +(sum/slice.length).toFixed(2); }); }
>>     const ma7=ma(net,7), ma30=ma(net,30);
>>     const cfg={
>>       type:'line',
>>       data:{labels,datasets:[
>>         {label:'Доходы',data:inc,borderColor:'#2ecc71',backgroundColor:'rgba(46,204,113,0.2)',fill:false,tension:.35},
>>         {label:'Расходы',data:exp,borderColor:'#e74c3c',backgroundColor:'rgba(231,76,60,0.2)',fill:false,tension:.35},
>>         {label:'Net',data:net,borderColor:'#3498db',backgroundColor:'rgba(52,152,219,0.25)',fill:true,tension:.35},
>>         {label:'MA7',data:ma7,borderColor:'#9b59b6',borderDash:[6,4],fill:false},
>>         {label:'MA30',data:ma30,borderColor:'#95a5a6',borderDash:[3,6],fill:false}
>>       ]},
>>       options:{scales:{y:{ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}
>>     };
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```
>
>> [!info] Доходы vs Расходы (месяцы)
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='320px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const byMonth={};
>>     rows.forEach(r=>{
>>       const key=r.date.slice(0,7); if(!byMonth[key]) byMonth[key]={in:0,out:0};
>>       const amt=Math.abs(Number(r.amount||0));
>>       if(window.financeIN.test(r.type)) byMonth[key].in+=amt; else byMonth[key].out+=amt;
>>     });
>>     const labels=Object.keys(byMonth).sort();
>>     const inc=labels.map(m=>+byMonth[m].in.toFixed(2));
>>     const exp=labels.map(m=>+byMonth[m].out.toFixed(2));
>>     const cfg={type:'bar',data:{labels,datasets:[
>>       {label:'Доходы',data:inc,backgroundColor:'rgba(46,204,113,0.7)'},
>>       {label:'Расходы',data:exp,backgroundColor:'rgba(231,76,60,0.7)'}
>>     ]},options:{plugins:{legend:{position:'bottom'}},scales:{y:{stacked:false,ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```

## 5) Структура расходов
> [!multi-column]
>
>> [!warning] Категории (donut)
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='300px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const sums={};
>>     rows.forEach(r=>{ if(window.financeIN.test(r.type)) return; const key=r.category||'—'; sums[key]=(sums[key]||0)+Math.abs(Number(r.amount||0)); });
>>     const labels=Object.keys(sums).sort((a,b)=>sums[b]-sums[a]);
>>     const data=labels.map(k=>+sums[k].toFixed(2));
>>     const colors=labels.map((_,i)=>window.financeColor(i,0.85));
>>     const cfg={type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors}]},options:{plugins:{tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.parsed.toLocaleString('ru-RU',{minimumFractionDigits:2, maximumFractionDigits:2})} ₽`}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```
>
>> [!warning] Treemap (Категория → Подкатегория)
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='300px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const nodes=[]; const totals={};
>>     rows.forEach(r=>{
>>       if(window.financeIN.test(r.type)) return;
>>       const cat=r.category||'—'; const sub=r.subcategory||'—';
>>       const val=Math.abs(Number(r.amount||0));
>>       const id=`${cat} › ${sub}`;
>>       totals[id]=(totals[id]||0)+val;
>>     });
>>     Object.entries(totals).forEach(([key,val],idx)=>{
>>       nodes.push({value:+val.toFixed(2), label:key, backgroundColor:window.financeColor(idx,0.85)});
>>     });
>>     const cfg={type:'treemap',data:{datasets:[{tree:nodes,key:'value',labels:{display:true,formatter:(ctx)=>`${ctx.raw._data.label}\n${ctx.raw.v.toLocaleString('ru-RU',{maximumFractionDigits:0})}`}}]}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```

## 6) Доходы и счета
> [!multi-column]
>
>> [!success] Источники доходов
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='280px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const sums={};
>>     rows.forEach(r=>{ if(!window.financeIN.test(r.type)) return; const key=r.source||r.account||'—'; sums[key]=(sums[key]||0)+Math.abs(Number(r.amount||0)); });
>>     const entries=Object.entries(sums).sort((a,b)=>b[1]-a[1]);
>>     const labels=entries.map(([k])=>k);
>>     const data=entries.map(([,v])=>+v.toFixed(2));
>>     const cfg={type:'bar',data:{labels,datasets:[{label:'Доход',data,backgroundColor:labels.map((_,i)=>window.financeColor(i,0.85))}]},options:{indexAxis:'y',scales:{x:{ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```
>
>> [!success] Сальдо по месяцам
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='280px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const months={};
>>     rows.forEach(r=>{
>>       const m=r.date.slice(0,7); if(!months[m]) months[m]=0;
>>       const amt=Math.abs(Number(r.amount||0));
>>       months[m]+=window.financeIN.test(r.type)?amt:-amt;
>>     });
>>     const labels=Object.keys(months).sort();
>>     let running=0; const data=labels.map(m=>{ running+=months[m]; return +running.toFixed(2); });
>>     const cfg={type:'line',data:{labels,datasets:[{label:'Кумулятивный Net',data,borderColor:'#1abc9c',fill:false,tension:.3}]},options:{scales:{y:{ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```

## 7) Накопления и цели
```dataviewjs
(async function(){
  await dv.view('90_System/92_File/Views/finance-bootstrap');
  const mount=dv.el('div','');
  mount.className='finance-savings-grid';
  async function render(){
    const rows=await window.financeRows();
    const cfg=dv.page('30_Areas/33_Finance/33.2_Planning/Finance_Config');
    const goals=(cfg?.savingsGoals||[]).map((g,idx)=>({
      name:g.name||`Цель ${idx+1}`,
      target:Number(g.target||0),
      targetDate:g.targetDate||'',
      description:g.description||'',
      match:g.match||{},
      color:g.color||window.financeColor(idx,0.85)
    }));
    function matches(goal,row){
      const {field,value}=goal.match||{};
      if(!field || !value) return (row.to||row.category||'').toLowerCase().includes(goal.name.toLowerCase());
      const key = String(field).toLowerCase();
      const val = String(value).toLowerCase();
      const map = {category:row.category, subcategory:row.subcategory, to:row.to, from:row.from, account:row.account};
      if(key==='tag'){ return (row.tags||[]).map(String).some(t=>t.toLowerCase().includes(val)); }
      return String(map[key]||'').toLowerCase().includes(val);
    }
    const contributions={};
    rows.forEach(r=>{
      if(r.type!=='sinking') return;
      goals.forEach(goal=>{ if(matches(goal,r)){ contributions[goal.name]=(contributions[goal.name]||0)+Math.abs(Number(r.amount||0)); } });
    });
    mount.innerHTML='';
    goals.forEach(goal=>{
      const current=contributions[goal.name]||0;
      const progress = goal.target?Math.min(100,Math.round((current/goal.target)*100)):0;
      const card=document.createElement('div'); card.className='finance-saving-card'; card.style.setProperty('--accent',goal.color);
      card.innerHTML=`<header>${goal.name}${goal.targetDate?`<span>до ${goal.targetDate}</span>`:''}</header><div class="progress"><div style="width:${progress}%"></div></div><p>${current.toLocaleString('ru-RU',{minimumFractionDigits:0})} / ${goal.target?goal.target.toLocaleString('ru-RU'): '∞'} ₽</p>${goal.description?`<small>${goal.description}</small>`:''}`;
      mount.append(card);
    });
  }
  await render();
  window.financeRegister(render);
})();
```

## 8) Инвестиции и сложные потоки
> [!multi-column]
>
>> [!tip] Инвестиции по тикерам
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='280px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const tickers={};
>>     rows.forEach(r=>{
>>       if(!/^invest_/.test(r.type)) return;
>>       const key=r.asset||r.category||'—';
>>       const sign=r.type==='invest_buy'?-1:1;
>>       const amt=Math.abs(Number(r.amount||0))*sign;
>>       tickers[key]=(tickers[key]||0)+amt;
>>     });
>>     const entries=Object.entries(tickers).sort((a,b)=>b[1]-a[1]);
>>     const labels=entries.map(([k])=>k);
>>     const data=entries.map(([,v])=>+v.toFixed(2));
>>     const cfg={type:'bar',data:{labels,datasets:[{label:'Net инвестиции',data,backgroundColor:labels.map((_,i)=>window.financeColor(i,0.85))}]},options:{scales:{y:{ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```
>
>> [!tip] Денежные потоки (Sankey)
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='280px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const flows={};
>>     rows.forEach(r=>{
>>       const from=(r.source||r.from||'—').trim();
>>       const to=(r.category||r.to||'—').trim();
>>       if(!from && !to) return;
>>       const key=`${from}|${to}`;
>>       flows[key]=(flows[key]||0)+Math.abs(Number(r.amount||0));
>>     });
>>     const data=Object.entries(flows).map(([key,val],idx)=>{ const [from,to]=key.split('|'); return {from,to,flow:+val.toFixed(2),color:window.financeColor(idx,0.8)}; });
>>     const cfg={type:'sankey',data:{datasets:[{label:'Потоки',data}]} ,options:{plugins:{legend:{display:false}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```

> [!multi-column]
>
>> [!tip] Тепловая карта расходов (день недели × категория)
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='320px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const cats=[...new Set(rows.filter(r=>!window.financeIN.test(r.type)).map(r=>r.category||'—'))].sort();
>>     const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
>>     const map={};
>>     rows.forEach(r=>{
>>       if(window.financeIN.test(r.type)) return;
>>       const dow=moment(r.date,'YYYY-MM-DD').isoWeekday()-1;
>>       const cat=r.category||'—';
>>       const key=`${dow}|${cat}`;
>>       map[key]=(map[key]||0)+Math.abs(Number(r.amount||0));
>>     });
>>     const data=[];
>>     days.forEach((dLabel,dIdx)=>{
>>       cats.forEach((cat,cIdx)=>{
>>         data.push({x:cIdx,y:dIdx,v:Math.round(map[`${dIdx}|${cat}`]||0)});
>>       });
>>     });
>>     const cfg={type:'matrix',data:{datasets:[{label:'Расходы',data,width:({chart})=>chart.chartArea.width/cats.length,height:({chart})=>chart.chartArea.height/days.length,backgroundColor:ctx=>{
>>       const v=ctx.raw.v||0; const alpha=Math.min(0.9,(v/Math.max(...data.map(x=>x.v||1)))+0.05);
>>       return `rgba(231,76,60,${alpha})`;
>>     },borderWidth:1,borderColor:'rgba(255,255,255,0.1)'}]},options:{scales:{x:{type:'category',labels:cats,position:'top'},y:{type:'category',labels:days}},plugins:{tooltip:{callbacks:{title:ctx=>`Категория: ${cats[ctx[0].raw.x]}`,label:ctx=>`${days[ctx.raw.y]}: ${ctx.raw.v.toLocaleString('ru-RU')} ₽`}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```
>
>> [!tip] Расходы по счетам
>> ```dataviewjs
>> (async function(){
>>   await dv.view('90_System/92_File/Views/finance-bootstrap');
>>   const mount=dv.el('div',''); mount.style.height='320px';
>>   async function render(){
>>     const rows=await window.financeRows();
>>     const accounts={};
>>     rows.forEach(r=>{
>>       if(window.financeIN.test(r.type)) return;
>>       const acc=r.account||r.from||'—';
>>       accounts[acc]=(accounts[acc]||0)+Math.abs(Number(r.amount||0));
>>     });
>>     const labels=Object.keys(accounts).sort((a,b)=>accounts[b]-accounts[a]);
>>     const data=labels.map(l=>+accounts[l].toFixed(2));
>>     const cfg={type:'radar',data:{labels,datasets:[{label:'Расходы',data,backgroundColor:'rgba(231,76,60,0.25)',borderColor:'#e74c3c',pointBackgroundColor:'#e74c3c'}]},options:{scales:{r:{ticks:{callback:v=>v.toLocaleString('ru-RU')}}}}};
>>     window.financeRenderChart(cfg,mount);
>>   }
>>   await render();
>>   window.financeRegister(render);
>> })();
>> ```

## 9) Сводные таблицы
```dataviewjs
(async function(){
  await dv.view('90_System/92_File/Views/finance-bootstrap');
  const mount = dv.el('div','');
  mount.className='finance-table';
  async function render(){
    const rows = await window.financeRows();
    const tableData = rows.map(r=>({
      date:r.date,
      type:r.type,
      direction: window.financeIN.test(r.type)?'Доход':'Расход',
      amount: Math.abs(Number(r.amount||0)),
      signed: r.signed,
      category: r.category||'—',
      subcategory: r.subcategory||'—',
      source: r.source||r.from||'—',
      target: r.to||'—',
      account: r.account||'—',
      asset: r.asset||'',
      quantity: r.quantity||'',
      price: r.price||'',
      link: r.link
    }));
    if (mount.__table) {
      try { mount.__table.destroy(); } catch (e) { console.warn('[Finance Table]', e); }
    }
    mount.innerHTML='';
    const table = document.createElement('div');
    mount.append(table);
    const Tab = window.Tabulator;
    mount.__table = new Tab(table, {
      data: tableData,
      layout: 'fitColumns',
      height: '520px',
      reactiveData: true,
      columns: [
        {title:'Дата', field:'date', sorter:'string', hozAlign:'center'},
        {title:'Тип', field:'direction', sorter:'string'},
        {title:'Категория', field:'category', sorter:'string'},
        {title:'Подкатегория', field:'subcategory', sorter:'string'},
        {title:'Источник/Откуда', field:'source', sorter:'string'},
        {title:'Куда/Назначение', field:'target', sorter:'string'},
        {title:'Счёт', field:'account', sorter:'string'},
        {title:'Сумма ₽', field:'amount', sorter:'number', formatter:(cell)=>cell.getValue().toLocaleString('ru-RU',{minimumFractionDigits:2, maximumFractionDigits:2})},
        {title:'Net ₽', field:'signed', sorter:'number', formatter:(cell)=>cell.getValue().toLocaleString('ru-RU',{minimumFractionDigits:2, maximumFractionDigits:2})},
        {title:'Актив', field:'asset', sorter:'string'},
        {title:'Кол-во', field:'quantity', sorter:'string'},
        {title:'Цена', field:'price', sorter:'string'},
        {title:'Заметка', field:'link', sorter:'string', formatter:(cell)=>{ const link=cell.getValue(); return link?`<a data-href="${link.path}" href="${link.path}" class="internal-link">Открыть</a>`:''; }}
      ],
      initialSort:[
        {column:'date', dir:'desc'},
        {column:'amount', dir:'desc'}
      ]
    });
  }
  await render();
  window.financeRegister(render);
})();
```

---

**Подсказки:**
- Управляй целями в файле `30_Areas/33_Finance/33.2_Planning/Finance_Config`.
- Для новых типов операций добавь теги `#type/...`, чтобы Auto Note Mover сразу разложил заметки.
- Используй Tabulator (стрелки в заголовках) для сортировки по сумме, категории, количеству операций.
