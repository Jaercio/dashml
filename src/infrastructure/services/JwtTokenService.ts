import { ITokenService } from '../../core/services/ITokenService';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-dashml-erp-2026-dynamic-token';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export class JwtTokenService implements ITokenService {
  async sign(payload: Record<string, any>, expiresIn: string = '24h'): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);
  }

  async verify(token: string): Promise<Record<string, any> | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      return payload;
    } catch (error) {
      return null;
    }
  }
}
