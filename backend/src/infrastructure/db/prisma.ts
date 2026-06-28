import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './index';

const adapter = new PrismaPg();
export const prisma = new PrismaClient({ adapter });
