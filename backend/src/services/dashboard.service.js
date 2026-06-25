import prisma from "../config/prisma.js";

/**
 * Retorna os totais e métricas para o painel administrativo.
 * Todas as queries rodam em paralelo via Promise.all para minimizar latência.
 */
export async function getDashboardStats() {
  const [
    totalProdutos,
    totalProdutosAtivos,
    produtosSemEstoque,
    produtosDestaque,
    totalCategorias,
    totalClientes,
    totalPedidos,
    pedidosPorStatus,
    totalAgendamentos,
    agendamentosPorStatus,
    receitaTotal,
  ] = await Promise.all([
    // Produtos
    prisma.produto.count(),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.produto.count({ where: { estoque: 0, ativo: true } }),
    prisma.produto.count({ where: { destaque: true, ativo: true } }),

    // Categorias
    prisma.categoria.count({ where: { ativo: true } }),

    // Clientes
    prisma.cliente.count(),

    // Pedidos
    prisma.pedido.count(),

    // Pedidos agrupados por status
    prisma.pedido.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Agendamentos
    prisma.agendamento.count(),

    // Agendamentos agrupados por status
    prisma.agendamento.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Receita total (soma de pedidos PAGO + ENVIADO + ENTREGUE)
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ["PAGO", "ENVIADO", "ENTREGUE"] },
      },
    }),
  ]);

  // Normalizar pedidos por status em objeto { STATUS: count }
  const pedidosStatus = pedidosPorStatus.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});

  // Normalizar agendamentos por status
  const agendamentosStatus = agendamentosPorStatus.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});

  return {
    produtos: {
      total: totalProdutos,
      ativos: totalProdutosAtivos,
      semEstoque: produtosSemEstoque,
      destaque: produtosDestaque,
    },
    categorias: {
      total: totalCategorias,
    },
    clientes: {
      total: totalClientes,
    },
    pedidos: {
      total: totalPedidos,
      porStatus: {
        PENDENTE:  pedidosStatus.PENDENTE  ?? 0,
        PAGO:      pedidosStatus.PAGO      ?? 0,
        ENVIADO:   pedidosStatus.ENVIADO   ?? 0,
        ENTREGUE:  pedidosStatus.ENTREGUE  ?? 0,
        CANCELADO: pedidosStatus.CANCELADO ?? 0,
      },
      receitaTotal: Number(receitaTotal._sum.total ?? 0),
    },
    agendamentos: {
      total: totalAgendamentos,
      porStatus: {
        PENDENTE:     agendamentosStatus.PENDENTE     ?? 0,
        CONFIRMADO:   agendamentosStatus.CONFIRMADO   ?? 0,
        EM_ANDAMENTO: agendamentosStatus.EM_ANDAMENTO ?? 0,
        CONCLUIDO:    agendamentosStatus.CONCLUIDO    ?? 0,
        CANCELADO:    agendamentosStatus.CANCELADO    ?? 0,
      },
    },
  };
}
