import { type Request, type Response } from 'express';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';
import { UpdateGoalUseCase } from '../../application/use-cases/UpdateGoalUseCase';
import { DeleteGoalUseCase } from '../../application/use-cases/DeleteGoalUseCase';
import type { GetGoalProgressUseCase } from '../../application/use-cases/GetGoalProgressUseCase';

export class GoalController {
  constructor(
    private readonly createGoalUseCase: CreateGoalUseCase,
    private readonly updateGoalUseCase: UpdateGoalUseCase,
    private readonly deleteGoalUseCase: DeleteGoalUseCase,
    private readonly getGoalProgressUseCase: GetGoalProgressUseCase
  ) {}

  public createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const {title, totalAmount, currency, userId} = req.body
      const newGoal = await this.createGoalUseCase.execute({title, totalAmount, currency, userId})
      res.status(201).json(newGoal)

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor al crear la meta' });
    }
  };

  public updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as {id: string};
      const { title, totalAmount, currency, userId, createdAt, finishedAt } = req.body;
      const updatedGoal = await this.updateGoalUseCase.execute({ id, title, totalAmount, currency, userId, createdAt, finishedAt });
      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor al actualizar la meta' });
    }
  };

  public deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as {id: string};
      await this.deleteGoalUseCase.execute({ id });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor al eliminar la meta' });
    }
  };

  public getGoalProgress = async (req: Request, res: Response): Promise<void> =>{
    try{
      const {goalId} = req.params as {goalId: string};
      const progress = await this.getGoalProgressUseCase.execute({ goalId });
      res.status(200).json(progress);
    } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Error interno del servidor al obtener progreso'})
    }
  };
}
