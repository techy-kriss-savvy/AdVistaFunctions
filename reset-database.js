const admin = require("firebase-admin");

// Check if FIREBASE_SERVICE_ACCOUNT is set
const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJSON) {
  console.error("FIREBASE_SERVICE_ACCOUNT secret is missing!");
  process.exit(1);
}

// Parse the JSON safely
let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJSON);
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT secret:", error);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://earning-948278-default-rtdb.firebaseio.com/",
});

const db = admin.database();
const usersRef = db.ref("users");
const adminSettingsRef = db.ref("adminSettings/tasks");

async function resetDailyAttempts() {
  try {
    const snapshot = await usersRef.once("value");
    if (!snapshot.exists()) {
      console.log("No users found for reset.");
      return;
    }

    // Fetch default attempts from adminSettings
    const adminSnapshot = await adminSettingsRef.once("value");
    let defaultAttempts = {};

    if (adminSnapshot.exists()) {
      adminSnapshot.forEach((task) => {
        defaultAttempts[task.key] = task.child("attempts").val();
      });
    }

    // Batch update all users in parallel
    const updatePromises = [];
    snapshot.forEach((user) => {
      updatePromises.push(
        usersRef.child(user.key).update({
          attempts: defaultAttempts,
          lastReset: Date.now(),
        })
      );
    });

    await Promise.all(updatePromises);
    console.log("Daily reset completed!");

  } catch (error) {
    console.error("Error resetting attempts:", error);
  }
}

resetDailyAttempts();
