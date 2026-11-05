// Registr obrazových nástrojů — viz konvence v pdf.ts.
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
import ScreenshotTool from "@/components/tools/tools/screenshot-tool";


import ImageResize from "@/components/tools/tools/image-resize";
import ImageAddText from "@/components/tools/tools/image-add-text";
import ImageBorder from "@/components/tools/tools/image-border";
import ImagePixelate from "@/components/tools/tools/image-pixelate";
import ImageRound from "@/components/tools/tools/image-round";
import ImageSplitter from "@/components/tools/tools/image-splitter";
import ChartMaker from "@/components/tools/tools/chart-maker";
import ImageBw from "@/components/tools/tools/image-bw";
import BlurBackground from "@/components/tools/tools/blur-background";
import HeicToJpg from "@/components/tools/tools/heic-to-jpg";

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