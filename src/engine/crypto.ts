/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  return buf2hex(hashBuffer);
}

export async function deriveKeyFromPassword(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as any,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const saltBytes = hex2buf(saltHex);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, key: CryptoKey): Promise<{ cipherTextHex: string; ivHex: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(data);

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    encoded as any
  );

  return {
    cipherTextHex: buf2hex(cipherBuffer),
    ivHex: buf2hex(iv.buffer),
  };
}

export async function decryptData(cipherTextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  const cipherBytes = hex2buf(cipherTextHex);
  const ivBytes = hex2buf(ivHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as any,
    },
    key,
    cipherBytes as any
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
