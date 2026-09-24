// h3's auto-imported createError, for server utils that throw it.
(globalThis as Record<string, unknown>).createError = (o: { statusCode: number; statusMessage?: string }) =>
  Object.assign(new Error(o.statusMessage ?? 'error'), o);
