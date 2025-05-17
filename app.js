
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

// script.js বা app.js ফাইলে এই কোড যোগ করুন
const incomeCategories = ["বেতন", "ব্যবসা", "অন্যান্য"];
const expenseCategories = [
    "বাসা ভাড়া", "মোবাইল রিচার্জ", "বিদ্যুৎ বিল", 
    "পরিবহন", "দোকান বিল", "কেনাকাটা", "গাড়ির খরচ", 
    "কাচা বাজার", "বাড়ি", "হাস্পাতাল", "ব্যক্তিগত", "অন্যান্য"
];

// পেজ লোড হওয়ার পর ক্যাটাগরি আপডেট করুন
document.addEventListener('DOMContentLoaded', () => {
    updateCategories();
});

// টাইপ পরিবর্তন হলে ক্যাটাগরি আপডেট করার ফাংশন
function updateCategories() {
    const type = document.getElementById('type').value;
    const categorySelect = document.getElementById('category');
    
    // বর্তমান অপশনগুলি মুছুন (প্রথম অপশন বাদে)
    categorySelect.innerHTML = '<option value="">ক্যাটাগরি নির্বাচন করুন</option>';
    
    // সংশ্লিষ্ট ক্যাটাগরি যোগ করুন
    const categories = (type === 'income') ? incomeCategories : expenseCategories;
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}
