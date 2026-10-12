import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { UserController } from './User.Controller.js';
import { UserService } from './User.Service.js';
import { UserRepository } from './User.Repository.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import {
  createPublicUserSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
  updateUserSchema,
  userIdSchema,
  ownerIdSchema,
  loginSchema,
  updatePasswordSchema,
  listUsersQuerySchema,
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
userRouter.put('/:ownerId/employee/:id', validateSchema(updateEmployeeSchema), userController.updateEmployee);
userRouter.post('/:ownerId/employee/:id/reactivate', validateSchema(employeeIdSchema), userController.reactivateEmployee);
userRouter.delete('/:ownerId/employee/:id', validateSchema(employeeIdSchema), userController.deleteEmployee);

// --- CRUD general ---
userRouter.get('/', validateSchema(listUsersQuerySchema), userController.findAll);
userRouter.get('/:id', validateSchema(userIdSchema), userController.findById);
userRouter.put('/:id', validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id', validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id/password', validateSchema(updatePasswordSchema), userController.updatePassword);
userRouter.post('/:id/reactivate', validateSchema(userIdSchema), userController.reactivate);
userRouter.delete('/:id', validateSchema(userIdSchema), userController.delete);