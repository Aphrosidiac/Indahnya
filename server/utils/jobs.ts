import { useDb, jobs, type JobKind, type JobLane } from '../db';
import { newId } from './ids';

type Db = Pick<ReturnType<typeof useDb>, 'insert'>;

/** The lane a job runs in when the caller does not say (see JobLane). */
const LANE: Record<JobKind, JobLane> = { process_media: 'photo', purge_event: 'maint', kad_gc: 'maint' };

export async function enqueue(kind: JobKind, ref: string, o: { delayMs?: number; lane?: JobLane; priority?: number; db?: Db } = {}) {
  await (o.db ?? useDb()).insert(jobs).values({
    id: newId(), kind, ref, lane: o.lane ?? LANE[kind], priority: o.priority ?? 0,
    runAfter: new Date(Date.now() + (o.delayMs ?? 0)),
  });
}
