async function filterByDate() {
  const selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate || !currentUser) return;

  const start = new Date(selectedDate);
  const end = new Date(selectedDate);
  end.setDate(end.getDate() + 1);

  const snapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(end))
    .orderBy('timestamp', 'desc')
    .get();

  transactions = [];
  snapshot.forEach(doc => {
    transactions.push({ id: doc.id, ...doc.data() });
  });

  renderTransactions();
  calculateSummary(); // শুধু এই দিনের আয়-ব্যয়
}

async function filterByMonth() {
  const selectedMonth = document.getElementById('filterMonth').value;
  if (selectedMonth === '' || !currentUser) return;

  const year = new Date().getFullYear();
  const start = new Date(year, selectedMonth, 1);
  const end = new Date(year, parseInt(selectedMonth) + 1, 1);

  // বর্তমান মাসের ডেটা আনো
  const currentSnapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(end))
    .orderBy('timestamp', 'desc')
    .get();

  const currentMonthData = [];
  currentSnapshot.forEach(doc => {
    currentMonthData.push({ id: doc.id, ...doc.data() });
  });

  // আগের মাসের শেষ পর্যন্ত মোট ব্যালেন্স হিসাব করো
  const previousSnapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(start))
    .get();

  let previousIncome = 0;
  let previousExpense = 0;
  previousSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') previousIncome += data.amount;
    else if (data.type === 'expense') previousExpense += data.amount;
  });

  const previousBalance = previousIncome - previousExpense;

  // এখন ফিল্টারড ডেটা এবং পুরানো ব্যালেন্স সেট করো
  transactions = currentMonthData;

  renderTransactions();

  const currentIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = previousBalance + currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? ((totalBalance / currentIncome) * 100).toFixed(1) : 0;

  document.getElementById('total-income').textContent = `৳ ${currentIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${currentExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
}
