import { type Request, type Response } from "express";
import { CreatePaymentUseCase } from "../../application/use-cases/CreatePaymentUseCase";
import type { GetPaymentHistoryUseCase } from "../../application/use-cases/GetPaymentHistoryUseCase";

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly getPaymentHistoryUseCase: GetPaymentHistoryUseCase
  ){}

  public createPayment = async (req: Request, res: Response): Promise<void> => {
    try{
      const {deposit, currency, goalId} = req.body
      const newDeposit = await this.createPaymentUseCase.execute({deposit, currency, goalId})
      res.status(201).json(newDeposit)
    } catch (error){
      console.error(error);
      res.status(500).json({error: 'Error interno del servidor al crear un deposito' })
    }
  };

  public getHistory = async(req: Request, res: Response): Promise<void> => {
    try{
      const {goalId} = req.params as {goalId: string};
      const history = await this.getPaymentHistoryUseCase.execute({ goalId })
      res.status(200).json(history)
    } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Error interno dle servidor al obttener historial'})
    }
  };
  
}
