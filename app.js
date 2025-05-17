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

Document ID: income
Fields:
{
  items: ["বেতন", "ব্যবসা", "অন্যান্য"]
}
Document ID: expense
Fields:
{
  items: ["বাসা ভাড়া", "মোবাইল রিচার্জ", "বিদ্যুৎ বিল", "পরিবহন", "দোকান বিল", "কেনাকাটা", "গাড়ির খরচ", "কাচা বাজার", "বাড়ি", "হাস্পাতাল", "ব্যক্তিগত", "অন্যান্য"]
}
// Firestore রেফারেন্স
const categoriesRef = db.collection("categories");

// আয় ও ব্যয়ের ক্যাটাগরি ভ্যারিয়েবল
let incomeCategories = [];
let expenseCategories = [];

// Firebase থেকে ক্যাটাগরি লোড করুন
const loadCategories = async () => {
  try {
    // আয়ের ক্যাটাগরি
    const incomeDoc = await categoriesRef.doc("income").get();
    incomeCategories = incomeDoc.data().items;

    // ব্যয়ের ক্যাটাগরি
    const expenseDoc = await categoriesRef.doc("expense").get();
    expenseCategories = expenseDoc.data().items;

    // UI আপডেট করুন
    updateCategories();
  } catch (error) {
    console.error("ক্যাটাগরি লোড করতে সমস্যা:", error);
  }
};

// পেজ লোড হওয়ার পর ক্যাটাগরি লোড করুন
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});
