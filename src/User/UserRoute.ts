import { Router } from 'express';
import { sanitizeUserInput, validateUserSchema} from "./UserValidations.js";
import { addPublicUser, addEmployee, findAll, findOne,findEmployeesByOwner, update, updatePassword, remove, findOneForEmail } from './UserController.js';


const UserRouter = Router();

UserRouter.post('/',sanitizeUserInput,validateUserSchema, addPublicUser);
UserRouter.get('/', findAll);
UserRouter.get('/:id', findOne);
UserRouter.get('/:ownerId/employee', findEmployeesByOwner);
UserRouter.put('/:id',sanitizeUserInput,validateUserSchema, update);
UserRouter.patch('/:id',sanitizeUserInput,validateUserSchema, update);
UserRouter.patch('/:id/password', updatePassword);
UserRouter.delete('/:id', remove);
UserRouter.post('/login', findOneForEmail);
UserRouter.post('/:ownerId/employee',sanitizeUserInput,validateUserSchema, addEmployee);

export default UserRouter;
