"use client";

import { useEffect, useRef, useState } from "react";
import { accountT as t, type AccountLocale } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { useSession, type AccountUser } from "../session";
import { Avatar } from "../ui";

/**
 * Port of the profile panel: avatar card (upload/remove) + PROFILE_FIELDS
 * form with nickname availability debounce — saveProfile/hydrateProfileForm
 * from app.js.
 */

const PROFILE_FIELDS = ["full_name", "nickname", "bio", "phone", "location", "birth_date"] as const;
type ProfileField = (typeof PROFILE_FIELDS)[number];
type ProfileDraft = Record<ProfileField, string>;

function profileFromUser(user: AccountUser): ProfileDraft {
  return Object.fromEntries(
    PROFILE_FIELDS.map((key) => [key, typeof user[key] === "string" ? (user[key] as string) : ""]),
  ) as ProfileDraft;
}

const NICKNAME_RE = /^[a-z0-9_.]{3,30}$/i;

export function ProfileSection() {
  const locale = useAccountLocale();
  const { user, setUser, showToast } = useSession();
  const run = useAccountApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [original, setOriginal] = useState<ProfileDraft>(() => profileFromUser(user));
  const [draft, setDraft] = useState<ProfileDraft>(original);
  const [nicknameAvailable, setNicknameAvailable] = useState(true);
  const [nicknamePending, setNicknamePending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const nicknameTimer = useRef<number | null>(null);

  const setField = (key: ProfileField, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const isDirty = PROFILE_FIELDS.some((key) => (draft[key] || "") !== (original[key] || ""));
  const validationErrors = validate(draft, original.nickname, nicknameAvailable, locale);

  function scheduleNicknameCheck(nickname: string) {
    if (nicknameTimer.current !== null) window.clearTimeout(nicknameTimer.current);
    if (nickname === original.nickname || !NICKNAME_RE.test(nickname)) {
      setNicknameAvailable(true);
      setNicknamePending(false);
      return;
    }
    setNicknamePending(true);
    nicknameTimer.current = window.setTimeout(async () => {
      try {
        const result = await run<{ available: boolean }>(`nickname-availability.php?nickname=${encodeURIComponent(nickname)}`);
        if (draft.nickname.trim() === nickname) setNicknameAvailable(Boolean(result.available));
      } catch (error) {
        console.error("Nickname availability failed", error);
        if (draft.nickname.trim() === nickname) setNicknameAvailable(false);
      } finally {
        if (draft.nickname.trim() === nickname) setNicknamePending(false);
      }
    }, 350);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(validationErrors).length > 0 || !isDirty) return;
    setSaving(true);
    const patch = Object.fromEntries(PROFILE_FIELDS.map((key) => [key, draft[key].trim()]));
    try {
      const result = await run<{ user: AccountUser }>("profile-update.php", { method: "PATCH", body: patch });
      const nextUser = (result.user as AccountUser) || { ...user, ...patch };
      setUser(nextUser);
      const nextOriginal = profileFromUser(nextUser);
      setOriginal(nextOriginal);
      setDraft(nextOriginal);
      showToast(t("profile.saved", locale));
    } catch (error) {
      console.error("Profile save failed", error);
      if (error instanceof Error && "field" in error && (error as { field?: string }).field === "nickname") {
        setNicknameAvailable(false);
      }
      showToast(error instanceof Error ? error.message : t("profile.saveFailed", locale), "error");
    } finally {
      setSaving(false);
    }
  }

  function uploadAvatar(file: File | undefined) {
    if (!file || uploading) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      showToast(t("avatar.invalidType", locale), "error");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    fetch("/account/api/avatar-upload.php", { method: "POST", credentials: "same-origin", body: form })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || t("avatar.uploadFailed", locale));
        setUser({ ...user, avatar_url: payload.avatar_url || "" });
        showToast(t("avatar.uploaded", locale));
      })
      .catch((error) => {
        console.error("Avatar upload failed", error);
        showToast(error instanceof Error ? error.message : t("avatar.uploadFailed", locale), "error");
      })
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  async function removeAvatar() {
    const avatarUrl = typeof user.avatar_url === "string" ? user.avatar_url.trim() : "";
    if (!avatarUrl || !confirm(t("avatar.removeConfirm", locale))) return;
    try {
      await run("avatar-remove.php", { method: "POST", body: {} });
      setUser({ ...user, avatar_url: "" });
      showToast(t("avatar.removed", locale));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("avatar.removeFailed", locale), "error");
    }
  }

  // Unsaved-changes guard for tab close/reload (parity with beforeunload in app.js).
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  });

  const avatarUrl = typeof user.avatar_url === "string" ? user.avatar_url.trim() : "";
  const initials = initialsFor(user);

  return (
    <section>
      <article className="card profile-avatar-card">
        <div className="profile-avatar-card__preview">
          <button
            className="avatar avatar--lg avatar-upload-trigger"
            type="button"
            aria-label={t("profile.changePhotoAria", locale)}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar url={avatarUrl} initials={initials} className="avatar__initials" />
          </button>
          <div>
            <h2>{t("profile.photoTitle", locale)}</h2>
            <p>{t("profile.photoHint", locale)}</p>
            <div className="avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => uploadAvatar(event.target.files?.[0])}
              />
              <button className="btn btn--ghost btn--sm" type="button" disabled={!avatarUrl || uploading} onClick={removeAvatar}>
                {t("profile.removeBtn", locale)}
              </button>
            </div>
          </div>
        </div>
      </article>

      <form className="card profile-form" noValidate onSubmit={save}>
        <div className="card-heading">
          <div>
            <h2>{t("profile.personalTitle", locale)}</h2>
            <p>{t("profile.personalDesc", locale)}</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field--wide">
            <label htmlFor="profFullName">{t("profile.fullName", locale)}</label>
            <input
              id="profFullName"
              className="input"
              name="full_name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              value={draft.full_name}
              aria-invalid={validationErrors.full_name ? "true" : "false"}
              onChange={(event) => setField("full_name", event.target.value)}
            />
            <span className="field-message" aria-live="polite">{validationErrors.full_name || ""}</span>
          </div>
          <div className="form-field form-field--wide">
            <label htmlFor="profNickname">{t("profile.nickname", locale)}</label>
            <input
              id="profNickname"
              className="input input--mono"
              name="nickname"
              type="text"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              required
              aria-describedby="nicknameHint nicknameError"
              value={draft.nickname}
              aria-invalid={validationErrors.nickname ? "true" : "false"}
              onChange={(event) => {
                setField("nickname", event.target.value);
                scheduleNicknameCheck(event.target.value.trim());
              }}
            />
            <span className="field-hint" id="nicknameHint">{t("profile.nicknameHint", locale)}</span>
            <span className="field-message" id="nicknameError" aria-live="polite">
              {nicknamePending ? t("profile.checkingAvailability", locale) : (validationErrors.nickname || "")}
            </span>
          </div>
          <div className="form-field form-field--wide">
            <label htmlFor="profEmail">{t("profile.email", locale)}</label>
            <input id="profEmail" className="input input--mono" type="email" autoComplete="email" readOnly aria-describedby="emailHint" value={user.email || ""} />
            <span className="field-hint" id="emailHint">{t("profile.emailHint", locale)}</span>
          </div>
          <div className="form-field form-field--wide">
            <label htmlFor="profBio">{t("profile.bio", locale)}</label>
            <textarea
              id="profBio"
              className="input"
              name="bio"
              rows={4}
              maxLength={300}
              placeholder={t("profile.bioPlaceholder", locale)}
              value={draft.bio}
              onChange={(event) => setField("bio", event.target.value)}
            />
            <span className="field-hint"><span>{draft.bio.length}</span><span>{t("profile.bioCountSuffix", locale)}</span></span>
          </div>
          <div className="form-field">
            <label htmlFor="profPhone">{t("profile.phone", locale)}</label>
            <input id="profPhone" className="input" name="phone" type="tel" autoComplete="tel" maxLength={40} value={draft.phone} onChange={(event) => setField("phone", event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="profLocation">{t("profile.location", locale)}</label>
            <input id="profLocation" className="input" name="location" type="text" autoComplete="address-level2" maxLength={100} value={draft.location} onChange={(event) => setField("location", event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="profBirthDate">{t("profile.birthDate", locale)}</label>
            <input id="profBirthDate" className="input" name="birth_date" type="date" autoComplete="bday" value={draft.birth_date} onChange={(event) => setField("birth_date", event.target.value)} />
          </div>
        </div>

        <div className="form-actions">
          <span className="form-status" role="status" aria-live="polite">{saving ? t("profile.saving", locale) : ""}</span>
          <button id="saveProfileBtn" className="btn btn--primary" type="submit" disabled={!isDirty || Object.keys(validationErrors).length > 0 || nicknamePending || saving} aria-busy={saving}>
            <span className="button-spinner" aria-hidden="true" />
            <span>{t("profile.save", locale)}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

function validate(draft: ProfileDraft, originalNickname: string, available: boolean, locale: AccountLocale): { full_name?: string; nickname?: string } {
  const errors: { full_name?: string; nickname?: string } = {};
  if (draft.full_name.trim().length < 2) errors.full_name = t("profile.errorFullName", locale);
  if (!NICKNAME_RE.test(draft.nickname.trim())) {
    errors.nickname = t("profile.errorNicknameFormat", locale);
  } else if (!available && draft.nickname.trim() !== originalNickname) {
    errors.nickname = t("profile.errorNicknameTaken", locale);
  }
  return errors;
}

function initialsFor(user: AccountUser): string {
  const source = (user.full_name || user.nickname || user.email || "").trim();
  if (!source) return "VV";
  const words = source.split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return raw.toLocaleUpperCase("cs-CZ");
}