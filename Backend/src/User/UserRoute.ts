import { Router } from 'express';
import { createUser, getUsers, getUserDNI, updateUser, deleteUser } from '../controllers/UserController.js';

const router = Router();

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:dni', getUserDNI);
router.put('/:dni', updateUser);
router.delete('/:dni', deleteUser);

export default router;