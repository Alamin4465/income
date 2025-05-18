
let transactions = [];

// ইউজার লগইন স্টেট চেক করুন
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById('welcomeMessage').textContent = `স্বাগতম, ${user.email}`;
    loadTransactions();
  } else {
    window.location.href = 'login.html';
  }
});

// লেনদেন লোড করুন (রিয়েলটাইম আপডেট)
const loadTransactions = () => {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      transactions = [];
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      updateUI();
    });
};

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("ইউজার লগইন করা নেই!");
    return;
  }

  const transaction = {
    date: document.getElementById('date').value,
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    amount: parseFloat(document.getElementById('amount').value),
    userId: user.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('transactions').add(transaction);
    e.target.reset();
  } catch (error) {
    console.error("ত্রুটি:", error);
    alert("লেনদেন জমা দিতে সমস্যা হচ্ছে: " + error.message);
  }
});

// UI আপডেট ফাংশন
const updateUI = () => {
  calculateSummary();
  renderTransactions();
  updateCharts();
};

// সামারি ক্যালকুলেশন
const calculateSummary = () => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0;

  // DOM আপডেট
  document.getElementById('total-income').textContent = `৳ ${totalIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
};

// লেনদেন তালিকা দেখান
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

// লেনদেন মুছুন
window.deleteTransaction = async (id) => {
  await db.collection('transactions').doc(id).delete();
};

// চার্ট আপডেট
let categoryChartInstance = null;
let monthlyChartInstance = null;

const updateCharts = () => {
  // ক্যাটেগরি চার্ট
  const categories = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(document.getElementById('categoryChart'), {
    type: 'pie',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    }
  });

  // মাসিক সামারি চার্ট
  const monthlyData = Array(12).fill(0);
  transactions.forEach(t => {
    const month = new Date(t.date).getMonth();
    if (t.type === 'income') monthlyData[month] += t.amount;
    else monthlyData[month] -= t.amount;
  });

  if (monthlyChartInstance) monthlyChartInstance.destroy();
  monthlyChartInstance = new Chart(document.getElementById('monthlySummaryChart'), {
    type: 'line',
    data: {
      labels: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'],
      datasets: [{
        label: 'মাসিক ব্যালেন্স',
        data: monthlyData,
        borderColor: '#4BC0C0'
      }]
    }
  });
};

const incomeCategories = ['বেতন', 'ব্যবসা', 'অন্যান্য'];
const expenseCategories = ['বাসা ভাড়া', 'মোবাইল রিচার্জ', 'বিদ্যুৎ বিল', 'পরিবহন', 'দোকান বিল', 'কেনাকাটা', 'গাড়ির খরচ', 'কাচা বাজার', 'বাড়ি', 'হাস্পাতাল', 'ব্যক্তিগত', 'অন্যান্য'];

function updateCategoryOptions() {
  const type = document.getElementById('type').value;
  const categorySelect = document.getElementById('category');

  // পুরাতন অপশনগুলো মুছে ফেলি
  categorySelect.innerHTML = '';

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// প্রথমবার পেজ লোড হলে ডিফল্ট ক্যাটাগরি সেট
document.addEventListener('DOMContentLoaded', updateCategoryOptions);

// লগআউট
window.logout = () => {
  auth.signOut();
};
