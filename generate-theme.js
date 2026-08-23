// Gera uma trilha placeholder (WAV) — melodia espacial simples em loop.
// Rode com: node generate-theme.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const BPM = 120;
const beat = 60 / BPM; // segundos por batida

// Melodia pentatônica "aventura espacial", em batidas (nota, duração em batidas)
// null = pausa
const notes = [
  ['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['C5', 0.5],
  ['G4', 0.5], ['E4', 0.5], ['D4', 0.5], ['E4', 0.5],
  ['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['A4', 0.5],
  ['G4', 0.5], ['E4', 0.5], ['C4', 1.0],
  ['D4', 0.5], ['F4', 0.5], ['A4', 0.5], ['D5', 0.5],
  ['A4', 0.5], ['F4', 0.5], ['E4', 0.5], ['F4', 0.5],
  ['G4', 0.5], ['E4', 0.5], ['C4', 0.5], ['D4', 0.5],
  ['E4', 1.0], ['C4', 1.0],
];

const noteFreq = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33,
};

function synthNote(freq, durationSec) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(n);
  const attack = Math.floor(n * 0.05);
  const release = Math.floor(n * 0.25);
  for (let i = 0; i < n; i++) {
    // onda quadrada suavizada (estilo chiptune) + leve harmônico
    const t = i / SAMPLE_RATE;
    const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
    const harmonic = 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
    let s = 0.6 * square + harmonic;

    let env = 1;
    if (i < attack) env = i / attack;
    else if (i > n - release) env = Math.max(0, (n - i) / release);
    samples[i] = s * env * 0.35;
  }
  return samples;
}

function silence(durationSec) {
  return new Float32Array(Math.floor(SAMPLE_RATE * durationSec));
}

let chunks = [];
for (const [note, dur] of notes) {
  const durSec = dur * beat;
  if (note === null) {
    chunks.push(silence(durSec));
  } else {
    chunks.push(synthNote(noteFreq[note], durSec * 0.92));
    chunks.push(silence(durSec * 0.08));
  }
}

const total = chunks.reduce((sum, c) => sum + c.length, 0);
const pcm = new Float32Array(total);
let offset = 0;
for (const c of chunks) { pcm.set(c, offset); offset += c.length; }

// Converte float [-1,1] para PCM 16-bit
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

const outDir = path.join(__dirname, 'assets', 'music');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'theme.wav');
fs.writeFileSync(outPath, buffer);
console.log('Gerado:', outPath, `(${(buffer.length / 1024).toFixed(1)} KB, ${(total / SAMPLE_RATE).toFixed(1)}s)`);
