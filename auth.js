// ইউজারের নাম লোড ফাংশন
const loadUserData = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error("ডেটা লোড করতে সমস্যা:", error);
    return null;
  }
};

// অথেন্টিকেশন স্টেট চেক
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    currentUserId = user.uid;
    const userData = await loadUserData(user.uid);
    const displayName = userData?.name || user.email;
    document.getElementById('welcomeMessage').textContent = `স্বাগতম, ${displayName}`;
    loadTransactions(); // প্রথমবার কল
  }
});

// লগআউট
window.logout = () => {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  }).catch((error) => {
    console.error("লগআউটে সমস্যা:", error);
  });
};
