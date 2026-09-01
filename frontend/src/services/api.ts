import type { DocumentRequest, DocumentResponse, HealthResponse } from "@/types";

/**
 * Helper interno sin señal de aborto para evitar que el navegador o componentes
 * cancelen la petición mientras Ollama procesa el modelo.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  options.headers = headers;
  
  const res = await fetch(url, options);
  
  if (res.status === 401) {
    // Si no está autorizado, borrar datos de sesión y redirigir
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
    window.location.href = "/login";
  }
  
  return res;
}

/* ────────────────────────────────────────────────────────
   Health
   ──────────────────────────────────────────────────────── */

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetchWithTimeout("/health", { method: "GET" });

  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }

  return res.json() as Promise<HealthResponse>;
}

/* ────────────────────────────────────────────────────────
   Generate Report
   ──────────────────────────────────────────────────────── */

export async function generateReport(
  req: DocumentRequest
): Promise<DocumentResponse> {
  const res = await fetchWithTimeout("/api/v1/reportes/generar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    let detail = `Error del servidor (código ${res.status}).`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(detail);
  }

  return res.json() as Promise<DocumentResponse>;
}

/* ────────────────────────────────────────────────────────
   Download URL builder
   ──────────────────────────────────────────────────────── */

export function getDownloadUrl(rutaArchivo: string): string {
  const normalized = rutaArchivo.replace(/\\/g, "/").replace(/^\.\//, "");

  if (normalized.startsWith("archivos_generados/")) {
    return `/${normalized}`;
  }

  const filename = normalized.split("/").pop() ?? normalized;
  return `/archivos_generados/${filename}`;
}