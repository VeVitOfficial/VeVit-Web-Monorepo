// Registr media nástrojů — mapuje slug → React komponenta.
// Konvence viz src/components/tools/registry/index.ts. Každý nástroj žije v
// src/components/tools/tools/<slug>.tsx a exportuje default ({ locale }).
// Sdílené helpery (Dropzone / FileList / Progress / ResultArea / ffmpeg loadery)
// žijí v audio-convert.tsx jako pojmenované exporty a ostatní media nástroje
// je importují — batch agent smí vytvářet jen své <slug>.tsx soubory.
import type { ToolComponent } from "@/components/tools/registry/data";

import AudioConvert from "@/components/tools/tools/audio-convert";
import AudioTrimNormalize from "@/components/tools/tools/audio-trim-normalize";
import AudioWaveform from "@/components/tools/tools/audio-waveform";
import VideoCompress from "@/components/tools/tools/video-compress";
import VideoConvert from "@/components/tools/tools/video-convert";
import VideoExtractAudio from "@/components/tools/tools/video-extract-audio";
import VideoMerge from "@/components/tools/tools/video-merge";
import VideoTargetSize from "@/components/tools/tools/video-target-size";
import VideoThumbnail from "@/components/tools/tools/video-thumbnail";
import VideoToGif from "@/components/tools/tools/video-to-gif";
import VideoTrim from "@/components/tools/tools/video-trim";

const MEDIA: Record<string, ToolComponent | undefined> = {
  "audio-convert": AudioConvert,
  "audio-trim-normalize": AudioTrimNormalize,
  "audio-waveform": AudioWaveform,
  "video-compress": VideoCompress,
  "video-convert": VideoConvert,
  "video-extract-audio": VideoExtractAudio,
  "video-merge": VideoMerge,
  "video-target-size": VideoTargetSize,
  "video-thumbnail": VideoThumbnail,
  "video-to-gif": VideoToGif,
  "video-trim": VideoTrim,
};

export default MEDIA;