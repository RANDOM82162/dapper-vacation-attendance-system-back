import * as admin from "firebase-admin";

const bucket = process.env.STORAGE_BUCKET;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const useFirebaseEmulators = process.env.USE_FIREBASE_EMULATORS === "true";

if (useFirebaseEmulators) {
  console.log("Running with firebase emulators");

  // Configuracion anterior para correr los emuladores desde Docker:
  // process.env.FIREBASE_AUTH_EMULATOR_HOST = "host.docker.internal:9099";
  // process.env.FIRESTORE_EMULATOR_HOST = "host.docker.internal:3000";
  // process.env.FIREBASE_STORAGE_EMULATOR_HOST = "host.docker.internal:9199";

  // Configuracion local sin Docker:
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
}

const firebaseOptions: admin.AppOptions = { projectId };

if (projectId && clientEmail && privateKey) {
  firebaseOptions.credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  firebaseOptions.credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp(firebaseOptions);
}

function auth() {
  try {
    assertFirebaseAdminConfigured();
    return admin.auth();
  } catch (error) {
    throw error;
  }
}

function storage() {
  try {
    assertFirebaseAdminConfigured();
    return admin.storage().bucket(bucket);
  } catch (error) {}
}

function messaging() {
  try {
    assertFirebaseAdminConfigured();
    return admin.messaging();
  } catch (error) {
    return null;
  }
}

function assertFirebaseAdminConfigured() {
  if (useFirebaseEmulators) return;
  if (projectId && clientEmail && privateKey) return;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  throw new Error(
    "Falta configurar Firebase Admin. Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en el backend.",
  );
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
    res.status(500).send({ success: false, error: "No se pudo enviar la notificación." });
  }
};

export { auth, storage, messaging, enviarNotificacion};
