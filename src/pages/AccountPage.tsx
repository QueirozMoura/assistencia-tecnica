import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Package, MapPin, Settings, LogOut, ChevronRight,
  Edit3, Check, Truck, Clock, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { mockOrders, mockAddresses } from '../data/orders';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '../utils/formatters';
import { Button } from '../components/ui/Button';

type Tab = 'profile' | 'orders' | 'addresses' | 'settings';

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <Check size={14} />,
  processing: <Package size={14} />,
  shipped: <Truck size={14} />,
  delivered: <CheckCircle size={14} />,
};

export function AccountPage() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>(
    location.pathname.includes('pedidos') ? 'orders' :
    location.pathname.includes('enderecos') ? 'addresses' : 'profile'
  );
  const [editingProfile, setEditingProfile] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const navItems = [
    { id: 'profile' as Tab, icon: User, label: 'Meu Perfil' },
    { id: 'orders' as Tab, icon: Package, label: 'Meus Pedidos' },
    { id: 'addresses' as Tab, icon: MapPin, label: 'Endereços' },
    { id: 'settings' as Tab, icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Minha Conta</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seu perfil e pedidos</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* User card */}
            <div className="bg-white rounded-3xl p-5 shadow-card mb-4 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-3 shadow-glow">
                <span className="text-2xl font-black text-white">
                  {user?.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{user?.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>

            {/* Nav */}
            <div className="bg-white rounded-3xl p-3 shadow-card">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab !== id && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {/* Profile */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Dados Pessoais</h2>
                  <Button
                    size="sm"
                    variant={editingProfile ? 'primary' : 'outline'}
                    icon={editingProfile ? <Check size={14} /> : <Edit3 size={14} />}
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    {editingProfile ? 'Salvar' : 'Editar'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: 'Nome Completo', value: user?.name || '' },
                    { label: 'E-mail', value: user?.email || '' },
                    { label: 'Telefone', value: '(11) 99999-8888' },
                    { label: 'CPF', value: '***.***.***-00' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {label}
                      </label>
                      {editingProfile ? (
                        <input
                          defaultValue={value}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-400"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-gray-900">Meus Pedidos</h2>
                {mockOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl p-5 shadow-card">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-bold text-gray-900 font-mono">{order.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.date)}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor(order.status)}`}>
                        {statusIcons[order.status]}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-xl"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-400">{item.product.brand} • Qtd: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                        {order.trackingCode && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            Rastreamento: {order.trackingCode}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Endereços</h2>
                  <Button size="sm">+ Adicionar</Button>
                </div>

                {mockAddresses.map((addr) => (
                  <div key={addr.id} className="bg-white rounded-3xl p-5 shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MapPin size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{addr.label}</h3>
                            {addr.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {addr.street}, {addr.number}
                            {addr.complement && ` - ${addr.complement}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.neighborhood} - {addr.city}/{addr.state}
                          </p>
                          <p className="text-sm text-gray-400">CEP: {addr.cep}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:underline font-medium">Editar</button>
                        {!addr.isDefault && (
                          <button className="text-sm text-red-400 hover:text-red-600 font-medium">Remover</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-gray-900">Configurações</h2>

                {[
                  {
                    title: 'Notificações',
                    items: [
                      { label: 'E-mail sobre pedidos', enabled: true },
                      { label: 'E-mail promocional', enabled: false },
                      { label: 'Notificações push', enabled: true },
                    ],
                  },
                  {
                    title: 'Privacidade',
                    items: [
                      { label: 'Compartilhar dados para personalização', enabled: true },
                      { label: 'Aceitar cookies analíticos', enabled: true },
                    ],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="bg-white rounded-3xl p-5 shadow-card">
                    <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
                    <div className="space-y-4">
                      {items.map(({ label, enabled }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{label}</span>
                          <div
                            className={`relative w-10 h-6 rounded-full cursor-pointer transition-colors ${
                              enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <motion.div
                              animate={{ x: enabled ? 18 : 2 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-red-50 rounded-3xl p-5 border border-red-100">
                  <h3 className="font-bold text-red-700 mb-2">Zona de Perigo</h3>
                  <p className="text-sm text-red-500 mb-4">
                    Ações irreversíveis. Prossiga com cuidado.
                  </p>
                  <Button variant="danger" size="sm">Excluir minha conta</Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
