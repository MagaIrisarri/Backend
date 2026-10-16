import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { UserController } from './User.Controller.js';
import { UserService } from './User.Service.js';
import { UserRepository } from './User.Repository.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth, self } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import {
  createPublicUserSchema,
  resetPasswordSchema,
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
userRouter.get('/:ownerId/employee', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(ownerIdSchema), userController.findEmployeesByOwner);
userRouter.post('/:ownerId/employee', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(ownerIdSchema), validateSchema(createEmployeeSchema), userController.createEmployee);
userRouter.put('/:ownerId/employee/:id', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(updateEmployeeSchema), userController.updateEmployee);
userRouter.post('/:ownerId/employee/:id/reactivate', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(employeeIdSchema), userController.reactivateEmployee);
userRouter.delete('/:ownerId/employee/:id', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(employeeIdSchema), userController.deleteEmployee);

// --- CRUD general ---
userRouter.get('/', auth(UserType.ADMINISTRADOR), validateSchema(listUsersQuerySchema), userController.findAll);
userRouter.get('/:id', auth(), self('id'), validateSchema(userIdSchema), userController.findById);
userRouter.put('/:id', auth(), self('id'), validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id', auth(), self('id'), validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.patch('/:id/password', auth(), self('id'), validateSchema(updatePasswordSchema), userController.updatePassword);
userRouter.post('/:id/reactivate', auth(UserType.ADMINISTRADOR), validateSchema(userIdSchema), userController.reactivate);
userRouter.post('/:id/reset-password', auth(UserType.ADMINISTRADOR), validateSchema(resetPasswordSchema), userController.resetPassword);
userRouter.delete('/:id', auth(), self('id'), validateSchema(userIdSchema), userController.delete);