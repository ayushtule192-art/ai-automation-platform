import type { PasswordResetToken } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class PasswordResetRepository {
  async create(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /** Invalidate any previous unused reset tokens for this email */
  async invalidateExisting(email: string): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

export const passwordResetRepository = new PasswordResetRepository();
