
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const date = document.getElementById('date').value;
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const amount = parseFloat(document.getElementById('amount').value);

  // Firestore-এ ডেটা সংরক্ষণ
  await db.collection('transactions').add({
    date,
    type,
    category,
    amount,
    userId: currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  // ফর্ম রিসেট করুন
  e.target.reset();
});
const calculateSummary = async () => {
  const snapshot = await db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .get();

  let totalIncome = 0;
  let totalExpense = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.type === 'income') totalIncome += data.amount;
    if (data.type === 'expense') totalExpense += data.amount;
  });

  const totalBalance = totalIncome - totalExpense;
  const savingsRate = ((totalBalance / totalIncome) * 100 || 0).toFixed(1);

  // DOM আপডেট করুন
  document.getElementById('total-income').textContent = `৳ ${totalIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
};

const loadTransactions = () => {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      transactions = [];
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      renderTransactions();
      calculateSummary();
    });
};

const renderTransactions = () => {
  const transactionsList = document.getElementById('transactionsList');
  transactionsList.innerHTML = transactions.map(transaction => `
    <div class="transaction-item ${transaction.type}">
      <span>${transaction.date}</span>
      <span>${transaction.category}</span>
      <span>৳ ${transaction.amount.toLocaleString('bn-BD')}</span>
      <button onclick="deleteTransaction('${transaction.id}')">মুছুন</button>
    </div>
  `).join('');
};
