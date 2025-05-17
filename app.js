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
            } catch (error) {
                console.error("ত্রুটি:", error);
            }
        });

        // সামারি আপডেট ফাংশন
        const updateSummary = async () => {
            const incomeSnapshot = await db.collection('transactions')
                .where('type', '==', 'income')
                .get();
            const expenseSnapshot = await db.collection('transactions')
                .where('type', '==', 'expense')
                .get();

            // মোট হিসাব
            const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            const totalExpense = expenseSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            const balance = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : 0;

            // DOM আপডেট
            document.getElementById('total-income').textContent = `৳${totalIncome}`;
            document.getElementById('total-expense').textContent = `৳${totalExpense}`;
            document.getElementById('total-balance').textContent = `৳${balance}`;
            document.getElementById('savingsRate').textContent = `${savingsRate}%`;
            document.getElementById('savingsAmount').textContent = `৳${balance}`;
        };

        // রিয়েল-টাইম আপডেট
        db.collection('transactions').onSnapshot(() => {
            updateSummary();
        });

        // প্রাথমিক আপডেট
        updateSummary();
