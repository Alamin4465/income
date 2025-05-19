function filterByDate() {
  const selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate) {
    alert("অনুগ্রহ করে একটি তারিখ নির্বাচন করুন");
    return;
  }

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('date', '==', selectedDate)
    .orderBy('date')
    .get()
    .then(snapshot => {
      transactions = [];
      snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      renderTransactions();
      calculateSummary();
    });
}
function filterByMonth() {
  const selectedMonth = document.getElementById('filterMonth').value;
  if (selectedMonth === "") {
    alert("অনুগ্রহ করে একটি মাস নির্বাচন করুন");
    return;
  }

  const year = new Date().getFullYear();
  const month = parseInt(selectedMonth);
  const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${(month + 2).toString().padStart(2, '0')}-01`;

  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .where('date', '>=', startDate)
    .where('date', '<', endDate)
    .orderBy('date')
    .get()
    .then(snapshot => {
      transactions = [];
      let income = 0, expense = 0;
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        transactions.push(data);
        if (data.type === 'income') income += data.amount;
        else expense += data.amount;
      });

      // হিসাব করো গত মাস পর্যন্ত ব্যালেন্স
      let previousBalance = 0;
      allTransactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() < month)) {
          if (t.type === 'income') previousBalance += t.amount;
          else previousBalance -= t.amount;
        }
      });

      const balance = previousBalance + income - expense;
      const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

      renderTransactions();

      document.getElementById('total-income').textContent = `৳ ${income.toLocaleString('bn-BD')}`;
      document.getElementById('total-expense').textContent = `৳ ${expense.toLocaleString('bn-BD')}`;
      document.getElementById('total-balance').textContent = `৳ ${balance.toLocaleString('bn-BD')}`;
      document.getElementById('savingsRate').textContent = `${savingsRate}%`;
      document.getElementById('savingsAmount').textContent = `৳ ${balance.toLocaleString('bn-BD')}`;
    });
}
