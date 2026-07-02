import { Router } from 'express';
import {
        createService, 
        getServices, 
        getServiceById, 
        updateService, 
        deleteService } from '../controllers/ServiceController.js';


const router = Router();

router.post('/', createService);
router.get('/', getServices);
router.get('/:id', getServiceById);
router.put('/:id', updateService);
router.delete('/:id', deleteService); 

export default router;