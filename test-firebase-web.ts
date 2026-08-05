import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Starting Firebase Web SDK Connection Test...");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("Config loaded:", {
    projectId: config.projectId,
    databaseId: config.firestoreDatabaseId
  });

  try {
    const app = initializeApp(config);
    // Note: getFirestore accepts databaseId as the second parameter
    const db = getFirestore(app, config.firestoreDatabaseId);
    console.log("Web SDK Initialized.");

    console.log("Attempting to fetch 'admins' collection...");
    const q = query(collection(db, "admins"), limit(1));
    const snapshot = await getDocs(q);
    console.log("Success! Admins count in limit(1):", snapshot.size);
    snapshot.forEach(doc => {
      console.log("Doc ID:", doc.id, "Data:", doc.data());
    });
  } catch (err: any) {
    console.error("Firebase Web SDK test FAILED!");
    console.error("Error Message:", err.message);
    console.error("Full Error:", err);
  }
}

run();
