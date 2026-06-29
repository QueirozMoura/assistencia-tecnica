# TODO — Finalização do módulo de Agendamentos

- [x] 1) Revisar padrão existente de "Meus Pedidos" (backend e frontend) para espelhar em "Meus Agendamentos"
- [x] 2) Atualizar Prisma schema (campos opcionais em Agendamento) e criar migration segura
- [x] 3) Atualizar validator/controller/service/routes de agendamento no backend
- [x] 4) Criar endpoint autenticado "Meus Agendamentos" no padrão de cliente logado
- [x] 5) Atualizar `frontend/src/services/clientApi.js` com APIs de agendamento do cliente
- [x] 6) Atualizar `frontend/src/pages/Scheduling.jsx` (pré-preenchimento, máscaras, validação, submit real, loading/erro/sucesso)
- [x] 7) Atualizar `frontend/src/pages/MeusAgendamentos.jsx` com listagem real, ordenação e badges de status
- [ ] 8) Implementar gerenciamento admin de agendamentos (listagem + alteração de status apenas)
- [ ] 9) Ajustar rotas do painel admin para incluir página de agendamentos sem quebrar rotas existentes
- [ ] 10) Validar backend start, migrate, frontend build e não-regressão básica (auth/google/checkout/mp/pedidos)
