
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAMsK0XzP1n1lYCaKNb08KP8Fio-Yw69D0",
  authDomain: "sihproject-700b0.firebaseapp.com",
  projectId: "sihproject-700b0",
  storageBucket: "sihproject-700b0.appspot.com",
  messagingSenderId: "233272893337",
  appId: "1:233272893337:web:abab052f829e9cf37abd08",
  measurementId: "G-LFQRBCJVGT"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
