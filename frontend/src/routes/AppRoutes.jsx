import { Routes, Route, Navigate } from 'react-router-dom'

// ── Layout e páginas públicas ─────────────────────────────────────────────────
import Layout        from '../components/layout/Layout'
import Home          from '../pages/Home'
import Catalog       from '../pages/Catalog'
import ProductDetail from '../pages/ProductDetail'
import Services      from '../pages/Services'
import Scheduling    from '../pages/Scheduling'
import About         from '../pages/About'
import Contact       from '../pages/Contact'
import NotFound      from '../pages/NotFound'

// ── Cliente: auth + páginas ───────────────────────────────────────────────────
import ClientPrivateRoute from '../components/client/ClientPrivateRoute'
import Login              from '../pages/Login'
import Cadastro           from '../pages/Cadastro'
import EsqueciSenha       from '../pages/EsqueciSenha'
import RedefinirSenha     from '../pages/RedefinirSenha'
import MinhaConta         from '../pages/MinhaConta'
import MeusPedidos        from '../pages/MeusPedidos'
import MeusAgendamentos   from '../pages/MeusAgendamentos'
import Checkout           from '../pages/Checkout'
import PagamentoSucesso   from '../pages/PagamentoSucesso'

// ── Admin: auth + layout ──────────────────────────────────────────────────────
import PrivateRoute  from '../components/admin/PrivateRoute'
import AdminLayout   from '../admin/components/AdminLayout'
import AdminLogin    from '../admin/pages/AdminLogin'

// ── Admin: páginas ────────────────────────────────────────────────────────────
import Dashboard       from '../admin/pages/Dashboard'
import CategoriasList  from '../admin/pages/Categorias/CategoriasList'
import CategoriaForm   from '../admin/pages/Categorias/CategoriaForm'
import ProdutosList    from '../admin/pages/Produtos/ProdutosList'
import ProdutoForm     from '../admin/pages/Produtos/ProdutoForm'
import AgendamentosAdmin from '../admin/pages/Agendamentos/Agendamentos'
import Pedidos         from '../admin/pages/Pedidos/Pedidos'
import PedidoDetail    from '../admin/pages/Pedidos/PedidoDetail'
import Clientes        from '../admin/pages/Clientes/Clientes'

export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Rotas públicas (site) ─────────────────────────────────── */}
      <Route element={<Layout />}>
        {/* Páginas públicas */}
        <Route path="/"              element={<Home />} />
        <Route path="/catalogo"      element={<Catalog />} />
        <Route path="/produto/:slug" element={<ProductDetail />} />
        <Route path="/assistencia"   element={<Services />} />
        <Route path="/agendamento"   element={<Scheduling />} />
        <Route path="/sobre"         element={<About />} />
        <Route path="/contato"       element={<Contact />} />

        {/* Auth de cliente — públicas (sem Layout próprio, usam o Layout do site) */}
        <Route path="/login"           element={<Login />} />
        <Route path="/cadastro"        element={<Cadastro />} />
        <Route path="/esqueci-senha"   element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Área do cliente — protegidas */}
        <Route path="/minha-conta"        element={<ClientPrivateRoute><MinhaConta /></ClientPrivateRoute>} />
        <Route path="/meus-pedidos"       element={<ClientPrivateRoute><MeusPedidos /></ClientPrivateRoute>} />
        <Route path="/meus-agendamentos"  element={<ClientPrivateRoute><MeusAgendamentos /></ClientPrivateRoute>} />
        <Route path="/checkout"           element={<ClientPrivateRoute><Checkout /></ClientPrivateRoute>} />
        <Route path="/pagamento/sucesso"  element={<PagamentoSucesso />} />

        <Route path="*"              element={<NotFound />} />
      </Route>

      {/* ── Login admin — público ─────────────────────────────────── */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ── Área admin — protegida + layout próprio ───────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        {/* /admin → redireciona para /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Categorias */}
        <Route path="categorias"              element={<CategoriasList />} />
        <Route path="categorias/nova"         element={<CategoriaForm />} />
        <Route path="categorias/:id/editar"   element={<CategoriaForm />} />

        {/* Produtos */}
        <Route path="produtos"                element={<ProdutosList />} />
        <Route path="produtos/novo"           element={<ProdutoForm />} />
        <Route path="produtos/:id/editar"     element={<ProdutoForm />} />

        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetail />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ComingSoon title="Detalhe do Cliente" />} />
        <Route path="agendamentos" element={<AgendamentosAdmin />} />
      </Route>

    </Routes>
  )
}

// Placeholder temporário para rotas ainda não implementadas
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#cce0ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 4v10l6 3" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="14" cy="14" r="11" stroke="#003366" strokeWidth="2"/>
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[#003366] mb-2">{title}</h2>
      <p className="text-sm text-[#737780]">Esta seção será implementada na próxima etapa da Fase D.</p>
    </div>
  )
}
