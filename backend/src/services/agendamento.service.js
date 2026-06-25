import prisma from "../config/prisma.js";

export async function listarAgendamentos(query) {
  const { page = 1, limit = 20, status, dataInicio, dataFim, busca } = query;
  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;

  if (dataInicio || dataFim) {
    where.dataAgendamento = {};
    if (dataInicio) where.dataAgendamento.gte = new Date(dataInicio);
    if (dataFim) where.dataAgendamento.lte = new Date(dataFim);
  }

  if (busca) {
    where.OR = [
      { nomeContato: { contains: busca, mode: "insensitive" } },
      { telefoneContato: { contains: busca } },
      { equipamento: { contains: busca, mode: "insensitive" } },
      { marca: { contains: busca, mode: "insensitive" } },
      { problema: { contains: busca, mode: "insensitive" } },
    ];
  }

  const [total, agendamentos] = await Promise.all([
    prisma.agendamento.count({ where }),
    prisma.agendamento.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, nome: true, email: true, telefone: true } },
      },
    }),
  ]);

  return {
    data: agendamentos,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function buscarAgendamentoPorId(id) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true, email: true, telefone: true } },
    },
  });

  if (!agendamento) {
    throw Object.assign(new Error("Agendamento não encontrado."), { statusCode: 404 });
  }

  return agendamento;
}

export async function criarAgendamento(dados) {
  return prisma.agendamento.create({
    data: dados,
    include: {
      cliente: { select: { id: true, nome: true, email: true, telefone: true } },
    },
  });
}

export async function atualizarAgendamento(id, dados) {
  await buscarAgendamentoPorId(id);
  return prisma.agendamento.update({
    where: { id },
    data: dados,
    include: {
      cliente: { select: { id: true, nome: true, email: true, telefone: true } },
    },
  });
}

export async function atualizarStatusAgendamento(id, status) {
  await buscarAgendamentoPorId(id);
  return prisma.agendamento.update({
    where: { id },
    data: { status },
  });
}

export async function deletarAgendamento(id) {
  await buscarAgendamentoPorId(id);
  return prisma.agendamento.delete({ where: { id } });
}
