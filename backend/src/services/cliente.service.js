import prisma from "../config/prisma.js";
import {
  toClienteDetailDto,
  toClienteListDto,
  toClienteResponseDto,
} from "../dtos/cliente.dto.js";

const clienteListSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  cpf: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { agendamentos: true, pedidos: true } },
};

const clienteResponseSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  cpf: true,
  emailVerificado: true,
  createdAt: true,
  updatedAt: true,
};

const clienteDetailSelect = {
  ...clienteResponseSelect,
  agendamentos: {
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      equipamento: true,
      problema: true,
      createdAt: true,
    },
  },
  pedidos: {
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      valorTotal: true,
      paymentStatus: true,
      createdAt: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          precoUnitario: true,
          produto: {
            select: { id: true, nome: true },
          },
        },
      },
    },
  },
};

const allowedClienteFields = ["nome", "email", "telefone", "cpf"];

function sanitizeClienteData(dados = {}) {
  const safeData = {};

  for (const field of allowedClienteFields) {
    if (Object.prototype.hasOwnProperty.call(dados, field)) {
      safeData[field] = dados[field];
    }
  }

  return safeData;
}

async function validarClienteExiste(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }
}

export async function listarClientes({ page = 1, limit = 20, busca } = {}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: "insensitive" } },
      { email: { contains: busca, mode: "insensitive" } },
      { telefone: { contains: busca } },
      { cpf: { contains: busca } },
    ];
  }

  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nome: "asc" },
      select: clienteListSelect,
    }),
  ]);

  return {
    data: clientes.map(toClienteListDto),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function buscarClientePorId(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: clienteDetailSelect,
  });

  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  return toClienteDetailDto(cliente);
}

export async function criarCliente(dados) {
  const safeData = sanitizeClienteData(dados);

  const cliente = await prisma.cliente.create({
    data: safeData,
    select: clienteResponseSelect,
  });

  return toClienteResponseDto(cliente);
}

export async function atualizarCliente(id, dados) {
  await validarClienteExiste(id);

  const safeData = sanitizeClienteData(dados);

  const cliente = await prisma.cliente.update({
    where: { id },
    data: safeData,
    select: clienteResponseSelect,
  });

  return toClienteResponseDto(cliente);
}

export async function deletarCliente(id) {
  await validarClienteExiste(id);

  const [agendamentos, pedidos] = await Promise.all([
    prisma.agendamento.count({ where: { clienteId: id } }),
    prisma.pedido.count({ where: { clienteId: id } }),
  ]);

  if (agendamentos > 0 || pedidos > 0) {
    throw Object.assign(
      new Error("Não é possível excluir cliente com agendamentos ou pedidos vinculados."),
      { statusCode: 409 }
    );
  }

  return prisma.cliente.delete({ where: { id } });
}
