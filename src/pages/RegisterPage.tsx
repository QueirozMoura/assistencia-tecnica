import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const benefits = [
  'Acompanhe seus pedidos em tempo real',
  'Histórico completo de compras',
  'Ofertas exclusivas para membros',
  'Suporte prioritário',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name || formData.name.length < 3) errs.name = 'Nome deve ter ao menos 3 caracteres';
    if (!formData.email || !formData.email.includes('@')) errs.email = 'E-mail inválido';
    if (!formData.password || formData.password.length < 6) errs.password = 'Mínimo de 6 caracteres';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Senhas não conferem';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password });
      toast.success('Conta criada com sucesso! Bem-vindo(a)!');
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao criar conta. Tente novamente.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength();
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Fraca', 'Regular', 'Boa', 'Forte'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:block"
          >
            <Link to="/" className="inline-flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-glow">
                <Zap size={24} className="text-white" fill="white" />
              </div>
              <div>
                <div className="font-black text-2xl text-white">JFQ</div>
                <div className="text-xs text-blue-400 font-semibold tracking-widest uppercase">Assistência</div>
              </div>
            </Link>

            <h2 className="text-3xl font-black text-white mb-4">
              Junte-se a mais de{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                50 mil clientes
              </span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Crie sua conta JFQ e tenha acesso a uma experiência de compra premium
              com benefícios exclusivos e suporte especializado.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-blue-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-white rounded-3xl p-8 shadow-premium">
              <div className="text-center mb-6 md:hidden">
                <Link to="/" className="inline-flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
                    <Zap size={18} className="text-white" fill="white" />
                  </div>
                  <span className="font-black text-gray-900">JFQ Assistência</span>
                </Link>
              </div>

              <h2 className="text-xl font-black text-gray-900 mb-6">Criar conta gratuita</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { label: 'Nome Completo', key: 'name', type: 'text', placeholder: 'Seu nome completo', icon: User },
                  { label: 'E-mail', key: 'email', type: 'email', placeholder: 'seu@email.com', icon: Mail },
                  { label: 'Telefone (opcional)', key: 'phone', type: 'tel', placeholder: '(11) 99999-9999', icon: null },
                ].map(({ label, key, type, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <div className="relative">
                      {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />}
                      <input
                        type={type}
                        value={formData[key as keyof typeof formData]}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={placeholder}
                        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none transition-all ${
                          errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-white'
                        }`}
                      />
                    </div>
                    {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                  </div>
                ))}

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={`w-full pl-10 pr-11 py-3 bg-gray-50 border rounded-2xl text-sm outline-none transition-all ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-yellow-500' : strength === 3 ? 'text-blue-500' : 'text-emerald-500'}`}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      placeholder="Repita a senha"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none transition-all ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-white'
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Já tem conta?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
