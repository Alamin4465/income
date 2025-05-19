// তারিখ অনুযায়ী ফিল্টার
const filterByDate = () => {
  const selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate) return;

  transactions = allTransactions.filter(t => t.date === selectedDate);
  renderTransactions();
  calculateSummary();
};

// মাস অনুযায়ী ফিল্টার (গত মাসের অবশিষ্ট সহ)
const filterByMonth = () => {
  const selectedMonth = parseInt(document.getElementById('filterMonth').value);
  if (isNaN(selectedMonth)) return;

  const currentYear = new Date().getFullYear();

  // বর্তমান মাসের ট্রানজ্যাকশন
  transactions = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === currentYear;
  });

  // পূর্ববর্তী মাসের ব্যালেন্স হিসাব
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? currentYear - 1 : currentYear;

  const prevMonthTransactions = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === prevMonth && tDate.getFullYear() === prevYear;
  });

  const prevIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const carryForward = prevIncome - prevExpense;

  // সামারি গণনা আপডেট
  calculateSummaryWithCarryForward(carryForward);
  renderTransactions();
};

// Carry Forward সহ সামারি আপডেট
const calculateSummaryWithCarryForward = (carryForward = 0) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = carryForward + totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0;

  document.getElementById('total-income').textContent = `৳ ${totalIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
};
