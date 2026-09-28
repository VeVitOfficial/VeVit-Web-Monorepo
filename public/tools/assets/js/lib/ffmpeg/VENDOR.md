# ffmpeg.wasm vendor inventory

- `@ffmpeg/ffmpeg` 0.12.15, ESM distribution (`classes.js`, `const.js`, `errors.js`, `index.js`, `types.js`, `utils.js`, `worker.js`)
- `@ffmpeg/core` 0.12.10, ESM single-thread distribution (`ffmpeg-core.js`, `ffmpeg-core.wasm`)
- Source: <https://github.com/ffmpegwasm/ffmpeg.wasm>
- Package license: MIT; FFmpeg/core codec licensing remains governed by the upstream build configuration.

The ESM distribution is intentional: the UMD webpack bootstrap contains dynamic `Function` construction and is incompatible with VeVit `script-src 'self'` without `unsafe-eval`.
