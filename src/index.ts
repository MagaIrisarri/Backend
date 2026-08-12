import express from 'express';
import cors from 'cors';


const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); 

import userRoutes from './User/UserRoute.js';
import VehicleRouter from './Vehicle/VehicleRoute.js'; 
import  reservationRouter  from './Reservation/ReservationRoutes.js';

app.use('/api/users', userRoutes);
app.use('/api/vehicles', VehicleRouter);
app.use('/api/reservations', reservationRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
