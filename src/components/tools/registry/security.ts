// Registr security nástrojů — mapuje slug → React komponenta.
//
// Každý nástroj žije v src/components/tools/tools/<slug>.tsx a exportuje
// default React komponentu s props { locale: Locale }. Komponenta renderuje
// POUZE vnitřní tělo nástroje (obsah .tool-tool) — shell dodává stránka
// src/app/tools/[tool]/page.tsx. ClassName zůstávají totožné s legacy HTML,
// aby public/tools/assets/css/style.css styl fungoval.
//
// UMD knihovny (md5, qrcode-generator) se načítají líně z /tools/assets/js/lib/
// přes loadScript() — žádné npm závislosti. Web Crypto API (crypto.subtle)
// pro SHA/ AES-GCM/ PBKDF2/ HMAC-SHA1. TOTP RFC 6238 počítáno ručně (HMAC-SHA1).
// Steganografie přes canvas getImageData/putImageData (LSB v RGB kanálech).
//
// certificate-info: legacy volá /tools/api/ssl-check.php (PHP endpoint na VPS),
// který nebyl portován na Vercel — fetch zůstává 1:1, ale endpoint vrací 404.
import type { ToolComponent } from "@/components/tools/registry/data";

import CertificateInfo from "@/components/tools/tools/certificate-info";
import EncryptDecrypt from "@/components/tools/tools/encrypt-decrypt";
import FileEncryption from "@/components/tools/tools/file-encryption";
import HashGen from "@/components/tools/tools/hash-gen";
import PasswordBreachCheck from "@/components/tools/tools/password-breach-check";
import PasswordGen from "@/components/tools/tools/password-gen";
import PasswordStrength from "@/components/tools/tools/password-strength";
import Steganography from "@/components/tools/tools/steganography";
import TokenGenerator from "@/components/tools/tools/token-generator";
import TotpGenerator from "@/components/tools/tools/totp-generator";

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