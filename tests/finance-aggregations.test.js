const assert = require('assert');

const rows = [
  ['2024-01-01', 'income', '1000', 'Зарплата', '', 'Работа', '', 'Основной счёт', 'Банк', '', '', '', ''],
  ['2024-01-02', 'expense', '250', 'Продукты', 'Магазин', '', 'Карта', 'Супермаркет', 'Банк', '', '', '', ''],
  ['2024-01-03', 'expense', '100', 'Транспорт', 'Метро', '', 'Карта', 'Метро', 'Банк', '', '', '', ''],
  ['2024-01-05', 'income', '200', 'Фриланс', '', 'Клиент', '', 'Основной счёт', 'Банк', '', '', '', ''],
  ['2024-01-07', 'expense', '300', 'Продукты', 'Рынок', '', 'Наличные', 'Рынок', 'Кошелёк', '', '', '', ''],
  ['2024-02-01', 'income', '800', 'Зарплата', '', 'Работа', '', 'Основной счёт', 'Банк', '', '', '', ''],
  ['2024-02-03', 'expense', '400', 'Аренда', '', '', 'Банк', 'Арендодатель', 'Банк', '', '', '', ''],
  ['2024-02-05', 'expense', '120', 'Транспорт', 'Такси', '', 'Карта', 'Такси', 'Банк', '', '', '', '']
];

const isIncome = type => ['income', 'refund', 'dividend', 'invest_sell'].includes(String(type).toLowerCase());
const toNumber = value => {
  if (value == null) return 0;
  const num = Number(String(value).replace(/\s+/g, '').replace(',', '.'));
  return Number.isNaN(num) ? 0 : num;
};

function aggregateDailyFlow(data) {
  const map = new Map();
  for (const row of data) {
    const date = row[0];
    if (!date) continue;
    const bucket = map.get(date) || { inc: 0, exp: 0 };
    const amount = Math.abs(toNumber(row[2]));
    if (!amount) continue;
    if (isIncome(row[1])) bucket.inc += amount; else bucket.exp += amount;
    map.set(date, bucket);
  }
  const labels = Array.from(map.keys()).sort();
  const inc = labels.map(date => +map.get(date).inc.toFixed(2));
  const exp = labels.map(date => +map.get(date).exp.toFixed(2));
  const net = labels.map((_, idx) => +(inc[idx] - exp[idx]).toFixed(2));
  return { labels, inc, exp, net };
}

function aggregateMonthlyNet(data) {
  const map = new Map();
  for (const row of data) {
    const month = String(row[0] || '').slice(0, 7);
    if (!month) continue;
    const amount = Math.abs(toNumber(row[2]));
    if (!amount) continue;
    const prev = map.get(month) || 0;
    map.set(month, prev + (isIncome(row[1]) ? amount : -amount));
  }
  const labels = Array.from(map.keys()).sort();
  const values = labels.map(month => +map.get(month).toFixed(2));
  return { labels, values };
}

function expenseStructure(data) {
  const map = new Map();
  for (const row of data) {
    if (isIncome(row[1])) continue;
    const category = row[3] || 'Без категории';
    const amount = Math.abs(toNumber(row[2]));
    if (!amount) continue;
    map.set(category, (map.get(category) || 0) + amount);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function cumulativeNet(data) {
  const perDay = new Map();
  for (const row of data) {
    const date = row[0];
    if (!date) continue;
    const amount = toNumber(row[2]);
    if (!amount) continue;
    const delta = isIncome(row[1]) ? Math.abs(amount) : -Math.abs(amount);
    perDay.set(date, (perDay.get(date) || 0) + delta);
  }
  const labels = Array.from(perDay.keys()).sort();
  let acc = 0;
  const values = labels.map(date => {
    acc += perDay.get(date);
    return +acc.toFixed(2);
  });
  return { labels, values };
}

function balanceByAccount(data) {
  const map = new Map();
  for (const row of data) {
    const amount = Math.abs(toNumber(row[2]));
    if (!amount) continue;
    if (isIncome(row[1])) {
      const to = row[7] || 'Счёт';
      map.set(to, (map.get(to) || 0) + amount);
    } else {
      const from = row[6] || 'Счёт';
      map.set(from, (map.get(from) || 0) - amount);
    }
  }
  return Array.from(map.entries());
}

(function runTests() {
  const flow = aggregateDailyFlow(rows);
  assert.deepStrictEqual(flow.labels, ['2024-01-01','2024-01-02','2024-01-03','2024-01-05','2024-01-07','2024-02-01','2024-02-03','2024-02-05']);
  assert.strictEqual(flow.inc[0], 1000);
  assert.strictEqual(flow.exp[1], 250);
  assert.strictEqual(flow.net[2], -100);

  const monthly = aggregateMonthlyNet(rows);
  assert.deepStrictEqual(monthly.labels, ['2024-01','2024-02']);
  assert.strictEqual(monthly.values[0], 550); // 1200 income - 650 expenses
  assert.strictEqual(monthly.values[1], 280); // 800 income - 520 expenses

  const structure = expenseStructure(rows);
  assert.strictEqual(structure[0][0], 'Продукты');
  assert.strictEqual(structure.reduce((sum, [,v]) => sum + v, 0), 1170);

  const cumulative = cumulativeNet(rows);
  assert.strictEqual(cumulative.values[cumulative.values.length - 1], 830);

  const balances = balanceByAccount(rows);
  const bank = balances.find(([acc]) => acc === 'Карта');
  assert.ok(bank);
  assert.strictEqual(+bank[1].toFixed(2), -470);
})();

console.log('finance-aggregations.test.js passed');
