import { useDb, jobs } from '../db';
import { newId } from './ids';

export async function enqueue(kind: 'process_media' | 'purge_event' | 'zip_event', ref: string, delayMs = 0) {
  await useDb().insert(jobs).values({ id: newId(), kind, ref, runAfter: new Date(Date.now() + delayMs) });
}
