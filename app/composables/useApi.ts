import type { FetchError } from 'ofetch';

/** The message a route handler put in statusMessage, or a fallback. */
export function apiError(e: unknown, fallback = 'Ada masalah, cuba lagi') {
  const f = e as FetchError;
  return f?.data?.statusMessage || f?.data?.message || f?.statusMessage || f?.message || fallback;
}
