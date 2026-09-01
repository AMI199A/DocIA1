import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { fetchWithTimeout } from "@/services/api";

interface StatsData {
  totals: {
    reportes: number;
    rag: number;
    plantillas: number;
  };
  activity: {
    name: string;
    reportes: number;
    consultas: number;
  }[];
}

export const Dashboard: React.FC = React.memo(() => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchWithTimeout("/api/v1/workspace/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Error loading stats", e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-white text-sm">Cargando estadísticas...</div>;
  }

  const data = stats?.activity || [];
  const totals = stats?.totals || { reportes: 0, rag: 0, plantillas: 0 };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-panel2 border border-line p-5 rounded-lg">
          <p className="text-slate-400 text-sm">Reportes Generados</p>
          <p className="text-3xl font-bold text-white mt-2">{totals.reportes}</p>
        </div>
        <div className="bg-panel2 border border-line p-5 rounded-lg">
          <p className="text-slate-400 text-sm">Documentos RAG</p>
          <p className="text-3xl font-bold text-white mt-2">{totals.rag}</p>
        </div>
        <div className="bg-panel2 border border-line p-5 rounded-lg">
          <p className="text-slate-400 text-sm">Plantillas Activas</p>
          <p className="text-3xl font-bold text-white mt-2">{totals.plantillas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-panel2 border border-line p-5 rounded-lg h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Semanal</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} 
                  itemStyle={{ color: '#f1f5f9' }} 
                />
                <Legend />
                <Bar dataKey="reportes" name="Reportes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consultas" name="Documentos RAG" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-panel2 border border-line p-5 rounded-lg h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Uso</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} 
                />
                <Legend />
                <Line type="monotone" dataKey="reportes" name="Reportes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="consultas" name="Documentos RAG" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});
