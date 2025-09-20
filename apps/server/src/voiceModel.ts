// Placeholder embedding extractor + similarity function
export function extractVoiceEmbeddingFromWavBase64(base64wav: string, dim = 256): Float32Array {
  // Placeholder: deterministic pseudo-random vector from sample hash (so repeated same sample -> same vector)
  const buf = Buffer.from(base64wav, 'base64');
  const hash = require('crypto').createHash('sha256').update(buf).digest();
  const out = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    // expand hash to values in [-1,1]
    const v = hash[i % hash.length] / 255;
    out[i] = (v * 2) - 1;
  }
  return out;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
