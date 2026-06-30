import { Router } from "express";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { LoginController } from "../controllers/LoginController";

const router : Router = Router();

const loginRepository = new PrismaUserRepository();
const loginUseCase = new LoginUseCase(loginRepository);
const loginController =  new LoginController(loginUseCase);
router.post('/', loginController.loginUser);
export {router as loginRoutes};
