import { Router } from 'express'
import { createVehicleType, getVehicleTypes, getVehicleTypeCode, updateVehicleType, deleteVehicleType} from '../controllers/vehicleTypeController.js';

const router = Router();

router.post('/', createVehicleType);
router.get('/', getVehicleTypes);
router.get('/:code', getVehicleTypeCode);
router.put('/:code', updateVehicleType);
router.delete('/:code', deleteVehicleType);

export default router;
