
let allTransactions = [];
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



const loadTransactions = () => {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push({ id: doc.id, ...doc.data() });
      });

      // সব ডাটা দিয়ে সামারি ও চার্ট আপডেট
      updateSummaryAndCharts();

      // শুরুতে সকল টেবিল দেখাও
      filterTable('all');
    });
};

// শুধুমাত্র টেবিল ফিল্টার (UI তে আয়/ব্যয়/সকল দেখানোর জন্য)
const filterTable = (filterType) => {
  if (filterType === 'all') {
    transactions = [...allTransactions];
  } else {
    transactions = allTransactions.filter(t => t.type === filterType);
  }
  renderTransactions();
};

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("ইউজার লগইন করা নেই!");
    return;
  }
//from 
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
const updateSummaryAndCharts = () => {
  calculateSummary(); // allTransactions ব্যবহার করবে
  updateCharts();     // allTransactions ব্যবহার করবে
};

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

  if (transactions.length === 0) {
    transactionsList.innerHTML = "<p>কোনো লেনদেন পাওয়া যায়নি</p>";
    return;
  }

  let html = `
    <table border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>তারিখ</th>
          <th>টাইপ</th>
          <th>ক্যাটাগরি</th>
          <th>পরিমাণ</th>
          <th>একশন</th>
        </tr>
      </thead>
      <tbody>
  `;

  transactions.forEach(t => {
    html += `
      <tr class="${t.type}">
        <td>${t.date}</td>
        <td>${t.type === 'income' ? 'আয়' : 'ব্যয়'}</td>
        <td>${t.category}</td>
        <td>৳ ${t.amount.toLocaleString('bn-BD')}</td>
        <td>
          <button onclick="editTransaction('${t.id}')">এডিট</button>
          <button onclick="deleteTransaction('${t.id}')">মুছুন</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  transactionsList.innerHTML = html;
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
//transactions ডিলেট করুন
window.deleteTransaction = async (id) => {
  if (confirm("আপনি কি নিশ্চিত যে এই লেনদেন মুছতে চান?")) {
    await db.collection('transactions').doc(id).delete();
  }
};
//transactions এডিট করুন

window.editTransaction = async (id) => {
  const doc = await db.collection('transactions').doc(id).get();
  if (!doc.exists) {
    alert("লেনদেন পাওয়া যায়নি!");
    return;
  }

  const data = doc.data();

  const newDate = prompt("তারিখ পরিবর্তন করুন (YYYY-MM-DD):", data.date);
  const newType = prompt("টাইপ লিখুন (income/expense):", data.type);
  const newCategory = prompt("ক্যাটাগরি পরিবর্তন করুন:", data.category);
  const newAmount = prompt("পরিমাণ পরিবর্তন করুন:", data.amount);

  if (newDate && newType && newCategory && newAmount) {
    await db.collection('transactions').doc(id).update({
      date: newDate,
      type: newType,
      category: newCategory,
      amount: parseFloat(newAmount)
    });
  }
};

// প্রথমবার পেজ লোড হলে ডিফল্ট ক্যাটাগরি সেট
document.addEventListener('DOMContentLoaded', updateCategoryOptions);

// লগআউট
window.logout = () => {
  auth.signOut();
};
