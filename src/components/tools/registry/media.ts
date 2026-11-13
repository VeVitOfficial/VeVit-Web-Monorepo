// Registr media nástrojů — mapuje slug → React komponenta.
// Konvence viz src/components/tools/registry/index.ts. Každý nástroj žije v
// src/components/tools/tools/<slug>.tsx a exportuje default ({ locale }).
// Sdílené helpery (Dropzone / FileList / Progress / ResultArea / ffmpeg loadery)
// žijí v audio-convert.tsx jako pojmenované exporty a ostatní media nástroje
// je importují — batch agent smí vytvářet jen své <slug>.tsx soubory.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";

const AudioConvert = dynamic(() => import("@/components/tools/tools/audio-convert"), { loading: ToolBodySkeleton });
const AudioTrimNormalize = dynamic(() => import("@/components/tools/tools/audio-trim-normalize"), { loading: ToolBodySkeleton });
const AudioWaveform = dynamic(() => import("@/components/tools/tools/audio-waveform"), { loading: ToolBodySkeleton });
const VideoCompress = dynamic(() => import("@/components/tools/tools/video-compress"), { loading: ToolBodySkeleton });
const VideoConvert = dynamic(() => import("@/components/tools/tools/video-convert"), { loading: ToolBodySkeleton });
const VideoExtractAudio = dynamic(() => import("@/components/tools/tools/video-extract-audio"), { loading: ToolBodySkeleton });
const VideoMerge = dynamic(() => import("@/components/tools/tools/video-merge"), { loading: ToolBodySkeleton });
const VideoTargetSize = dynamic(() => import("@/components/tools/tools/video-target-size"), { loading: ToolBodySkeleton });
const VideoThumbnail = dynamic(() => import("@/components/tools/tools/video-thumbnail"), { loading: ToolBodySkeleton });
const VideoToGif = dynamic(() => import("@/components/tools/tools/video-to-gif"), { loading: ToolBodySkeleton });
const VideoTrim = dynamic(() => import("@/components/tools/tools/video-trim"), { loading: ToolBodySkeleton });


const VideoResize = dynamic(() => import("@/components/tools/tools/video-resize"), { loading: ToolBodySkeleton });
const VideoMute = dynamic(() => import("@/components/tools/tools/video-mute"), { loading: ToolBodySkeleton });
const VideoToWebp = dynamic(() => import("@/components/tools/tools/video-to-webp"), { loading: ToolBodySkeleton });

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
  "video-resize": VideoResize,
  "video-mute": VideoMute,
  "video-to-webp": VideoToWebp,
  // coming_soon — bez komponenty (plánovaný Amazon Transcribe)
  "audio-to-text": undefined,

};

export default MEDIA;