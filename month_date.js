// Firebase Configuration (আপনার কনফিগ দিয়ে প্রতিস্থাপন করুন)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase Initialize
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const monthFilter = document.getElementById('monthFilter');
const dateFilter = document.getElementById('dateFilter');
const transactionsBody = document.getElementById('transactionsBody');

// --------------------------
// ফাংশনালিটি
// --------------------------

// ১. মাস ফিল্টার ফাংশন
async function filterByMonth() {
  try {
    const selectedMonth = monthFilter.value;
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // UTC ডেটা সেট (টাইমজোন ইস্যু ফিক্স)
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    endDate.setUTCHours(23, 59, 59, 999);

    // কুয়েরি তৈরি
    const query = db.collection('transactions')
      .where('userId', '==', auth.currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
      .orderBy('timestamp', 'desc');

    // ডিবাগিং লগ
    console.log('মাস ফিল্টার কুয়েরি:', { 
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      user: auth.currentUser.uid
    });

    // ডেটা ফেচ
    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    // রেন্ডার
    renderTransactions(transactions);

    // এম্পটি চেক
    if (transactions.length === 0) {
      console.warn('এই মাসে কোনো ট্রানজ্যাকশন পাওয়া যায়নি');
      alert('এই মাসে কোনো লেনদেন নেই!');
    }

  } catch (error) {
    console.error('মাস ফিল্টার এরর:', error);
    alert('ডেটা লোড করতে ব্যর্থ! কনসোলে এরর চেক করুন।');
  }
}

// ২. তারিখ ফিল্টার ফাংশন
async function filterByDate() {
  try {
    const selectedDate = new Date(dateFilter.value);
    const startOfDay = new Date(selectedDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setUTCHours(23, 59, 59, 999));

    const query = db.collection('transactions')
      .where('userId', '==', auth.currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endOfDay))
      .orderBy('timestamp', 'desc');

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    renderTransactions(transactions);

  } catch (error) {
    console.error('তারিখ ফিল্টার এরর:', error);
  }
}

// ৩. ট্রানজ্যাকশন রেন্ডার
function renderTransactions(transactions) {
  transactionsBody.innerHTML = transactions.map(transaction => `
    <tr>
      <td>${transaction.timestamp.toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</td>
      <td>${transaction.type === 'income' ? 'আয়' : 'খরচ'}</td>
      <td>${transaction.description || 'N/A'}</td>
      <td style="color: ${transaction.type === 'income' ? 'green' : 'red'}">
        ৳${transaction.amount.toLocaleString('bn-BD')}
      </td>
    </tr>
  `).join('');
}

// ৪. ফিল্টার রিসেট
async function clearFilters() {
  monthFilter.value = '';
  dateFilter.value = '';
  await loadAllTransactions();
}

// ৫. সব ডেটা লোড
async function loadAllTransactions() {
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', auth.currentUser.uid)
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    renderTransactions(transactions);

  } catch (error) {
    console.error('সমস্ত ডেটা লোড এরর:', error);
  }
}

// ৬. অথেন্টিকেশন চেক
auth.onAuthStateChanged(user => {
  if (user) {
    loadAllTransactions();
    setupRealtimeListener(); // রিয়েল-টাইম আপডেট
  } else {
    window.location.href = '/login';
  }
});

// ৭. রিয়েল-টাইম লিসেনার (ঐচ্ছিক)
function setupRealtimeListener() {
  db.collection('transactions')
    .where('userId', '==', auth.currentUser.uid)
    .onSnapshot(snapshot => {
      console.log('রিয়েল-টাইম আপডেট:', snapshot.docs.length);
      loadAllTransactions();
    }, error => {
      console.error('রিয়েল-টাইম এরর:', error);
    });
}

// ৮. টেস্ট ডেটা জেনারেটর (ডিবাগিং)
async function addTestData() {
  const testDate = new Date('2024-05-15');
  await db.collection('transactions').add({
    userId: auth.currentUser.uid,
    amount: 5000,
    type: "income",
    timestamp: firebase.firestore.Timestamp.fromDate(testDate),
    description: "টেস্ট ডেটা"
  });
  console.log('টেস্ট ডেটা যোগ করা হয়েছে!');
}
