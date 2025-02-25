const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.resetAttemptsOnLogin = functions.database
    .ref("/users/{userId}/lastLogin") // Trigger when lastLogin updates
    .onWrite(async (change, context) => {
        const userId = context.params.userId;
        const db = admin.database();
        const userRef = db.ref(`users/${userId}`);
        const adminTasksRef = db.ref("adminSettings/tasks");

        try {
            const userSnapshot = await userRef.once("value");
            if (!userSnapshot.exists()) return null;

            const lastReset = userSnapshot.child("lastReset").val() || 0;
            const currentTime = Date.now();

            // Get 12:00 AM timestamp of today
            const midnight = new Date();
            midnight.setHours(0, 0, 0, 0);
            const midnightTimestamp = midnight.getTime();

            if (lastReset < midnightTimestamp) {
                // Fetch default attempts from adminSettings/tasks
                const adminSnapshot = await adminTasksRef.once("value");
                let newAttempts = {};
                
                if (adminSnapshot.exists()) {
                    adminSnapshot.forEach(task => {
                        newAttempts[task.key] = task.child("attempts").val();
                    });
                }

                // Update user's attempts and lastReset time
                await userRef.update({
                    attempts: newAttempts,
                    lastReset: currentTime
                });
            }
        } catch (error) {
        
        }

        return null;
    });
