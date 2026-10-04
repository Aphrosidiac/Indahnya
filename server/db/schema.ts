import { sql } from 'drizzle-orm';
import {
  pgTable, text, timestamp, integer, bigint, boolean, jsonb, primaryKey, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Indahnya's tables. One event = one majlis = one QR. Plans are one-time
 * purchases that stretch two clocks: the upload window and the storage window.
 * Ids are ULIDs (sortable, unguessable enough for media keys) except where a
 * cookie token needs more entropy.
 */

export type Plan = 'free' | 'std' | 'full';
export type EventType = 'kahwin' | 'aqiqah' | 'birthday' | 'corporate' | 'graduation' | 'lain';
export type MediaKind = 'photo' | 'video' | 'audio';
export type MediaStatus = 'pending' | 'uploaded' | 'ready' | 'hidden' | 'failed' | 'deleted';

export interface EventNames { a: string; b?: string; short?: string }
export interface EventVenue { name?: string; address?: string; waze?: string; gmaps?: string }
export interface EventSettings {
  locale: 'ms' | 'en';
  approvalMode: boolean;
  modules: { gambar: boolean; ucapan: boolean; rsvp: boolean; tempat: boolean; kad: boolean };
  slideshow: { intervalSec: number; showNames: boolean; shuffle: boolean };
  guestDeleteHours: number;
  /** Retention mails already sent for the current storage clock (reset when a payment moves it). */
  notified?: string[];
  /** The landing's sample gallery: readable by anyone, never accepts uploads. */
  demo?: boolean;
  /** The landing's "cuba sekarang" sandbox: a visitor sees only their own uploads, and everything goes within the hour. */
  sandbox?: boolean;
  /** RSVP form: closes after `deadline` (YYYY-MM-DD, end of that day MYT); pax per reply; optional meal choices; ask which side. */
  rsvp?: { deadline: string | null; maxPax: number; meals: string[]; sides: boolean };
}

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  googleSub: text('google_sub'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('users_email_uq').on(t.email)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One-shot sign-in links. Consumed on first use, dead after 15 minutes. */
export const loginTokens = pgTable('login_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  next: text('next'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  slug: text('slug').notNull(),
  type: text('type').$type<EventType>().notNull().default('kahwin'),
  title: text('title').notNull(),
  names: jsonb('names').$type<EventNames>().notNull(),
  date: timestamp('date', { withTimezone: true }),
  venue: jsonb('venue').$type<EventVenue>().notNull().default({}),
  plan: text('plan').$type<Plan>().notNull().default('free'),
  planPaidAt: timestamp('plan_paid_at', { withTimezone: true }),
  uploadWindowEndsAt: timestamp('upload_window_ends_at', { withTimezone: true }).notNull(),
  storageEndsAt: timestamp('storage_ends_at', { withTimezone: true }).notNull(),
  settings: jsonb('settings').$type<EventSettings>().notNull(),
  /** The TV page's bearer. Rotated from Tetapan. */
  tvToken: text('tv_token').notNull(),
  /** Set when the retention sweep has purged R2; the row stays for the host's history. */
  purgedAt: timestamp('purged_at', { withTimezone: true }),
  /** Set when the owner deletes the majlis. Unlike a retention purge, a deleted majlis leaves the host's list. */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('events_slug_uq').on(t.slug), index('events_owner_idx').on(t.ownerId)]);

export const eventMembers = pgTable('event_members', {
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').$type<'owner' | 'cohost'>().notNull(),
}, t => [primaryKey({ columns: [t.eventId, t.userId] })]);

/** A guest is a browser, not a person: the cookie token is the identity. */
export const guests = pgTable('guests', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name'),
  token: text('token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('guests_token_uq').on(t.token), index('guests_event_idx').on(t.eventId)]);

export const media = pgTable('media', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  guestId: text('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  kind: text('kind').$type<MediaKind>().notNull(),
  status: text('status').$type<MediaStatus>().notNull().default('pending'),
  /**
   * The original, always in the PRIVATE bucket (it still carries EXIF, GPS
   * included). `key`/`thumbKey`/`posterKey` are the served copies: in the
   * public bucket while `ready`, in the private one while `hidden`.
   */
  originalKey: text('original_key').notNull(),
  key: text('key'),
  thumbKey: text('thumb_key'),
  posterKey: text('poster_key'),
  mime: text('mime').notNull(),
  bytes: bigint('bytes', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  durationSec: integer('duration_sec'),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readyAt: timestamp('ready_at', { withTimezone: true }),
}, t => [index('media_event_status_idx').on(t.eventId, t.status, t.createdAt)]);

export const reactions = pgTable('reactions', {
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  guestId: text('guest_id').notNull().references(() => guests.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'love' | 'party' | 'cry'>().notNull(),
}, t => [primaryKey({ columns: [t.mediaId, t.guestId] })]);

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  guestId: text('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  name: text('name'),
  kind: text('kind').$type<'text' | 'audio'>().notNull(),
  body: text('body'),
  mediaId: text('media_id').references(() => media.id, { onDelete: 'set null' }),
  /**
   * visible / hidden as for photos (hidden audio lives in the private bucket);
   * `pending` is a voice note whose upload has not landed yet, `processing`
   * one being transcoded, `failed` one that could not be read. Only
   * `visible` is ever shown to guests.
   */
  status: text('status').$type<'visible' | 'hidden' | 'pending' | 'processing' | 'failed' | 'deleted'>().notNull().default('visible'),
  /** Voice ucapan: the processed m4a (public while visible) and the upload it came from (private). */
  audioKey: text('audio_key'),
  audioSrcKey: text('audio_src_key'),
  durationSec: integer('duration_sec'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('messages_event_idx').on(t.eventId, t.createdAt)]);

export const tables = pgTable('tables', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull().default(10),
  sort: integer('sort').notNull().default(0),
});

export const rsvps = pgTable('rsvps', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  guestId: text('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  phone: text('phone'),
  attending: boolean('attending').notNull(),
  pax: integer('pax').notNull().default(1),
  side: text('side').$type<'lelaki' | 'perempuan' | 'rakan' | 'lain'>(),
  meal: text('meal'),
  note: text('note'),
  tableId: text('table_id').references(() => tables.id, { onDelete: 'set null' }),
  /** Digits-only form of `phone` (60123456789), so a guest on a second phone finds their own reply. */
  phoneKey: text('phone_key'),
  /** Who wrote it: a guest's browser, or the host adding a reply taken by phone. */
  source: text('source').$type<'guest' | 'host'>().notNull().default('guest'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('rsvps_event_idx').on(t.eventId),
  /** One reply per browser, enforced by the database: two open tabs cannot make two. */
  uniqueIndex('rsvps_guest_uq').on(t.eventId, t.guestId).where(sql`${t.guestId} is not null`),
  index('rsvps_phone_idx').on(t.eventId, t.phoneKey),
]);

export const kad = pgTable('kad', {
  eventId: text('event_id').primaryKey().references(() => events.id, { onDelete: 'cascade' }),
  template: text('template').notNull().default('garden'),
  fields: jsonb('fields').$type<Record<string, unknown>>().notNull().default({}),
  musicKey: text('music_key'),
  ogKey: text('og_key'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  stripeSessionId: text('stripe_session_id').notNull(),
  plan: text('plan').$type<Plan>().notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status').$type<'open' | 'paid' | 'expired'>().notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
}, t => [uniqueIndex('payments_session_uq').on(t.stripeSessionId)]);

/** Work for the media worker. A row per upload; claimed with SKIP LOCKED. */
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  kind: text('kind').$type<'process_media' | 'purge_event' | 'zip_event' | 'kad_gc'>().notNull(),
  ref: text('ref').notNull(),
  attempts: integer('attempts').notNull().default(0),
  runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  doneAt: timestamp('done_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('jobs_queue_idx').on(t.doneAt, t.runAfter)]);
