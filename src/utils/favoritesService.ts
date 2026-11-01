import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const GUEST_KEY = 'colorlink_favorites_guest';

/**
 * Returns a unique, profile-scoped storage key for favorites based on user identifier (documento, email, or id)
 */
export function getUserFavoritesStorageKey(userIdentifier?: string | null): string {
  if (!userIdentifier || !userIdentifier.trim()) {
    return GUEST_KEY;
  }
  const clean = userIdentifier.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `colorlink_favorites_${clean}`;
}

/**
 * Get stored favorites for a given user profile
 * Returns empty array if user has not added any favorites yet
 */
export function getStoredFavorites(userIdentifier?: string | null): string[] {
  if (!userIdentifier || !userIdentifier.trim()) {
    // Unauthenticated visitors do not have persistent favorites
    return [];
  }

  try {
    const key = getUserFavoritesStorageKey(userIdentifier);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // One-time graceful migration from legacy single-key if user has no personal key yet
    const legacy = localStorage.getItem('colorlink_favorites');
    if (legacy) {
      try {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          localStorage.setItem(key, JSON.stringify(parsedLegacy));
          return parsedLegacy;
        }
      } catch {
        // ignore JSON errors
      }
    }
  } catch (err) {
    console.warn('Error reading favorites from localStorage:', err);
  }

  return [];
}

/**
 * Save favorites list strictly for the authenticated user profile
 */
export function saveStoredFavorites(userIdentifier: string | null | undefined, favorites: string[]): void {
  if (!userIdentifier || !userIdentifier.trim()) {
    return;
  }

  try {
    const key = getUserFavoritesStorageKey(userIdentifier);
    localStorage.setItem(key, JSON.stringify(favorites));

    // Notify components and listeners of the updated favorites
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('colorlink_favorites_updated', {
        detail: { userIdentifier, favorites }
      }));
    }
  } catch (err) {
    console.error('Error saving favorites for user:', err);
  }
}

/**
 * Toggle a product id in favorites list for the current user
 */
export function toggleStoredFavorite(
  userIdentifier: string | null | undefined,
  productId: string,
  currentFavorites: string[]
): string[] {
  const isFav = currentFavorites.includes(productId);
  const updated = isFav 
    ? currentFavorites.filter(id => id !== productId)
    : [...currentFavorites, productId];

  saveStoredFavorites(userIdentifier, updated);
  return updated;
}

/**
 * Attempt to sync favorites with Supabase if table exists
 */
export async function syncFavoritesWithSupabase(
  userIdentifier: string,
  localFavorites: string[]
): Promise<string[]> {
  if (!isSupabaseConfigured || !userIdentifier) {
    return localFavorites;
  }

  try {
    // Check if table 'user_favorites' exists or profiles
    const { data, error } = await supabase
      .from('user_favorites')
      .select('product_id')
      .eq('user_id', userIdentifier);

    if (!error && data && data.length > 0) {
      const remoteIds = data.map((row: any) => row.product_id);
      const merged = Array.from(new Set([...localFavorites, ...remoteIds]));
      saveStoredFavorites(userIdentifier, merged);
      return merged;
    }
  } catch {
    // Table might not exist yet, local storage remains authoritative
  }

  return localFavorites;
}
