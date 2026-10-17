import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';
import { orm, syncSchema } from './Shared/db/orm.js';
import { seedDatabase } from './Shared/db/seeder.js';

import { errorHandler } from './Shared/middlewares/errorHandler.js';

import { userRouter } from './User/User.Route.js';
import employeeShiftRouter from './EmployeeShift/EmployeeShift.Route.js';
import holidayRouter from './Holiday/Holiday.Route.js';

import { VehicleRouter } from './Vehicle/Vehicle.Route.js';
import { vehicleTypeRouter } from './Vehicle/VehicleType/VehicleType.Route.js'; 
import { insuranceRouter } from './Vehicle/Insurance/Insurance.Route.js';
import { brandRouter } from './Vehicle/Brand/Brand.Route.js';
import { modelRouter } from './Vehicle/Model/Model.Route.js';
import { catalogRouter } from './Vehicle/Catalog/Catalog.Route.js';

import parkingRoutes from './Parking/Parking.Route.js';
import parkingspaceRoutes from './ParkingSpace/ParkingSpace.Route.js';
import parkingpriceRoutes from './ParkingPrice/ParkingPrice.Route.js';

import serviceCatalogRouter from './ServiceCatalog/ServiceCatalog.Route.js';
import servicePriceRouter from './ServicePrice/ServicePrice.Route.js';

import reservationRouter, { reservationService } from './Reservation/Reservation.Route.js';
import { EXPIRED_RESERVATIONS_CHECK_MINUTES, REMINDER_CHECK_MINUTES } from './Shared/constants/schedule.js';
import { NOTIFICATIONS_PURGE_HOURS } from './Shared/constants/notifications.js';
import invoiceRouter from './Invoice/Invoice.Route.js';
import statsRouter from './Stats/Stats.Route.js';
import notificationRouter, { notificationService } from './Notification/Notification.Route.js';

const app = express();
// ==========================================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
// Importar el catálogo del DNRPA manda hasta 5.000 modelos: más que los 100 kb por defecto. Va antes del parser global, que después lo saltea.
app.use('/api/catalog', express.json({ limit: '2mb' }));
app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
// ==========================================


// --- Usuarios y Personal ---
app.use('/api/users', userRouter);
app.use('/api/shifts', employeeShiftRouter);
app.use('/api/holidays', holidayRouter);

// --- Vehículos ---
app.use('/api/vehicles', VehicleRouter);
app.use('/api/vehicle-types', vehicleTypeRouter);
app.use('/api/insurances', insuranceRouter);
app.use('/api/brands', brandRouter);
app.use('/api/models', modelRouter);
app.use('/api/catalog', catalogRouter);

// --- Estacionamiento ---
app.use('/api/parkings', parkingRoutes);
app.use('/api/parkings', parkingspaceRoutes);
app.use('/api/parkings', parkingpriceRoutes); 

// --- Servicios ---
app.use('/api/service-catalog', serviceCatalogRouter);
app.use('/api/parkings', servicePriceRouter); 

// --- Reserva ---
app.use('/api/reservations', reservationRouter);
app.use('/api/billing', invoiceRouter);
app.use('/api/stats', statsRouter);
app.use('/api/notifications', notificationRouter);

app.use(errorHandler);


// ==========================================
async function startServer() {
  try {
    await syncSchema();
    // Antes de la siembra, que ve las reservas activas para elegir plazas libres.
    const unconfirmed = await reservationService.clearConfirmed();
    if (unconfirmed) console.log(`Reservas confirmadas pasadas a pendientes: ${unconfirmed}`);
    await seedDatabase(orm.em.fork());

    const coded = await reservationService.fillMissingCodes();
    if (coded) console.log(`Reservas con código asignado: ${coded}`);
    const assigned = await reservationService.fillMissingEmployees();
    if (assigned) console.log(`Reservas con empleado asignado (R-07): ${assigned}`);

    // R-17: al arrancar y cada pocos minutos, cancela las reservas cuyo horario terminó sin ingreso.
    // shortcut: R-17, tarea en memoria del proceso, pasar a un job programado si el backend corre en varias instancias
    const cancelExpired = () => reservationService.cancelExpired()
      .then(n => { if (n) console.log(`Reservas vencidas sin ingreso canceladas: ${n}`); })
      .catch(err => console.error('Error al cancelar reservas vencidas:', err));
    await cancelExpired();
    setInterval(cancelExpired, EXPIRED_RESERVATIONS_CHECK_MINUTES * 60 * 1000);

    // R-28: recordatorio en la app antes del inicio de cada reserva.
    // shortcut: L-27, tarea en memoria del proceso, pasar a un job o una cola si el backend corre en varias instancias
    const sendReminders = () => reservationService.sendReminders()
      .then(n => { if (n) console.log(`Recordatorios de reserva enviados: ${n}`); })
      .catch(err => console.error('Error al enviar recordatorios:', err));
    await sendReminders();
    setInterval(sendReminders, REMINDER_CHECK_MINUTES * 60 * 1000);

    // L-31: los avisos de más de NOTIFICATIONS_RETENTION_DAYS días se borran al arrancar y una vez por día.
    const purgeNotifications = () => notificationService.purgeOld()
      .then(n => { if (n) console.log(`Notificaciones viejas borradas: ${n}`); })
      .catch(err => console.error('Error al borrar notificaciones viejas:', err));
    await purgeNotifications();
    setInterval(purgeNotifications, NOTIFICATIONS_PURGE_HOURS * 3600 * 1000);

    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    // Sale con error: el pool de MikroORM dejaría el proceso vivo y sin atender, y no se notaría que el arranque falló.
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}
// ==========================================

startServer();
