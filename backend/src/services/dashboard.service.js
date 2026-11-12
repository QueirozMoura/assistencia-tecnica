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

    // Receita total (soma de pedidos PAGO + PREPARANDO + ENVIADO + ENTREGUE: todos já pagos)
    prisma.pedido.aggregate({
      _sum: {
        valorTotal: true,
        valorFrete: true,
      },
      where: {
        status: {
          in: ["PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE"],
        },
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
        PREPARANDO: pedidosStatus.PREPARANDO ?? 0,
        ENVIADO:   pedidosStatus.ENVIADO   ?? 0,
        ENTREGUE:  pedidosStatus.ENTREGUE  ?? 0,
        CANCELADO: pedidosStatus.CANCELADO ?? 0,
      },
      // receitaTotal mantém o significado anterior (soma de valorTotal = produtos + frete).
      // receitaProdutos e receitaFrete separam os dois componentes (produtos = total - frete).
      receitaTotal: Math.round(Number(receitaTotal._sum.valorTotal ?? 0) * 100) / 100,
      receitaProdutos:
        Math.round((Number(receitaTotal._sum.valorTotal ?? 0) - Number(receitaTotal._sum.valorFrete ?? 0)) * 100) / 100,
      receitaFrete: Math.round(Number(receitaTotal._sum.valorFrete ?? 0) * 100) / 100,
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
