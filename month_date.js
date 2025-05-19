firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();

        // ট্রানজ্যাকশন লোড ও ডিসপ্লে
        async function loadTransactions(query) {
            try {
                const snapshot = await query.get();
                const transactions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp.toDate()
                }));
                renderTransactions(transactions);
            } catch (error) {
                console.error("ডেটা লোড এরর:", error);
                alert("ডেটা লোড করতে সমস্যা! কনসোলে এরর চেক করুন।");
            }
        }

        // ট্রানজ্যাকশন রেন্ডার
        function renderTransactions(transactions) {
            const tbody = document.getElementById('transactionsBody');
            tbody.innerHTML = transactions.map(transaction => `
                <tr>
                    <td>${transaction.timestamp.toLocaleDateString('bn-BD')}</td>
                    <td>${transaction.type === 'income' ? 'আয়' : 'খরচ'}</td>
                    <td>${transaction.description || 'N/A'}</td>
                    <td class="${transaction.type}">৳ ${transaction.amount.toLocaleString('bn-BD')}</td>
                </tr>
            `).join('');
        }

        // মাস ফিল্টার
        async function filterByMonth() {
            const selectedMonth = document.getElementById('monthFilter').value;
            const [year, month] = selectedMonth.split('-');
            
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            const query = db.collection('transactions')
                .where('userId', '==', auth.currentUser.uid)
                .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
                .orderBy('timestamp', 'desc');

            await loadTransactions(query);
        }

        // তারিখ ফিল্টার
        async function filterByDate() {
            const selectedDate = document.getElementById('dateFilter').value;
            const dateObj = new Date(selectedDate);
            
            const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
            const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

            const query = db.collection('transactions')
                .where('userId', '==', auth.currentUser.uid)
                .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
                .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endOfDay))
                .orderBy('timestamp', 'desc');

            await loadTransactions(query);
        }

        // সব ফিল্টার ক্লিয়ার
        async function clearFilters() {
            document.getElementById('monthFilter').value = '';
            document.getElementById('dateFilter').value = '';
            const query = db.collection('transactions')
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('timestamp', 'desc');
            await loadTransactions(query);
        }

        // অথেন্টিকেশন চেক
        auth.onAuthStateChanged(user => {
            if (user) {
                clearFilters(); // প্রথম লোডে সব ডেটা
            } else {
                window.location.href = '/login'; // লগইন পেজে রিডাইরেক্ট
            }
        });

        // টেস্ট ডেটা যোগ (ঐচ্ছিক)
        async function addTestData() {
            const testData = {
                userId: auth.currentUser.uid,
                amount: Math.floor(Math.random() * 10000) + 500,
                type: Math.random() > 0.5 ? 'income' : 'expense',
                timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
                description: "টেস্ট এন্ট্রি"
            };
            await db.collection('transactions').add(testData);
            console.log("টেস্ট ডেটা যোগ করা হয়েছে!");
        }
