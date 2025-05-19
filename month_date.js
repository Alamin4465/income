
// ফায়ারবেস ইন্সট্যান্স ইনিশিয়ালাইজ
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// মাস ভিত্তিক ফিল্টার
async function filterByMonth() {
  const selectedMonth = document.getElementById('monthFilter').value;
  const [year, month] = selectedMonth.split('-');
  
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', firebase.auth().currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate() // টাইমস্ট্যাম্পকে JS Date তে কনভার্ট
    }));

    renderTransactions(transactions);
  } catch (error) {
    console.error("মাসের ডেটা লোড করতে সমস্যা:", error);
  }
}

// তারিখ ভিত্তিক ফিল্টার
async function filterByDate() {
  const selectedDate = document.getElementById('dateFilter').value;
  const dateObj = new Date(selectedDate);
  
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', firebase.auth().currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endOfDay))
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    renderTransactions(transactions);
  } catch (error) {
    console.error("তারিখভিত্তিক ডেটা লোড করতে সমস্যা:", error);
  }
}

// ট্রানজ্যাকশন রেন্ডার
function renderTransactions(transactions) {
  const tbody = document.getElementById('transactionsBody');
  tbody.innerHTML = '';

  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    const dateOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      timeZone: 'Asia/Dhaka'
    };

    row.innerHTML = `
      <td>${transaction.timestamp.toLocaleDateString('bn-BD', dateOptions)}</td>
      <td>${transaction.type === 'income' ? 'আয়' : 'খরচ'}</td>
      <td>${transaction.description || '-'}</td>
      <td style="color: ${transaction.type === 'income' ? 'green' : 'red'}">
        ৳${transaction.amount.toLocaleString('bn-BD')}
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// ফিল্টার ক্লিয়ার
function clearFilters() {
  document.getElementById('monthFilter').value = '';
  document.getElementById('dateFilter').value = '';
  loadAllTransactions();
}

// সব ট্রানজ্যাকশন লোড
async function loadAllTransactions() {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', firebase.auth().currentUser.uid)
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    renderTransactions(transactions);
  } catch (error) {
    console.error("সমস্ত ডেটা লোড করতে সমস্যা:", error);
  }
}

// প্রথম লোডে সব ডেটা দেখাবে
window.onload = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      loadAllTransactions();
    } else {
      window.location.href = '/login'; // লগইন পেজে রিডাইরেক্ট
    }
  });
};
