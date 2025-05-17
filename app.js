let selectedTransactionId = null;

        // ফর্ম সাবমিট হ্যান্ডলার
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const transaction = {
                date: document.getElementById('date').value,
                type: document.getElementById('type').value,
                category: document.getElementById('category').value,
                amount: parseFloat(document.getElementById('amount').value),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if(selectedTransactionId) {
                    // এডিট মোড
                    await db.collection('transactions').doc(selectedTransactionId).update(transaction);
                    selectedTransactionId = null;
                } else {
                    // নতুন লেনদেন যোগ করুন
                    await db.collection('transactions').add(transaction);
                }
                document.getElementById('transactionForm').reset();
                await refreshSavings();
            } catch (error) {
                console.error("Error saving transaction: ", error);
            }
        });
	const updateSummary = async () => {
    try {
        // মোট আয় হিসাব
        const incomeQuery = await db.collection('transactions')
            .where('type', '==', 'income')
            .get();
        const totalIncome = incomeQuery.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

        // মোট ব্যয় হিসাব
        const expenseQuery = await db.collection('transactions')
            .where('type', '==', 'expense')
            .get();
        const totalExpense = expenseQuery.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

        // বর্তমান ব্যালেন্স
        const currentBalance = totalIncome - totalExpense;

        // সঞ্চয় হার (%) 
        const savingsRate = totalIncome > 0 
            ? ((currentBalance / totalIncome) * 100).toFixed(2) 
            : 0;

        // DOM আপডেট
        document.getElementById('total-income').textContent = `৳${totalIncome}`;
        document.getElementById('total-expense').textContent = `৳${totalExpense}`;
        document.getElementById('total-balance').textContent = `৳${currentBalance}`;
        document.getElementById('savingsRate').textContent = `${savingsRate}%`;
        document.getElementById('savingsAmount').textContent = `৳${currentBalance}`;

    } catch (error) {
        console.error("সামারি লোডে সমস্যা:", error);
    }
};

// সমস্ত ট্রানজ্যাকশন চেঞ্জ লিসেনার
db.collection('transactions').onSnapshot(() => {
    loadTransactions();
    updateSummary(); // সামারি আপডেট যোগ করুন
});

// প্রাথমিক আপডেট
updateSummary();
