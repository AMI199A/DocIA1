import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { api } from '../lib/auth-context';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  full_name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['user', 'admin']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user'
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Cuenta creada. Ahora puedes iniciar sesión.');
      setLocation('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-md bg-panel rounded-xl shadow-lg border border-line p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-200">Crear Cuenta</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre Completo</label>
            <input 
              {...register('full_name')}
              type="text" 
              className="w-full bg-base border border-line rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent"
            />
            {errors.full_name && <span className="text-error text-xs mt-1 block">{errors.full_name.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              {...register('email')}
              type="email" 
              className="w-full bg-base border border-line rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent"
            />
            {errors.email && <span className="text-error text-xs mt-1 block">{errors.email.message}</span>}
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rol de la cuenta</label>
            <select 
              {...register('role')}
              className="w-full bg-base border border-line rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-accent"
            >
              <option value="user">Usuario (User)</option>
              <option value="admin">Administrador (Admin)</option>
            </select>
            {errors.role && <span className="text-error text-xs mt-1 block">{errors.role.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-glow text-white font-medium py-2 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta? <a href="/login" className="text-accent2 hover:underline">Inicia Sesión</a>
        </p>
      </div>
    </div>
  );
};
