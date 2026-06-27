// Contrato del modelo Goal
export class Goal {
  constructor(
    public readonly id: string,
    public title: string,
    public totalAmount: number,
    public currentAmount: number, 
    public currency: string,
    public userId: string,
    public createdAt: Date,
    public updatedAt: Date,
    public finishedAt: Date | null
  ) {}

    // Método que evalúa si la meta ya se cumplió
  public get isCompleted(): boolean {
    return this.currentAmount >= this.totalAmount;
  }

    // Método que devuelva el porcentaje de avance (de 0 a 100).
  public get progressPercentage(): number {
    if (this.totalAmount === 0) return 0;
      const percentage = (this.currentAmount / this.totalAmount) * 100;
      return Math.round(percentage);
    }
}
