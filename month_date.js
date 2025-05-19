let currentUser = null;

// লগইন ইউজার আইড পাওয়ার পর কল করো
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

function updateSummary(data, isMonthly, prevMonthData = []) {
  let income = 0, expense = 0, carry = 0;
  let prevIncome = 0, prevExpense = 0;

  // বর্তমান মাসের হিসাব
  data.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  });

  // আগের মাসের হিসাব
  if (isMonthly) {
    prevMonthData.forEach(t => {
      if (t.type === 'income') {
        prevIncome += t.amount;
        carry += t.amount;
      } else if (t.type === 'expense') {
        prevExpense += t.amount;
        carry -= t.amount;
      }
    });
  }

  const total = isMonthly ? carry + income - expense : income - expense;

  document.getElementById('summary').innerHTML = `
    ${isMonthly ? `
      <p>গত মাসের মোট আয়: ${prevIncome}</p>
      <p>গত মাসের মোট ব্যয়: ${prevExpense}</p>
      <p><strong>গত মাসের ব্যালেন্স: ${carry}</strong></p>
    ` : ''}
    <p>এই মাসের মোট আয়: ${income}</p>
    <p>এই মাসের মোট ব্যয়: ${expense}</p>
    <p><strong>মোট ব্যালেন্স: ${total}</strong></p>
  `;
}

function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';

  data.forEach(t => {
    const tDate = new Date(t.timestamp.seconds * 1000).toISOString().split('T')[0];
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

// মাস সিলেক্ট করলে কল করো
document.getElementById('monthFilter').addEventListener('change', function () {
  const selectedMonth = this.value;
  if (selectedMonth && currentUser) {
    loadTransactionsByMonth(selectedMonth);
  }
});

// অ্যাকচুয়াল ইউজার লগইন করার পর কল করো
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
  }
});

function loadTransactionsByDate(selectedDateStr) {
  const [year, month, day] = selectedDateStr.split('-');

  const start = new Date(year, month - 1, day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month - 1, day);
  end.setHours(23, 59, 59, 999);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', start)
    .where('timestamp', '<=', end)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      const dailyTx = [];
      snapshot.forEach(doc => {
        dailyTx.push({ id: doc.id, ...doc.data() });
      });

      renderTable(dailyTx);
      updateSummary(dailyTx, false);
    });
}
