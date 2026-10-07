// Joins the aerial clips in scratch/hero into one looping hero montage with crossfades.
// Usage: node scripts/build-hero-video.mjs  (needs ffmpeg-static, installed as a devDependency)
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";

const ffmpeg = createRequire(import.meta.url)("ffmpeg-static");
const dir = "scratch/hero";
const clips = readdirSync(dir).filter((f) => /^\d\d-.*\.mp4$/.test(f)).sort().map((f) => `${dir}/${f}`);
if (clips.length < 2) throw new Error("need at least two clips in scratch/hero");

const FADE = 0.7;      // crossfade length (s)
const LEN = 4.6;       // seconds used from each clip
const W = 1920, H = 1080;

// Normalise every clip (size, fps, duration), then chain xfade filters.
const inputs = clips.flatMap((c) => ["-i", c]);
const norm = clips.map((_, i) => `[${i}:v]trim=0:${LEN},setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=24,format=yuv420p[v${i}]`);
const chain = [];
let prev = "v0";
for (let i = 1; i < clips.length; i++) {
  const offset = (LEN - FADE) * i;
  const out = i === clips.length - 1 ? "vout" : `x${i}`;
  chain.push(`[${prev}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`);
  prev = out;
}
const filter = [...norm, ...chain].join(";");
execFileSync(ffmpeg, ["-y", ...inputs, "-filter_complex", filter, "-map", "[vout]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", "-pix_fmt", "yuv420p", "public/media/hero.mp4"], { stdio: "inherit" });

// Poster: first frame of the montage.
execFileSync(ffmpeg, ["-y", "-i", "public/media/hero.mp4", "-frames:v", "1", "-q:v", "2", `${dir}/poster.png`], { stdio: "inherit" });
await sharp(`${dir}/poster.png`).resize({ width: 1920 }).webp({ quality: 80 }).toFile("public/media/hero-poster.webp");
console.log("hero.mp4 ready:", clips.length, "clips,", ((LEN - FADE) * clips.length + FADE).toFixed(1), "s");
