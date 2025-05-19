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

  /**
 * Bengali Income-Expense Tracker Web App
 * Author: আপনার নাম
 * Description: Firebase ব্যবহার করে তারিখ ও মাস ভিত্তিক ফিল্টার সহ আয়-ব্যয় ব্যবস্থাপনা
 * Date: ২০২৫
 */

// Global Variables
let allTransactions = [];
let transactions = [];
let currentUser = null;
let currentFilterType = 'all'; // 'all', 'income', 'expense', 'date', 'month'
let previousBalance = 0;

// Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById('welcomeMessage').textContent = `স্বাগতম, ${user.email}`;
    loadTransactions();
  } else {
    window.location.href = 'login.html';
  }
});

// Load Transactions from Firestore
const loadTransactions = () => {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push({ 
          id: doc.id, 
          ...doc.data(),
          date: doc.data().date // Ensure date is stored as 'YYYY-MM-DD'
        });
      });
      updateSummaryAndCharts();
      filterTable('all');
    });
};

// Date Filter
window.filterByDate = (date) => {
  currentFilterType = 'date';
  document.getElementById('monthFilter').value = '';
  document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
  
  transactions = allTransactions.filter(t => t.date === date);
  renderTransactions();
  updateSummaryAndCharts();
};

// Month Filter
window.filterByMonth = (month) => {
  currentFilterType = 'month';
  document.getElementById('dateFilter').value = '';
  document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));

  const [year, monthNum] = month.split('-');
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  // Current Month Transactions
  transactions = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  // Calculate Previous Month Balance
  const prevMonthDate = new Date(startDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
  const prevEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0);

  const prevTransactions = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= prevStart && tDate <= prevEnd;
  });

  const prevIncome = prevTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const prevExpense = prevTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  previousBalance = prevIncome - prevExpense;

  renderTransactions();
  updateSummaryAndCharts();
};

// Calculate Summary with Monthly Carryover
const calculateSummary = () => {
  let totalIncome, totalExpense, totalBalance, savingsRate;

  if (currentFilterType === 'month') {
    totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    totalBalance = previousBalance + totalIncome - totalExpense;
    savingsRate = totalIncome > 0 
      ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1)
      : 0;
  } else {
    totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    totalBalance = totalIncome - totalExpense;
    savingsRate = totalIncome > 0 
      ? (totalBalance / totalIncome * 100).toFixed(1)
      : 0;
  }

  // Update UI
  document.getElementById('total-income').textContent = `৳ ${totalIncome.toLocaleString('bn-BD')}`;
  document.getElementById('total-expense').textContent = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
  document.getElementById('total-balance').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
  document.getElementById('savingsRate').textContent = `${savingsRate}%`;
  document.getElementById('savingsAmount').textContent = `৳ ${totalBalance.toLocaleString('bn-BD')}`;
};

// Modify Existing FilterTable Function
const filterTable = (filterType) => {
  currentFilterType = filterType;
  document.getElementById('dateFilter').value = '';
  document.getElementById('monthFilter').value = '';
  
  transactions = filterType === 'all' 
    ? [...allTransactions] 
    : allTransactions.filter(t => t.type === filterType);

  renderTransactions();
  updateSummaryAndCharts();
  setActiveButton(document.querySelector(`.filter-buttons button[data-type="${filterType}"]`));
};

// Add This HTML Structure to Your Dashboard
/*
<div class="filters">
  <input type="date" id="dateFilter" onchange="filterByDate(this.value)" placeholder="তারিখ নির্বাচন করুন">
  <input type="month" id="monthFilter" onchange="filterByMonth(this.value)" placeholder="মাস নির্বাচন করুন">
</div>
*/
