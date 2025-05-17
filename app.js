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

