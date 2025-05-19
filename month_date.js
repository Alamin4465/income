let allTransactions = [];
let filteredTransactions = [];
let selectedDate = null;
let selectedMonth = null;

const loadTransactions = () => {
  db.collection('transactions')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      allTransactions = [];
      snapshot.forEach(doc => {
        allTransactions.push({ id: doc.id, ...doc.data() });
      });
      applyDateMonthFilter();
    });
};

document.getElementById('dateFilter').addEventListener('change', function () {
  selectedDate = this.value;
  selectedMonth = null;
  document.getElementById('monthFilter').value = '';
  applyDateMonthFilter();
});

document.getElementById('monthFilter').addEventListener('change', function () {
  selectedMonth = this.value;
  selectedDate = null;
  document.getElementById('dateFilter').value = '';
  applyDateMonthFilter();
});

const clearFilters = () => {
  selectedDate = null;
  selectedMonth = null;
  document.getElementById('dateFilter').value = '';
  document.getElementById('monthFilter').value = '';
  applyDateMonthFilter();
};

const applyDateMonthFilter = () => {
  const summaryDiv = document.getElementById('summary');
  const filterTypeDiv = document.getElementById('filterType');

  if (selectedDate) {
    filterTypeDiv.innerText = `তারিখ অনুযায়ী ফলাফল (${selectedDate})`;
    filteredTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.timestamp.seconds * 1000).toISOString().split('T')[0];
      return tDate === selectedDate;
    });
    updateSummary(filteredTransactions, false);
  } else if (selectedMonth) {
    filterTypeDiv.innerText = `মাস অনুযায়ী ফলাফল (${selectedMonth})`;

    const [year, month] = selectedMonth.split('-');
    const prevMonth = new Date(year, month - 2); // আগের মাসের Date object
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);

    const currentMonthTx = allTransactions.filter(t => {
      const tDate = new Date(t.timestamp.seconds * 1000).toISOString().slice(0, 7);
      return tDate === selectedMonth;
    });

    const prevMonthTx = allTransactions.filter(t => {
      const tDate = new Date(t.timestamp.seconds * 1000).toISOString().slice(0, 7);
      return tDate === prevMonthStr;
    });

    filteredTransactions = currentMonthTx;
    updateSummary(currentMonthTx, true, prevMonthTx);
  } else {
    filterTypeDiv.innerText = 'সব ট্রানজেকশন';
    filteredTransactions = [...allTransactions];
    updateSummary(filteredTransactions, false);
  }

  renderTable(filteredTransactions);
};

const updateSummary = (data, isMonthly, prevMonthData = []) => {
  let income = 0, expense = 0;
  let carryForward = 0;

  data.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  });

  if (isMonthly) {
    prevMonthData.forEach(t => {
      if (t.type === 'income') carryForward += t.amount;
      else if (t.type === 'expense') carryForward -= t.amount;
    });
  }

  const total = isMonthly ? (carryForward + income - expense) : (income - expense);

  document.getElementById('summary').innerHTML = `
    ${isMonthly ? `<p>আগের মাসের ব্যালেন্স: ${carryForward}</p>` : ''}
    <p>মোট আয়: ${income}</p>
    <p>মোট ব্যয়: ${expense}</p>
    <p><strong>মোট ব্যালেন্স: ${total}</strong></p>
  `;
};

const renderTable = (data) => {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';

  data.forEach(t => {
    const tDate = new Date(t.timestamp.seconds * 1000).toISOString().split('T')[0];
    tbody.innerHTML += `
      <tr>
        <td>${tDate}</td>
        <td>${t.description || ''}</td>
        <td>${t.type === 'income' ? t.amount : ''}</td>
        <td>${t.type === 'expense' ? t.amount : ''}</td>
      </tr>
    `;
  });
};
