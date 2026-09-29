import { type Request, type Response, type NextFunction } from "express";
import { CreatePaymentUseCase } from "../../application/use-cases/CreatePaymentUseCase";
import type { GetPaymentHistoryUseCase } from "../../application/use-cases/GetPaymentHistoryUseCase";
import { UnauthorizedError } from '../../domain/errors/AppError';
import { requireObjectBody, requireMoney, requireCurrency, requireId } from '../validation/validators';

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly getPaymentHistoryUseCase: GetPaymentHistoryUseCase
  ){}

  private requireUserId(req: Request): string {
    const userId = req.user?.userId
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado')
    }
    return userId
  }

  public createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const body = requireObjectBody(req.body)

    const deposit = requireMoney(body.deposit, 'deposit')
    const currency = requireCurrency(body.currency)
    const goalId = requireId(body.goalId, 'goalId')

    const newDeposit = await this.createPaymentUseCase
      .execute({ deposit, currency, goalId, userId })
      .catch(next)
    if (newDeposit) res.status(201).json(newDeposit)
  };

  public getHistory = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const goalId = requireId(req.params.goalId, 'goalId')

    const history = await this.getPaymentHistoryUseCase
      .execute({ goalId, userId })
      .catch(next)
    if (history) res.status(200).json(history)
  };
}
