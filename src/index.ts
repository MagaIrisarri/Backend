import express from 'express';
import cors from 'cors';


const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // para parsear el body JSON

import userRoutes from './User/UserRoute.js';

app.use('/api/users', userRoutes);

// acá van tus rutas, por ejemplo:
// import userRoutes from './routes/userRoutes';
// app.use('/api/users', userRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
