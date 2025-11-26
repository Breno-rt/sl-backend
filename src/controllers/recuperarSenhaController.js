import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { enviarEmail } from '../services/emailService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const recuperarSenha = async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ mensagem: 'E-mail não encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = dayjs().add(15, 'minute').toDate(); // token expira em 15 min

    await prisma.usuario.update({
      where: { email },
      data: {
        tokenRecuperacao: token,
        tokenExpiracao: expiracao,
      },
    });

    const link = `${process.env.FRONTEND_URL}/usuarios/trocar-senha/${token}`;
    const mensagem = `
      Olá ${usuario.nome},

      Você solicitou a recuperação da sua senha.

      Clique no link abaixo para redefinir sua senha. Ele será válido por 15 minutos:

      ${link}

      Se você não solicitou isso, ignore este e-mail.

      Abraços,
      Société de Langues
    `;

    await enviarEmail(email, 'Recuperação de senha', mensagem);

    res.status(200).json({ mensagem: 'E-mail de recuperação enviado com sucesso!' });
  } catch (erro) {
    console.error('Erro na recuperação de senha:', erro);
    res.status(500).json({ mensagem: 'Erro ao enviar e-mail de recuperação' });
  }
};


  export const redefinirSenha = async (req, res) => {
  const { token } = req.params;
  const { novaSenha } = req.body;

  console.log("🔥 TOKEN RECEBIDO NO BACKEND:", token);

  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        tokenRecuperacao: token,
        tokenExpiracao: { gte: new Date() },
      },
    });

    if (!usuario) {
      console.log("❌ Token não encontrado no banco OU expirado");
      return res.status(400).json({ mensagem: 'Token inválido ou expirado' });
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaCriptografada,
        tokenRecuperacao: null,
        tokenExpiracao: null,
      },
    });

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro);
    res.status(500).json({ mensagem: 'Erro ao redefinir senha' });
  }
};


