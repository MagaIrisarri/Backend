import express from 'express';
import { orm, syncSchema } from './Shared/db/orm.js';
import { seedDatabase } from './Shared/db/seeder.js'; 

import {VehicleRouter} from './Vehicle/Vehicle.Route.js';
import { vehicleTypeRouter } from './Vehicle/VehicleType/VehicleType.Route.js'; 
import { insuranceRouter } from './Vehicle/Insurance/Insurance.Route.js';
import { brandRouter } from './Vehicle/Brand/Brand.Route.js';
import { modelRouter } from './Vehicle/Model/Model.Route.js';

// ... tu código de express ...


const app = express();
app.use(express.json()); // para parsear el body JSON

import userRoutes from './User/UserRoute.js';


app.use('/api/users', userRoutes);
app.use('/api/vehicles', VehicleRouter);
app.use('/api/vehicle-types', vehicleTypeRouter);
app.use('/api/insurances', insuranceRouter);
app.use('/api/brands', brandRouter);
app.use('/api/models', modelRouter);

// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);

async function startServer() {
  try {
    await syncSchema(); //never in production
    await seedDatabase(orm.em.fork());
    app.listen(3000, () => {
      console.log('Servidor corriendo en http://localhost:3000');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

startServer();