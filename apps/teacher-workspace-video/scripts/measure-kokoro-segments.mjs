import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { KokoroTTS } from "kokoro-js";

const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "script.md");

const paragraphs = (await readFile(scriptPath, "utf8"))
  .split(/\n{2,}/)
  .map((paragraph) => paragraph.trim())
  .filter((paragraph) => paragraph && !paragraph.startsWith("#"));

const tts = await KokoroTTS.from_pretrained(
  "onnx-community/Kokoro-82M-v1.0-ONNX",
  {
    dtype: "q8",
    device: "cpu",
  },
);

const voice = process.env.KOKORO_VOICE ?? "bf_emma";
const speed = Number(process.env.KOKORO_SPEED ?? 0.95);

let cursor = 0;
for (const text of paragraphs) {
  const audio = await tts.generate(text, { voice, speed });
  const duration = audio.audio.length / audio.sampling_rate;
  console.log(
    JSON.stringify({
      start: Number(cursor.toFixed(2)),
      end: Number((cursor + duration).toFixed(2)),
      duration: Number(duration.toFixed(2)),
      text,
    }),
  );
  cursor += duration;
}
