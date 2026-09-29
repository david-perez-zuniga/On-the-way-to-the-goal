import { type Request, type Response, type NextFunction } from 'express';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';
import { UpdateGoalUseCase } from '../../application/use-cases/UpdateGoalUseCase';
import { DeleteGoalUseCase } from '../../application/use-cases/DeleteGoalUseCase';
import type { GetGoalProgressUseCase } from '../../application/use-cases/GetGoalProgressUseCase';
import type { GetUserGoalsUseCase } from '../../application/use-cases/GetUserGoalsUseCase';
import { UnauthorizedError } from '../../domain/errors/AppError';
import {
  requireObjectBody, requireMoney, requireCurrency, requireId, requireOptionalDate, requireTitle,
} from '../validation/validators';

export class GoalController {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase,
    private readonly getGoalProgressUseCase: GetGoalProgressUseCase,
    private readonly getUserGoalsUseCase: GetUserGoalsUseCase,
  ) {}

  /** Identity is taken from the verified token only. It is never read from the request
   *  body or params, which is what allowed a caller to act as, or reassign, another user. */
  private requireUserId(req: Request): string {
    const userId = req.user?.userId
    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado')
    }
    return userId
  }

  public createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const body = requireObjectBody(req.body)

    const title = requireTitle(body.title, 'title')
    const totalAmount = requireMoney(body.totalAmount, 'totalAmount')
    const currency = requireCurrency(body.currency)

    const newGoal = await this.createGoalUseCase
      .execute({ title, totalAmount, currency, userId })
      .catch(next)
    if (newGoal) res.status(201).json(newGoal)
  };

  public updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const id = requireId(req.params.id, 'id')
    const body = requireObjectBody(req.body)

    const title = requireTitle(body.title, 'title')
    const totalAmount = requireMoney(body.totalAmount, 'totalAmount')
    const currency = requireCurrency(body.currency)
    const finishedAt = requireOptionalDate(body.finishedAt, 'finishedAt')

    // `createdAt` is intentionally not accepted from the client: the use case reads it from
    // the stored record so a caller cannot forge or rewind the audit timestamp. Sending it
    // here is not merely ignored, it is not part of the command at all.
    const updatedGoal = await this.updateGoalUseCase
      .execute({ id, title, totalAmount, currency, userId, finishedAt })
      .catch(next)
    if (updatedGoal) res.status(200).json(updatedGoal)
  };

  public deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const id = requireId(req.params.id, 'id')

    // Not written as `await ....catch(next); res.status(204).send()`. The use case returns
    // void, so there is no truthy result to guard on: `catch(next)` would swallow the
    // rejection, execution would continue, and a 204 would be sent even when the delete was
    // refused. try/catch keeps the 204 strictly tied to a successful delete.
    try {
      await this.deleteGoalUseCase.execute({ id, userId })
    } catch (error) {
      next(error)
      return
    }
    res.status(204).send()
  };

  public getGoalProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const goalId = requireId(req.params.goalId, 'goalId')

    const progress = await this.getGoalProgressUseCase
      .execute({ goalId, userId })
      .catch(next)
    if (progress) res.status(200).json(progress)
  };

  public getUserGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = this.requireUserId(req)
    const goals = await this.getUserGoalsUseCase.execute(userId).catch(next)
    if (goals) res.status(200).json(goals)
  };
}
