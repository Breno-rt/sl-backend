import nodemailer from "nodemailer";
import dotenv from "dotenv";
import moment from 'moment-timezone'; // Importar moment-timezone

dotenv.config();

// Configuração do transporte de e-mails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Função para formatar a data corretamente
function formatarData(data) {
  if (!data) return "Data inválida";

  try {
    return moment.utc(data).tz('America/Sao_Paulo').format('DD/MM/YYYY');
  } catch {
    return "Data inválida";
  }
}

// Função para enviar e-mails sem adicionar data/horário automaticamente
export async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    await transporter.sendMail({
      from: `"Société de Langues" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: assunto,
      text: mensagem, // Agora só manda a mensagem que já foi formatada antes
    });
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
  }
}

export { enviarEmail };