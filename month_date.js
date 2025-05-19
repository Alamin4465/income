const selectedDate = new Date('2024-05-19'); // yyyy-mm-dd
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
    console.log("Selected date result:", filtered);
  });

const selectedMonth = '2024-05'; // yyyy-mm
const [year, month] = selectedMonth.split('-');

// মাসের শুরু
const start = new Date(year, month - 1, 1);
start.setHours(0, 0, 0, 0);

// মাসের শেষ
const end = new Date(year, month, 0); // 0 gives last day of previous month
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
    console.log("Selected month result:", filtered);
  });
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
