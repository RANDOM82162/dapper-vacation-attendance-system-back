db = db.getSiblingDB("proyecto-dev");

db.createCollection("employees");
db.createCollection("vacation_requests");
db.createCollection("vacation_balances");
db.createCollection("attendance_records");
db.createCollection("attendance_imports");
db.createCollection("attendance_settings");
db.createCollection("notifications");

db.employees.createIndex({ uid: 1 }, { unique: true, sparse: true });
db.employees.createIndex({ email: 1 }, { unique: true, sparse: true });
db.employees.createIndex({ employeeNumber: 1 }, { unique: true, sparse: true });
db.employees.createIndex({ name: 1 });
db.employees.createIndex({ department: 1, role: 1, status: 1 });
db.employees.createIndex({ managerId: 1 });

db.vacation_requests.createIndex({ employeeId: 1, status: 1 });
db.vacation_requests.createIndex({ managerId: 1, status: 1 });
db.vacation_requests.createIndex({ startDate: 1, endDate: 1 });
db.vacation_requests.createIndex({ folio: 1 }, { unique: true, sparse: true });

db.vacation_balances.createIndex({ employeeId: 1, year: 1 }, { unique: true });

db.attendance_records.createIndex({ employeeId: 1, date: 1 }, { unique: true });
db.attendance_records.createIndex({ weekKey: 1, employeeName: 1 }, { unique: true });
db.attendance_records.createIndex({ weekStartDate: 1, weekEndDate: 1 });
db.attendance_records.createIndex({ importId: 1 });
db.attendance_imports.createIndex({ uploadedAtTS: -1 });
db.attendance_imports.createIndex({ weekKeys: 1 });
db.attendance_imports.createIndex({ "weeks.weekStartDate": 1 });
db.attendance_imports.createIndex({ "weeks.weekEndDate": 1 });

db.notifications.createIndex({ usuario_id: 1, leido: 1, creationDateTS: -1 });
db.notifications.createIndex({ usuario_id: 1, categoria: 1, creationDateTS: -1 });
db.notifications.createIndex({ creationDateTS: -1 });

db.attendance_settings.updateOne(
  { key: "default" },
  {
    $setOnInsert: {
      key: "default",
      workdayStartTime: "09:00",
      lateToleranceMinutes: 5,
      lateRecordsForSaturday: 3,
      creationDateTS: new Date().getTime(),
    },
  },
  { upsert: true }
);
