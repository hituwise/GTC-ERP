import { Firestore } from "@google-cloud/firestore";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Starting Firestore Connection Test...");
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

  const firestore = new Firestore({
    projectId: "ais-asia-southeast1-1cd7dbadb7",
    databaseId: config.firestoreDatabaseId || "(default)"
  });

  try {
    console.log("Attempting to fetch 'admins' collection...");
    const snapshot = await firestore.collection("admins").limit(1).get();
    console.log("Success! Admins count in limit(1):", snapshot.size);
    snapshot.forEach(doc => {
      console.log("Doc ID:", doc.id, "Data:", doc.data());
    });
  } catch (err: any) {
    console.error("Firestore test FAILED!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Full Error:", err);
  }
}

run();
