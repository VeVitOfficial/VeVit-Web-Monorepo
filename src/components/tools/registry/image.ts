// Registr obrazových nástrojů — viz konvence v pdf.ts.
// screenshot-tool je server-side (legacy HTML nemá .tool-tool tělo) → undefined (shell ukáže placeholder).
import type { ToolComponent } from "@/components/tools/registry/data";
import BgRemover from "@/components/tools/tools/bg-remover";
import FaviconGenerator from "@/components/tools/tools/favicon-generator";
import GifMaker from "@/components/tools/tools/gif-maker";
import ImageCollage from "@/components/tools/tools/image-collage";
import ImageConvert from "@/components/tools/tools/image-convert";
import ImageCrop from "@/components/tools/tools/image-crop";
import ImageExif from "@/components/tools/tools/image-exif";
import ImageFilters from "@/components/tools/tools/image-filters";
import ImageRotateFlip from "@/components/tools/tools/image-rotate-flip";
import ImageWatermark from "@/components/tools/tools/image-watermark";
import ImgCompress from "@/components/tools/tools/img-compress";
import ImgUpscaler from "@/components/tools/tools/img-upscaler";
import MemeGenerator from "@/components/tools/tools/meme-generator";

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
  "screenshot-tool": undefined,
};

export default IMAGE;