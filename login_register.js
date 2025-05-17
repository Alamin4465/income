function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }

  function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  }

  // এরর মেসেজ শো করার ফাংশন
  function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    setTimeout(() => {
      document.getElementById('errorMessage').textContent = '';
    }, 5000);
  }

  // রেজিস্ট্রেশন ফাংশন
  async function registerUser() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
      // ইউজার ক্রিয়েশন
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // ফায়ারস্টোরে ডেটা সেভ
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert('রেজিস্ট্রেশন সফল! লগিন করুন');
      showLoginForm();
    } catch (error) {
      showError(error.message);
    }
  }

  // লগিন ফাংশন
  async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // লগিন সফল হলে index.html এ রিডাইরেক্ট
      window.location.href = 'index.html';
    } catch (error) {
      showError(error.message);
    }
  }

  // অটো রিডাইরেক্ট চেক
  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = 'index.html';
    }
  });
