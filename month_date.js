function loadTransactionsByDate(selectedDateStr) {
  const selectedDate = new Date(selectedDateStr); // yyyy-mm-dd format
  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      const filtered = [];
      snapshot.forEach(doc => {
        filtered.push({ id: doc.id, ...doc.data() });
      });
      renderTable(filtered);
      updateSummary(filtered, false);
    })
    .catch(error => {
      console.error('Date filter error:', error);
    });
}

function loadTransactionsByMonth(selectedMonthStr) {
  const [year, month] = selectedMonthStr.split('-');

  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
  const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', startTimestamp)
    .where('timestamp', '<=', endTimestamp)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      const currentMonthTx = [];
      snapshot.forEach(doc => {
        currentMonthTx.push({ id: doc.id, ...doc.data() });
      });

      // আগের মাসের ব্যালেন্স আনো
      const prevStart = new Date(year, month - 2, 1);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(year, month - 1, 0);
      prevEnd.setHours(23, 59, 59, 999);

      const prevStartTS = firebase.firestore.Timestamp.fromDate(prevStart);
      const prevEndTS = firebase.firestore.Timestamp.fromDate(prevEnd);

      db.collection('transactions')
        .where('userId', '==', currentUser.uid)
        .where('timestamp', '>=', prevStartTS)
        .where('timestamp', '<=', prevEndTS)
        .get()
        .then(prevSnapshot => {
          const prevMonthTx = [];
          prevSnapshot.forEach(doc => {
            prevMonthTx.push({ id: doc.id, ...doc.data() });
          });

          renderTable(currentMonthTx);
          updateSummary(currentMonthTx, true, prevMonthTx);
        });
    })
    .catch(error => {
      console.error('Month filter error:', error);
    });
}

document.getElementById('dateFilter').addEventListener('change', function () {
  loadTransactionsByDate(this.value);
  document.getElementById('monthFilter').value = '';
});

document.getElementById('monthFilter').addEventListener('change', function () {
  loadTransactionsByMonth(this.value);
  document.getElementById('dateFilter').value = '';
});

function clearFilters() {
  document.getElementById('dateFilter').value = '';
  document.getElementById('monthFilter').value = '';
  loadAllTransactions(); // সমস্ত ডেটা পুনরায় লোড করো
}

function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';
  let balance = 0;

  data.forEach(t => {
    const tDate = t.timestamp.toDate().toLocaleDateString('bn-BD'); // বাংলা তারিখ
    const income = t.type === 'income' ? Number(t.amount) : 0;
    const expense = t.type === 'expense' ? Number(t.amount) : 0;

    balance += income - expense;

    tbody.innerHTML += `
      <tr>
        <td>${tDate}</td>
        <td>${t.description || ''}</td>
        <td>${income ? income : ''}</td>
        <td>${expense ? expense : ''}</td>
        <td>${balance}</td>
      </tr>
    `;
  });
}
}function updateSummary(transactions, isMonthly, prevMonthTx = []) {
  let currentIncome = 0;
  let currentExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') currentIncome += Number(t.amount);
    else if (t.type === 'expense') currentExpense += Number(t.amount);
  });

  let previousBalance = 0;

  if (isMonthly && Array.isArray(prevMonthTx) && prevMonthTx.length > 0) {
    let prevIncome = 0;
    let prevExpense = 0;
    prevMonthTx.forEach(t => {
      if (t.type === 'income') prevIncome += Number(t.amount);
      else if (t.type === 'expense') prevExpense += Number(t.amount);
    });
    previousBalance = prevIncome - prevExpense;
  }

  const totalBalance = previousBalance + currentIncome - currentExpense;

  document.getElementById('filter_summary').innerHTML = `
    <div class="summary-box">
      <p>গত মাসের অবশিষ্ট: <strong>${previousBalance}</strong> টাকা</p>
      <p>বর্তমান মাসের আয়: <strong>${currentIncome}</strong> টাকা</p>
      <p>বর্তমান মাসের ব্যয়: <strong>${currentExpense}</strong> টাকা</p>
      <p>মোট টাকা: <strong>${totalBalance}</strong> টাকা</p>
    </div>
  `;
}
