function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapItensResumo(itens = []) {
  return (itens || []).map((item) => ({
    id: item.id,
    produtoId: item.produtoId,
    nome: item.produto?.nome || `Produto #${item.produtoId}`,
    quantidade: item.quantidade,
    precoUnitario: toNumber(item.precoUnitario),
    subtotal: toNumber(item.precoUnitario) * toNumber(item.quantidade),
  }));
}

function mapEnderecoEntrega(pedido) {
  return {
    nomeDestinatario: pedido?.nomeDestinatario || null,
    telefoneEntrega: pedido?.telefoneEntrega || null,
    cep: pedido?.cep || null,
    rua: pedido?.rua || null,
    numero: pedido?.numero || null,
    complemento: pedido?.complemento || null,
    bairro: pedido?.bairro || null,
    cidade: pedido?.cidade || null,
    estado: pedido?.estado || null,
    observacoes: pedido?.observacoes || null,
  };
}

export function toPedidoAdminListDto(pedido) {
  return {
    id: pedido.id,
    status: pedido.status,
    valorTotal: toNumber(pedido.valorTotal),
    createdAt: pedido.createdAt,
    cliente: {
      nome: pedido?.cliente?.nome || null,
    },
    itens: mapItensResumo(pedido?.itens || []),
  };
}

export function toPedidoAdminDetailDto(pedido) {
  return {
    id: pedido.id,
    status: pedido.status,
    paymentStatus: pedido.paymentStatus || null,
    paymentMethod: pedido.paymentMethod || null,
    paidAt: pedido.paidAt || null,
    valorTotal: toNumber(pedido.valorTotal),
    createdAt: pedido.createdAt,
    cliente: {
      id: pedido?.cliente?.id || null,
      nome: pedido?.cliente?.nome || null,
      email: pedido?.cliente?.email || null,
      telefone: pedido?.cliente?.telefone || null,
    },
    entrega: mapEnderecoEntrega(pedido),
    itens: mapItensResumo(pedido?.itens || []).map((item) => ({
      ...item,
      produto: {
        id: (pedido?.itens || []).find((i) => i.id === item.id)?.produto?.id || null,
        nome: (pedido?.itens || []).find((i) => i.id === item.id)?.produto?.nome || item.nome,
        slug: (pedido?.itens || []).find((i) => i.id === item.id)?.produto?.slug || null,
        imagemPrincipal: (pedido?.itens || []).find((i) => i.id === item.id)?.produto?.imagemPrincipal || null,
        preco: toNumber((pedido?.itens || []).find((i) => i.id === item.id)?.produto?.preco, null),
      },
    })),
  };
}

export function toPedidoClienteDto(pedido) {
  return {
    id: pedido.id,
    createdAt: pedido.createdAt,
    valorTotal: toNumber(pedido.valorTotal),
    status: pedido.status,
    paymentStatus: pedido.paymentStatus || null,
    paymentMethod: pedido.paymentMethod || null,
    paidAt: pedido.paidAt || null,
    itens: (pedido.itens || []).map((item) => ({
      id: item.id,
      quantidade: item.quantidade,
      precoUnitario: toNumber(item.precoUnitario),
      subtotal: toNumber(item.precoUnitario) * toNumber(item.quantidade),
      produto: {
        nome: item?.produto?.nome || null,
        imagemPrincipal: item?.produto?.imagemPrincipal || null,
        categoria: {
          nome: item?.produto?.categoria?.nome || null,
        },
      },
    })),
  };
}

export function toPedidoCheckoutDto(payload) {
  return {
    pedidoId: payload?.pedido?.id,
    init_point: payload?.init_point || null,
    checkoutAccessToken: payload?.checkoutAccessToken || null,
    checkoutAccessTokenExpiresAt: payload?.checkoutAccessTokenExpiresAt || null,
  };
}

function maskAddress(pedido) {
  if (!pedido) return null;

  const cep = pedido.cep ? `${String(pedido.cep).slice(0, 5)}***` : null;
  const rua = pedido.rua ? `${String(pedido.rua).slice(0, 6)}***` : null;
  const numero = pedido.numero ? "***" : null;

  return {
    cep,
    rua,
    numero,
    bairro: pedido.bairro || null,
    cidade: pedido.cidade || null,
    estado: pedido.estado || null,
  };
}

export function toPedidoSucessoDto(pedido) {
  return {
    numeroPedido: pedido.id,
    status: pedido.status,
    valorTotal: toNumber(pedido.valorTotal),
    dataPedido: pedido.createdAt,
    itens: mapItensResumo(pedido?.itens || []),
    endereco: maskAddress(pedido),
  };
}
