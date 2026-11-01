import { useState, useEffect, useMemo } from 'react';

/**
 * Hook seguro para obtener el pathname actual sin romper en SSR o entornos sin enrutador
 */
export function useSafePathname(): string {
  const [pathname, setPathname] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        return window.location.pathname || '/';
      }
    } catch {
      // Fallback seguro
    }
    return '/';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      try {
        setPathname(window.location.pathname || '/');
      } catch {
        // Fallback seguro
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return pathname;
}

/**
 * Hook seguro para obtener información de location (pathname, search, hash)
 */
export function useSafeLocation() {
  const [loc, setLoc] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        return {
          pathname: window.location.pathname || '/',
          search: window.location.search || '',
          hash: window.location.hash || '',
          href: window.location.href || '',
        };
      }
    } catch {
      // Fallback seguro
    }
    return { pathname: '/', search: '', hash: '', href: '' };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      try {
        setLoc({
          pathname: window.location.pathname || '/',
          search: window.location.search || '',
          hash: window.location.hash || '',
          href: window.location.href || '',
        });
      } catch {
        // Fallback seguro
      }
    };

    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return loc;
}

/**
 * Verifica de forma totalmente segura si la ruta o estado actual corresponde a la Intranet / Consola Corporativa
 */
export function checkIsIntranetRoute(options?: {
  userRole?: string | null;
  isCorporateSession?: boolean;
  activeTab?: string | null;
  adminSubTab?: string | null;
}): boolean {
  if (options) {
    if (options.userRole && options.userRole !== 'cliente') return true;
    if (options.isCorporateSession) return true;
    if (options.activeTab === 'admin' || options.activeTab === 'intranet') return true;
  }

  try {
    if (typeof window !== 'undefined' && window.location) {
      const path = (window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      return (
        path.includes('intranet') ||
        path.includes('admin') ||
        path.includes('corporativo') ||
        search.includes('intranet') ||
        search.includes('admin') ||
        search.includes('corporativo') ||
        hash.includes('intranet') ||
        hash.includes('admin') ||
        hash.includes('corporativo')
      );
    }
  } catch (err) {
    console.warn('Inspección de ruta protegida en checkIsIntranetRoute:', err);
  }

  return false;
}
