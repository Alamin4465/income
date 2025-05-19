const db = firebase.firestore();
let transactions = [];
let currentUser = null;

// ইউজার লগইন হলে সেট করো
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
  }
});

// তারিখ অনুসারে ফিল্টার
async function filterByDate() {
  const selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate || !currentUser) return;

  const start = new Date(selectedDate);
  const end = new Date(selectedDate);
  end.setDate(end.getDate() + 1);

  const snapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(end))
    .orderBy('timestamp', 'desc')
    .get();

  transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTransactions();
  calculateSummary(); // ঐ দিনের জন্য সারাংশ
}

// মাস অনুসারে ফিল্টার
async function filterByMonth() {
  const selectedMonth = document.getElementById('filterMonth').value;
  if (selectedMonth === '' || !currentUser) return;

  const year = new Date().getFullYear();
  const start = new Date(year, selectedMonth, 1);
  const end = new Date(year, parseInt(selectedMonth) + 1, 1);

  // বর্তমান মাসের ডেটা
  const currentSnapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(end))
    .orderBy('timestamp', 'desc')
    .get();

  const currentMonthData = currentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // আগের ব্যালেন্স
  const previousSnapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(start))
    .get();

  let previousIncome = 0;
  let previousExpense = 0;
  previousSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') previousIncome += data.amount;
    else if (data.type === 'expense') previousExpense += data.amount;
  });

  const previousBalance = previousIncome - previousExpense;

  // বর্তমান মাসের সারাংশ
  transactions = currentMonthData;
  renderTransactions();

  const currentIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = previousBalance + currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? ((totalBalance / currentIncome) * 100).toFixed(1) : 0;

  document.getElementById('total-income').textContent = `৳ ${currentIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${currentExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
}

// লেনদেন দেখানোর ফাংশন
function renderTransactions() {
  const container = document.getElementById('transactionsList');
  container.innerHTML = '';

  if (transactions.length === 0) {
    container.innerHTML = '<p>কোনো লেনদেন পাওয়া যায়নি।</p>';
    return;
  }

  transactions.forEach((tx, index) => {
    const entry = document.createElement('div');
    entry.classList.add('transaction-entry'); // চাইলে CSS দিবেন
    entry.innerHTML = `
      <div><strong>${index + 1}.</strong> 
        ${tx.type === 'income' ? 'আয়' : 'ব্যয়'} | 
        ক্যাটাগরি: ${tx.category || 'N/A'} | 
        পরিমাণ: ৳${tx.amount} | 
        তারিখ: ${tx.timestamp?.toDate ? new Date(tx.timestamp.toDate()).toLocaleDateString('bn-BD') : ''}
      </div>
    `;
    container.appendChild(entry);
  });
}
