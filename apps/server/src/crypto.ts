import crypto from 'crypto';

const KEY_HEX = process.env.VOICE_SECRET;
if (!KEY_HEX) throw new Error('VOICE_SECRET not set in env (must be 32 bytes hex)');

const KEY = Buffer.from(KEY_HEX, 'hex');
if (KEY.length !== 32) throw new Error('VOICE_SECRET must be 32 bytes (64 hex chars)');

export function encryptEmbedding(buf: Buffer) {
  const iv = crypto.randomBytes(12); // 96 bit for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptEmbedding(ciphertextB64: string, ivB64: string, tagB64: string) {
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain; // Buffer
}
