import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

const SALT_ROUNDS = 12;

export async function listarUsuarios({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [total, usuarios] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.findMany({
      skip,
      take: limit,
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    data: usuarios,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function buscarUsuarioPorId(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!usuario) {
    throw Object.assign(new Error("Usuário não encontrado."), { statusCode: 404 });
  }

  return usuario;
}

export async function criarUsuario(dados) {
  const { nome, email, senha, role, ativo } = dados;

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    throw Object.assign(new Error("E-mail já cadastrado."), { statusCode: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  return prisma.usuario.create({
    data: { nome, email, senha: senhaHash, role, ativo },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      createdAt: true,
    },
  });
}

export async function atualizarUsuario(id, dados) {
  await buscarUsuarioPorId(id);
  return prisma.usuario.update({
    where: { id },
    data: dados,
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      updatedAt: true,
    },
  });
}

export async function alterarSenha(id, senhaAtual, novaSenha) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw Object.assign(new Error("Usuário não encontrado."), { statusCode: 404 });
  }

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
  if (!senhaValida) {
    throw Object.assign(new Error("Senha atual incorreta."), { statusCode: 400 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  await prisma.usuario.update({ where: { id }, data: { senha: senhaHash } });

  return { message: "Senha alterada com sucesso." };
}

export async function deletarUsuario(id, usuarioLogadoId) {
  if (id === usuarioLogadoId) {
    throw Object.assign(new Error("Não é possível excluir sua própria conta."), { statusCode: 400 });
  }

  await buscarUsuarioPorId(id);
  return prisma.usuario.delete({ where: { id } });
}
