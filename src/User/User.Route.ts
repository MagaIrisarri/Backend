import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { UserController } from './User.Controller.js';
import { UserService } from './User.Service.js';
import { UserRepository } from './User.Repository.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import {
  createPublicUserSchema,
  createEmployeeSchema,
  updateUserSchema,
  userIdSchema,
  ownerIdSchema,
  loginSchema,
  updatePasswordSchema,
} from './User.Schema.js';

export const userRouter = Router();
const userRepository = new UserRepository(orm.em);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// --- Registro público y Login ---
userRouter.post('/', validateSchema(createPublicUserSchema), userController.createPublic);
userRouter.post('/login', validateSchema(loginSchema), userController.login);

// --- Empleados (bajo un dueño) ---
userRouter.get('/:ownerId/employee', validateSchema(ownerIdSchema), userController.findEmployeesByOwner);
userRouter.post('/:ownerId/employee', validateSchema(ownerIdSchema), validateSchema(createEmployeeSchema), userController.createEmployee);

// --- CRUD general ---
userRouter.get('/', userController.findAll);
userRouter.get('/:id', validateSchema(userIdSchema), userController.findById);
userRouter.put('/:id', validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id', validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id/password', validateSchema(updatePasswordSchema), userController.updatePassword);
userRouter.delete('/:id', validateSchema(userIdSchema), userController.delete);