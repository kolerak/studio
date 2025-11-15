import { getApps, initializeApp, App } from "firebase-admin/app";
import { firebaseConfig } from "@/firebase/config";

let adminApp: App;

export async function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // When running in a Google Cloud environment, the SDK can automatically
    // detect the service account credentials and project ID.
    adminApp = initializeApp();
  } catch (e) {
    console.warn("Admin initialization with default credentials failed, trying with project ID. Error: ", e);
    try {
        // Fallback for local development or environments where default credentials aren't set
        adminApp = initializeApp({
            projectId: firebaseConfig.projectId,
        });
    } catch (initError) {
        console.error("Firebase Admin SDK initialization failed completely. Error: ", initError);
    }
  }
  return adminApp;
}
