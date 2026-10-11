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

import parkingRoutes from './Parking/Parking.Route.js';
import parkingspaceRoutes from './ParkingSpace/ParkingSpace.Route.js';
import parkingpriceRoutes from './ParkingPrice/ParkingPrice.Route.js';

import serviceCatalogRouter from './ServiceCatalog/ServiceCatalog.Route.js';
import servicePriceRouter from './ServicePrice/ServicePrice.Route.js';

import reservationRouter, { reservationService } from './Reservation/Reservation.Route.js';
import { EXPIRED_RESERVATIONS_CHECK_MINUTES, REMINDER_CHECK_MINUTES } from './Shared/constants/schedule.js';
import { ParkingSpaceRepository } from './ParkingSpace/ParkingSpace.Repository.js';
import invoiceRouter from './Invoice/Invoice.Route.js';
import statsRouter from './Stats/Stats.Route.js';

const app = express();
// ==========================================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
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

app.use(errorHandler);


// ==========================================
async function startServer() {
  try {
    await syncSchema(); 
    await seedDatabase(orm.em.fork());

    // Unifica el tipo de las plazas viejas ('MOTOCICLETA' → 'MOTO', 'Camioneta' → 'CAMIONETA'); las nuevas ya se guardan así.
    const normalized = await new ParkingSpaceRepository(orm.em).normalizeVehicleTypes();
    if (normalized) console.log(`Plazas con el tipo unificado: ${normalized}`);
    const coded = await reservationService.fillMissingCodes();
    if (coded) console.log(`Reservas con código asignado: ${coded}`);

    // R-17: al arrancar y cada pocos minutos, cancela las reservas cuyo horario terminó sin ingreso.
    // shortcut: R-17, tarea en memoria del proceso, pasar a un job programado si el backend corre en varias instancias
    const cancelExpired = () => reservationService.cancelExpired()
      .then(n => { if (n) console.log(`Reservas vencidas sin ingreso canceladas: ${n}`); })
      .catch(err => console.error('Error al cancelar reservas vencidas:', err));
    await cancelExpired();
    setInterval(cancelExpired, EXPIRED_RESERVATIONS_CHECK_MINUTES * 60 * 1000);

    // R-28: recordatorio por email antes del inicio de cada reserva.
    // shortcut: L-27, tarea en memoria del proceso, pasar a un job o una cola si el backend corre en varias instancias
    const sendReminders = () => reservationService.sendReminders()
      .then(n => { if (n) console.log(`Recordatorios de reserva enviados: ${n}`); })
      .catch(err => console.error('Error al enviar recordatorios:', err));
    await sendReminders();
    setInterval(sendReminders, REMINDER_CHECK_MINUTES * 60 * 1000);

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
