import { SignJWT, jwtVerify } from 'jose';
import { SessionUser } from '@/lib/types';

const USERS: Record<string, { envKey: string; name: string }> = {
  ahmed: { envKey: 'USER_AHMED_PASSWORD', name: 'Ahmed Ali' },
  owais: { envKey: 'USER_OWAIS_PASSWORD', name: 'Owais Ahmed' },
  ubaid: { envKey: 'USER_UBAID_PASSWORD', name: 'Ubaid Raza' },
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

export async function authenticate(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const user = USERS[username.toLowerCase()];
  if (!user) return null;

  const envPassword = process.env[user.envKey];
  if (!envPassword) return null;

  if (password !== envPassword) return null;

  return { name: user.name, username: username.toLowerCase() };
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      name: payload.name as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

export function getUserList() {
  return Object.entries(USERS).map(([username, data]) => ({
    username,
    name: data.name,
  }));
}
