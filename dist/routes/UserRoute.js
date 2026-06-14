import { Router } from 'express';
import { createUser, getUsers, getUserDNI, updateUser } from '../controllers/UserController.js';
const router = Router();
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:dni', getUserDNI);
router.put('/:dni', updateUser);
export default router;
//# sourceMappingURL=UserRoute.js.map