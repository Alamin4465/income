async function loadTransactionsByMonth(selectedMonthStr) {
  if (!selectedMonthStr) return;

  try {
    const [year, month] = selectedMonthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const currentSnapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(end))
      .orderBy('timestamp', 'desc')
      .get();

    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    const prevSnapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(prevStart))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(prevEnd))
      .get();

    processAndDisplayData(currentSnapshot, true, prevSnapshot);
  } catch (error) {
    handleError(error, 'মাস অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}
async function loadTransactionsByDate(selectedDateStr) {
  if (!selectedDateStr) return;

  try {
    const selectedDate = new Date(selectedDateStr);
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const snapshot = await db.collection('transactions')
      .where('userId', '==', currentUser.uid)
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
      .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(end))
      .orderBy('timestamp', 'desc')
      .get();

    processAndDisplayData(snapshot, false);
  } catch (error) {
    handleError(error, 'তারিখ অনুযায়ী ডেটা লোড করতে সমস্যা!');
  }
}
document.getElementById('dateFilter').max = new Date().toISOString().split('T')[0];

document.getElementById('dateFilter').addEventListener('change', e => {
  loadTransactionsByDate(e.target.value);
  document.getElementById('monthFilter').value = '';
});

document.getElementById('monthFilter').addEventListener('change', e => {
  loadTransactionsByMonth(e.target.value);
  document.getElementById('dateFilter').value = '';
});
firebase.firestore().collection('transactions')
  .where('userId', '==', firebase.auth().currentUser.uid)
  .orderBy('timestamp', 'desc')
  .limit(5)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Description:', data.description);
      console.log('Amount:', data.amount);
      console.log('Type:', data.type);
      console.log('Timestamp:', data.timestamp);
      console.log('Date (converted):', data.timestamp.toDate());
      console.log('------');
    });
  })
  .catch(error => console.error('Error getting documents:', error));
