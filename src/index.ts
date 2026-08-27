import express from 'express';
import { orm, syncSchema } from './Shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core';
import cors from 'cors';


const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); 

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

import userRoutes from './User/UserRoute.js';
import parkingRoutes from './Parking/Parking.Route.js';
import parkingpriceRoutes from './ParkingPrice/ParkingPrice.Route.js';
import parkingspaceRoutes from './ParkingSpace/ParkingSpace.Route.js';
import VehicleRouter from './Vehicle/VehicleRoute.js'; 
import  reservationRouter  from './Reservation/ReservationRoutes.js';
import vehicleTypeRouter from './VehicleType/vehicleTypeRoute.js';

app.use('/api/users', userRoutes);
app.use('/api/parkings', parkingRoutes);
app.use('/api', parkingpriceRoutes);
app.use('/api/parkings', parkingspaceRoutes);
app.use('/api/vehicles', VehicleRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/vehicle-types', vehicleTypeRouter);

async function startServer() {
  try {
    await syncSchema(); //never in production
  
    app.listen(3000, () => {
      console.log('Servidor corriendo en http://localhost:3000');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

startServer();