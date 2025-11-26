import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './src/routes.js';
import cron from "node-cron";
import { excluirAulasAntigas } from "./src/services/excluirAulasAntigas.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configurado corretamente
app.use(cors({
  origin: "https://sl-frontend-dbym.onrender.com",
  credentials: true
}));


app.use(express.json());
app.use(routes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Cron job
cron.schedule("0 15 * * *", async () => {
  try {
    await excluirAulasAntigas();
    console.log("✅ Aulas antigas excluídas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao excluir aulas antigas:", error);
  }
});
