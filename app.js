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

        // লেনদেন লোড এবং ডিসপ্লে করুন
        const loadTransactions = async () => {
            const querySnapshot = await db.collection('transactions').orderBy('timestamp', 'desc').get();
            const transactionsList = document.getElementById('transactionsList');
            transactionsList.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const transaction = doc.data();
                const transactionItem = document.createElement('div');
                transactionItem.className = 'transaction-item';
                transactionItem.innerHTML = `
                    <div>
                        <strong>তারিখ:</strong> ${transaction.date} |
                        <strong>ধরন:</strong> ${transaction.type} |
                        <strong>ক্যাটাগরি:</strong> ${transaction.category} |
                        <strong>পরিমাণ:</strong> ৳${transaction.amount}
                    </div>
                    <div>
                        <button class="edit-btn" onclick="editTransaction('${doc.id}')">এডিট</button>
                        <button class="delete-btn" onclick="deleteTransaction('${doc.id}')">ডিলিট</button>
                    </div>
                `;
                transactionsList.appendChild(transactionItem);
            });
        };

        // লেনদেন এডিট করুন
        window.editTransaction = async (id) => {
            const doc = await db.collection('transactions').doc(id).get();
            const transaction = doc.data();
            
            document.getElementById('date').value = transaction.date;
            document.getElementById('type').value = transaction.type;
            document.getElementById('category').value = transaction.category;
            document.getElementById('amount').value = transaction.amount;
            
            selectedTransactionId = id;
        };

        // লেনদেন ডিলিট করুন
        window.deleteTransaction = async (id) => {
            if(confirm("আপনি কি এই লেনদেন ডিলিট করতে চান?")) {
                await db.collection('transactions').doc(id).delete();
                await loadTransactions();
                await refreshSavings();
            }
        };

        // সঞ্চয় হিসাব আপডেট করুন
        const refreshSavings = async () => {
            const incomeSnapshot = await db.collection('transactions')
                .where('type', '==', 'income')
                .get();
            const expenseSnapshot = await db.collection('transactions')
                .where('type', '==', 'expense')
                .get();

            const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            const totalExpense = expenseSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
            const savings = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(2) : 0;

            document.getElementById('savingsRate').textContent = `${savingsRate}%`;
            document.getElementById('savingsAmount').textContent = `৳${savings}`;
        };

        // রিয়েল-টাইম আপডেটের জন্য লিসেনার যোগ করুন
        db.collection('transactions').onSnapshot(() => {
            loadTransactions();
            refreshSavings();
        });

        // প্রাথমিক লোড
        loadTransactions();
        refreshSavings();
