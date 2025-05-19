// ফায়ারস্টোর থেকে ডেটা নিয়ে মাস ভিত্তিক ফিল্টার
async function showSpecificMonth(selectedMonth) {
  try {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const transactionsRef = db.collection('transactions');
    const snapshot = await transactionsRef
      .where('userId', '==', currentUser.uid)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();

    const monthTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate() // টাইমস্ট্যাম্পকে জাভাস্ক্রিপ্ট ডেটে কনভার্ট
    }));

    renderTransactionList(monthTransactions);
    renderMonthlySummaryBlock(monthTransactions, selectedMonth);
  } catch (error) {
    console.error("মাসের ডেটা লোড করতে সমস্যা:", error);
  }
}

// নির্দিষ্ট তারিখের ডেটা ও ব্যালেন্স ক্যালকুলেশন
async function showSpecificDate(selectedDate) {
  try {
    const selectedDateObj = new Date(selectedDate);
    const endOfDay = new Date(selectedDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // সম্পূর্ণ তারিখের ডেটা
    const dailySnapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('date', '>=', selectedDateObj)
      .where('date', '<=', endOfDay)
      .orderBy('date', 'asc')
      .get();

    // ব্যালেন্স ক্যালকুলেশনের জন্য সব ডেটা
    const balanceSnapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('date', '<=', endOfDay)
      .orderBy('date', 'asc')
      .get();

    const sortedTransactions = balanceSnapshot.docs.map(doc => ({
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    let cumulativeBalance = 0;
    sortedTransactions.forEach(t => {
      cumulativeBalance += t.type === 'income' ? t.amount : -t.amount;
    });

    const dailyTransactions = dailySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    renderDailyTransactions(dailyTransactions, cumulativeBalance);
  } catch (error) {
    console.error("তারিখভিত্তিক ডেটা লোড করতে সমস্যা:", error);
  }
}

// ট্রানজ্যাকশন লিস্ট রেন্ডারিং
function renderTransactionList(transactions) {
  const tbody = document.getElementById('filteredResultsBody');
  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td>${t.date.toLocaleDateString('bn-BD')}</td>
      <td>${t.type === 'income' ? 'আয়' : 'ব্যয়'}</td>
      <td>${t.category}</td>
      <td style="color: ${t.type === 'income' ? 'green' : 'red'}">
        ৳ ${t.amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}
      </td>
    </tr>
  `).join('');
}
