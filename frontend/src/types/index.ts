/* ── Request / Response DTOs matching FastAPI backend ── */

export type ReportFormat = "pdf" | "docx" | "pptx" | "xlsx" | "html";

export interface DocumentRequest {
  texto: string;
  formato: ReportFormat;
}

export interface DocumentResponse {
  id: string;
  mensaje: string;
  contenido_ia: string;
  ruta_archivo: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

/* ── Client‑side enriched entry for session history ── */

export interface ReportEntry {
  id: string;
  texto: string;
  formato: ReportFormat;
  contenido_ia: string;
  ruta_archivo: string;
  timestamp: string;
}

/* ── Role type ── */

export type UserRole = "user" | "admin";
