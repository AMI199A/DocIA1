import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Switch, Route } from "wouter";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { ReportForm } from "@/components/ReportForm";
import { ReportViewer } from "@/components/ReportViewer";
import { ProcessingStrip } from "@/components/ProcessingStrip";
import { ErrorBanner } from "@/components/ErrorBanner";
import { HistoryList } from "@/components/HistoryList";
import { AdminPanel } from "@/components/AdminPanel";
import { useHealthCheck } from "@/hooks/use-health";
import { ReportEntry, DocumentResponse, DocumentRequest } from "@/types";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";

const WorkspaceDashboard = React.lazy(() => import("@/pages/workspace/Dashboard").then(m => ({ default: m.Dashboard })));
const DocumentManager = React.lazy(() => import("@/pages/workspace/DocumentManager").then(m => ({ default: m.DocumentManager })));
const Editor = React.lazy(() => import("@/pages/workspace/Editor").then(m => ({ default: m.Editor })));
const Templates = React.lazy(() => import("@/pages/workspace/Templates").then(m => ({ default: m.Templates })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<ReportEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ReportEntry | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isOnline: isApiOnline } = useHealthCheck();
  const isOllamaOnline = Boolean(isApiOnline && !simulateFailure);
  const { user } = useAuth();
  
  const currentRole = user?.role || "user";

  const handleReportSuccess = (
    data: DocumentResponse,
    request: DocumentRequest
  ) => {
    setErrorMessage(null);
    const newEntry: ReportEntry = {
      id: data?.id || Date.now().toString(),
      texto: request?.texto || "",
      formato: request?.formato || "pdf",
      contenido_ia: data?.contenido_ia || "Resumen no disponible.",
      ruta_archivo: data?.ruta_archivo || "",
      timestamp: new Date().toLocaleTimeString("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setHistory((prev) => [newEntry, ...prev]);
    setSelectedEntry(newEntry);
  };

  const handleReportError = (errorMsg: string) => {
    setErrorMessage(errorMsg || "Ocurrió un error inesperado al generar el reporte.");
  };

  return (
    <div className="flex min-h-screen bg-base text-slate-200 font-sans antialiased">
      <Sidebar
        isApiOnline={Boolean(isApiOnline)}
        isOllamaOnline={isOllamaOnline}
        history={history}
        onSelectHistoryItem={(entry) => setSelectedEntry(entry)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isApiOnline={Boolean(isApiOnline)}
          isOllamaOnline={isOllamaOnline}
          currentRole={currentRole as any}
          onRoleChange={() => {}}
        />
        <main className="flex-1 px-5 lg:px-8 py-6 max-w-5xl w-full mx-auto space-y-6">
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
          <Switch>
            <Route path="/admin">
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            </Route>
            <Route path="/workspace/documents">
              <ProtectedRoute>
                <WorkspaceLayout>
                  <React.Suspense fallback={<div className="p-4 text-slate-300">Cargando módulo...</div>}>
                    <DocumentManager />
                  </React.Suspense>
                </WorkspaceLayout>
              </ProtectedRoute>
            </Route>
            <Route path="/workspace/editor">
              <ProtectedRoute>
                <WorkspaceLayout>
                  <React.Suspense fallback={<div className="p-4 text-slate-300">Cargando módulo...</div>}>
                    <Editor />
                  </React.Suspense>
                </WorkspaceLayout>
              </ProtectedRoute>
            </Route>
            <Route path="/workspace/templates">
              <ProtectedRoute>
                <WorkspaceLayout>
                  <React.Suspense fallback={<div className="p-4 text-slate-300">Cargando módulo...</div>}>
                    <Templates />
                  </React.Suspense>
                </WorkspaceLayout>
              </ProtectedRoute>
            </Route>
            <Route path="/workspace">
              <ProtectedRoute>
                <WorkspaceLayout>
                  <React.Suspense fallback={<div className="p-4 text-slate-300">Cargando módulo...</div>}>
                    <WorkspaceDashboard />
                  </React.Suspense>
                </WorkspaceLayout>
              </ProtectedRoute>
            </Route>
            <Route path="/">
              <ProtectedRoute>
                <div className="space-y-6">
                  <ReportForm
                    onSuccess={handleReportSuccess}
                    onError={handleReportError}
                    simulateFailure={simulateFailure}
                    onToggleSimulateFailure={setSimulateFailure}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                  <ProcessingStrip isProcessing={isProcessing} />
                  <ReportViewer entry={selectedEntry} />
                  <section className="lg:hidden bg-panel border border-line rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 mb-3">
                      Reportes recientes ({history.length})
                    </p>
                    <HistoryList
                      history={history}
                      onSelectItem={(entry) => setSelectedEntry(entry)}
                    />
                  </section>
                </div>
              </ProtectedRoute>
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/*">
            <Dashboard />
          </Route>
        </Switch>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#0F172A",
              border: "1px solid #334155",
              color: "#E2E8F0",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
