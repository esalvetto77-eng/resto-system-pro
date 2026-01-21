import crypto from 'crypto'

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.trim().length < 32) return null
  return secret
}

function base64url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function signUserId(userId: string): string {
  const secret = getSessionSecret()
  if (!secret) return userId

  const sig = crypto.createHmac('sha256', secret).update(userId).digest()
  return `${userId}.${base64url(sig)}`
}

export function verifySignedUserId(value: string): { userId: string | null; signed: boolean } {
  const secret = getSessionSecret()
  if (!secret) {
    // Sin secret: aceptar valor plano (modo compatibilidad)
    return { userId: value || null, signed: false }
  }

  // Con secret: exigir firma válida
  const parts = value.split('.')
  if (parts.length !== 2) return { userId: null, signed: false }

  const [userId, sig] = parts
  if (!userId || !sig) return { userId: null, signed: false }

  const expected = base64url(crypto.createHmac('sha256', secret).update(userId).digest())
  // timingSafeEqual requiere mismo largo
  if (sig.length !== expected.length) return { userId: null, signed: true }
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  return { userId: ok ? userId : null, signed: true }
}

export function hasSessionSecret(): boolean {
  return getSessionSecret() !== null
}

export function getSessionCookieNames(): { primary: string; legacy: string } {
  // __Host- requiere: Secure + Path=/ + sin Domain (ideal para producción)
  return { primary: '__Host-userId', legacy: 'userId' }
}

