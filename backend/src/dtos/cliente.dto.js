export function toClienteListDto(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    cpf: cliente.cpf,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
    totalAgendamentos: cliente?._count?.agendamentos ?? 0,
    totalPedidos: cliente?._count?.pedidos ?? 0,
  };
}

export function toClienteDetailDto(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    cpf: cliente.cpf,
    emailVerificado: cliente.emailVerificado,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
    agendamentos: (cliente.agendamentos || []).map((agendamento) => ({
      id: agendamento.id,
      status: agendamento.status,
      equipamento: agendamento.equipamento,
      problema: agendamento.problema,
      createdAt: agendamento.createdAt,
    })),
    pedidos: (cliente.pedidos || []).map((pedido) => ({
      id: pedido.id,
      status: pedido.status,
      valorTotal: pedido.valorTotal,
      paymentStatus: pedido.paymentStatus,
      createdAt: pedido.createdAt,
      itens: (pedido.itens || []).map((item) => ({
        id: item.id,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        produto: item.produto
          ? {
              id: item.produto.id,
              nome: item.produto.nome,
            }
          : null,
      })),
    })),
  };
}

export function toClienteResponseDto(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    cpf: cliente.cpf,
    emailVerificado: cliente.emailVerificado,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
  };
}
