import { Router } from 'express';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';
import { UpdateGoalUseCase } from '../../application/use-cases/UpdateGoalUseCase';
import { DeleteGoalUseCase } from '../../application/use-cases/DeleteGoalUseCase';
import { GoalController } from '../controllers/GoalController';
import { GetGoalProgressUseCase } from '../../application/use-cases/GetGoalProgressUseCase';
import { PrismaPaymentRepository } from '../repositories/PrismaPaymentRepository';

const router : Router = Router();
const paymentRepository = new PrismaPaymentRepository
const goalRepository = new PrismaGoalRepository();

const createGoalUseCase = new CreateGoalUseCase(goalRepository);
const updateGoalUseCase = new UpdateGoalUseCase(goalRepository);
const deleteGoalUseCase = new DeleteGoalUseCase(goalRepository);
const getGoalProgressUseCase = new GetGoalProgressUseCase(goalRepository, paymentRepository);

const goalController = new GoalController(createGoalUseCase,
                                          updateGoalUseCase,
                                          deleteGoalUseCase,
                                          getGoalProgressUseCase);

router.get('/:goalId', goalController.getGoalProgress)
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

export { router as goalRoutes };
