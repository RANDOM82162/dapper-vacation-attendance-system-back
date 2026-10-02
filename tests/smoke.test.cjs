const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

// La prueba usa un URI sintácticamente válido; nunca abre una conexión.
process.env.CONNECTION_STRING = 'mongodb://127.0.0.1:27017/vacaciones_test';
process.env.DB_NAME = 'vacaciones_test';

const { countVacationChargeableDays } = require('../dist/shared/utils/vacationDays');
const attendanceModel = require('../dist/api/attendance_records/attendanceRecordsModel');
const { importAttendanceRecords } = require('../dist/api/attendance_records/attendanceRecordsService');
const { AuthMiddleware } = require('../dist/middleware/auth.middleware');
const { ROLES } = require('../dist/middleware/auth.enum');
const { BaseError } = require('../dist/shared/classes/base-error');
const { buildErrorMessage } = require('../dist/shared/classes/error-handler');

test('vacaciones: descuenta fines de semana y feriados adicionales', () => {
  assert.equal(countVacationChargeableDays('2026-09-28', '2026-10-04'), 5);
  assert.equal(countVacationChargeableDays('2026-09-28', '2026-10-04', ['2026-09-30']), 4);
});

test('asistencia: importar una semana existente no duplica registros', async () => {
  const count = mock.method(attendanceModel, 'countAttendanceRecordsByWeek', async () => 1);
  const insert = mock.method(attendanceModel, 'insertAttendanceRecordsMongo', async () => {
    throw new Error('No debe insertar registros duplicados');
  });
  const imports = [];
  const saveImport = mock.method(attendanceModel, 'createAttendanceImportMongo', async (value) => {
    imports.push(value);
  });

  try {
    const result = await importAttendanceRecords({
      sourceFileName: 'asistencia.xlsx',
      weeks: [{
        weekLabel: 'Semana 40',
        weekStartDate: '2026-09-28',
        weekEndDate: '2026-10-04',
        rows: [{ employeeName: 'Empleado', department: 'Desarrollo' }],
      }],
    }, { uid: 'admin-test' });

    assert.deepEqual(result.insertedWeeks, []);
    assert.deepEqual(result.skippedWeeks, ['2026-09-28_2026-10-04']);
    assert.equal(result.insertedRecords, 0);
    assert.equal(result.skippedRecords, 1);
    assert.equal(count.mock.callCount(), 1);
    assert.equal(insert.mock.callCount(), 0);
    assert.equal(saveImport.mock.callCount(), 1);
    assert.equal(imports[0].weeks[0].status, 'OMITIDA');
  } finally {
    count.mock.restore();
    insert.mock.restore();
    saveImport.mock.restore();
  }
});

test('asistencia: Dirección puede actualizar configuración y otros empleados no', () => {
  const middleware = AuthMiddleware.requireRoleOrDepartment([ROLES.JEFE_DIRECTOR, ROLES.ADMIN], 'Direccion');
  const invoke = (user) => {
    let statusCode;
    let nextCalled = false;
    middleware(
      { user },
      { status(code) { statusCode = code; return this; }, json() { return this; } },
      () => { nextCalled = true; },
    );
    return { statusCode, nextCalled };
  };

  assert.deepEqual(invoke({ role: ROLES.EMPLEADO, department: 'Dirección' }), { statusCode: undefined, nextCalled: true });
  assert.deepEqual(invoke({ role: ROLES.EMPLEADO, department: 'Desarrollo' }), { statusCode: 403, nextCalled: false });
  assert.deepEqual(invoke({ role: ROLES.JEFE_DIRECTOR, department: 'Desarrollo' }), { statusCode: undefined, nextCalled: true });
});

test('seguridad: las respuestas de error omiten causas internas y conservan mensajes de validación', () => {
  const secret = 'MongoServerError mongodb://user:secret@internal-db';
  const unexpected = buildErrorMessage(new Error(secret));
  const wrapped = buildErrorMessage(new BaseError('Database failure', new Error(secret), 'writeVacationRequest'));
  const validation = buildErrorMessage(new BaseError('Invalid period', 'Las fechas no son válidas', 'validatePeriod', 400));

  assert.equal(unexpected.status, 500);
  assert.equal(wrapped.status, 500);
  assert.equal(JSON.stringify(unexpected).includes(secret), false);
  assert.equal(JSON.stringify(wrapped).includes(secret), false);
  assert.equal('errorDetails' in unexpected, false);
  assert.equal('methodName' in unexpected, false);
  assert.equal(validation.status, 400);
  assert.equal(validation.message, 'Las fechas no son válidas');
  assert.equal('methodName' in validation, false);
});
