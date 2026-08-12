import express from 'express';
import { syncSchema } from './Shared/db/orm.js';
import VehicleRouter from './Vehicle/Vehicle.Route.js';
const app = express();
app.use(express.json()); // para parsear el body JSON
import userRoutes from './User/UserRoute.js';
app.use('/api/users', userRoutes);
app.use('/api/vehicles', VehicleRouter);
// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
async function startServer() {
    try {
        await syncSchema(); //never in production
        app.listen(3000, () => {
            console.log('Servidor corriendo en http://localhost:3000');
        });
    }
    catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
}
startServer();
//# sourceMappingURL=index.js.map