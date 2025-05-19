// Firestore ও ইউজার ডিফাইন করা আছে ধরে নিচ্ছি: db, currentUser

// তারিখ অনুযায়ী লোড (date input: yyyy-mm-dd)
function loadTransactionsByDate(selectedDateStr) {
  const selectedDate = new Date(selectedDateStr);
  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  const startTS = firebase.firestore.Timestamp.fromDate(start);
  const endTS = firebase.firestore.Timestamp.fromDate(end);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp')
    .where('timestamp', '>=', startTS)
    .where('timestamp', '<=', endTS)
    .get()
    .then(snapshot => {
      const transactions = [];
      snapshot.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));
      renderTable(transactions);
      updateSummary(transactions, false);
    })
    .catch(console.error);
}

// মাস অনুযায়ী লোড (month input: yyyy-mm)
function loadTransactionsByMonth(selectedMonthStr) {
  const [year, month] = selectedMonthStr.split('-');
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);

  const startTS = firebase.firestore.Timestamp.fromDate(start);
  const endTS = firebase.firestore.Timestamp.fromDate(end);

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp')
    .where('timestamp', '>=', startTS)
    .where('timestamp', '<=', endTS)
    .get()
    .then(snapshot => {
      const currentMonthTx = [];
      snapshot.forEach(doc => currentMonthTx.push({ id: doc.id, ...doc.data() }));

      // আগের মাসের ব্যালেন্স আনার জন্য
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
          prevSnapshot.forEach(doc => prevMonthTx.push({ id: doc.id, ...doc.data() }));

          renderTable(currentMonthTx);
          updateSummary(currentMonthTx, true, prevMonthTx);
        })
        .catch(console.error);
    })
    .catch(console.error);
}

// টেবিল রেন্ডার ফাংশন
function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';

  data.forEach(t => {
    const dateObj = t.timestamp.toDate();
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(-2);
    const formattedDate = `${day}-${month}-${year}`;

    const income = t.type === 'income' ? Number(t.amount) : '';
    const expense = t.type === 'expense' ? Number(t.amount) : '';
    const balance = income !== '' ? income : (expense !== '' ? -expense : '');

    tbody.innerHTML += `
      <tr>
        <td>${formattedDate}</td>
        <td>${t.description || ''}</td>
        <td style="text-align: right;">${income}</td>
        <td style="text-align: right;">${expense}</td>
        <td style="text-align: right;">${balance}</td>
      </tr>
    `;
  });
}

// সামারি আপডেট ফাংশন
function updateSummary(transactions, isMonthly, prevMonthTx = []) {
  let currentIncome = 0;
  let currentExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') currentIncome += Number(t.amount);
    else if (t.type === 'expense') currentExpense += Number(t.amount);
  });

  let previousBalance = 0;
  if (isMonthly && prevMonthTx.length) {
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
    <div>
      <p>গত মাসের অবশিষ্ট: <strong>${previousBalance}</strong> টাকা</p>
      <p>বর্তমান মাসের আয়: <strong>${currentIncome}</strong> টাকা</p>
      <p>বর্তমান মাসের ব্যয়: <strong>${currentExpense}</strong> টাকা</p>
      <p>মোট টাকা: <strong>${totalBalance}</strong> টাকা</p>
    </div>
  `;
}

// ইভেন্ট লিসেনার
document.getElementById('dateFilter').addEventListener('change', e => {
  loadTransactionsByDate(e.target.value);
  document.getElementById('monthFilter').value = '';
});

document.getElementById('monthFilter').addEventListener('change', e => {
  loadTransactionsByMonth(e.target.value);
  document.getElementById('dateFilter').value = '';
});

// সব ট্রানজেকশন লোড করার ফাংশন (প্রয়োজনে ব্যবহার করবে)
function loadAllTransactions() {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      const allData = [];
      snapshot.forEach(doc => allData.push({ id: doc.id, ...doc.data() }));
      renderTable(allData);
      updateSummary(allData, false);
    })
    .catch(console.error);
}

// পেজ লোডের সময় সব ডেটা লোড করতে পারো
loadAllTransactions();
