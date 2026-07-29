export function toAgendamentoListDto(agendamento) {
  return {
    id: agendamento.id,
    status: agendamento.status,
    createdAt: agendamento.createdAt,
    dataAgendamento: agendamento.dataAgendamento,
    nomeContato: agendamento.nomeContato,
    equipamento: agendamento.equipamento,
    marca: agendamento.marca,
    modelo: agendamento.modelo,
    cidade: agendamento.cidade,
    cliente: {
      id: agendamento?.cliente?.id || null,
      nome: agendamento?.cliente?.nome || null,
    },
  };
}

export function toAgendamentoDetailDto(agendamento) {
  return {
    id: agendamento.id,
    status: agendamento.status,
    createdAt: agendamento.createdAt,
    updatedAt: agendamento.updatedAt,
    dataAgendamento: agendamento.dataAgendamento,
    nomeContato: agendamento.nomeContato,
    whatsapp: agendamento.whatsapp,
    telefoneContato: agendamento.telefoneContato,
    email: agendamento.email,
    endereco: agendamento.endereco,
    cep: agendamento.cep,
    cidade: agendamento.cidade,
    equipamento: agendamento.equipamento,
    marca: agendamento.marca,
    modelo: agendamento.modelo,
    problema: agendamento.problema,
    observacoes: agendamento.observacoes,
    melhorHorario: agendamento.melhorHorario,
    cliente: {
      id: agendamento?.cliente?.id || null,
      nome: agendamento?.cliente?.nome || null,
      email: agendamento?.cliente?.email || null,
      telefone: agendamento?.cliente?.telefone || null,
    },
  };
}

export function toAgendamentoResponseDto(agendamento) {
  return {
    id: agendamento.id,
    status: agendamento.status,
    updatedAt: agendamento.updatedAt,
    nomeContato: agendamento.nomeContato,
    equipamento: agendamento.equipamento,
    dataAgendamento: agendamento.dataAgendamento,
  };
}
