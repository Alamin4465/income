// Firebase কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyBd-XtWebM0_CTQMdzPK-o-W7FUA05bLH8",
  authDomain: "income-expenses-c943b.firebaseapp.com",
  projectId: "income-expenses-c943b",
  storageBucket: "income-expenses-c943b.appspot.com",
  messagingSenderId: "628898657958",
  appId: "1:628898657958:web:2050bcaca828be73c8a667"
};

// Firebase ইনিশিয়ালাইজ করুন
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// রিয়েলটাইম ডেটা ট্র্যাকিং
let transactions = [];
let currentUser = null;
