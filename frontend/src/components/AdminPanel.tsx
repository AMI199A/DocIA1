import React, { useState } from "react";
import { ShieldCheck, Shield, User as UserIcon, Activity, Trash2, Users, FileText, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/auth-context";
import { toast } from "sonner";
import { UserRole } from "../types";

interface UserData {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface StatsData {
  total_users: number;
  total_reports: number;
  format_breakdown: {
    pdf: number;
    markdown: number;
  };
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsData>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
      await api.patch(`/admin/users/${id}/status`, { is_active });
    },
    onSuccess: () => {
      toast.success("Estado de usuario actualizado");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Error al actualizar estado");
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number, role: UserRole }) => {
      await api.patch(`/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      toast.success("Rol de usuario actualizado");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Error al actualizar rol");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      toast.success("Usuario eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Error al eliminar usuario");
    }
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent2/30 bg-accent2/5 px-5 py-4">
        <div className="flex items-center gap-2 text-accent2 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4" />
          Vista de Administrador — Panel de Control
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Administra las cuentas, roles y métricas globales de la plataforma.
        </p>
      </div>

      <div className="flex gap-2 border-b border-line pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
        >
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
        >
          Métricas y Análisis
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-panel border border-line rounded-xl overflow-hidden">
          {isLoadingUsers ? (
            <div className="p-8 text-center text-slate-400">Cargando usuarios...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-panel2 text-slate-400 border-b border-line text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nombre / Email</th>
                    <th className="px-6 py-3 font-medium">Rol</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-slate-200">
                  {users?.map(user => (
                    <tr key={user.id} className="hover:bg-panel2/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{user.full_name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {user.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-accent2" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="capitalize text-xs font-medium">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${user.is_active ? 'bg-ok/10 text-ok border-ok/20' : 'bg-error/10 text-error border-error/20'}`}>
                          <Activity className="w-3 h-3" />
                          {user.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => changeRoleMutation.mutate({ id: user.id, role: e.target.value as UserRole })}
                          className="px-2 py-1 bg-panel2 border border-line rounded text-xs focus:outline-none focus:border-accent"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button 
                          onClick={() => toggleStatusMutation.mutate({ id: user.id, is_active: !user.is_active })}
                          className={`px-3 py-1.5 border rounded transition-colors text-xs font-medium ${user.is_active ? 'bg-error/10 text-error border-error/20 hover:bg-error hover:text-white' : 'bg-ok/10 text-ok border-ok/20 hover:bg-ok hover:text-white'}`}
                        >
                          {user.is_active ? 'Suspender' : 'Activar'}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("¿Estás seguro de eliminar este usuario de forma permanente?")) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          className="px-2 py-1.5 border border-error/20 text-error rounded hover:bg-error hover:text-white transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay usuarios registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {isLoadingStats || !stats ? (
            <div className="p-8 text-center text-slate-400">Cargando métricas...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-panel border border-line rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total de Usuarios</p>
                    <p className="text-3xl font-bold text-white">{stats.total_users}</p>
                  </div>
                </div>
                <div className="bg-panel border border-line rounded-xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent2/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent2" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Reportes Generados</p>
                    <p className="text-3xl font-bold text-white">{stats.total_reports}</p>
                  </div>
                </div>
              </div>

              <div className="bg-panel border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 text-white font-medium mb-4">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Uso por Formato
                </div>
                {stats.total_reports === 0 ? (
                  <p className="text-sm text-slate-400">No hay reportes para analizar.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">PDF</span>
                        <span className="text-white font-medium">{stats.format_breakdown.pdf}</span>
                      </div>
                      <div className="w-full bg-line rounded-full h-2">
                        <div 
                          className="bg-accent rounded-full h-2" 
                          style={{ width: `${(stats.format_breakdown.pdf / stats.total_reports) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Markdown</span>
                        <span className="text-white font-medium">{stats.format_breakdown.markdown}</span>
                      </div>
                      <div className="w-full bg-line rounded-full h-2">
                        <div 
                          className="bg-accent2 rounded-full h-2" 
                          style={{ width: `${(stats.format_breakdown.markdown / stats.total_reports) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
