import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface UserMailData {
  name: string;
  email: string;
  id: string | number;
  password?: string;
  role: string;
}

interface AccessRequestData {
  email: string;
  message: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "facturacion@dappertechnologies.com",
      pass: "xsmtpsib-3f8bbad1c81ecfb555e19854871cd01ccbce776b5de5aa8c5b82c87da0915a67-FHcJUhSjG3YqZN0x", 
    },
  });
};

export async function sendAccessRequest(requestData: AccessRequestData, adminEmail: string) {
  console.log('Procesando solicitud de acceso de:', requestData.email);

  try {
    const transporter = createTransporter();
    const currentYear = new Date().getFullYear();

    const htmlAdmin = await ejs.renderFile(
      "src/api/mail/requestAccessAdmin.ejs", 
      {
        data: requestData,
        year: currentYear
      }
    );

    await transporter.sendMail({
      from: '"Web +Conta" <no-reply@tudominio.com>',
      to: adminEmail, 
      replyTo: requestData.email,
      subject: `Solicitud de Ingreso: ${requestData.email}`,
      html: htmlAdmin,
    });
    console.log(`Notificación de solicitud enviada al admin (${adminEmail}).`);

    const htmlUser = await ejs.renderFile(
      "src/api/mail/requestReceivedUser.ejs",
      {
        data: requestData,
        year: currentYear
      }
    );

    await transporter.sendMail({
      from: '"+Conta Soporte" <no-reply@tudominio.com>',
      to: requestData.email,
      subject: 'Hemos recibido tu solicitud de acceso',
      html: htmlUser,
    });
    console.log('Correo de confirmación enviado al solicitante.');

    return "Proceso de solicitud finalizado con éxito";

  } catch (error) {
    console.error("Error al enviar correos de solicitud:", error);
    throw error;
  }
}

export async function sendNewUserCredentials(userData: UserMailData, notificationEmail?: string) {
  console.log('Iniciando proceso de envío de credenciales para:', userData.email);

  try {
    let transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "facturacion@dappertechnologies.com",
        pass: "xsmtpsib-3f8bbad1c81ecfb555e19854871cd01ccbce776b5de5aa8c5b82c87da0915a67-FHcJUhSjG3YqZN0x", 
      },
    });

    let currentYear = new Date().getFullYear();

    if (notificationEmail) {
        let htmlAdmin = await ejs.renderFile(
          "src/api/mail/newUserAdmin.ejs", 
          {
            user: userData,
            year: currentYear
          }
        );

        await transporter.sendMail({
          from: '"Sistema +Conta" <no-reply@tudominio.com>', 
          to: notificationEmail,
          cc: 'a.roano@dappertechnologies.com', 
          subject: `Nuevo Usuario Creado: ${userData.name} (${userData.role})`,
          html: htmlAdmin,
        });
        console.log(`Notificación enviada a ${notificationEmail}.`);
    }

    if (userData.email && userData.password) {
        let htmlUser = await ejs.renderFile(
          "src/api/mail/credentialsUser.ejs",
          {
            user: userData,
            year: currentYear
          }
        );
    
        await transporter.sendMail({
          from: '"+Conta Accesos" <no-reply@tudominio.com>',
          to: userData.email,
          subject: 'Bienvenido a +Conta - Tus Credenciales de Acceso',
          html: htmlUser,
        });
        console.log('Credenciales enviadas al usuario.');
    }

    return "Correos de alta enviados correctamente";

  } catch (error) {
    console.error("Error al enviar correos de alta:", error);
    throw error;
  }
}