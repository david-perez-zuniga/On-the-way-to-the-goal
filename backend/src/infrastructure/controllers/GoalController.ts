import { type Request, type Response } from 'express';
import { CreateGoalUseCase } from '../../application/use-cases/CreateGoalUseCase';

export class GoalController {
  // Inyectamos el caso de uso en el controlador
  constructor(private readonly createGoalUseCase: CreateGoalUseCase) {}
  // Usamos una arrow function para no perder el contexto 
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
}
