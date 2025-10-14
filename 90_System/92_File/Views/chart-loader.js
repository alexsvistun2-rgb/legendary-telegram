module.exports = async () => {
  if (window.Chart) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Не удалось загрузить Chart.js'));
    document.head.appendChild(script);
  });
};
