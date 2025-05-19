const applyDateMonthFilter = () => {
  const summaryDiv = document.getElementById('summary');
  const filterTypeDiv = document.getElementById('filterType');

  if (selectedDate) {
    filterTypeDiv.innerText = `তারিখ অনুযায়ী ফলাফল (${selectedDate})`;
    filteredTransactions = allTransactions.filter(t => {
      const tDate = t.timestamp.toDate().toISOString().split('T')[0];
      return tDate === selectedDate;
    });
    updateSummary(filteredTransactions, false);
  } else if (selectedMonth) {
    filterTypeDiv.innerText = `মাস অনুযায়ী ফলাফল (${selectedMonth})`;

    const [year, month] = selectedMonth.split('-');
    const prevMonthDate = new Date(year, month - 2); // আগের মাস
    const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

    const currentMonthTx = allTransactions.filter(t => {
      const tMonth = t.timestamp.toDate().toISOString().slice(0, 7);
      return tMonth === selectedMonth;
    });

    const prevMonthTx = allTransactions.filter(t => {
      const tMonth = t.timestamp.toDate().toISOString().slice(0, 7);
      return tMonth === prevMonthStr;
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
