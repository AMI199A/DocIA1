import React, { useState, useEffect } from "react";
import { LayoutTemplate, Plus, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/services/api";

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  color: string;
  created_at: string;
}

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", content: "", color: "bg-blue-500" });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetchWithTimeout("/api/v1/templates/");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      toast.error("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name) {
      toast.error("El nombre es requerido");
      return;
    }
    
    try {
      const res = await fetchWithTimeout("/api/v1/templates/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (res.ok) {
        toast.success("Plantilla creada exitosamente");
        setShowModal(false);
        setNewTemplate({ name: "", description: "", content: "", color: "bg-blue-500" });
        loadTemplates();
      } else {
        toast.error("Error al crear la plantilla");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta plantilla?")) return;
    try {
      const res = await fetchWithTimeout(`/api/v1/templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Plantilla eliminada");
        loadTemplates();
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const handleUseTemplate = (t: Template) => {
    // Para simplificar, copiaremos el contenido al portapapeles y avisaremos al usuario,
    // o se podría redirigir a un formulario guardando el contexto globalmente.
    navigator.clipboard.writeText(t.content);
    toast.success(`Plantilla "${t.name}" copiada al portapapeles.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Plantillas de Reportes</h2>
          <p className="text-sm text-slate-400">Gestiona los formatos predefinidos para la generación de documentos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent2 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Cargando plantillas...</p>
        ) : templates.length === 0 ? (
          <p className="text-slate-500">No hay plantillas creadas.</p>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-panel2 border border-line rounded-xl overflow-hidden hover:border-slate-500 transition-colors group flex flex-col">
              <div className={`h-2 ${template.color} w-full`}></div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-panel flex items-center justify-center border border-line">
                    <LayoutTemplate className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button onClick={() => handleDelete(template.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-sm text-slate-400 mb-4 flex-1">{template.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-xs text-slate-500">
                    Modificado: {new Date(template.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleUseTemplate(template)}
                    className="text-xs font-medium text-accent hover:text-accent2 transition-colors"
                  >
                    Usar Plantilla
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-panel border border-line rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Nueva Plantilla</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="w-full bg-panel2 border border-line rounded p-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                <input 
                  type="text" 
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  className="w-full bg-panel2 border border-line rounded p-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Color (clase Tailwind)</label>
                <select 
                  value={newTemplate.color}
                  onChange={(e) => setNewTemplate({...newTemplate, color: e.target.value})}
                  className="w-full bg-panel2 border border-line rounded p-2 text-white text-sm"
                >
                  <option value="bg-blue-500">Azul</option>
                  <option value="bg-green-500">Verde</option>
                  <option value="bg-purple-500">Morado</option>
                  <option value="bg-orange-500">Naranja</option>
                  <option value="bg-red-500">Rojo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contenido (Texto / Prompt)</label>
                <textarea 
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  className="w-full bg-panel2 border border-line rounded p-2 text-white text-sm h-32 resize-none"
                  placeholder="Ej: Escribe un resumen estructurado en 3 viñetas..."
                ></textarea>
              </div>
              <button 
                onClick={handleCreate}
                className="w-full bg-accent hover:bg-accent2 text-white font-medium py-2 rounded transition-colors"
              >
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
