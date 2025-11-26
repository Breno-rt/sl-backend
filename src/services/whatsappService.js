import twilio from "twilio";
import dotenv from "dotenv";

// Carrega as variáveis do .env
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

export const sendWhatsAppMessage = async (to, message) => {
  try {
    const numeroComDDI = `+55${to}`;

    const result = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${numeroComDDI}`,
      body: message,
    });

    console.log(`✅ Mensagem enviada para ${numeroComDDI}: ${result.sid}`);
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err);
  }
};