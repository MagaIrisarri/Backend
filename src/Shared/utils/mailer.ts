import nodemailer from 'nodemailer';

// R-28: con SMTP_HOST se manda por SMTP; sin él el mail se escribe en la consola (desarrollo, o la defensa sin credenciales).
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export type Mail = { to: string; subject: string; text: string };
export type SendMail = (mail: Mail) => Promise<void>;

export const sendMail: SendMail = async (mail) => {
  const info = await transport.sendMail({ from: process.env.MAIL_FROM || 'Estacionamiento <no-reply@estacionamiento.local>', ...mail });
  if (!process.env.SMTP_HOST) console.log('Mail sin enviar (falta SMTP_HOST):', info.message);
};
