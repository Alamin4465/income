// ফায়ারস্টোর এবং ইউজার সেটআপ
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;

// ইন্সট্যান্স অবজার্ভারস
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadAllTransactions();
  } else {
    window.location.href = '/login'; // লগইন পেজে রিডাইরেক্ট
  }
});

// ফরম্যাটার ইউটিলিটি
const formatter = new Intl.NumberFormat('bn-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2
});

// তারিখ অনুযায়ী লোড
async function loadTransactionsByDate(selectedDateStr) {
  if (!selectedDateStr) return;
  
  try {
    const selectedDate = new Date(selectedDateStr);
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

// মাস অনুযায়ী লোড
async function loadTransactionsByMonth(selectedMonthStr) {
  if (!selectedMonthStr) return;

  try {
    const [year, month] = selectedMonthStr.split('-');
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    // বর্তমান মাসের ডেটা
    const currentSnapshot = await getSnapshot(start, end);
    
    // পূর্ববর্তী মাসের ডেটা
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0);
    const prevSnapshot = await getSnapshot(prevStart, prevEnd);

    processAndDisplayData(currentSnapshot, true, prevSnapshot);
  } catch (error) {
    handleError(error, 'মাস অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}

// কমন ফায়ারস্টোর কোয়েরি
async function getSnapshot(startDate, endDate) {
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
    .orderBy('timestamp', 'desc')
    .get();
}

// ডেটা প্রসেসিং এবং ডিসপ্লে
function processAndDisplayData(snapshot, isMonthly, prevSnapshot = null) {
  const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const prevTransactions = prevSnapshot?.docs.map(doc => doc.data()) || [];

  renderTable(transactions);
  updateSummary(transactions, isMonthly, prevTransactions);
}

// টেবিল রেন্ডারিং
function renderTable(data) {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '<tr><td colspan="5">লোড হচ্ছে...</td></tr>';

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5">কোন ডেটা পাওয়া যায়নি</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(t => {
    const dateObj = t.timestamp.toDate();
    const date = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
    
    const income = t.type === 'income' ? parseFloat(t.amount) || 0 : 0;
    const expense = t.type === 'expense' ? parseFloat(t.amount) || 0 : 0;
    const balance = income - expense;

    return `
      <tr>
        <td>${date}</td>
        <td>${t.description || 'N/A'}</td>
        <td class="currency income">${formatter.format(income)}</td>
        <td class="currency expense">${formatter.format(expense)}</td>
        <td class="currency balance">${formatter.format(balance)}</td>
      </tr>
    `;
  }).join('');
}

// সামারি আপডেট
function updateSummary(currentTx, isMonthly, prevTx = []) {
  const calculateTotals = transactions => transactions.reduce((acc, t) => {
    const amount = parseFloat(t.amount) || 0;
    t.type === 'income' ? acc.income += amount : acc.expense += amount;
    return acc;
  }, { income: 0, expense: 0 });

  const current = calculateTotals(currentTx);
  const previous = isMonthly ? calculateTotals(prevTx) : null;
  
  const previousBalance = previous ? previous.income - previous.expense : 0;
  const totalBalance = previousBalance + current.income - current.expense;
  const expensePercentage = ((current.expense / current.income) * 100) || 0;

  document.getElementById('filter_summary').innerHTML = `
    <div class="summary-card">
      ${isMonthly ? `<p>পূর্ববর্তী মাসের ব্যালেন্স: <b>${formatter.format(previousBalance)}</b></p>` : ''}
      <p>আয়: <b class="income">${formatter.format(current.income)}</b></p>
      <p>ব্যয়: <b class="expense">${formatter.format(current.expense)}</b> (${expensePercentage.toFixed(1)}%)</p>
      <p>নিট ব্যালেন্স: <b class="balance">${formatter.format(totalBalance)}</b></p>
    </div>
  `;
}

// এরর হ্যান্ডলিং
function handleError(error, message) {
  console.error(error);
  alert(`${message}\n${error.message}`);
  document.querySelector('#transactionTable tbody').innerHTML = 
    '<tr><td colspan="5">ডেটা লোড করতে ব্যর্থ হয়েছে</td></tr>';
}

// ইভেন্ট হ্যান্ডলার
document.getElementById('dateFilter').max = new Date().toISOString().split('T')[0]; // আজকের তারিখ পর্যন্ত সীমাবদ্ধ

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

// সব ট্রানজেকশন লোড
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
function handleError(error, message) {
  console.error(error);
  document.getElementById('filter_summary').innerHTML = `<p class="error">${message}</p>`;
  document.querySelector('#transactionTable tbody').innerHTML = 
    '<tr><td colspan="5">ডেটা লোড করতে ব্যর্থ হয়েছে</td></tr>';
}
