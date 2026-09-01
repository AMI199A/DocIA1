import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useAuth, api } from '../lib/auth-context';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);
      
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token, response.data.user);
      toast.success('Sesión iniciada correctamente');
      setLocation('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-md bg-panel rounded-xl shadow-lg border border-line p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-200">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              {...register('username')}
              type="email" 
              className="w-full bg-base border border-line rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent"
            />
            {errors.username && <span className="text-error text-xs mt-1 block">{errors.username.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input 
              {...register('password')}
              type="password" 
              className="w-full bg-base border border-line rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent"
            />
            {errors.password && <span className="text-error text-xs mt-1 block">{errors.password.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-glow text-white font-medium py-2 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          ¿No tienes cuenta? <a href="/register" className="text-accent2 hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
};
