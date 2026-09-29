import { Router } from "express";
import { PrismaUserRepository } from "../repositories/PrismaUserRepository";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { LoginController } from "../controllers/LoginController";
import { rateLimit, safeKeyPart } from '../middlewares/rateLimiter';

const router : Router = Router();

const loginRepository = new PrismaUserRepository();
const loginUseCase = new LoginUseCase(loginRepository);
const loginController =  new LoginController(loginUseCase);

/**
 * Credential-stuffing mitigation. Bucketed by client IP AND submitted email, so one
 * attacker hammering many accounts is limited per account, and a shared NAT egress cannot
 * lock out unrelated users on its own. The key tolerates an absent or oversized email
 * because this runs before body validation.
 */
const loginRateLimit = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => {
    const email =
      typeof req.body === 'object' && req.body !== null
        ? (req.body as Record<string, unknown>).email
        : undefined
    return `${req.ip ?? 'unknown'}|${safeKeyPart(email)}`
  },
});

router.post('/', loginRateLimit, loginController.loginUser);
export {router as loginRoutes};
