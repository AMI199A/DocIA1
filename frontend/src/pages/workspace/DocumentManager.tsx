import React, { useState, useEffect } from "react";
import { Upload, File as FileIcon, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/services/api";

interface Document {
  id: string;
  filename: string;
  created_at: string;
}

export const DocumentManager: React.FC = React.memo(() => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = React.useCallback(async () => {
    try {
      const res = await fetchWithTimeout("/api/v1/documents/");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetchWithTimeout("/api/v1/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          toast.success(`Archivo ${file.name} subido exitosamente.`);
          loadDocuments();
        } else {
          toast.error("Error al subir el archivo.");
        }
      } catch (e) {
        toast.error("Error de conexión.");
      }
    }
  }, [loadDocuments]);

  const handleDelete = React.useCallback(async (id: string) => {
    try {
      const res = await fetchWithTimeout(`/api/v1/documents/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Documento eliminado.");
        loadDocuments();
      } else {
        toast.error("Error al eliminar documento.");
      }
    } catch (e) {
      toast.error("Error de conexión.");
    }
  }, [loadDocuments]);

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gestor de Documentos (RAG)</h2>
          <p className="text-sm text-slate-400">Sube documentos para que la IA los use como contexto.</p>
        </div>
        <div>
          <label className="cursor-pointer bg-accent hover:bg-accent2 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Subir Documento
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
          </label>
        </div>
      </div>

      <div className="bg-panel2 border border-line rounded-lg p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar documentos..." 
          className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-panel2 border border-line rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-panel border-b border-line">
            <tr>
              <th className="px-6 py-4">Nombre del Archivo</th>
              <th className="px-6 py-4">Fecha de Subida</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-line/50 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <FileIcon className="w-4 h-4 text-accent" />
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors p-1"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No se encontraron documentos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
