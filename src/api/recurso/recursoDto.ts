import { ObjectId } from "mongodb";

export enum EstadoRecurso {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
  PROCESANDO = "PROCESANDO",
}

export interface SubDocumento {
  campo_interno: string;
  valor: number;
}

export interface RecursoBase {
  _id: ObjectId;
  id_padre: string;
  folio: string;
  estado: EstadoRecurso;
  detalles: SubDocumento[];
  monto_total: number;
  es_restringido: boolean;
  creationDateTS: number;
}

export interface CreateRecursoDto {
  id_padre: string;
  folio?: string;
  estado: EstadoRecurso;
  detalles: SubDocumento[];
  monto_total: number;
  es_restringido: boolean;
  parametro_temporal_frontend?: string;
}

export interface UpdateRecursoDto extends Partial<
  Omit<RecursoBase, "_id" | "creationDateTS" | "id_padre">
> {}

export interface GetAllRecursosFilters {
  search?: string;
  id_padre?: string;
  estado?: EstadoRecurso;
  fechaInicio?: number;
  fechaFin?: number;
  page?: number;
  limit?: number;
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

export interface RecursoSimpleDto {
  _id: ObjectId;
  folio: string;
  monto_total: number;
}
