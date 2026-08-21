import { Router } from 'express';
import { sanitizeUserInput, validateUserSchema} from "./UserValidations.js";
import { UserCreateSchema, UserUpdateSchema } from "./UserSchema.js";
import { addPublicUser, addEmployee, findAll, findOne,findEmployeesByOwner, update, updatePassword, remove, findOneForEmail } from './UserController.js';


const UserRouter = Router();

UserRouter.post('/',sanitizeUserInput,validateUserSchema(UserCreateSchema), addPublicUser);
UserRouter.post('/:ownerId/employee',sanitizeUserInput,validateUserSchema(UserCreateSchema), addEmployee);
UserRouter.post('/login', findOneForEmail);

UserRouter.get('/', findAll);
UserRouter.get('/:id', findOne);
UserRouter.get('/:ownerId/employee', findEmployeesByOwner);

UserRouter.put('/:id',sanitizeUserInput,validateUserSchema(UserUpdateSchema), update);

UserRouter.patch('/:id',sanitizeUserInput,validateUserSchema(UserUpdateSchema), update);
UserRouter.patch('/:id/password', updatePassword);

UserRouter.delete('/:id', remove);


export default UserRouter;
