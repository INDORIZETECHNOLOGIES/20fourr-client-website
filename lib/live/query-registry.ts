/**
 * The queries currently on screen, so a live event can refresh exactly the stale ones.
 *
 * `useApiQuery` registers each mounted query here with a *quiet* refresh: it refetches without
 * going back to a loading state, so the page updates in place instead of flashing a skeleton.
 */
type Entry = { path: string; refresh: () => void };

const entries = new Set<Entry>();

export function registerQuery(entry: Entry): () => void {
  entries.add(entry);
  return () => {
    entries.delete(entry);
  };
}

/** Refreshes every mounted query whose path matches. Returns how many refreshed. */
export function refreshMatching(match: (path: string) => boolean): number {
  let n = 0;
  for (const e of entries) {
    if (match(e.path)) {
      e.refresh();
      n++;
    }
  }
  return n;
}

/** After a reconnect: missed events aren't replayed, so everything on screen refreshes once. */
export function refreshAll(): number {
  return refreshMatching(() => true);
}
