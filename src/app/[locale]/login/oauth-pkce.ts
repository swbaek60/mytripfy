/**
 * 클라이언트 PKCE: code_verifier를 localStorage에 저장하고 code_challenge를 반환합니다.
 * 콜백이 새 탭에서 열려도 같은 origin의 localStorage에서 verifier를 읽어 exchange할 수 있습니다.
 */
const STORAGE_KEY = 'mytripfy_oauth_code_verifier'
const STORAGE_TS_KEY = 'mytripfy_oauth_code_verifier_ts'
const TTL_MS = 5 * 60 * 1000 // 5분

function randomBytes(length: number): string {
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * PKCE code_verifier 생성 (43자, 256비트 랜덤)
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes.buffer)
}

/**
 * code_challenge = base64url(SHA256(code_verifier))
 */
export async function computeCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(hash)
}

/**
 * code_verifier를 localStorage에 저장하고 code_challenge를 반환합니다.
 * 콜백/교환 시 getStoredCodeVerifier()로 읽어 사용합니다.
 */
export async function createAndStorePkce(): Promise<{ codeChallenge: string; codeVerifier: string }> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await computeCodeChallenge(codeVerifier)
  try {
    localStorage.setItem(STORAGE_KEY, codeVerifier)
    localStorage.setItem(STORAGE_TS_KEY, String(Date.now()))
  } catch {
    // ignore
  }
  return { codeChallenge, codeVerifier }
}

/**
 * 저장된 code_verifier를 읽습니다. 사용 후 clearStoredCodeVerifier() 호출 권장.
 */
export function getStoredCodeVerifier(): string | null {
  try {
    const ts = localStorage.getItem(STORAGE_TS_KEY)
    if (ts && Date.now() - Number(ts) > TTL_MS) {
      clearStoredCodeVerifier()
      return null
    }
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearStoredCodeVerifier(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TS_KEY)
  } catch {
    // ignore
  }
}
