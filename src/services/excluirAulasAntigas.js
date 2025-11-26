import moment from "moment-timezone";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export async function excluirAulasAntigas() {
    const agora = moment().tz("America/Sao_Paulo");
    console.log(`⏳ Verificando aulas para exclusão às ${agora.format("HH:mm:ss")}`);
  
    try {
      // Buscar aulas diretamente no banco de dados
      const aulas = await prisma.aula.findMany();
  
      // Filtrar aulas com mais de 20 dias
      const aulasParaExcluir = aulas.filter((aula) => {
        const dataAula = moment(aula.data, "YYYY-MM-DD").tz("America/Sao_Paulo");
        return agora.diff(dataAula, "days") > 20; // Excluir se tiver mais de 20 dias
      });
  
      // Excluir aulas do banco de dados
      for (const aula of aulasParaExcluir) {
        await prisma.aula.delete({ where: { id: aula.id } });
        console.log(`✅ Aula ${aula.id} excluída.`);
      }
  
      console.log("🚀 Processo de exclusão concluído!");
    } catch (error) {
      console.error("❌ Erro ao excluir aulas:", error);
    }
  }