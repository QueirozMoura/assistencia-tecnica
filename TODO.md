# TODO - Correção mínima fluxo de login (QA)

- [x] Validar composição do provider de autenticação no bootstrap (`frontend/src/main.jsx`) e contexto (`frontend/src/contexts/ClientAuthContext.jsx`)
- [x] Aplicar fallback defensivo em `frontend/src/hooks/useClientAuth.js` para evitar crash de renderização
- [x] Isolar render do `GoogleLogin` em `frontend/src/pages/Login.jsx` sem remover funcionalidade
- [x] Validar runtime: login carrega sem erro 500, submit dispara POST `/api/client-auth/login` e fluxo responde corretamente

# TODO - Correção mínima do carrinho (sem refatoração)

- [ ] Etapa 1: corrigir `frontend/src/hooks/useCart.js` (resolvedor único `getItemPrice` + persistência/rehidratação `jfq-cart` + cálculos com resolvedor)
- [ ] Etapa 2: validar manualmente (adicionar produto, trocar rota, F5, persistência mantida)
- [ ] Etapa 3: corrigir `frontend/src/components/ui/ProductCard.jsx` (enviar objeto normalizado para `addItem`)
- [ ] Etapa 4: validar preço do item correto após ajuste do ProductCard
- [ ] Etapa 5: corrigir `frontend/src/components/layout/CartDrawer.jsx` (usar resolvedor único)
- [ ] Etapa 6: corrigir `frontend/src/pages/Checkout.jsx` (usar resolvedor único)
- [ ] Etapa 7: regressão rápida (preço, total, parcelamento, persistência entre rotas e após F5, console sem erros novos)
