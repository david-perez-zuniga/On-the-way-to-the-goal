import { Payment } from "../entities/Payment";

// Scoped by owner: an unscoped lookup by goal id leaked one user's full deposit history
// to any authenticated caller, and let anyone post deposits into another user's goal.
export interface IPaymentRepository {
  create(payment: Payment): Promise<void>;
  findByGoalId(idGoal: string, userId: string): Promise<Payment[]>;
}
