import React from "react";
import { Link } from "wouter";
import { StatusIndicator } from "../StatusIndicator";
import { UserRole } from "@/types";
import { FileText, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isApiOnline: boolean;
  isOllamaOnline: boolean;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isApiOnline,
  isOllamaOnline,
  currentRole,
  onRoleChange,
}) => {
  return (
    <header className="border-b border-line bg-panel/60 backdrop-blur px-5 lg:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Mobile Logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold tracking-tight text-white leading-none">
            DOC<span className="text-accent">IA</span>
          </p>
          <p className="text-[10px] text-slate-500 leading-none mt-1">
            Reportes IA
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="hidden sm:block">
        <h1 className="text-sm font-semibold text-white">
          Panel de Generación de Reportes
        </h1>
        <p className="text-xs text-slate-500">
          FastAPI · Ollama 3 · Generador de Archivos SPA
        </p>
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center gap-2 bg-panel2 border border-line rounded-lg p-1.5 ml-auto sm:ml-0">
        <div className="hidden sm:flex items-center gap-1 mr-2 border-r border-line pr-3">
          <Link href="/">
            <a className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-line transition-all duration-200">
              Inicio
            </a>
          </Link>
          {currentRole === 'admin' && (
            <Link href="/admin">
              <a className="px-3 py-1.5 rounded-md text-xs font-medium text-accent hover:text-white hover:bg-accent transition-all duration-200">
                Panel Admin
              </a>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 px-2">
          {currentRole === 'admin' ? <Shield className="w-4 h-4 text-accent" /> : <User className="w-4 h-4 text-slate-400" />}
          <span className="text-xs font-medium text-slate-200 capitalize">{currentRole}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            // Remove token and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
        >
          Salir
        </button>
      </div>
    </header>
  );
};
