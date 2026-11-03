import React from "react";
import { Link } from "wouter";
import { FileText, Clock, LayoutDashboard, FolderOpen, PenTool, LayoutTemplate } from "lucide-react";
import { StatusIndicator } from "../StatusIndicator";
import { HistoryList } from "../HistoryList";
import { ReportEntry } from "@/types";

interface SidebarProps {
  isApiOnline: boolean;
  isOllamaOnline: boolean;
  history: ReportEntry[];
  onSelectHistoryItem: (entry: ReportEntry) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isApiOnline,
  isOllamaOnline,
  history,
  onSelectHistoryItem,
}) => {
  return (
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-line bg-panel min-h-screen">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-line flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold tracking-tight text-white leading-none text-base">
            DOC<span className="text-accent">IA</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-none mt-1">
            Reportes con IA
          </p>
        </div>
      </div>

      {/* Services status */}
      <div className="px-6 py-4 border-b border-line space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 mb-1">
          Estado de servicios
        </p>
        <StatusIndicator label="Sistema" isOnline={isApiOnline && isOllamaOnline} />
      </div>

      {/* Workspace Navigation */}
      <div className="px-6 py-4 border-b border-line">
        <p className="text-xs font-semibold text-slate-500 mb-3">
          Espacio de Trabajo
        </p>
        <nav className="space-y-1">
          <Link href="/workspace">
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <LayoutDashboard className="w-4 h-4 text-accent" />
              Dashboard
            </a>
          </Link>
          <Link href="/workspace/documents">
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <FolderOpen className="w-4 h-4 text-accent" />
              Gestor RAG
            </a>
          </Link>
          <Link href="/workspace/editor">
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <PenTool className="w-4 h-4 text-accent" />
              Editor WYSIWYG
            </a>
          </Link>
          <Link href="/workspace/templates">
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <LayoutTemplate className="w-4 h-4 text-accent" />
              Plantillas
            </a>
          </Link>
        </nav>
      </div>

      {/* History section */}
      <div className="px-6 py-4 flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            Reportes recientes
          </p>
          <span className="text-[11px] font-mono text-slate-500 bg-panel2 px-2 py-0.5 rounded border border-line">
            {history.length}
          </span>
        </div>
        <HistoryList history={history} onSelectItem={onSelectHistoryItem} />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-line">
        <p className="text-[11px] text-slate-500 font-mono">
          Análisis de Sistemas II · UMG
        </p>
      </div>
    </aside>
  );
};
