import { Router } from 'express';
import { UserController } from './User.Controller.js';
import { UserService } from './User.Service.js';
import { UserRepository } from './User.Repository.js';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { createUserSchema, updateUserSchema, userIdSchema } from './User.Schema.js';

export const userRouter = Router();

const em = orm.em.fork();
const userRepository = new UserRepository(em);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

userRouter.get('/', userController.findAll);
userRouter.get('/:id', validateSchema(userIdSchema), userController.findById);
userRouter.post('/', validateSchema(createUserSchema), userController.create);
userRouter.put('/:id', validateSchema(userIdSchema), validateSchema(updateUserSchema), userController.update);
userRouter.delete('/:id', validateSchema(userIdSchema), userController.delete);