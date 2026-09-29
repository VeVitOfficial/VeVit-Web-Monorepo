import { Config } from "@remotion/cli/config";

// Kvalitní H.264 pro sdílení (CRF 18 ≈ vizuálně bezeztrátové).
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);

// Volitelně vlastní Chrome/Chromium (např. předinstalovaný headless shell).
if (process.env.PROMO_CHROMIUM) {
  Config.setBrowserExecutable(process.env.PROMO_CHROMIUM);
}
