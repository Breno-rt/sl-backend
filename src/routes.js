import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { autenticarToken } from "./middleware/auth.js";
import { enviarEmail } from "./services/emailService.js"; // Importa o serviço de e-mails
import moment from "moment-timezone"; // Garante que estamos importando o moment corretamente
import { recuperarSenha, redefinirSenha } from './controllers/recuperarSenhaController.js';

const router = Router();
const prisma = new PrismaClient();
dotenv.config();

//_____________________________________________________________________________________________________________________________________________________________________________________________//

//Recuperação de Senha

router.post('/usuarios/recuperar-senha', recuperarSenha);
router.post('/usuarios/trocar-senha/:token', redefinirSenha);


// CRUD usuário 
router.post("/usuarios", async (req, res) => {
  const { nome, email } = req.body;
  const senhaPadrao = "123456";

  try {
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash },
    });

    // Enviar e-mail de boas-vindas
    const mensagem = `Olá, ${nome}!\n\n` +
      `Seja bem-vindo(a) à Société de Langues!\n\n` +
      `Seu cadastro foi realizado com sucesso. Para acessar a plataforma, utilize os dados abaixo:\n\n` +
      `👤 E-mail: ${email}\n` +
      `🔒 Senha inicial: ${senhaPadrao}\n\n` +
      `⚠️ Recomendamos que você altere sua senha após o primeiro acesso, na aba "Usuário" dentro do site.\n\n` +
      `Dúvidas? Entre em contato com o suporte: (12) 99681-9714`;

    await enviarEmail(email, "Cadastro na Société de Langues", mensagem);

    res.status(201).json({ message: "Usuário criado e e-mail enviado com sucesso!", usuario: novoUsuario });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// GET - Listar todos os usuários
router.get("/usuarios", autenticarToken, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true } // Evita retornar a senha
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// GET - Buscar usuário pelo ID
router.get("/usuarios/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});


// PUT - Editar um usuário
router.put("/usuarios/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;

  try {
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: { nome, email }
    });

    res.json({ message: "Usuário atualizado com sucesso", usuario: usuarioAtualizado });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// DELETE - Excluir um usuário
router.delete("/usuarios/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.usuario.delete({ where: { id } });
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

// PATCH - Trocar a senha de um usuário
router.patch("/usuarios/:id/senha", autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      return res.status(400).json({ error: "Senha atual incorreta" });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id },
      data: { senha: novaSenhaHash },
    });

    res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
});

// Login de usuário
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});



// CRUD PROFESSORES

router.post('/professores', autenticarToken, async (req, res) => {
  const { nome, email, telefone, materia } = req.body;

  try {
    const novoProfessor = await prisma.professor.create({
      data: { nome, email, telefone, materia },
    });
    res.status(201).json(novoProfessor);
  } catch (error) {
    console.error("❌ Erro ao criar professor:", error);
    res.status(500).json({ error: 'Erro ao criar professor' });
  }
});

router.get('/professores', autenticarToken, async (req, res) => {
  try {
    const professores = await prisma.professor.findMany();
    res.json(professores);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professores' });
  }
});

router.get('/professores/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const professor = await prisma.professor.findUnique({ where: { id } });
    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }
    res.json(professor);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar professor' });
  }
});

router.put('/professores/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, materia } = req.body;

  try {
    const professorAtualizado = await prisma.professor.update({
      where: { id },
      data: { nome, email, telefone, materia },
    });
    res.json(professorAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar professor:", error);
    res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
});

router.delete('/professores/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.professor.delete({ where: { id } });
    res.json({ message: 'Professor deletado com sucesso' });
  } catch (error) {
    console.error("❌ Erro ao deletar professor:", error);
    res.status(500).json({ error: 'Erro ao deletar professor' });
  }
});

// CRUD ALUNOS

router.post('/alunos', autenticarToken, async (req, res) => {
  const { nome, email, telefone, materia } = req.body;

  try {
    const novoAluno = await prisma.aluno.create({
      data: { nome, email, telefone, materia },
    });
    res.status(201).json(novoAluno);
  } catch (error) {
    console.error("❌ Erro ao criar aluno:", error);
    res.status(500).json({ error: 'Erro ao criar aluno' });
  }
});

router.get('/alunos', autenticarToken, async (req, res) => {
  try {
    const alunos = await prisma.aluno.findMany();
    res.json(alunos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
});

router.get('/alunos/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const aluno = await prisma.aluno.findUnique({ where: { id } });
    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    res.json(aluno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
});

router.put('/alunos/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, materia } = req.body;

  try {
    const alunoAtualizado = await prisma.aluno.update({
      where: { id },
      data: { nome, email, telefone, materia },
    });
    res.json(alunoAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar aluno:", error);
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
});

router.delete('/alunos/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.aluno.delete({ where: { id } });
    res.json({ message: 'Aluno deletado com sucesso' });
  } catch (error) {
    console.error("❌ Erro ao deletar aluno:", error);
    res.status(500).json({ error: 'Erro ao deletar aluno' });
  }
});

// CRUD AULAS

router.post('/aulas', autenticarToken, async (req, res) => {
  const { data, horario, professorId, alunoId, materia } = req.body;

  try {
    // 🔹 Validar o formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    // 🔹 Validar o formato do horário (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(horario)) {
      return res.status(400).json({ error: "Formato de horário inválido. Use HH:mm." });
    }

    // 🔹 Verificar conflito de horário para o professor
    const conflitoProfessor = await prisma.aula.findFirst({
      where: {
        professorId,
        data, // Compara a data como string (YYYY-MM-DD)
        horario, // Compara o horário como string (HH:mm)
      },
    });

    if (conflitoProfessor) {
      return res.status(400).json({ error: "O professor já tem uma aula marcada nesse horário." });
    }

    // 🔹 Verificar conflito de horário para o aluno
    const conflitoAluno = await prisma.aula.findFirst({
      where: {
        alunoId,
        data, // Compara a data como string (YYYY-MM-DD)
        horario, // Compara o horário como string (HH:mm)
      },
    });

    if (conflitoAluno) {
      return res.status(400).json({ error: "O aluno já tem uma aula marcada nesse horário." });
    }

    // 🔹 Criar a aula no banco de dados
    const novaAula = await prisma.aula.create({
      data: {
        data, // Armazenar a data como string (YYYY-MM-DD)
        horario, // Armazenar o horário como string (HH:mm)
        materia,
        professor: { connect: { id: professorId } }, // Conecta ao professor
        aluno: { connect: { id: alunoId } },         // Conecta ao aluno
      },
      include: { professor: true, aluno: true }, // Inclui os dados do professor e aluno
    });

    // 🔹 Função para formatar a data (DD/MM/YYYY)
    const formatarData = (data) => {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    // 🔹 Enviar e-mails de confirmação
    const mensagemProfessor = `Olá, ${novaAula.professor.nome}!\n\n` +
      "Uma nova aula foi agendada!\n\n" +
      `📚 Matéria: ${materia}\n` +
      `👨‍🎓 Aluno(a): ${novaAula.aluno.nome}\n` +
      `📅 Data: ${formatarData(novaAula.data)}\n` + // Formata a data para DD/MM/YYYY
      `⏰ Horário: ${horario}\n\n` +
      `Caso tenha dúvidas, entre em contato com o suporte: (12) 996819714`;

    const mensagemAluno = `Olá, ${novaAula.aluno.nome}!\n\n` +
      "Sua aula foi agendada com sucesso!\n\n" +
      `📚 Matéria: ${materia}\n` +
      `👨‍🏫 Professor(a): ${novaAula.professor.nome}\n` +
      `📅 Data: ${formatarData(novaAula.data)}\n` + // Formata a data para DD/MM/YYYY
      `⏰ Horário: ${horario}\n\n` +
      `Caso tenha dúvidas, entre em contato com o suporte: (12) 996819714`; 

    await enviarEmail(novaAula.professor.email, "Nova Aula Agendada", mensagemProfessor);
    await enviarEmail(novaAula.aluno.email, "Aula Confirmada", mensagemAluno);

    res.status(201).json(novaAula);
  } catch (error) {
    console.error("❌ Erro ao criar aula:", error);
    res.status(500).json({ error: "Erro ao criar aula" });
  }
});

router.get('/aulas', autenticarToken, async (req, res) => {
  try {
    const aulas = await prisma.aula.findMany({
      include: { professor: true, aluno: true },
    });

    res.json(aulas);
  } catch (error) {
    console.error("❌ Erro ao buscar aulas:", error);
    res.status(500).json({ error: "Erro ao buscar aulas" });
  }
});



router.get('/aulas/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const aula = await prisma.aula.findUnique({
      where: { id },
      include: { professor: true, aluno: true },
    });
    if (!aula) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }
    res.json(aula);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aula' });
  }
});

router.put('/aulas/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { data, horario, professorId, materia } = req.body;

  try {
    // 🔹 Buscar a aula antes da atualização
    const aulaAntiga = await prisma.aula.findUnique({
      where: { id },
      include: { professor: true, aluno: true },
    });

    if (!aulaAntiga) {
      return res.status(404).json({ error: "Aula não encontrada" });
    }

    // 🔹 Validar o formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    // 🔹 Validar o formato do horário (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(horario)) {
      return res.status(400).json({ error: "Formato de horário inválido. Use HH:mm." });
    }

    // 🔹 Verificar conflito de horário para o professor (ignorando a aula atual)
    const conflitoProfessor = await prisma.aula.findFirst({
      where: {
        professorId,
        data, // Compara a data como string (YYYY-MM-DD)
        horario, // Compara o horário como string (HH:mm)
        NOT: { id },
      },
    });

    if (conflitoProfessor) {
      return res.status(400).json({ error: "O professor já tem uma aula marcada nesse horário." });
    }

    // 🔹 Atualizar a aula
    const aulaAtualizada = await prisma.aula.update({
      where: { id },
      data: {
        data, // Armazenar a data como string (YYYY-MM-DD)
        horario, // Armazenar o horário como string (HH:mm)
        professor: { connect: { id: professorId } }, // Conecta ao novo professor
        materia,
      },
      include: { professor: true, aluno: true }, // Inclui os dados do professor e aluno
    });

    // 🔹 Função para formatar a data (DD/MM/YYYY)
    const formatarData = (data) => {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    // 🔹 Enviar e-mails de atualização
    const mensagem = `Olá!\n\nSua aula sofreu alterações. Aqui estão os novos detalhes:\n\n` +
                     `📚 Matéria: ${materia}\n` +
                     `👨‍🏫 Professor: ${aulaAtualizada.professor.nome}\n` +
                     `👨‍🎓 Aluno: ${aulaAtualizada.aluno.nome}\n` +
                     `📅 Data: ${formatarData(aulaAtualizada.data)}\n` + // Formata a data para DD/MM/YYYY
                     `⏰ Horário: ${horario}\n\n` +
                     `Caso tenha dúvidas, entre em contato com o suporte: (12) 996819714`;

    await enviarEmail(aulaAtualizada.professor.email, "Aula Atualizada", mensagem);
    await enviarEmail(aulaAtualizada.aluno.email, "Aula Atualizada", mensagem);

    res.json(aulaAtualizada);
  } catch (error) {
    console.error("❌ Erro ao atualizar aula:", error);
    res.status(500).json({ error: "Erro ao atualizar aula" });
  }
});


router.delete('/aulas/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 🔹 Buscar a aula antes de deletar para obter os dados
    const aula = await prisma.aula.findUnique({
      where: { id },
      include: { professor: true, aluno: true },
    });

    if (!aula) {
      return res.status(404).json({ error: "Aula não encontrada" });
    }

    // 🔹 Função para formatar a data (DD/MM/YYYY)
    const formatarData = (data) => {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    // 🔹 Criar mensagem de cancelamento
    const mensagem = `Olá!\n\nInfelizmente, sua aula foi cancelada. Segue os detalhes da aula cancelada abaixo:\n\n` +
                     `📚 Matéria: ${aula.materia}\n` +
                     `👨‍🏫 Professor: ${aula.professor.nome}\n` +
                     `👨‍🎓 Aluno: ${aula.aluno.nome}\n` +
                     `📅 Data: ${formatarData(aula.data)}\n` + // Formata a data para DD/MM/YYYY
                     `⏰ Horário: ${aula.horario}\n\n` +
                     `Caso tenha dúvidas, entre em contato com o suporte: (12) 996819714`;

    // 🔹 Enviar e-mails de cancelamento
    await enviarEmail(aula.professor.email, "Aula Cancelada", mensagem);
    await enviarEmail(aula.aluno.email, "Aula Cancelada", mensagem);

    // 🔹 Excluir a aula do banco de dados
    await prisma.aula.delete({ where: { id } });

    res.json({ message: "Aula cancelada e e-mails enviados." });
  } catch (error) {
    console.error("❌ Erro ao cancelar aula:", error);
    res.status(500).json({ error: "Erro ao cancelar aula" });
  }
});
//_________________________________________________________________________________________________________________________________________________________________________________________//


export default router;
