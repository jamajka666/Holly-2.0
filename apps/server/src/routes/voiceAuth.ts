import express from 'express';
import { z } from 'zod';
import db from '../db';
import { extractVoiceEmbeddingFromWavBase64, cosineSimilarity } from '../voiceModel';
import { encryptEmbedding, decryptEmbedding } from '../crypto';
import { randomUUID } from 'crypto';

const router = express.Router();

const registerSchema = z.object({
  userId: z.string().min(1),
  audioSamples: z.array(z.string()).min(3),
});

const verifySchema = z.object({
  userId: z.string().min(1),
  audioSample: z.string(),
});

const pinSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(8),
  password: z.string().min(6),
});

// Helper DB ops
function insertVoiceProfile(id: string, userId: string, ciphertext: string, iv: string, tag: string, samplesCount: number) {
  const stmt = db.prepare(`INSERT OR REPLACE INTO voice_profiles (id, user_id, encrypted_embedding, iv, tag, samples_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))`);
  stmt.run(id, userId, ciphertext, iv, tag, samplesCount);
}

function getVoiceProfileByUser(userId: string) {
  const stmt = db.prepare(`SELECT * FROM voice_profiles WHERE user_id = ? LIMIT 1`);
  return stmt.get(userId);
}

/**
 * POST /auth/voice/register
 * Body: { userId, audioSamples: [ base64wav, ... ] }  (at least 3)
 */
router.post('/auth/voice/register', express.json(), async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { userId, audioSamples } = parsed;

    // average embeddings
    const embeddings = audioSamples.map(s => extractVoiceEmbeddingFromWavBase64(s));
    const dim = embeddings[0].length;
    const avg = new Float32Array(dim);
    for (const e of embeddings) for (let i=0;i<dim;i++) avg[i] += e[i];
    for (let i=0;i<dim;i++) avg[i] /= embeddings.length;

    // encrypt avg as raw bytes
    const buf = Buffer.from(avg.buffer);
    const { ciphertext, iv, tag } = encryptEmbedding(buf);

    const id = randomUUID();
    insertVoiceProfile(id, userId, ciphertext, iv, tag, audioSamples.length);

    res.json({ success: true, id });
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: 'validation_failed', details: err.issues });
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /auth/voice/verify
 * Body: { userId, audioSample: base64wav }
 */
router.post('/auth/voice/verify', express.json(), async (req, res) => {
  try {
    const parsed = verifySchema.parse(req.body);
    const { userId, audioSample } = parsed;

    const row = getVoiceProfileByUser(userId);
    if (!row) return res.status(404).json({ success: false, reason: 'no_profile' });

    // decrypt stored embedding
    const plain = decryptEmbedding(row.encrypted_embedding, row.iv, row.tag); // Buffer
    // create Float32Array view
    const stored = new Float32Array(plain.buffer, plain.byteOffset, plain.length / 4);

    const probe = extractVoiceEmbeddingFromWavBase64(audioSample, stored.length);

    const sim = cosineSimilarity(stored, probe);
    const THRESH = 0.85; // adjust after experiments

    const success = sim >= THRESH;
    res.json({ success, similarity: sim });
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: 'validation_failed', details: err.issues });
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /auth/pin-login
 * Simple fallback stub (replace with real user/password check)
 * Body: { userId, pin, password }
 */
router.post('/auth/pin-login', express.json(), async (req, res) => {
  try {
    const parsed = pinSchema.parse(req.body);
    // TODO: validate against user DB/hash. For now just accept any and return token.
    const token = 'dev-token-' + Math.random().toString(36).slice(2);
    res.json({ success: true, token });
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: 'validation_failed', details: err.issues });
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
