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
      renderTable(filtered); // তোমার টেবিলে দেখাও
      updateSummary(filtered, false); // সামারি আপডেট করো
    });
}


function loadTransactionsByMonth(selectedMonthStr) {
  const [year, month] = selectedMonthStr.split('-');

  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      const currentMonthTx = [];
      snapshot.forEach(doc => {
        currentMonthTx.push({ id: doc.id, ...doc.data() });
      });

      // আগের মাসের হিসাব আনো
      const prevStart = new Date(year, month - 2, 1);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(year, month - 1, 0);
      prevEnd.setHours(23, 59, 59, 999);

      db.collection('transactions')
        .where('userId', '==', currentUser.uid)
        .where('timestamp', '>=', prevStart)
        .where('timestamp', '<=', prevEnd)
        .get()
        .then(prevSnapshot => {
          const prevMonthTx = [];
          prevSnapshot.forEach(doc => {
            prevMonthTx.push({ id: doc.id, ...doc.data() });
          });

          renderTable(currentMonthTx);
          updateSummary(currentMonthTx, true, prevMonthTx);
        });
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
  loadAllTransactions(); // আবার সব ডেটা দেখাও
}

function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';
  data.forEach(t => {
    const tDate = t.timestamp.toDate().toISOString().split('T')[0];
    tbody.innerHTML += `
      <tr>
        <td>${tDate}</td>
        <td>${t.description || ''}</td>
        <td>${t.type === 'income' ? t.amount : ''}</td>
        <td>${t.type === 'expense' ? t.amount : ''}</td>
      </tr>
    `;
  });
}


function updateSummary(transactions, isMonthly, prevMonthTx = []) {
  let currentIncome = 0;
  let currentExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') currentIncome += Number(t.amount);
    else if (t.type === 'expense') currentExpense += Number(t.amount);
  });

  let previousBalance = 0;

  if (isMonthly && prevMonthTx.length > 0) {
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
