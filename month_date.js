let allTransactions = []; // এখানে Firestore বা অন্য উৎস থেকে লোড করা ডাটা থাকবে

// তারিখ ভিত্তিক ফিল্টার
function showSpecificDate(selectedDate) {
    if (!selectedDate) return;

    const filtered = allTransactions.filter(t => t.date === selectedDate);

    let income = 0, expense = 0;
    filtered.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
    });

    const balance = income - expense;
    renderFilteredTable(filtered, income, expense, balance);
}

// মাস ভিত্তিক ফিল্টার
function showSpecificMonth(selectedMonth) {
    if (!selectedMonth) return;

    const now = new Date();
    const currentYear = now.getFullYear();

    // বর্তমান মাসের সব ডাটা
    const filtered = allTransactions.filter(t => {
        const d = new Date(t.date);
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        return month === selectedMonth && d.getFullYear() === currentYear;
    });

    // আগের মাসের ব্যালেন্স
    const prevMonth = parseInt(selectedMonth) - 1 || 12;
    const prevYear = selectedMonth === '01' ? currentYear - 1 : currentYear;

    const previousBalance = allTransactions.reduce((sum, t) => {
        const d = new Date(t.date);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        if ((month === prevMonth && year === prevYear)) {
            return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }
        return sum;
    }, 0);

    let income = 0, expense = 0;
    filtered.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
    });

    const balance = previousBalance + income - expense;
    renderFilteredTable(filtered, income, expense, balance, previousBalance);
}

// টেবিল রেন্ডার করা
function renderFilteredTable(data, income, expense, balance, prevBalance = 0) {
    const tbody = document.getElementById('filteredResultsBody');
    const tfoot = document.getElementById('filteredSummary');
    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    let runningBalance = prevBalance;

    data.forEach(t => {
        runningBalance += t.type === 'income' ? t.amount : -t.amount;
        const row = `
            <tr>
                <td>${t.date}</td>
                <td>${t.type === 'income' ? 'আয়' : 'ব্যয়'}</td>
                <td>${t.category}</td>
                <td>৳ ${t.amount.toLocaleString('bn-BD')}</td>
                <td>৳ ${runningBalance.toLocaleString('bn-BD')}</td>
            </tr>`;
        tbody.innerHTML += row;
    });

    tfoot.innerHTML = `
        <tr>
            <td colspan="2"><strong>সারাংশ</strong></td>
            <td><strong>আয়: ৳${income.toLocaleString('bn-BD')}</strong></td>
            <td><strong>ব্যয়: ৳${expense.toLocaleString('bn-BD')}</strong></td>
            <td><strong>মোট: ৳${balance.toLocaleString('bn-BD')}</strong></td>
        </tr>`;
}
