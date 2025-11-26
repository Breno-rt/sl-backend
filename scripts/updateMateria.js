import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function atualizarMaterias() {
  try {
    // Atualizar todos os alunos
    await prisma.aluno.updateMany({
      data: { materia: ["Inglês"] }, // Agora armazenamos como um array
    });

    // Atualizar todos os professores
    await prisma.professor.updateMany({
      data: { materia: ["Inglês"] }, // Agora armazenamos como um array
    });

    // Atualizar todas as aulas
    await prisma.aula.updateMany({
      data: { materia: "Inglês" }, // A aula continua com uma única matéria
    });

    console.log("✅ Matéria adicionada com sucesso a todos os registros!");
  } catch (error) {
    console.error("❌ Erro ao atualizar matérias:", error);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarMaterias();
