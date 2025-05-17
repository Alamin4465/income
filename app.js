let selectedTransactionId = null;

// ফর্ম সাবমিট হ্যান্ডলার (Add + Edit)
document.getElementById('transactionForm').addEventListener('submit', async (e) => {  
    e.preventDefault();  
      
    const transaction = {  
        date: document.getElementById('date').value,  
        type: document.getElementById('type').value,  
        category: document.getElementById('category').value,  
        amount: parseFloat(document.getElementById('amount').value),
        userId: currentUser.uid, // ইউজার আইডি যোগ করুন
        timestamp: firebase.firestore.FieldValue.serverTimestamp()  
    };  

    try {  
        if(selectedTransactionId) {  
            // এডিট মোড: আপডেট
            await db.collection('transactions').doc(selectedTransactionId).update(transaction);  
            selectedTransactionId = null;  
        } else {  
            // নতুন লেনদেন যোগ
            await db.collection('transactions').add(transaction);  
        }  
        document.getElementById('transactionForm').reset();  
    } catch (error) {  
        console.error("ত্রুটি:", error);  
    }  
});

// এডিট ফাংশন
const editTransaction = async (transactionId) => {
  const doc = await db.collection('transactions').doc(transactionId).get();
  const data = doc.data();
  populateFormForEdit(transactionId, data);
};

// ফর্ম পপুলেট
const populateFormForEdit = (transactionId, data) => {
  selectedTransactionId = transactionId;
  document.getElementById('date').value = data.date;
  document.getElementById('type').value = data.type;
  document.getElementById('category').value = data.category;
  document.getElementById('amount').value = data.amount;
};
