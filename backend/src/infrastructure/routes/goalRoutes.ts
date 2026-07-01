import { Router } from 'express';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';
import { UpdateGoalUseCase } from '../../application/use-cases/UpdateGoalUseCase';
import { GoalController } from '../controllers/GoalController';

const router : Router = Router();

const goalRepository = new PrismaGoalRepository();

const createGoalUseCase = new CreateGoalUseCase(goalRepository);
const updateGoalUseCase = new UpdateGoalUseCase(goalRepository);

const goalController = new GoalController(createGoalUseCase, updateGoalUseCase);

router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);

export { router as goalRoutes };
