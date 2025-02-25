const admin = require("firebase-admin");

// Initialize Firebase Admin with Service Account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://earning-948278-default-rtdb.firebaseio.com/"
});

const db = admin.database();
const usersRef = db.ref("users");
const adminSettingsRef = db.ref("adminSettings/tasks");

async function resetDailyAttempts() {
  try {
    const snapshot = await usersRef.once("value");
    if (snapshot.exists()) {
      const adminSnapshot = await adminSettingsRef.once("value");
      let defaultAttempts = {};

      if (adminSnapshot.exists()) {
        adminSnapshot.forEach((task) => {
          defaultAttempts[task.key] = task.child("attempts").val();
        });
      }

      // Update all users' attempts and lastReset time
      snapshot.forEach((user) => {
        usersRef.child(user.key).update({
          attempts: defaultAttempts,
          lastReset: Date.now()
        });
      });

      console.log("Daily reset completed!"); 
    } else {
      console.log("No users found for reset."); 
    }
  } catch (error) {
    console.error("Error resetting attempts:", error); 
  }
}

resetDailyAttempts();
