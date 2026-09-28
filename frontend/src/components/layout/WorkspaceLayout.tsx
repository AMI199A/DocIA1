import React from "react";

export const WorkspaceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Espacio de Trabajo</h1>
        <p className="text-sm text-slate-400">Gestiona tus documentos, plantillas y reportes generados</p>
      </div>
      <div className="flex-1 bg-panel border border-line rounded-xl p-6 shadow-sm overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
