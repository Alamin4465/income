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

// জাভাস্ক্রিপ্ট অংশ
function displayTransactions(transactions) {
  const tbody = document.getElementById('transactionsBody');
  tbody.innerHTML = ''; // পুরানো ডেটা ক্লিয়ার

  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    const date = transaction.timestamp.toDate().toLocaleDateString('bn-BD');
    const amount = transaction.amount.toLocaleString('bn-BD');
    const type = transaction.type === 'income' ? 'আয়' : 'খরচ';

    row.innerHTML = `
      <td>${date}</td>
      <td>${transaction.description}</td>
      <td style="color: ${transaction.type === 'income' ? 'green' : 'red'}">৳${amount}</td>
      <td>${type}</td>
    `;

    tbody.appendChild(row);
  });
}

async function loadAllTransactions() {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp
    }));

    displayTransactions(transactions);
  } catch (error) {
    console.error("ডেটা লোড করতে সমস্যা:", error);
  }
}

// বাকি ফাংশনগুলো আগের মতোই থাকবে (filterByMonth, clearFilters)


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
