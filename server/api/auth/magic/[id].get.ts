/**
 * Links mailed before the token moved to /masuk still land here. A GET never
 * spends the token (a mail scanner would); it hands it to the page that does.
 */
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!;
  return sendRedirect(event, `/masuk?t=${encodeURIComponent(id)}`);
});
