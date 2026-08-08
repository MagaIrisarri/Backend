import express from 'express';
import { orm, syncSchema } from './Shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core';

const app = express();

app.use(express.json()); // para parsear el body JSON

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

import userRoutes from './User/UserRoute.js';
import parkingRoutes from './Parking/ParkingRoute.js';

app.use('/api/users', userRoutes);
app.use('/api/parkings', parkingRoutes);

// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);

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