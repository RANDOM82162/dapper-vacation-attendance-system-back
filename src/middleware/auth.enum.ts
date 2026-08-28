
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid?: string;
                email?: string;
                role: string;
                permissions: {}; 
            }
        }
    }
}

export const ROLES = {
    ADMIN: 'Administrador',
    DESPACHO: 'DESPACHO',
    CONTRIBUYENTE: 'CONTRIBUYENTE',
    AUXILIAR: 'AUXILIAR'
};

// Definimos los permisos específicos
export const PERMISSIONS = {
    //ADMIN
    ADMIN_READ: 'admin.read',
    ADMIN_CREATE: 'admin.create',
    ADMIN_UPDATE: 'admin.update',
    ADMIN_DELETE: 'admin.delete',

    //Despacho
    DESPACHO_READ: 'despacho.read',
    DESPACHO_CREATE: 'despacho.create',
    DESPACHO_UPDATE: 'despacho.update',
    DESPACHO_DELETE: 'despacho.delete',
    DESPACHO_FINANCE: 'despacho.finance',

    //Contribuyente
    CONTRIBUYENTE_READ: 'contribuyente.read',
    CONTRIBUYENTE_CREATE: 'contribuyente.create',
    CONTRIBUYENTE_UPDATE: 'contribuyente.update',
    CONTRIBUYENTE_DELETE: 'contribuyente.delete',
    CONTRIBUYENTE_FINANCE: 'contribuyente.finance',

    //Auxiliar
    AUXILIAR_READ: 'auxiliar.read',
    AUXILIAR_CREATE: 'auxiliar.create',
    AUXILIAR_UPDATE: 'auxiliar.update',
    AUXILIAR_DELETE: 'auxiliar.delete',

    //Clientes
    CLIENTE_READ: 'cliente.read',
    CLIENTE_CREATE: 'cliente.create',
    CLIENTE_UPDATE: 'cliente.update',
    CLIENTE_DELETE: 'cliente.delete',

    //Catalogos
    CATALOGO_READ: 'catalogo.read',
    CATALOGO_CREATE: 'catalogo.create',
    CATALOGO_UPDATE: 'catalogo.update',
    CATALOGO_DELETE: 'catalogo.delete',

    //Facturas
    FACTURA_READ: 'factura.read',
    FACTURA_CREATE: 'factura.create',
    FACTURA_UPDATE: 'factura.update',
    FACTURA_DELETE: 'factura.delete',

    //Productos
    PRODUCTO_READ: 'producto.read',
    PRODUCTO_CREATE: 'producto.create',
    PRODUCTO_UPDATE: 'producto.update',
    PRODUCTO_DELETE: 'producto.delete',

    //Tarea
    TAREA_READ: 'tarea.read',
    TAREA_CREATE: 'tarea.create',
    TAREA_UPDATE: 'tarea.update',
    TAREA_DELETE: 'tarea.delete',

    //Cotizacion
    COTIZACION_READ: 'cotizacion.read',
    COTIZACION_CREATE: 'cotizacion.create',
    COTIZACION_UPDATE: 'cotizacion.update',
    COTIZACION_DELETE: 'cotizacion.delete',

    //Notificaciones
    NOTIFICACION_CREATE: 'notificacion.create',

    //Proveedores
    PROVEEDOR_READ: 'proveedor.read',
    PROVEEDOR_CREATE: 'proveedor.create',
    
    PROVEEDOR_UPDATE: 'proveedor.update',
    PROVEEDOR_DELETE: 'proveedor.delete',

    //Logs
    LOG_READ: 'log.read',

    //Movimientos
    MOVIMIENTOS_READ: 'movimientos.read',
    MOVIMIENTOS_CREATE: 'movimientos.create',
    MOVIMIENTOS_UPDATE: 'movimientos.update',
    MOVIMIENTOS_DELETE: 'movimientos.delete',

    //ingreso
    INGRESOS_READ: 'ingreso.read',
    INGRESOS_CREATE: 'ingreso.create',
    INGRESOS_UPDATE: 'ingreso.update',
    INGRESOS_DELETE: 'ingreso.delete',

    EGRESOS_READ: 'egreso.read',
    EGRESOS_CREATE: 'egreso.create',
    EGRESOS_UPDATE: 'egreso.update',
    EGRESOS_DELETE: 'egreso.delete',

    //Presupuesto
    PRESUPUESTO_READ: 'presupuesto.read',
    PRESUPUESTO_CREATE: 'presupuesto.create',
    PRESUPUESTO_UPDATE: 'presupuesto.update',
    PRESUPUESTO_DELETE: 'presupuesto.delete',

};

export const ANALYTICS_PERMISSIONS: Record<string, string[]> = {
    'Administrador': ['*'],
    'DESPACHO': ['*'],
    'CONTRIBUYENTE': ['*'],
    'AUXILIAR': ['*']
};