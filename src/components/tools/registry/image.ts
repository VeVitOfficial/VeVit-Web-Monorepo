// Registr obrazových nástrojů — viz konvence v pdf.ts.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";
const BgRemover = dynamic(() => import("@/components/tools/tools/bg-remover"), { loading: ToolBodySkeleton });
const FaviconGenerator = dynamic(() => import("@/components/tools/tools/favicon-generator"), { loading: ToolBodySkeleton });
const GifMaker = dynamic(() => import("@/components/tools/tools/gif-maker"), { loading: ToolBodySkeleton });
const ImageCollage = dynamic(() => import("@/components/tools/tools/image-collage"), { loading: ToolBodySkeleton });
const ImageConvert = dynamic(() => import("@/components/tools/tools/image-convert"), { loading: ToolBodySkeleton });
const ImageCrop = dynamic(() => import("@/components/tools/tools/image-crop"), { loading: ToolBodySkeleton });
const ImageExif = dynamic(() => import("@/components/tools/tools/image-exif"), { loading: ToolBodySkeleton });
const ImageFilters = dynamic(() => import("@/components/tools/tools/image-filters"), { loading: ToolBodySkeleton });
const ImageRotateFlip = dynamic(() => import("@/components/tools/tools/image-rotate-flip"), { loading: ToolBodySkeleton });
const ImageWatermark = dynamic(() => import("@/components/tools/tools/image-watermark"), { loading: ToolBodySkeleton });
const ImgCompress = dynamic(() => import("@/components/tools/tools/img-compress"), { loading: ToolBodySkeleton });
const ImgUpscaler = dynamic(() => import("@/components/tools/tools/img-upscaler"), { loading: ToolBodySkeleton });
const MemeGenerator = dynamic(() => import("@/components/tools/tools/meme-generator"), { loading: ToolBodySkeleton });
const ScreenshotTool = dynamic(() => import("@/components/tools/tools/screenshot-tool"), { loading: ToolBodySkeleton });


const ImageResize = dynamic(() => import("@/components/tools/tools/image-resize"), { loading: ToolBodySkeleton });
const ImageAddText = dynamic(() => import("@/components/tools/tools/image-add-text"), { loading: ToolBodySkeleton });
const ImageBorder = dynamic(() => import("@/components/tools/tools/image-border"), { loading: ToolBodySkeleton });
const ImagePixelate = dynamic(() => import("@/components/tools/tools/image-pixelate"), { loading: ToolBodySkeleton });
const ImageRound = dynamic(() => import("@/components/tools/tools/image-round"), { loading: ToolBodySkeleton });
const ImageSplitter = dynamic(() => import("@/components/tools/tools/image-splitter"), { loading: ToolBodySkeleton });
const ChartMaker = dynamic(() => import("@/components/tools/tools/chart-maker"), { loading: ToolBodySkeleton });
const ImageBw = dynamic(() => import("@/components/tools/tools/image-bw"), { loading: ToolBodySkeleton });
const BlurBackground = dynamic(() => import("@/components/tools/tools/blur-background"), { loading: ToolBodySkeleton });
const HeicToJpg = dynamic(() => import("@/components/tools/tools/heic-to-jpg"), { loading: ToolBodySkeleton });

const IMAGE: Record<string, ToolComponent | undefined> = {
  "bg-remover": BgRemover,
  "favicon-generator": FaviconGenerator,
  "gif-maker": GifMaker,
  "image-collage": ImageCollage,
  "image-convert": ImageConvert,
  "image-crop": ImageCrop,
  "image-exif": ImageExif,
  "image-filters": ImageFilters,
  "image-rotate-flip": ImageRotateFlip,
  "image-watermark": ImageWatermark,
  "img-compress": ImgCompress,
  "img-upscaler": ImgUpscaler,
  "meme-generator": MemeGenerator,
  "screenshot-tool": ScreenshotTool,
  "image-resize": ImageResize,
  "image-add-text": ImageAddText,
  "image-border": ImageBorder,
  "image-pixelate": ImagePixelate,
  "image-round": ImageRound,
  "image-splitter": ImageSplitter,
  "chart-maker": ChartMaker,
  "image-bw": ImageBw,
  "blur-background": BlurBackground,
  "heic-to-jpg": HeicToJpg,

};

export default IMAGE;