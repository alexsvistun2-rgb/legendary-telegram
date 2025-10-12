---
cssClass: dashboard
---

# 💼 Finance — Единая доска (фильтр → графики → таблица)

> Папка фиксирована: **60_Finance**.  
> Сверху — **фильтр периода**, ниже — **графики** (читают `window.financeRows()`), внизу — **таблица‑источник** (самообновляющаяся).

## Служебные скрипты (Chart.js + плагины + helper)
```dataviewjs
(async function(){
  async function loadOnce(url, isReady){
    try{ if(isReady()) return; }catch(_){}
    await new Promise(function(res,rej){
      var s=document.createElement('script'); s.src=url; s.async=true;
      s.onload=res; s.onerror=function(){ rej(new Error('Load fail '+url)); };
      document.head.appendChild(s);
    });
  }
  function hasChart(){ try{ return !!window.Chart; }catch(_){ return false; } }
  function hasCtrl(name){ try{ return !!(Chart && Chart.controllers && Chart.controllers[name]); }catch(_){ return false; } }
  await loadOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', hasChart);
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js', function(){ return hasCtrl('matrix'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js', function(){ return hasCtrl('sankey'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-hierarchy@2.0.1/dist/chartjs-chart-hierarchy.min.js', function(){ return !!Chart.registry.getScale('category'); });
  await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js', function(){ return hasCtrl('treemap'); });
  if(!window.renderChart){
    window.renderChart = function(cfg, mount){
      var holder = mount || document.createElement('div');
      holder.style.width = '100%';
      holder.style.minHeight = (cfg._height || 280) + 'px';
      var canvas = document.createElement('canvas');
      holder.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      cfg.options = cfg.options || {};
      cfg.options.maintainAspectRatio = false;
      cfg.options.responsive = true;
      cfg.options.plugins = cfg.options.plugins || {};
      cfg.options.plugins.legend = cfg.options.plugins.legend || { display: true };
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
  const root = dv.el('div',''); root.style.display='grid'; root.style.gap='8px';

  const get = ()=>{ try{ const r=localStorage.getItem(KEYR); return r?JSON.parse(r):{mode:'all'}; }catch(_){ return {mode:'all'}; } };
  const set = (patch)=>{
    const merged = Object.assign(get(), patch||{});
    localStorage.setItem(KEYR, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('finance-range-changed'));
  };

  const cfg = get();
  function row(label){ const r=document.createElement('div'); r.style.display='flex'; r.style.gap='8px'; r.style.alignItems='center'; r.append(Object.assign(document.createElement('strong'),{textContent:label+':'})); root.append(r); return r; }

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

  // Собираем все строки из 60_Finance, потом фильтруем по диапазону
  if(!window.financeAllRows){
    window.financeAllRows = async () => {
      const rows=[], pages=dv.pages('"60_Finance"');
      for (const p of pages){
        const txt=await dv.io.load(p.file.path);
        const dm=(txt.match(/-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/i)||[]);
        const dt=dm[1]? moment(dm[1]+(dm[2]?(' '+dm[2]):''), ['YYYY-MM-DD HH:mm','YYYY-MM-DD']) : moment(p.file.ctime);
        if(!dt.isValid()) continue;
        const date=dt.format('YYYY-MM-DD'), time=dt.format('HH:mm');
        function g(re){ const m=(txt.match(re)||[]); return (m[1]||'').trim(); }
        const amt=((txt.match(/-\s*Сумма:\s*\*{0,2}([\d\s.,+-]+)/i)||[])[1]||'').replace(/\s+/g,'').replace(',','.');
        rows.push([date, g(/#type\/([A-Za-z_]+)/g), amt||'', g(/-\s*Категория:\s*\*{0,2}([^\n*]+)/i),
                   g(/-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/i), g(/-\s*Источник:\s*\*{0,2}([^\n*]+)/i),
                   g(/-\s*Откуда:\s*\*{0,2}([^\n*]+)/i), g(/-\s*Куда:\s*\*{0,2}([^\n*]+)/i),
                   g(/-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/i), g(/-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/i),
                   g(/-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/i), g(/-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/i), p.file.link]);
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

# 2) Быстрая аналитика

> [!multi-column]
>
>> [!info] Кэш‑флоу по дням + MA7/MA30
>> ```dataviewjs
>> (async function(){
>>   var rows = await window.financeRows();
>>   var IN = /^(income|refund|dividend|invest_sell)$/;
>>   var byDay = {};
>>   for (var i=0;i<rows.length;i++){
>>     var date=rows[i][0], type=rows[i][1], amount=rows[i][2];
>>     var a=Math.abs(Number(amount||0)); if(!byDay[date]) byDay[date]={inc:0,exp:0};
>>     if(IN.test(type)) byDay[date].inc+=a; else byDay[date].exp+=a;
>>   }
>>   var labels=Object.keys(byDay).sort();
>>   var inc=[],exp=[],net=[],i;
>>   for(i=0;i<labels.length;i++){ inc.push(+byDay[labels[i]].inc.toFixed(2)); exp.push(+byDay[labels[i]].exp.toFixed(2)); net.push(+(inc[i]-exp[i]).toFixed(2)); }
>>   function MA(arr,w){ var out=[],i,j; for(i=0;i<arr.length;i++){ var s=Math.max(0,i-w+1),sum=0,c=0; for(j=s;j<=i;j++){ sum+=arr[j]; c++; } out.push(+(sum/c).toFixed(2)); } return out; }
>>   var ma7=MA(net,7), ma30=MA(net,30);
>>   function mk(label,data,fill,color){ return {label:label,data:data,type:'line',tension:.4,cubicInterpolationMode:'monotone',pointRadius:0,fill:fill,borderColor:color,backgroundColor:color}; }
>>   var cfg={type:'line',data:{labels:labels,datasets:[
>>     mk('Доходы',inc,false,'rgba(46,204,113,.9)'),
>>     mk('Расходы',exp,false,'rgba(231,76,60,.9)'),
>>     mk('Net',net,true,'rgba(41,128,185,.35)'),
>>     mk('MA7',ma7,false,'rgba(155,89,182,.9)'),
>>     mk('MA30',ma30,false,'rgba(52,73,94,.9)')
>>   ]}};
>>   var el=dv.el('div',''); el.style.height='300px'; window.renderChart(cfg,el);
>> })();
>> ```
>
>> [!info] Доходы vs Расходы (stacked) + Net
>> ```dataviewjs
>> (async function(){
>>   var rows=await window.financeRows();
>>   var IN=/^(income|refund|dividend|invest_sell)$/;
>>   var byM={};
>>   for (var i=0;i<rows.length;i++){
>>     var k=rows[i][0].slice(0,7); var a=Math.abs(Number(rows[i][2]||0));
>>     if(!byM[k]) byM[k]={inc:0,exp:0};
>>     if(IN.test(rows[i][1])) byM[k].inc+=a; else byM[k].exp+=a;
>>   }
>>   var labels=Object.keys(byM).sort();
>>   var inc=[],exp=[],net=[]; for(var i2=0;i2<labels.length;i2++){ var v=byM[labels[i2]]; inc.push(+v.inc.toFixed(2)); exp.push(+v.exp.toFixed(2)); net.push(+(v.inc-v.exp).toFixed(2)); }
>>   var cfg={type:'bar',data:{labels:labels,datasets:[
>>     {label:'Доходы',data:inc,stack:'flows',backgroundColor:'rgba(46,204,113,.65)'},
>>     {label:'Расходы',data:exp,stack:'flows',backgroundColor:'rgba(231,76,60,.65)'},
>>     {label:'Net',data:net,stack:'net',backgroundColor:'rgba(52,73,94,.75)'}
>>   ]},options:{scales:{x:{stacked:true},y:{stacked:true}}}};
>>   var el=dv.el('div',''); el.style.height='300px'; window.renderChart(cfg,el);
>> })();
>> ```
>
>> [!info] Структура расходов (donut)
>> ```dataviewjs
>> (async function(){
>>   var rows=await window.financeRows();
>>   var sums={}, i;
>>   for (i=0;i<rows.length;i++){
>>     var type=rows[i][1], amount=rows[i][2], cat=rows[i][3]||'—';
>>     if(/^(income|refund|dividend|invest_sell)$/.test(type)) continue;
>>     var a=Math.abs(Number(amount||0));
>>     sums[cat]=(sums[cat]||0)+a;
>>   }
>>   var labels=Object.keys(sums), vals=[], colors=[];
>>   for(i=0;i<labels.length;i++){ vals.push(+sums[labels[i]].toFixed(2)); colors.push('hsl('+((i*47)%360)+' 70% 55% / .9)'); }
>>   var cfg={type:'doughnut',data:{labels:labels,datasets:[{data:vals,backgroundColor:colors}]}};
>>   var el=dv.el('div',''); el.style.height='260px'; window.renderChart(cfg,el);
>> })();
>> ```

# 3) Глубокая аналитика

> [!multi-column]
>
>> [!info] Pareto по категориям
>> ```dataviewjs
>> (async function(){
>>   var rows = await window.financeRows();
>>   var sums = {};
>>   for (var i = 0; i < rows.length; i++) {
>>     var type = rows[i][1];
>>     var amount = Number(rows[i][2] || 0);
>>     var cat = rows[i][3] || '—';
>>     if (/^(income|refund|dividend|invest_sell)$/.test(type)) continue;
>>     var a = Math.abs(amount);
>>     sums[cat] = (sums[cat] || 0) + a;
>>   }
>>   var items = []; for (var k in sums) if (Object.prototype.hasOwnProperty.call(sums,k)) items.push([k, sums[k]]);
>>   items.sort(function(a,b){ return b[1] - a[1]; });
>>   var labels = [], vals = [], total = 0;
>>   for (var j = 0; j < items.length; j++) { labels.push(items[j][0]); vals.push(+items[j][1].toFixed(2)); total += items[j][1]; }
>>   var cum = [], acc = 0; for (var t = 0; t < vals.length; t++) { acc += vals[t]; cum.push(+((acc / (total || 1)) * 100).toFixed(2)); }
>>   var cfg = { type: 'bar', data: { labels: labels, datasets: [
>>       { label: 'Расходы', data: vals, yAxisID: 'y' },
>>       { label: 'Нак. %', data: cum, yAxisID: 'y1', type: 'line', tension: 0.4, pointRadius: 0 }
>>     ]}, options: { scales: { y: { beginAtZero: true }, y1: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false } } } } };
>>   var el = dv.el('div',''); el.style.height='320px'; window.renderChart(cfg, el);
>> })();
>> ```
>
>> [!info] Контрольная диаграмма (мес. расходы + ±σ)
>> ```dataviewjs
>> (async function(){
>>   var rows=await window.financeRows(), IN=/^(income|refund|dividend|invest_sell)$/;
>>   var byM={}, i;
>>   for(i=0;i<rows.length;i++){ var k=rows[i][0].slice(0,7); var a=Math.abs(Number(rows[i][2]||0)); byM[k]=(byM[k]||0)+(IN.test(rows[i][1])?0:a); }
>>   var labels=Object.keys(byM).sort(), exp=[], i2; for(i2=0;i2<labels.length;i2++) exp.push(+byM[labels[i2]].toFixed(2));
>>   var mean=0; for(i2=0;i2<exp.length;i2++) mean+=exp[i2]; mean/=Math.max(1,exp.length);
>>   var s2=0; for(i2=0;i2<exp.length;i2++) s2+=(exp[i2]-mean)*(exp[i2]-mean); var sd=Math.sqrt(s2/Math.max(1,exp.length));
>>   function line(v){ var a=[],i3; for(i3=0;i3<labels.length;i3++) a.push(+v.toFixed(2)); return a; }
>>   function mk(label,data,color){ return {label:label,data:data,type:'line',tension:0,pointRadius:0,borderDash:[6,6],borderColor:color}; }
>>   var cfg={type:'line',data:{labels:labels,datasets:[
>>     {label:'Расходы/мес',data:exp,type:'line',tension:.4,cubicInterpolationMode:'monotone',pointRadius:0,borderColor:'rgba(231,76,60,.9)'},
>>     mk('Mean',line(mean),'rgba(52,73,94,.9)'), mk('+1σ',line(mean+sd),'rgba(41,128,185,.9)'), mk('-1σ',line(mean-sd),'rgba(41,128,185,.9)')
>>   ]}};
>>   var el=dv.el('div',''); el.style.height='280px'; window.renderChart(cfg,el);
>> })();
>> ```
>
>> [!info] Календарный heatmap (дни)
>> ```dataviewjs
>> (async function(){
>>   if(!(Chart && Chart.controllers && Chart.controllers.matrix)){ dv.paragraph('⚠️ matrix-плагин не загружен'); return; }
>>   var rows=await window.financeRows(), byDay={}, i;
>>   for(i=0;i<rows.length;i++){ if(/^(income|refund|dividend|invest_sell)$/.test(rows[i][1])) continue; var d=rows[i][0]; byDay[d]=(byDay[d]||0)+Math.abs(Number(rows[i][2]||0)); }
>>   var days=Object.keys(byDay).sort(), data=[], i2; for(i2=0;i2<days.length;i2++){ var d2=days[i2]; data.push({x:d2,y:moment(d2,'YYYY-MM-DD').format('ddd'),v:+byDay[d2].toFixed(2)}); }
>>   var cfg={type:'matrix',data:{datasets:[{label:'Расходы',data:data,width:(c)=> (c.chartArea||{}).width/Math.min(days.length,60),height:(c)=> (c.chartArea||{}).height/7,backgroundColor:(c)=>{ var v=c.raw.v; var l=Math.max(20,80 - Math.min(80, v/10)); return 'hsl(0 70% '+l+'% / .9)';}}]},options:{scales:{y:{type:'category',offset:true,reverse:true},x:{type:'time',time:{unit:'day'}}},plugins:{legend:{display:false}}};
>>   var el=dv.el('div',''); el.style.height='240px'; window.renderChart(cfg,el);
>> })();
>> ```

# 4) Акции и прочее

> [!multi-column]
>
>> [!info] Стоимость портфеля (line)
>> ```dataviewjs
>> (async function(){
>>   var rows=await window.financeRows(), byD={}, i;
>>   for(i=0;i<rows.length;i++){ var date=rows[i][0], t=rows[i][9], q=Number(String(rows[i][10]||'').replace(',','.')), p=Number(String(rows[i][11]||'').replace(',','.')); if(!t||isNaN(q)||isNaN(p)) continue; byD[date]=(byD[date]||0)+q*p; }
>>   var labels=Object.keys(byD).sort(), val=[], j; for(j=0;j<labels.length;j++) val.push(+byD[labels[j]].toFixed(2));
>>   var cfg={type:'line',data:{labels:labels,datasets:[{label:'Portfolio value',data:val,type:'line',tension:.4,pointRadius:0}]} };
>>   var el=dv.el('div',''); el.style.height='260px'; window.renderChart(cfg,el);
>> })();
>> ```
>
>> [!info] Баланс по счетам (Δ притоки−оттоки)
>> ```dataviewjs
>> (async function(){
>>   var rows=await window.financeRows(), IN=/^(income|refund|dividend|invest_sell)$/;
>>   var byAcc={}, i;
>>   for(i=0;i<rows.length;i++){ var type=rows[i][1], a=Math.abs(Number(rows[i][2]||0)), from=rows[i][6], to=rows[i][7]; if(IN.test(type)){ byAcc[to||'—']=(byAcc[to||'—']||0)+a; } else { byAcc[from||'—']=(byAcc[from||'—']||0)-a; } }
>>   var labels=Object.keys(byAcc), vals=[], i2; for(i2=0;i2<labels.length;i2++) vals.push(+byAcc[labels[i2]].toFixed(2));
>>   var colors=[]; for(i2=0;i2<vals.length;i2++) colors.push(vals[i2]>=0?'rgba(46,204,113,.7)':'rgba(231,76,60,.7)');
>>   var cfg={type:'bar',data:{labels:labels,datasets:[{label:'ΔБаланс',data:vals,backgroundColor:colors}]}};
>>   var el=dv.el('div',''); el.style.height='260px'; window.renderChart(cfg,el);
>> })();
>> ```
>
>> [!info] Sankey «Откуда → Куда/Категория»
>> ```dataviewjs
>> (async function(){
>>   if(!(Chart && Chart.controllers && Chart.controllers.sankey)){ dv.paragraph('⚠️ sankey-плагин не загружен'); return; }
>>   var rows=await window.financeRows(), IN=/^(income|refund|dividend|invest_sell)$/;
>>   var links={}, i;
>>   for(i=0;i<rows.length;i++){ var a=Math.abs(Number(rows[i][2]||0)), cat=rows[i][3]||'Расходы', from=rows[i][6]||'Счёт', to=rows[i][7]||'Счёт'; if(IN.test(rows[i][1])){ links[(from||'Источник')+'|'+(to||cat)]=(links[(from||'Источник')+'|'+(to||cat)]||0)+a; } else { links[(from||'Счёт')+'|'+cat]=(links[(from||'Счёт')+'|'+cat]||0)+a; } }
>>   var data=[], k; for(k in links){ if(Object.prototype.hasOwnProperty.call(links,k)){ var sp=k.split('|'); data.push({from:sp[0],to:sp[1],flow:+links[k].toFixed(2)}); } }
>>   var cfg={type:'sankey',data:{datasets:[{label:'Потоки',data:data,colorFrom:'#2ecc71',colorTo:'#e74c3c',colorMode:'gradient'}]}};
>>   var el=dv.el('div',''); el.style.height='360px'; window.renderChart(cfg,el);
>> })();
>> ```

---

# 📄 Таблица транзакций (источник, автообновление)
```dataviewjs
(async function(){
  const FOLDER = '60_Finance';
  const container = dv.el('div',''); container.style.display='grid'; container.style.gap='10px';

  function cfgR(){ try{ return JSON.parse(localStorage.getItem('finance_range2')||'{}'); }catch(_){ return {mode:'all'}; } }
  function computeRange(c){
    const now = moment().endOf('day');
    const m = c.mode || 'all';
    if(m==='all') return {s: moment('1900-01-01'), e: now};
    if(m==='day'   && c.day  ){ const d=moment(c.day,'YYYY-MM-DD'); return {s:d.clone().startOf('day'), e:d.clone().endOf('day')}; }
    if(m==='week'  && c.week ){ const w=moment(c.week+'-1','GGGG-[W]WW-E'); return {s:w.clone().startOf('isoWeek'), e:w.clone().endOf('isoWeek')}; }
    if(m==='month' && c.month){ const mo=moment(c.month,'YYYY-MM'); return {s:mo.clone().startOf('month'), e:mo.clone().endOf('month')}; }
    if(m==='quarter'&& c.qyear){ const q=Number(c.quarter||1), y=Number(c.qyear); const mo=moment({year:y, month:(q-1)*3, day:1}); return {s:mo.clone().startOf('quarter'), e:mo.clone().endOf('quarter')}; }
    if(m==='year'  && c.year ){ const y=Number(c.year); const mo=moment({year:y, month:0, day:1}); return {s:mo.clone().startOf('year'), e:mo.clone().endOf('year')}; }
    if(m==='range' ){ let s=c.start?moment(c.start,'YYYY-MM-DD').startOf('day'):moment('1900-01-01'); let e=c.end?moment(c.end,'YYYY-MM-DD').endOf('day'):now; if(e.isBefore(s)){ const t=s; s=e; e=t; } return {s,e}; }
    return {s: moment('1900-01-01'), e: now};
  }

  const RX_DATE = /^-\s*Дата:\s*\*{0,2}(\d{4}-\d{2}-\d{2})(?:\s+\d{2}:\d{2})?/mi;
  const RX_TYPE = /#type\/([A-Za-z_]+)/;
  const RX_AMT  = /^-\s*Сумма:\s*\*{0,2}([\d\s.,+-]+)/mi;
  const RX_CAT  = /^-\s*Категория:\s*\*{0,2}([^\n*]+)/mi;
  const RX_SUB  = /^-\s*Подкатегория:\s*\*{0,2}([^\n*]+)/mi;
  const RX_SRC  = /^-\s*Источник:\s*\*{0,2}([^\n*]+)/mi;
  const RX_FROM = /^-\s*Откуда:\s*\*{0,2}([^\n*]+)/mi;
  const RX_TO   = /^-\s*Куда:\s*\*{0,2}([^\n*]+)/mi;
  const RX_ACC  = /^-\s*Сч[её]т:\s*\*{0,2}([^\n*]+)/mi;
  const RX_TICK = /^-\s*(?:Актив|Тикер):\s*\*{0,2}([^\n*]+)/mi;
  const RX_QTY  = /^-\s*Кол-во[^:]*:\s*\*{0,2}([^\n*]+)/mi;
  const RX_PRICE= /^-\s*Цена[^:]*:\s*\*{0,2}([^\n*]+)/mi;

  function pick(rx, txt){ const m=(txt||'').match(rx); return m? String(m[1]).trim() : ''; }
  function fmt(n){ if(n==null||n==='') return ''; const x=Number(String(n).replace(/\s+/g,'').replace(',','.')); return isNaN(x)?String(n):x.toFixed(2); }

  let lastRows = [];
  window.financeCurrentRange = () => { const R=computeRange(cfgR()); return { from: R.s.format('YYYY-MM-DD'), to: R.e.format('YYYY-MM-DD') }; };
  window.financeRows = async () => lastRows.slice();

  async function collectRows(){
    const CR = cfgR(); const R = computeRange(CR);
    const pages = dv.pages('\"' + FOLDER + '\"');
    const out = [];
    for(const p of pages){
      const txt = await dv.io.load(p.file.path).catch(()=>'');
      const m = (txt||'').match(RX_DATE); if(!m) continue;
      const d = moment(m[1],'YYYY-MM-DD'); if(!d.isValid()) continue;
      if(d.isBefore(R.s) || d.isAfter(R.e)) continue;
      out.push([
        d.format('YYYY-MM-DD'),
        pick(RX_TYPE, txt),
        (pick(RX_AMT, txt)||'').replace(/\s+/g,'').replace(',','.'),
        pick(RX_CAT, txt), pick(RX_SUB, txt), pick(RX_SRC, txt),
        pick(RX_FROM, txt), pick(RX_TO, txt), pick(RX_ACC, txt),
        pick(RX_TICK, txt), pick(RX_QTY, txt), pick(RX_PRICE, txt),
        p.file.link
      ]);
    }
    out.sort((a,b)=> a[0].localeCompare(b[0]));
    return out;
  }

  function renderTable(rows){
    container.innerHTML = '';
    const tbl = document.createElement('table');
    tbl.style.borderCollapse = 'collapse'; tbl.style.width='100%'; tbl.style.fontSize='0.95rem';
    const cols = ['Дата','Тип','Сумма','Категория','Подкатегория','Источник','Откуда','Куда','Счёт','Тикер','Кол-во','Цена','Файл'];
    const thead = document.createElement('thead'); const trh = document.createElement('tr');
    cols.forEach(h=>{ const th=document.createElement('th'); th.textContent=h; th.style.borderBottom='1px solid var(--background-modifier-border)'; th.style.textAlign='left'; th.style.padding='4px 6px'; trh.appendChild(th); });
    thead.appendChild(trh); tbl.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      r.slice(0,12).forEach((cell, idx)=>{
        const td=document.createElement('td'); td.style.padding='4px 6px'; td.style.borderBottom='1px solid var(--background-modifier-border)';
        td.textContent = idx===2 ? fmt(cell) : (cell||'');
        tr.appendChild(td);
      });
      const tdL = document.createElement('td'); tdL.style.padding='4px 6px'; tdL.style.borderBottom='1px solid var(--background-modifier-border)';
      try { tdL.appendChild(dv.el('span', r[12])); } catch(_) { tdL.textContent = String(r[12]||''); }
      tr.appendChild(tdL);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    container.appendChild(tbl);
  }

  let busy = false;
  async function refresh(){ if(busy) return; busy = true; const rows = await collectRows(); lastRows = rows; renderTable(rows); busy = false; }

  const kick = ()=> refresh();
  window.addEventListener('finance-range-changed', kick);
  try { app?.vault?.on?.('modify', kick); } catch(_) {}
  try { app?.metadataCache?.on?.('dataview:metadata-change', kick); } catch(_) {}
  try { app?.workspace?.on?.('file-open', kick); } catch(_) {}
  const hb = setInterval(kick, 10000); dv.current()?.onunload?.(() => clearInterval(hb));

  refresh();
})();
```
