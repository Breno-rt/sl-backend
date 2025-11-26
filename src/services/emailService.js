import nodemailer from "nodemailer";
import dotenv from "dotenv";
import moment from 'moment-timezone';

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

// 🔥 TESTE DE CONEXÃO - adiciona isso
console.log("🔄 Testando conexão SMTP...");
console.log("📧 Email User:", process.env.EMAIL_USER);
console.log("🔑 Email Host:", process.env.EMAIL_HOST);
console.log("🚪 Email Port:", process.env.EMAIL_PORT);

transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ ERRO SMTP:", error);
  } else {
    console.log("✅ SMTP CONECTADO COM SUCESSO!");
  }
});
// FIM DO TESTE

// ... resto do código igual