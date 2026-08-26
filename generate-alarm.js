// Gera um som placeholder de alarme (WAV) — sirene de duas notas alternadas.
// Rode com: node generate-alarm.js
// Troque depois por assets/sfx/alarm.mp3 (ou alarm.wav) com o som real.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function tone(freq, durationSec, volume) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(n);
  const attack = Math.floor(n * 0.05);
  const release = Math.floor(n * 0.15);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
    let env = 1;
    if (i < attack) env = i / attack;
    else if (i > n - release) env = Math.max(0, (n - i) / release);
    samples[i] = square * env * volume;
  }
  return samples;
}

// Sirene clássica de alerta: alterna entre duas notas, 4 vezes.
const beepDur = 0.18;
const gapDur = 0.05;
const pattern = [880, 660, 880, 660, 880, 660, 880, 660];
let chunks = [];
for (const freq of pattern) {
  chunks.push(tone(freq, beepDur, 0.4));
  chunks.push(new Float32Array(Math.floor(SAMPLE_RATE * gapDur)));
}

const total = chunks.reduce((sum, c) => sum + c.length, 0);
const pcm = new Float32Array(total);
let offset = 0;
for (const c of chunks) { pcm.set(c, offset); offset += c.length; }

const buffer = Buffer.alloc(44 + pcm.length * 2);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + pcm.length * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(pcm.length * 2, 40);

for (let i = 0; i < pcm.length; i++) {
  let s = Math.max(-1, Math.min(1, pcm[i]));
  buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}

const outDir = path.join(__dirname, 'assets', 'sfx');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'alarm.wav');
fs.writeFileSync(outPath, buffer);
console.log('Gerado:', outPath, `(${(buffer.length / 1024).toFixed(1)} KB, ${(total / SAMPLE_RATE).toFixed(1)}s)`);
