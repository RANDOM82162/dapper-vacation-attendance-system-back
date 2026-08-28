import { ObjectId } from "mongodb";

// Entidad Base en Base de Datos
export interface LogActividad {
  _id: ObjectId;
  fecha: Date;
  descripcion: string;
  id_despacho?: string;
  nombre_despacho?: string;
  id_contribuyente?: string;
  nombre_contribuyente?: string;
  usuario_id: string;
  nombre_usuario?: string;
  rol_usuario: string;
  tipo_accion?: string;
  entidad_afectada?: string;
  creationDateTS: number;
  usuario_detalle?: any;
  despacho_detalle?: any;
  contribuyente_detalle?: any;
}

// DTO para Creación (Interno)
export interface CreateLogDto {
  descripcion: string;
  id_despacho?: string;
  nombre_despacho?: string;
  id_contribuyente?: string;
  nombre_contribuyente?: string;
  usuario_id: string;
  nombre_usuario?: string;
  rol_usuario: string;
  tipo_accion?: string;
  entidad_afectada?: string;
}

// Filtros para Consultas
export interface GetLogsFilters {
  usuarioId?: string;
  idDespacho?: string;
  idContribuyente?: string;
  rol?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
  search?: string;
  month?: number;
  year?: number;
}

export interface PaginacionRespuesta<T> {
  data: T[];
  meta: {
    totalItems: number | void;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}