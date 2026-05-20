import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateRawToken, hashToken } from '../common/token-hash';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRefreshToken(userId: string, tenantId: string | null): Promise<string> {
    const rawToken = generateRawToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        tenantId,
        expiresAt,
      },
    });

    return rawToken;
  }

  async validateAndRotate(rawToken: string): Promise<{ userId: string; tenantId: string | null }> {
    const tokenHash = hashToken(rawToken.trim());
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!row || row.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (row.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: row.id } }).catch(() => undefined);
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.delete({ where: { id: row.id } });

    return { userId: row.userId, tenantId: row.tenantId };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken.trim());
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
