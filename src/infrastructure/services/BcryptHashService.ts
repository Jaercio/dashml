import { IHashService } from '../../core/services/IHashService';
import bcrypt from 'bcryptjs';

export class BcryptHashService implements IHashService {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
