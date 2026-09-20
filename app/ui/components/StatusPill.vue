<script setup lang="ts">
import { computed } from 'vue';
/**
 * `status` picks the TONE and the default wording. `label` overrides the
 * wording only.
 *
 * The map below is the shared vocabulary, and a module with states of its own
 * should not have to push them into it — SQL Account's READY and EXPORTED mean
 * nothing to the catalogue, and OPEN already means something else here. So the
 * tone stays shared and the words stay local, rather than a growing map where
 * two modules quietly disagree about one key.
 */
const props = defineProps<{ status: string; label?: string }>();

/** Text is always present — colour never carries the meaning alone. */
const MAP: Record<string, [string, string]> = {
  // catalogue
  DRAFT:        ['Draft',        'bg-line-100 text-ink-500'],
  PUBLISHED:    ['Published',    'bg-success-50 text-success-600'],
  ARCHIVED:     ['Archived',     'bg-line-100 text-ink-500'],
  // stock exceptions
  OPEN:         ['Open',         'bg-danger-50 text-danger-600'],
  RESOLVED:     ['Resolved',     'bg-success-50 text-success-600'],
  // reservations
  HELD:         ['Held',         'bg-warning-50 text-warning-600'],
  COMMITTED:    ['Committed',    'bg-success-50 text-success-600'],
  RELEASED:     ['Released',     'bg-line-100 text-ink-500'],
  EXPIRED:      ['Expired',      'bg-line-100 text-ink-500'],
  // orders
  PAID:         ['Paid',         'bg-success-50 text-success-600'],
  PENDING:      ['Pending',      'bg-warning-50 text-warning-600'],
  REFUNDED:     ['Refunded',     'bg-info-50 text-info-600'],
  VOID:         ['Void',         'bg-line-100 text-ink-500'],
  // bookings
  REQUESTED:    ['Requested',    'bg-line-100 text-ink-500'],
  CONFIRMED:    ['Confirmed',    'bg-info-50 text-info-600'],
  CHECKED_IN:   ['Checked in',   'bg-violet-50 text-violet-600'],
  IN_PROGRESS:  ['In progress',  'bg-violet-50 text-violet-600'],
  COMPLETED:    ['Completed',    'bg-success-50 text-success-600'],
  CANCELLED:    ['Cancelled',    'bg-line-100 text-ink-500'],
  NO_SHOW:      ['No show',      'bg-danger-50 text-danger-600'],
  // livestock
  AVAILABLE:    ['Available',    'bg-success-50 text-success-600'],
  RESERVED:     ['Reserved',     'bg-warning-50 text-warning-600'],
  ON_TRIAL:     ['On trial',     'bg-info-50 text-info-600'],
  SOLD:         ['Sold',         'bg-line-100 text-ink-500'],
  RETURNED:     ['Returned',     'bg-danger-50 text-danger-600'],
  WITHDRAWN:    ['Withdrawn',    'bg-line-100 text-ink-500'],
  // jobs
  created:      ['Queued',       'bg-line-100 text-ink-500'],
  active:       ['Running',      'bg-info-50 text-info-600'],
  completed:    ['Done',         'bg-success-50 text-success-600'],
  retry:        ['Retrying',     'bg-warning-50 text-warning-600'],
  failed:       ['Failed',       'bg-danger-50 text-danger-600'],
  cancelled:    ['Cancelled',    'bg-line-100 text-ink-500'],
  // marketplace stores
  CONNECTED:    ['Connected',    'bg-success-50 text-success-600'],
  REVOKED:      ['Revoked',      'bg-danger-50 text-danger-600'],
  DISCONNECTED: ['Disconnected', 'bg-line-100 text-ink-500'],
  // marketplace listings
  MATCHED:      ['Matched',      'bg-success-50 text-success-600'],
  UNMATCHED:    ['Unmatched',    'bg-warning-50 text-warning-600'],
  CHANGED:      ['SKU changed',  'bg-danger-50 text-danger-600'],
  IGNORED:      ['Not ours',     'bg-line-100 text-ink-500'],
  // marketplace orders — Shopee's words and TikTok's, as they send them
  UNPAID:            ['Unpaid',            'bg-line-100 text-ink-500'],
  READY_TO_SHIP:     ['Ready to ship',     'bg-warning-50 text-warning-600'],
  PROCESSED:         ['Packed',            'bg-info-50 text-info-600'],
  SHIPPED:           ['Shipped',           'bg-info-50 text-info-600'],
  TO_CONFIRM_RECEIVE:['Delivered',         'bg-success-50 text-success-600'],
  IN_CANCEL:         ['Cancel requested',  'bg-danger-50 text-danger-600'],
  INVOICE_PENDING:   ['Invoice pending',   'bg-line-100 text-ink-500'],
  ON_HOLD:           ['On hold',           'bg-line-100 text-ink-500'],
  AWAITING_SHIPMENT: ['Ready to ship',     'bg-warning-50 text-warning-600'],
  AWAITING_COLLECTION:['Awaiting pickup',  'bg-info-50 text-info-600'],
  PARTIALLY_SHIPPING:['Partly shipped',    'bg-info-50 text-info-600'],
  IN_TRANSIT:        ['In transit',        'bg-info-50 text-info-600'],
  DELIVERED:         ['Delivered',         'bg-success-50 text-success-600'],
  CANCEL:            ['Cancelled',         'bg-line-100 text-ink-500'],
};
const it = computed(() => MAP[props.status] ?? [props.status, 'bg-line-100 text-ink-500']);
</script>

<template>
  <!-- never wraps: a two-word label breaking over two lines makes its whole
       table row taller than its neighbours, which reads as a rendering fault -->
  <span class="inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2 text-[12px] font-medium leading-4"
    :class="it[1]">{{ label ?? it[0] }}</span>
</template>
