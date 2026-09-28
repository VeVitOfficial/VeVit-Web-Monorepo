"use client";

// Lokální progress AI gramotnosti v localStorage (port gamification.js).
// Klíč i tvar dat zůstávají stejné, takže postup z původní aplikace se zachová.

import { useSyncExternalStore } from "react";
import type { CourseDetail } from "./types";

const KEY = "aigram_progress_v1";
const MAX_LEVEL = 50;

export interface ProgressData {
  completedLessons: number[];
  totalXp: number;
  streak: number;
  longestStreak: number;
  lastActivity: string | null;
  achievements: number[];
  exerciseBest: Record<string, number>;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 1, name: "První kroky", description: "Dokonči 1 lekci", icon: "zap", condition_type: "lessons_count", condition_value: 1, xp_reward: 50 },
  { id: 2, name: "Prompt Wizard", description: "100 % v 5 cvičeních", icon: "brain", condition_type: "perfect_exercises", condition_value: 5, xp_reward: 100 },
  { id: 3, name: "Streak Master", description: "7 dní v řadě", icon: "flame", condition_type: "streak", condition_value: 7, xp_reward: 75 },
  { id: 4, name: "Speedrunner", description: "Rychlé dokončování", icon: "zap", condition_type: "lessons_count", condition_value: 10, xp_reward: 50 },
  { id: 5, name: "Perfectionist", description: "Dokonči kapitolu celou", icon: "trophy", condition_type: "perfect_chapter", condition_value: 1, xp_reward: 100 },
  { id: 6, name: "Code Poet", description: "Všechna kódová cvičení", icon: "zap", condition_type: "all_code_exercises", condition_value: 1, xp_reward: 75 },
  { id: 7, name: "RAG Pioneer", description: "Dokonči kapitolu 5", icon: "brain", condition_type: "chapter_complete", condition_value: 5, xp_reward: 50 },
  { id: 8, name: "Full Stack", description: "Dokonči celý kurz", icon: "trophy", condition_type: "course_complete", condition_value: 1, xp_reward: 200 },
  { id: 9, name: "Early Bird", description: "Otevři kurz před 8:00", icon: "zap", condition_type: "login_before_hour", condition_value: 8, xp_reward: 25 },
  { id: 10, name: "Night Owl", description: "Studuj po 22:00", icon: "brain", condition_type: "login_after_hour", condition_value: 22, xp_reward: 25 },
];

function empty(): ProgressData {
  return { completedLessons: [], totalXp: 0, streak: 0, longestStreak: 0, lastActivity: null, achievements: [], exerciseBest: {} };
}

const EMPTY = empty();
let data: ProgressData | null = null;
const listeners = new Set<() => void>();

function load(): ProgressData {
  if (data) return data;
  try {
    data = { ...empty(), ...(JSON.parse(window.localStorage.getItem(KEY) || "null") || {}) };
  } catch {
    data = empty();
  }
  return data as ProgressData;
}

function save(next: ProgressData) {
  data = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Úložiště nedostupné: postup platí jen do obnovení stránky.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function levelFromXp(totalXp: number): number {
  return Math.min(MAX_LEVEL, Math.floor(Math.sqrt((totalXp || 0) / 100)) + 1);
}

export function xpIntoNextLevel(totalXp: number) {
  const level = levelFromXp(totalXp);
  const base = (level - 1) * (level - 1) * 100;
  const next = level * level * 100;
  const into = (totalXp || 0) - base;
  return { level, into, need: next - base, pct: Math.round((into / (next - base)) * 100) };
}

export function formatXP(value: number): string {
  return Number(value || 0).toLocaleString("cs-CZ");
}

function lessonCount(course: CourseDetail | null): number {
  return (course?.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons || []).length, 0);
}

function achievementMet(d: ProgressData, a: Achievement, course: CourseDetail | null): boolean {
  const done = (id: number) => d.completedLessons.includes(Number(id));
  const perfect = Object.values(d.exerciseBest).filter((v) => v >= 100).length;
  switch (a.condition_type) {
    case "lessons_count": return d.completedLessons.length >= a.condition_value;
    case "xp_total": return d.totalXp >= a.condition_value;
    case "streak": return d.streak >= a.condition_value;
    case "perfect_exercises": return perfect >= a.condition_value;
    case "perfect_chapter": return (course?.chapters || []).some((ch) => (ch.lessons || []).every((l) => done(l.id))) ? 1 >= a.condition_value : false;
    case "all_code_exercises": return perfect >= 5;
    case "chapter_complete": {
      const chapter = course?.chapters?.[a.condition_value - 1];
      return Boolean(chapter && (chapter.lessons || []).every((l) => done(l.id)));
    }
    case "course_complete": return Boolean(course) && d.completedLessons.length >= lessonCount(course) && d.completedLessons.length > 0;
    case "login_before_hour": return new Date().getHours() < a.condition_value;
    case "login_after_hour": return new Date().getHours() >= a.condition_value;
    default: return false;
  }
}

function withAchievements(d: ProgressData, course: CourseDetail | null): ProgressData {
  const have = new Set(d.achievements);
  let totalXp = d.totalXp;
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id) || !achievementMet({ ...d, totalXp }, a, course)) continue;
    have.add(a.id);
    totalXp += a.xp_reward;
  }
  return { ...d, totalXp, achievements: [...have] };
}

function bumpStreak(d: ProgressData): ProgressData {
  const today = new Date().toISOString().slice(0, 10);
  let streak = d.streak;
  if (!d.lastActivity) streak = 1;
  else {
    const diff = Math.round((Date.parse(today) - Date.parse(d.lastActivity)) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff !== 0) streak = 1;
  }
  return { ...d, streak, lastActivity: today, longestStreak: Math.max(d.longestStreak || 0, streak) };
}

/** Časové achievementy (Early Bird / Night Owl) při otevření kurzu. */
export function checkAchievements(course: CourseDetail | null) {
  const current = load();
  const next = withAchievements(current, course);
  if (next.achievements.length !== current.achievements.length) save(next);
}

export function completeLesson(lessonId: number, xp: number, course: CourseDetail | null): number {
  const current = load();
  if (current.completedLessons.includes(Number(lessonId))) return 0;
  const multiplier = current.streak >= 30 ? 1.5 : current.streak >= 7 ? 1.2 : current.streak >= 3 ? 1.1 : 1;
  const earned = Math.round(xp * multiplier);
  const next = bumpStreak({ ...current, completedLessons: [...current.completedLessons, Number(lessonId)], totalXp: current.totalXp + earned });
  save(withAchievements(next, course));
  return earned;
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignorujeme
  }
  save(empty());
}
