import express from 'express';
import cors from 'cors'
import { RequestContext } from '@mikro-orm/core';
import { orm, syncSchema } from './Shared/db/orm.js';
import { seedDatabase } from './Shared/db/seeder.js'; 


import { VehicleRouter } from './Vehicle/Vehicle.Route.js';
import { vehicleTypeRouter } from './Vehicle/VehicleType/VehicleType.Route.js'; 
import { insuranceRouter } from './Vehicle/Insurance/Insurance.Route.js';
import { brandRouter } from './Vehicle/Brand/Brand.Route.js';
import { modelRouter } from './Vehicle/Model/Model.Route.js';

import { userRouter } from './User/User.Route.js';
import parkingRoutes from './Parking/Parking.Route.js';
import parkingpriceRoutes from './ParkingPrice/ParkingPrice.Route.js';
import parkingspaceRoutes from './ParkingSpace/ParkingSpace.Route.js';
import reservationRouter from './Reservation/Reservation.Route.js';
import serviceCatalogRouter from './ServiceCatalog/ServiceCatalog.Route.js';
import servicePriceRouter from './ServicePrice/ServicePrice.Route.js';
import employeeShiftRouter from './EmployeeShift/EmployeeShift.Route.js';
import invoiceRouter from './Invoice/Invoice.Route.js';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); 

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});



app.use('/api/users', userRouter);
app.use('/api/vehicles', VehicleRouter);
app.use('/api/vehicle-types', vehicleTypeRouter);
app.use('/api/insurances', insuranceRouter);
app.use('/api/brands', brandRouter);
app.use('/api/models', modelRouter);
app.use('/api/parkings', parkingRoutes);
app.use('/api', parkingpriceRoutes);
app.use('/api/parkings', parkingspaceRoutes);
app.use('/api/reservations', reservationRouter);
app.use ('/api/shifts', employeeShiftRouter);
app.use ('/api/billing', invoiceRouter);
app.use ('/api/service-catalog',serviceCatalogRouter);
app.use ('/api/service-price',servicePriceRouter);



async function startServer() {
  try {
    await syncSchema(); 
    await seedDatabase(orm.em.fork());

    app.listen(3000, () => {
      console.log('Servidor corriendo en http://localhost:3000');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}


startServer();
