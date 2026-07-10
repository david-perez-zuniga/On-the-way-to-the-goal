import { Router } from "express";
import { PrismaPaymentRepository } from "../repositories/PrismaPaymentRepository";
import { CreatePaymentUseCase } from "../../application/use-cases/CreatePaymentUseCase";
import { PaymentController } from "../controllers/PaymentController";
import { PrismaGoalRepository } from "../repositories/PrismaGoalRepository";

const router : Router = Router();
const goalRepository = new PrismaGoalRepository();


const paymentRepository = new PrismaPaymentRepository();
const createPaymentUseCase = new CreatePaymentUseCase(paymentRepository, goalRepository);
const paymentController = new PaymentController(createPaymentUseCase);

router.post('/', paymentController.createPayment);

export { router as paymentRoutes };
