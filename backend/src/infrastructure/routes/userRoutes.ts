import { Router } from 'express';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { CreateUserCase } from '../../application/use-cases/CreateUserUseCase';
import { UserController } from '../controllers/UserController';

const router : Router = Router();

// Ruta POST
const userRepository = new PrismaUserRepository();
const createUserUseCase = new CreateUserCase(userRepository);
const userController = new UserController(createUserUseCase);
router.post('/', userController.createUser);
export { router as userRoutes };
