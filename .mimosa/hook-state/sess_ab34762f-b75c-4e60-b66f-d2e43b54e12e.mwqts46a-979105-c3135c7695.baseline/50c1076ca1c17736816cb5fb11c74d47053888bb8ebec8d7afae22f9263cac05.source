// Registr security nástrojů — mapuje slug → React komponenta.
//
// Každý nástroj žije v src/components/tools/tools/<slug>.tsx a exportuje
// default React komponentu s props { locale: Locale }. Komponenta renderuje
// POUZE vnitřní tělo nástroje (obsah .tool-tool) — shell dodává stránka
// src/app/tools/[tool]/page.tsx. ClassName zůstávají totožné s legacy HTML,
// aby src/styles/tools.css styl fungoval.
//
// UMD knihovny (md5, qrcode-generator) se načítají líně z /tools/assets/js/lib/
// přes loadScript() — žádné npm závislosti. Web Crypto API (crypto.subtle)
// pro SHA/ AES-GCM/ PBKDF2/ HMAC-SHA1. TOTP RFC 6238 počítáno ručně (HMAC-SHA1).
// Steganografie přes canvas getImageData/putImageData (LSB v RGB kanálech).
//
// certificate-info: legacy volá /tools/api/ssl-check.php (PHP endpoint na VPS),
// který nebyl portován na Vercel — fetch zůstává 1:1, ale endpoint vrací 404.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";

const CertificateInfo = dynamic(() => import("@/components/tools/tools/certificate-info"), { loading: ToolBodySkeleton });
const EncryptDecrypt = dynamic(() => import("@/components/tools/tools/encrypt-decrypt"), { loading: ToolBodySkeleton });
const FileEncryption = dynamic(() => import("@/components/tools/tools/file-encryption"), { loading: ToolBodySkeleton });
const HashGen = dynamic(() => import("@/components/tools/tools/hash-gen"), { loading: ToolBodySkeleton });
const PasswordBreachCheck = dynamic(() => import("@/components/tools/tools/password-breach-check"), { loading: ToolBodySkeleton });
const PasswordGen = dynamic(() => import("@/components/tools/tools/password-gen"), { loading: ToolBodySkeleton });
const PasswordStrength = dynamic(() => import("@/components/tools/tools/password-strength"), { loading: ToolBodySkeleton });
const Steganography = dynamic(() => import("@/components/tools/tools/steganography"), { loading: ToolBodySkeleton });
const TokenGenerator = dynamic(() => import("@/components/tools/tools/token-generator"), { loading: ToolBodySkeleton });
const TotpGenerator = dynamic(() => import("@/components/tools/tools/totp-generator"), { loading: ToolBodySkeleton });

const SECURITY: Record<string, ToolComponent | undefined> = {
  "certificate-info": CertificateInfo,
  "encrypt-decrypt": EncryptDecrypt,
  "file-encryption": FileEncryption,
  "hash-gen": HashGen,
  "password-breach-check": PasswordBreachCheck,
  "password-gen": PasswordGen,
  "password-strength": PasswordStrength,
  steganography: Steganography,
  "token-generator": TokenGenerator,
  "totp-generator": TotpGenerator,
};

export default SECURITY;