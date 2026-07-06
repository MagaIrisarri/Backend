import { Router } from 'express';
import { sanitizeUserInput } from "./UserValidations.js";
import { add, findAll, findOne, update, remove } from './UserController.js';
const UserRouter = Router();
UserRouter.post('/', sanitizeUserInput, add);
UserRouter.get('/', findAll);
UserRouter.get('/:id', findOne);
UserRouter.put('/:id', sanitizeUserInput, update);
UserRouter.patch('/:id', sanitizeUserInput, update);
UserRouter.delete('/:id', remove);
export default UserRouter;
//# sourceMappingURL=UserRoute.js.map