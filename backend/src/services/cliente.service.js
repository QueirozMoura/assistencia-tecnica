import prisma from "../config/prisma.js";

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
      include: {
        _count: { select: { agendamentos: true, pedidos: true } },
      },
    }),
  ]);

  return {
    data: clientes,
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
    include: {
      agendamentos: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      pedidos: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          itens: { include: { produto: { select: { id: true, nome: true } } } },
        },
      },
    },
  });

  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  return cliente;
}

export async function criarCliente(dados) {
  return prisma.cliente.create({ data: dados });
}

export async function atualizarCliente(id, dados) {
  await buscarClientePorId(id);
  return prisma.cliente.update({ where: { id }, data: dados });
}

export async function deletarCliente(id) {
  await buscarClientePorId(id);

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
