import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

export const onComplaintUpdate = functions.firestore
  .document("complaints/{complaintId}")
  .onUpdate(async (change, context) => {
    const complaint = change.after.data();
    const previousComplaint = change.before.data();

    if (complaint.status !== previousComplaint.status) {
      const userId = complaint.userId;
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const user = userDoc.data();

      if (user && user.fcmToken) {
        const payload: admin.messaging.MessagingPayload = {
          notification: {
            title: "Complaint Status Updated",
            body: `The status of your complaint has been updated to ${complaint.status}`,
            icon: "/firebase-logo.png",
            click_action: `https://<your-app-url>/complaints/${change.after.id}`,
          },
        };

        await messaging.sendToDevice(user.fcmToken, payload);
      }
    }
  });
