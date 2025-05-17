let selectedTransactionId = null;
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const date = document.getElementById('date').value;
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const timestamp: firebase.firestore.FieldValue.serverTimestamp() ;
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
