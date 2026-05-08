import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { KokoroTTS } from "kokoro-js";

const root = resolve(import.meta.dirname, "..");
const scriptPath = resolve(root, "script.md");
const outputDir = resolve(root, "public/voiceover");

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

const requestedVoice = process.env.KOKORO_VOICE ?? "bf_emma";
const voice = requestedVoice;
const speed = Number(process.env.KOKORO_SPEED ?? 1.12);

await mkdir(outputDir, { recursive: true });
console.log(`Using Kokoro voice: ${voice}`);

const manifest = [];
for (const [index, text] of paragraphs.entries()) {
  const outputPath = resolve(outputDir, `segment-${index + 1}.wav`);
  console.log(`Generating ${outputPath}`);

  const audio = await tts.generate(text, { voice, speed });
  audio.save(outputPath);

  manifest.push({
    file: `voiceover/segment-${index + 1}.wav`,
    duration: audio.audio.length / audio.sampling_rate,
    text,
  });
}

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
