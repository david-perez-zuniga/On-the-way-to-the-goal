import { Router } from "express";
import { PrismaPaymentRepository } from "../repositories/PrismaPaymentRepository";
import { CreatePaymentUseCase } from "../../application/use-cases/CreatePaymentUseCase";
import { PaymentController } from "../controllers/PaymentController";

const router : Router = Router();

const paymentRepository = new PrismaPaymentRepository();
const createPaymentUseCase = new CreatePaymentUseCase(paymentRepository);
const paymentController = new PaymentController(createPaymentUseCase);

router.post('/', paymentController.createPayment);

export { router as paymentRoutes };
