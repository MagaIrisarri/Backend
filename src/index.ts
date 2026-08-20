import express from 'express';
import { RequestContext } from '@mikro-orm/core';
import { orm, syncSchema } from './Shared/db/orm.js';
import { seedDatabase } from './Shared/db/seeder.js'; 

import {VehicleRouter} from './Vehicle/Vehicle.Route.js';
import { vehicleTypeRouter } from './Vehicle/VehicleType/VehicleType.Route.js'; 
import { insuranceRouter } from './Vehicle/Insurance/Insurance.Route.js';
import { brandRouter } from './Vehicle/Brand/Brand.Route.js';
import { modelRouter } from './Vehicle/Model/Model.Route.js';
import  userRoutes from './User/UserRoute.js';

const app = express();
app.use(express.json()); 



app.use('/api/users', userRoutes);
app.use('/api/vehicles', VehicleRouter);
app.use('/api/vehicle-types', vehicleTypeRouter);
app.use('/api/insurances', insuranceRouter);
app.use('/api/brands', brandRouter);
app.use('/api/models', modelRouter);


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