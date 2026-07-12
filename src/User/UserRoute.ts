import { Router } from 'express';
import { sanitizeUserInput, validateUserSchema} from "./UserValidations.js";
import { add, findAll, findOne, update, remove, findOneForEmail } from './UserController.js';


const UserRouter = Router();

UserRouter.post('/',sanitizeUserInput,validateUserSchema, add);
UserRouter.get('/', findAll);
UserRouter.get('/:id', findOne);
UserRouter.put('/:id',sanitizeUserInput, update);
UserRouter.patch('/:id',sanitizeUserInput, update);
UserRouter.delete('/:id', remove);
UserRouter.post('/login', findOneForEmail);

export default UserRouter;
