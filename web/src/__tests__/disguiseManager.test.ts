import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getActiveDisguise,
  setActiveDisguise,
  getDisguiseMetadata,
  getAllDisguises,
  resetDisguise,
  getDisguiseFromSequence,
  getDisguiseFromUrl,
  getDisguiseUrl,
  DISGUISE_STORAGE_KEY,
  DISGUISE_EVENT_NAME,
} from '../services/disguiseManager';

describe('Chameleon Disguise Architecture - Disguise Manager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to MUNICIPAL_PREPAID if no disguise is stored', () => {
    expect(getActiveDisguise()).toBe('MUNICIPAL_PREPAID');
  });

  it('sets and retrieves DAILY_DEVOTIONAL disguise accurately', () => {
    const meta = setActiveDisguise('DAILY_DEVOTIONAL');
    expect(meta.id).toBe('DAILY_DEVOTIONAL');
    expect(meta.name).toBe('Daily Verse SA');
    expect(localStorage.getItem(DISGUISE_STORAGE_KEY)).toBe('DAILY_DEVOTIONAL');
    expect(getActiveDisguise()).toBe('DAILY_DEVOTIONAL');
  });

  it('sets and retrieves MUSIC_PLAYER (Coco Bongo Beats) disguise', () => {
    const meta = setActiveDisguise('MUSIC_PLAYER');
    expect(meta.id).toBe('MUSIC_PLAYER');
    expect(meta.name).toBe('Coco Bongo Beats');
    expect(meta.title).toBe('Edge City Audio & Music');
    expect(localStorage.getItem(DISGUISE_STORAGE_KEY)).toBe('MUSIC_PLAYER');
    expect(getActiveDisguise()).toBe('MUSIC_PLAYER');
  });

  it('sets and retrieves ANDROID_LAUNCHER (Ipkiss Launcher) disguise', () => {
    const meta = setActiveDisguise('ANDROID_LAUNCHER');
    expect(meta.id).toBe('ANDROID_LAUNCHER');
    expect(meta.name).toBe('Ipkiss Launcher');
    expect(meta.title).toBe('Minimalist Mobile Home');
    expect(localStorage.getItem(DISGUISE_STORAGE_KEY)).toBe('ANDROID_LAUNCHER');
    expect(getActiveDisguise()).toBe('ANDROID_LAUNCHER');
  });

  it('switches back to MUNICIPAL_PREPAID and persists correctly', () => {
    setActiveDisguise('MUSIC_PLAYER');
    expect(getActiveDisguise()).toBe('MUSIC_PLAYER');

    const meta = setActiveDisguise('MUNICIPAL_PREPAID');
    expect(meta.id).toBe('MUNICIPAL_PREPAID');
    expect(meta.name).toBe('PowerCalc SA');
    expect(localStorage.getItem(DISGUISE_STORAGE_KEY)).toBe('MUNICIPAL_PREPAID');
    expect(getActiveDisguise()).toBe('MUNICIPAL_PREPAID');
  });

  it('dispatches a custom event when active disguise changes', () => {
    const handler = vi.fn();
    window.addEventListener(DISGUISE_EVENT_NAME, handler);

    setActiveDisguise('MUSIC_PLAYER');
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(DISGUISE_EVENT_NAME, handler);
  });

  it('returns comprehensive metadata for all 4 facades', () => {
    const m1 = getDisguiseMetadata('MUNICIPAL_PREPAID');
    expect(m1.title).toBe('Prepaid Electricity Portal');
    expect(m1.icon).toBe('Zap');
    expect(m1.themeColor).toBe('#0F172A');

    const m2 = getDisguiseMetadata('MUSIC_PLAYER');
    expect(m2.title).toBe('Edge City Audio & Music');
    expect(m2.icon).toBe('Music');
    expect(m2.themeColor).toBe('#09090B');

    const m3 = getDisguiseMetadata('DAILY_DEVOTIONAL');
    expect(m3.title).toBe('Daily Scripture & Devotional');
    expect(m3.icon).toBe('BookOpen');
    expect(m3.themeColor).toBe('#1E1B4B');

    const m4 = getDisguiseMetadata('ANDROID_LAUNCHER');
    expect(m4.title).toBe('Minimalist Mobile Home');
    expect(m4.icon).toBe('LayoutGrid');
    expect(m4.themeColor).toBe('#18181B');
  });

  it('returns all 4 supported disguise configurations', () => {
    const all = getAllDisguises();
    expect(all).toHaveLength(4);
    expect(all.map((d) => d.id)).toEqual([
      'MUNICIPAL_PREPAID',
      'MUSIC_PLAYER',
      'DAILY_DEVOTIONAL',
      'ANDROID_LAUNCHER',
    ]);
  });

  it('maps the 8421-8424 numeric sequences to faces 1-4', () => {
    expect(getDisguiseFromSequence('8421')).toBe('MUNICIPAL_PREPAID');
    expect(getDisguiseFromSequence('8422')).toBe('MUSIC_PLAYER');
    expect(getDisguiseFromSequence('8423')).toBe('DAILY_DEVOTIONAL');
    expect(getDisguiseFromSequence('8424')).toBe('ANDROID_LAUNCHER');
    expect(getDisguiseFromSequence('8426')).toBeNull();
  });

  it('resolves and generates stable same-origin face URLs', () => {
    expect(getDisguiseFromUrl('https://ishekomberera.vercel.app/?face=3')).toBe('DAILY_DEVOTIONAL');
    expect(getDisguiseFromUrl('https://ishekomberera.vercel.app/?face=ANDROID_LAUNCHER')).toBe('ANDROID_LAUNCHER');
    expect(getDisguiseUrl('MUSIC_PLAYER')).toContain('?face=2');
  });

  it('resets disguise state back to MUNICIPAL_PREPAID', () => {
    setActiveDisguise('MUSIC_PLAYER');
    resetDisguise();
    expect(localStorage.getItem(DISGUISE_STORAGE_KEY)).toBeNull();
    expect(getActiveDisguise()).toBe('MUNICIPAL_PREPAID');
  });
});
