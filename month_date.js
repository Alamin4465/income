// // তারিখ অনুযায়ী ফিল্টার
function applyDateFilter() {
  const selectedDate = document.getElementById('dateFilter').value;
  if (!selectedDate) return alert("তারিখ নির্বাচন করুন");

  const filtered = allTransactions.filter(t => t.date === selectedDate);
  transactions = filtered;
  renderTransactions();
  calculateSummary();
}

// মাস অনুযায়ী ফিল্টার
function applyMonthFilter() {
  const selected = document.getElementById('monthFilter').value;
  if (!selected) return alert("মাস নির্বাচন করুন");

  const [year, month] = selected.split('-');
  const currentMonth = parseInt(month) - 1;
  const currentYear = parseInt(year);

  const currentMonthData = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // আগের মাসের ব্যালেন্স
  let previousBalance = 0;
  allTransactions.forEach(t => {
    const d = new Date(t.date);
    const m = d.getMonth();
    const y = d.getFullYear();

    if (y < currentYear || (y === currentYear && m < currentMonth)) {
      if (t.type === 'income') previousBalance += t.amount;
      else previousBalance -= t.amount;
    }
  });

  transactions = currentMonthData;

  renderTransactions();

  // মাসিক ইনকাম/এক্সপেন্স + পূর্বের ব্যালেন্সসহ সামারি দেখাও
  const income = currentMonthData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = currentMonthData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = previousBalance + income - expense;
  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

  document.getElementById('total-income').textContent = `৳ ${income.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${expense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${balance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${balance.toLocaleString('bn-BD')}`;
}
