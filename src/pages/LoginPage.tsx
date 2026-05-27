import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'E-mail é obrigatório';
    else if (!email.includes('@')) newErrors.email = 'E-mail inválido';
    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo de 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'E-mail ou senha inválidos';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-glow">
              <Zap size={24} className="text-white" fill="white" />
            </div>
            <div className="text-left">
              <div className="font-black text-2xl text-white">JFQ</div>
              <div className="text-xs text-blue-400 font-semibold tracking-widest uppercase">Assistência</div>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white">Bem-vindo de volta!</h1>
          <p className="text-gray-400 mt-1 text-sm">Acesse sua conta para continuar</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-white rounded-3xl p-8 shadow-premium"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="seu@email.com"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Senha</label>
                <button type="button" className="text-xs text-blue-600 hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                  placeholder="Sua senha"
                  className={`w-full pl-11 pr-11 py-3 bg-gray-50 border rounded-2xl text-sm outline-none transition-all ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-4 h-4 rounded-md border-2 border-gray-300 flex items-center justify-center">
                <input type="checkbox" className="hidden" />
              </div>
              <span className="text-sm text-gray-600">Manter conectado</span>
            </label>

            <Button type="submit" fullWidth size="lg" loading={loading} icon={<ArrowRight size={18} />} iconPosition="right">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-500 text-sm">Não tem conta? </span>
            <Link to="/cadastro" className="text-blue-600 font-semibold text-sm hover:underline">
              Criar conta grátis
            </Link>
          </div>

          {/* Social login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-400 mb-4">Ou continue com</p>
            <div className="grid grid-cols-2 gap-3">
              {['Google', 'Facebook'].map((provider) => (
                <button
                  key={provider}
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-600"
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Ao entrar, você concorda com nossos{' '}
          <Link to="/termos" className="text-blue-400 hover:underline">Termos de Uso</Link>
          {' '}e{' '}
          <Link to="/privacidade" className="text-blue-400 hover:underline">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  );
}
