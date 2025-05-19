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

      renderTable(currentMonthTx);
      updateSummary(currentMonthTx, true);
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

