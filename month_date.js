
const allTransactions = [
  { date: '2025-05-01', type: 'income', category: 'বেতন', amount: 10000 },
  { date: '2025-05-03', type: 'expense', category: 'খাবার', amount: 2000 },
  { date: '2025-05-10', type: 'income', category: 'ফ্রিল্যান্স', amount: 5000 },
  { date: '2025-04-28', type: 'income', category: 'পুরাতন', amount: 3000 },
  { date: '2025-04-29', type: 'expense', category: 'ভাড়া', amount: 1500 },
];

function showSpecificDate(dateStr) {
  const filtered = allTransactions.filter(t => t.date === dateStr);
  showResult(filtered, 0);
}

function showSpecificMonth(monthStr) {
  if (!monthStr) return;

  const year = new Date().getFullYear();

  const filtered = allTransactions.filter(t => {
    const d = new Date(t.date);
    return (d.getMonth() + 1 === parseInt(monthStr)) && d.getFullYear() === year;
  });

  // আগের মাস হিসাব
  let prevMonth = parseInt(monthStr) - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }

  const prevBalance = allTransactions.reduce((acc, t) => {
    const d = new Date(t.date);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (m === prevMonth && y === prevYear) {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }
    return acc;
  }, 0);

  showResult(filtered, prevBalance);
}

function showResult(transactions, prevBalance) {
  let income = 0;
  let expense = 0;
  let runningBalance = prevBalance;

  const tbody = document.getElementById("filteredResultsBody");
  const tfoot = document.getElementById("filteredSummary");
  tbody.innerHTML = '';
  tfoot.innerHTML = '';

  transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;

    runningBalance += t.type === 'income' ? t.amount : -t.amount;

    tbody.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type === 'income' ? 'আয়' : 'ব্যয়'}</td>
        <td>${t.category}</td>
        <td>৳ ${t.amount}</td>
        <td>৳ ${runningBalance}</td>
      </tr>
    `;
  });

  const net = prevBalance + income - expense;

  tfoot.innerHTML = `
    <tr>
      <td colspan="2"><strong>সারাংশ</strong></td>
      <td><strong>আয়: ৳${income}</strong></td>
      <td><strong>ব্যয়: ৳${expense}</strong></td>
      <td><strong>মোট: ৳${net}</strong></td>
    </tr>
  `;
}
