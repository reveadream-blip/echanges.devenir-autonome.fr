function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hexStr: string): Uint8Array {
  const pairs = hexStr.match(/.{1,2}/g)
  if (!pairs || pairs.length * 2 !== hexStr.length) {
    throw new Error('hex invalide')
  }
  return Uint8Array.from(pairs.map((byte) => parseInt(byte, 16)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/** Max ~100k sur Workers (workerd limite deriveBits PBKDF2 pour le budget CPU). */
const PBKDF2_ITERATIONS = 100_000

export async function hashPassword(
  password: string,
): Promise<{ saltHex: string; hashHex: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, '0')).join('')
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return { saltHex, hashHex: hex(bits) }
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string,
): Promise<boolean> {
  let salt: Uint8Array
  try {
    salt = hexToBytes(saltHex)
  } catch {
    return false
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  const out = hex(bits)
  return timingSafeEqual(out, hashHex)
}
