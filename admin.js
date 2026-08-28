const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = "A0mg5FsoZ4ZUR7tvK1bJAuMbd3t1"; // Lo sacas de la pestaña Authentication

admin.auth().setCustomUserClaims(uid, { role: "Administrador" })
  .then(() => {
    console.log("¡Claims configurados con éxito!");
    process.exit();
  })
  .catch(error => console.error(error));

const enviarNotificacion = async (req, res) => {
  const { fcmToken, titulo, cuerpo } = req.body;

  const message = {
    notification: {
      title: titulo,
      body: cuerpo
    },
    token: fcmToken // El token que te envió el Frontend
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).send({ success: false, error });
  }
};