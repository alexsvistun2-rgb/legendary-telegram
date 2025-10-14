module.exports = async ({}, {dv}) => {
  if (window.financeEnvPromise) {
    await window.financeEnvPromise;
    return;
  }
  window.financeEnvPromise = (async () => {
    async function loadOnce(url, check) {
      if (check && check()) return;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Не удалось загрузить ' + url));
        document.head.appendChild(script);
      });
    }
    async function loadStyle(url) {
      if ([...document.styleSheets].some(sheet => sheet.href && sheet.href.includes(url))) return;
      await new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = resolve;
        link.onerror = () => reject(new Error('Не удалось загрузить ' + url));
        document.head.appendChild(link);
      });
    }
    await loadOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js', () => window.Chart);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js', () => window.Chart?.registry?.controllers?.matrix);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-treemap@2.3.0/dist/chartjs-chart-treemap.min.js', () => window.Chart?.registry?.controllers?.treemap);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-hierarchy@2.0.1/dist/chartjs-chart-hierarchy.min.js', () => window.Chart?.overrides?.sunburst);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.14.0/dist/chartjs-chart-sankey.min.js', () => window.Chart?.registry?.controllers?.sankey);
    await loadOnce('https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js', () => window.Chart?.adapters?.date?.formats);
    await loadOnce('https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/js/tabulator.min.js', () => window.Tabulator);
    await loadStyle('https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/css/tabulator_midnight.min.css');

    window.financeIN = /^(income|refund|dividend|invest_sell)$/;
    window.financeOut = /^(expense|transfer|sinking|invest_buy|tax|fee|other)$/;
    window.financeColor = function (index, alpha = 0.75) {
      const palette = [
        '#1abc9c', '#2980b9', '#8e44ad', '#e74c3c', '#f1c40f', '#2ecc71',
        '#9b59b6', '#d35400', '#34495e', '#16a085', '#e67e22', '#7f8c8d'
      ];
      const base = palette[index % palette.length];
      if (base.startsWith('#')) {
        const hex = base.slice(1);
        const normalized = hex.length === 3
          ? hex.split('').map(ch => ch + ch).join('')
          : hex;
        const bigint = parseInt(normalized, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return base;
    };
    window.financeRenderChart = function (config, mount) {
      const host = mount || document.createElement('div');
      host.classList.add('finance-chart');
      if (!host.style.height) host.style.height = '280px';
      host.innerHTML = '';
      const canvas = document.createElement('canvas');
      host.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      config.options = config.options || {};
      config.options.maintainAspectRatio = false;
      config.options.responsive = true;
      config.options.plugins = config.options.plugins || {};
      config.options.plugins.legend = config.options.plugins.legend || { position: 'bottom' };
      if (host.__chart) host.__chart.destroy();
      host.__chart = new Chart(ctx, config);
      return host;
    };
    window.financeListeners = window.financeListeners || [];
    window.financeRegister = function (callback) {
      if (typeof callback === 'function' && !window.financeListeners.includes(callback)) {
        window.financeListeners.push(callback);
      }
    };
    window.dispatchFinanceRangeChanged = function () {
      window.financeListeners.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('[Finance Dashboard]', error);
        }
      });
    };
  })();

  window.ensureFinanceEnvironment = async () => {
    await window.financeEnvPromise;
  };
  window.financeBootstrap = window.ensureFinanceEnvironment;

  await window.financeEnvPromise;
};
