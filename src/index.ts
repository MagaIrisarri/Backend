import express from 'express';


const app = express();

app.use(express.json()); // para parsear el body JSON

import userRoutes from './User/UserRoute.js';
import parkingRoutes from './Parking/ParkingRoute.js';

app.use('/api/users', userRoutes);
app.use('/api/parkings', parkingRoutes);

// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
