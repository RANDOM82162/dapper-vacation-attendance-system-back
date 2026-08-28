import * as admin from "firebase-admin";

// const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const bucket = process.env.STORAGE_BUCKET;
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  console.log("Running with firebase emulators");
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "host.docker.internal:9099";
  process.env.FIRESTORE_EMULATOR_HOST = "host.docker.internal:3000";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = "host.docker.internal:9199";
}

admin.initializeApp({
  projectId: process.env.PROJECT_ID,
});

function auth() {
  try {
    return admin.auth();
  } catch (error) {
    throw error;
  }
}

function storage() {
  try {
    return admin.storage().bucket(bucket);
  } catch (error) {}
}

function messaging() {
  try {
    return admin.messaging();
  } catch (error) {
    throw error;
  }
}

const enviarNotificacion = async (req, res) => {
  const { fcmToken, titulo, cuerpo } = req.body;

  const message = {
    data: {
      title: titulo,
      body: cuerpo
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).send({ success: false, error });
  }
};

export { auth, storage, messaging, enviarNotificacion};
