import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { StatsController } from './Stats.Controller.js';
import { StatsRepository } from './Stats.Repository.js';
import { StatsService } from './Stats.Service.js';

// Panel del administrador. Sin parámetros: no lleva schema.
export const statsRouter = Router();

const statsController = new StatsController(new StatsService(new StatsRepository(orm.em)));

statsRouter.get('/summary', statsController.summary);

export default statsRouter;
