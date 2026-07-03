import { type Request, type Response } from "express";
import { CreatePaymentUseCase } from "../../application/use-cases/CreatePaymentUseCase";

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase
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
}
