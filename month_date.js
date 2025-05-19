const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadAllTransactions();
  } else {
    window.location.href = '/login.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dateFilter').max = new Date().toISOString().split('T')[0];

  document.getElementById('dateFilter').addEventListener('change', e => {
    loadTransactionsByDate(e.target.value);
    document.getElementById('monthFilter').value = '';
  });

  document.getElementById('monthFilter').addEventListener('change', e => {
    loadTransactionsByMonth(e.target.value);
    document.getElementById('dateFilter').value = '';
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('dateFilter').value = '';
    document.getElementById('monthFilter').value = '';
    loadAllTransactions();
  });
});

function formatDateObj(dateObj) {
  return `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
}

function handleError(error, message) {
  console.error(error);
  document.getElementById('filter_summary').innerHTML = `<p class="error">${message}</p>`;
  document.querySelector('#transactionTable tbody').innerHTML = 
    '<tr><td colspan="5">ডেটা লোড করতে ব্যর্থ হয়েছে</td></tr>';
}

async function loadAllTransactions() {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .get();
    processAndDisplayData(snapshot, false);
  } catch (error) {
    handleError(error, 'সমস্ত ডেটা লোড করতে সমস্যা!');
  }
}

async function loadTransactionsByDate(dateStr) {
  if (!dateStr) return;
  try {
    const selectedDate = new Date(dateStr);
    const start = new Date(selectedDate.setHours(0, 0, 0, 0));
    const end = new Date(selectedDate.setHours(23, 59, 59, 999));

    const snapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(end))
      .orderBy('timestamp', 'desc')
      .get();

    processAndDisplayData(snapshot, false);
  } catch (error) {
    handleError(error, 'তারিখ অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}

async function loadTransactionsByMonth(monthStr) {
  if (!monthStr) return;
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const currentSnapshot = await getSnapshot(start, end);

    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevSnapshot = await getSnapshot(prevStart, prevEnd);

    processAndDisplayData(currentSnapshot, true, prevSnapshot);
  } catch (error) {
    handleError(error, 'মাস অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}

async function getSnapshot(startDate, endDate) {
  return await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
    .orderBy('timestamp', 'desc')
    .get();
}

function processAndDisplayData(snapshot, isMonthly, prevSnapshot = null) {
  const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const prevTransactions = prevSnapshot?.docs.map(doc => doc.data()) || [];

  renderTable(transactions);
  updateSummary(transactions, isMonthly, prevTransactions);
}

function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5">কোন ডেটা পাওয়া যায়নি</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    const date = formatDateObj(t.timestamp.toDate());
    const income = t.type === 'income' ? parseFloat(t.amount) || 0 : 0;
    const expense = t.type === 'expense' ? parseFloat(t.amount) || 0 : 0;
    const balance = income - expense;

    return `
      <tr>
        <td>${date}</td>
        <td>${t.description || 'N/A'}</td>
        <td class="income">${income.toFixed(2)}</td>
        <td class="expense">${expense.toFixed(2)}</td>
        <td class="balance">${balance.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
}

function updateSummary(currentTx, isMonthly, prevTx = []) {
  const total = txs => txs.reduce((acc, t) => {
    const amt = parseFloat(t.amount) || 0;
    t.type === 'income' ? acc.income += amt : acc.expense += amt;
    return acc;
  }, { income: 0, expense: 0 });

  const curr = total(currentTx);
  const prev = isMonthly ? total(prevTx) : null;
  const prevBalance = prev ? prev.income - prev.expense : 0;
  const totalBalance = prevBalance + curr.income - curr.expense;
  const expensePercent = ((curr.expense / curr.income) * 100) || 0;

  document.getElementById('filter_summary').innerHTML = `
    <div class="summary-card">
      ${isMonthly ? `<p>পূর্ববর্তী ব্যালেন্স: <b>${prevBalance.toFixed(2)}</b></p>` : ''}
      <p>আয়: <b class="income">${curr.income.toFixed(2)}</b></p>
      <p>ব্যয়: <b class="expense">${curr.expense.toFixed(2)}</b> (${expensePercent.toFixed(1)}%)</p>
      <p>নিট ব্যালেন্স: <b class="balance">${totalBalance.toFixed(2)}</b></p>
    </div>
  `;
}
