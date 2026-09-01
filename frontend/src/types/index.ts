/* ── Request / Response DTOs matching FastAPI backend ── */

export interface DocumentRequest {
  texto: string;
  formato: "pdf" | "docx";
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
  formato: "pdf" | "docx";
  contenido_ia: string;
  ruta_archivo: string;
  timestamp: string;
}

/* ── Role type ── */

export type UserRole = "user" | "admin";
