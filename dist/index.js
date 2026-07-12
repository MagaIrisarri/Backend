import express from 'express';
const app = express();
app.use(express.json()); // para parsear el body JSON
import userRoutes from './User/UserRoute.js';
import VehicleRouter from './Vehicle/VehicleRoute.js';
app.use('/api/users', userRoutes);
app.use('/api/vehicles', VehicleRouter);
// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
//# sourceMappingURL=index.js.map