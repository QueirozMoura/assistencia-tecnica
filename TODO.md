- [ ] Revisar fluxo atual de webhook/pagamento e pontos de integração de notificação
- [ ] Criar camada intermediária backend/src/services/notification.service.js reutilizando email.service.js
- [ ] Integrar disparo no backend/src/services/pagamento.service.js apenas quando pagamento for confirmado (PAID/PAGO)
- [ ] Garantir tratamento de erro para não quebrar webhook em falha de e-mail
- [ ] Adicionar logs adequados sem dados sensíveis
- [ ] Executar validação de sintaxe/build no backend
- [ ] Consolidar relatório final com arquivos alterados, fluxo final e melhorias futuras

## Upload de imagem (Produto Admin) — Correção
- [x] Analisar fluxo frontend (input file/câmera, preview, estado e renderização)
- [x] Analisar fluxo backend (middleware, controller, URL pública e armazenamento)
- [x] Corrigir preview local para galeria e câmera sem depender da URL remota
- [x] Ajustar fallback de renderização quando a imagem falhar
- [x] Corrigir geração de URL pública no backend para ambiente hospedado (PUBLIC_API_URL)
- [ ] Testar seleção de imagem
- [ ] Testar captura por câmera
- [ ] Testar salvamento do produto
- [ ] Executar build do frontend
- [ ] Consolidar relatório final (causa, solução e arquivos alterados)
