import { Router } from 'express';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';
import { GoalController } from '../controllers/GoalController';

const router : Router = Router();

// Instanciamos el Adaptador de Base de Datos
const goalRepository = new PrismaGoalRepository();

// Instanciamos el Caso de Uso inyectando el repositorio
const createGoalUseCase = new CreateGoalUseCase(goalRepository);

// Instanciamos el Controlador inyectando el caso de uso
const goalController = new GoalController(createGoalUseCase);

// Definimos la ruta POST para crear la meta
router.post('/', goalController.createGoal);

export { router as goalRoutes };
