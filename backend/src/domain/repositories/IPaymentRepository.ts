import { Payment } from "../entities/Payment";

export interface IPaymentRepository {
  create(payment: Payment): Promise<void>;
  findByGoalId(idGoal: string): Promise<Payment[]>;
}
