-- Clocks used to start at creation/payment; they now start at the later of
-- that and the end of the majlis day (see server/utils/plans.ts). Stretch
-- every live event that has a date. Never shortens a clock.
WITH c AS (
  SELECT id,
    greatest(coalesce(plan_paid_at, created_at),
             least(date + interval '1 day', coalesce(plan_paid_at, created_at) + interval '540 days')) AS anchor,
    CASE plan WHEN 'free' THEN 30 WHEN 'std' THEN 183 ELSE 365 END AS up_days,
    CASE plan WHEN 'free' THEN 30 WHEN 'std' THEN 365 ELSE 730 END AS keep_days
  FROM events
  WHERE date IS NOT NULL AND purged_at IS NULL AND deleted_at IS NULL
)
UPDATE events e SET
  upload_window_ends_at = greatest(e.upload_window_ends_at, c.anchor + make_interval(days => c.up_days)),
  storage_ends_at = greatest(e.storage_ends_at, c.anchor + make_interval(days => c.keep_days))
FROM c WHERE e.id = c.id AND coalesce((e.settings->>'demo')::boolean, false) = false;
