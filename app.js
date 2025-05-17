// app.js ফাইলে নিচের কোড যোগ করুন

// ক্যাটাগরি ম্যাপিং অবজেক্ট
const categories = {
    income: ["বেতন", "ব্যবসা", "অন্যান্য"],
    expense: ["বাসা ভাড়া", "মোবাইল রিচার্জ", "বিদ্যুৎ বিল", "পরিবহন", 
            "দোকান বিল", "কেনাকাটা", "গাড়ির খরচ", "কাচা বাজার", 
            "বাড়ি", "হাস্পাতাল", "ব্যক্তিগত", "অন্যান্য"]
};

// টাইপ পরিবর্তন হলে ক্যাটাগরি আপডেট
document.getElementById('type').addEventListener('change', function() {
    const type = this.value;
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">ক্যাটাগরি নির্বাচন করুন</option>';
    
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
});


// ট্রানজ্যাকশন সেভ করা
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) return;

    const transaction = {
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        userId: user.uid
    };

    await db.collection('transactions').add(transaction);
    loadTransactions(); // ট্রানজ্যাকশন রিফ্রেশ
    this.reset();
});

// সামারি ক্যালকুলেশন
async function calculateSummary() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const snapshot = await db.collection('transactions')
        .where('userId', '==', user.uid)
        .get();

    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'income') totalIncome += data.amount;
        else totalExpense += data.amount;
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = ((balance / totalIncome) * 100 || 0).toFixed(1);

    document.getElementById('total-income').textContent = `৳ ${totalIncome}`;
    document.getElementById('total-expense').textContent = `৳ ${totalExpense}`;
    document.getElementById('total-balance').textContent = `৳ ${balance}`;
    document.getElementById('savingsRate').textContent = `${savingsRate}%`;
    document.getElementById('savingsAmount').textContent = `৳ ${balance}`;
}
