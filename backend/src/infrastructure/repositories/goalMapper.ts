import { Goal } from '../../domain/entities/Goal'

/** Row shape returned by Prisma for the Goal model. Declared locally so the mapper does
 *  not depend on the generated client's exact type name. */
export interface GoalRecord {
  id: string
  title: string
  totalAmount: unknown
  currency: string
  userId: string
  createdAt: Date
  updatedAt: Date
  finishedAt: Date | null
}

/**
 * Rebuilds the domain entity from a persistence row.
 *
 * Passing through the entity constructor on read is deliberate: it re-validates the stored
 * values, so a row that somehow violates an invariant (for example one written by an older
 * build before validation existed) is caught here rather than surfacing as arithmetic
 * nonsense downstream. Callers must handle ValidationError from this function.
 */
export function toGoal(record: GoalRecord): Goal {
  return new Goal(
    record.id,
    record.title,
    record.totalAmount as never,
    record.currency,
    record.userId,
    record.createdAt,
    record.updatedAt,
    record.finishedAt,
  )
}
