import { ObjectId } from "mongodb";

export enum TipoNotificacion {
  INFO = 'INFO',       // Icono azul (i)
  ELIMINAR = 'ELIMINAR', // Icono amarillo (!)
  SUCCESS = 'SUCCESS', // Icono verde (check)
  ERROR = 'ERROR'      // Icono rojo (x) - opcional
}

export enum CategoriaNotificacion {
  FISCAL = 'FISCAL',   // Pestaña "Fiscales"
  SISTEMA = 'SISTEMA', // Pestaña "Sistema"
  GENERAL = 'GENERAL'  // Pestaña "Todas" por defecto
}

// Entidad Base en Base de Datos
export interface Notificacion {
  _id: ObjectId;
  usuario_id: string;      // A quién va dirigida (Contribuyente o Auxiliar)
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  categoria: CategoriaNotificacion;
  leido: boolean;
  fecha: Date;             // Para mostrar "20 Oct. 2026 10:00 AM"
  link_accion?: string;    // Opcional: si al dar click lleva a una vista (ej. "actualizalo")
  creationDateTS: number;
}

// DTO para Creación (Interno del sistema o API)
export interface CreateNotificacionDto {
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  categoria?: CategoriaNotificacion;
  link_accion?: string;
  enviarPush?: boolean; // Flag para activar envío a FCM
  fcmToken?: string;    // Token del dispositivo si se envía push individual
}

// Filtros para la vista "Tus Avisos"
export interface GetNotificacionesFilters {
  usuarioId: string;
  categoria?: CategoriaNotificacion; // Filtro por pestañas (Fiscales, Sistema)
  soloNoLeidas?: boolean;            // Filtro botón "No Leidas"
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
    noLeidasCount: number; // Dato extra útil para el badge "Tienes 3 notificaciones sin leer"
  };
}