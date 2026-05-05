import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ENCRYPTION_KEY || '12345678901234567890123456789012',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, nombre: payload.nombre, rol: payload.rol };
  }
}
