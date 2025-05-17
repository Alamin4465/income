// Firebase কনফিগারেশন
  const firebaseConfig = {
    apiKey: "AIzaSyBd-XtWebM0_CTQMdzPK-o-W7FUA05bLH8",
    authDomain: "income-expenses-c943b.firebaseapp.com",
    projectId: "income-expenses-c943b",
    storageBucket: "income-expenses-c943b.firebasestorage.app",
    messagingSenderId: "628898657958",
    appId: "1:628898657958:web:2050bcaca828be73c8a667"
  };

  // Firebase ইনিশিয়ালাইজেশন
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase .firestore();
