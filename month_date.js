// Firestore setup
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;

// Formatter
const formatter = new Intl.NumberFormat('bn-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2
});

// Auth observer
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadAllTransactions();
  } else {
    window.location.href = '/login';
  }
});

// Load all transactions
async function loadAllTransactions() {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .orderBy('timestamp', 'desc')
      .get();
    processAndDisplayData(snapshot, false);
  } catch (error) {
    handleError(error, 'সমস্ত ডেটা লোড করতে ব্যর্থ!');
  }
}

// Filter by date
async function loadTransactionsByDate(dateStr) {
  if (!dateStr) return;

  try {
    const date = new Date(dateStr);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

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

// Filter by month
async function loadTransactionsByMonth(monthStr) {
  if (!monthStr) return;

  try {
    const [year, month] = monthStr.split('-');
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const currentSnapshot = await getSnapshot(start, end);

    // Previous month
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevSnapshot = await getSnapshot(prevStart, prevEnd);

    processAndDisplayData(currentSnapshot, true, prevSnapshot);
  } catch (error) {
    handleError(error, 'মাস অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}

async function getSnapshot(start, end) {
  return await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(end))
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
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5">কোনো ডেটা পাওয়া যায়নি</td></tr>';
    return;
  }

  data.forEach(t => {
    const d = t.timestamp.toDate();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const income = t.type === 'income' ? parseFloat(t.amount) : 0;
    const expense = t.type === 'expense' ? parseFloat(t.amount) : 0;
    const balance = income - expense;

    const row = `
      <tr>
        <td>${dateStr}</td>
        <td>${t.description || ''}</td>
        <td class="income">${formatter.format(income)}</td>
        <td class="expense">${formatter.format(expense)}</td>
        <td class="balance">${formatter.format(balance)}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function updateSummary(currentTx, isMonthly, prevTx = []) {
  const calc = arr => arr.reduce((acc, t) => {
    const amt = parseFloat(t.amount) || 0;
    t.type === 'income' ? acc.income += amt : acc.expense += amt;
    return acc;
  }, { income: 0, expense: 0 });

  const current = calc(currentTx);
  const previous = isMonthly ? calc(prevTx) : { income: 0, expense: 0 };

  const prevBalance = previous.income - previous.expense;
  const totalBalance = prevBalance + current.income - current.expense;
  const expensePercent = current.income ? (current.expense / current.income * 100).toFixed(1) : 0;

  document.getElementById('filter_summary').innerHTML = `
    <div class="summary-card">
      ${isMonthly ? `<p>পূর্ববর্তী মাসের ব্যালেন্স: <b>${formatter.format(prevBalance)}</b></p>` : ''}
      <p>আয়: <b class="income">${formatter.format(current.income)}</b></p>
      <p>ব্যয়: <b class="expense">${formatter.format(current.expense)}</b> (${expensePercent}%)</p>
      <p>নিট ব্যালেন্স: <b class="balance">${formatter.format(totalBalance)}</b></p>
    </div>
  `;
}

function handleError(error, message) {
  console.error(error);
  document.getElementById('filter_summary').innerHTML = `<p class="error">${message}</p>`;
  document.querySelector('#transactionTable tbody').innerHTML =
    '<tr><td colspan="5">ডেটা লোড করতে ব্যর্থ হয়েছে</td></tr>';
}

// Filter events
document.getElementById('dateFilter').addEventListener('change', e => {
  document.getElementById('monthFilter').value = '';
  loadTransactionsByDate(e.target.value);
});

document.getElementById('monthFilter').addEventListener('change', e => {
  document.getElementById('dateFilter').value = '';
  loadTransactionsByMonth(e.target.value);
});

document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('dateFilter').value = '';
  document.getElementById('monthFilter').value = '';
  loadAllTransactions();
});
