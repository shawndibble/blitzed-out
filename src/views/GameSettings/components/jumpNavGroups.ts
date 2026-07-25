import type { JumpNavEntry } from './JumpNav';

/**
 * Split entries into contiguous same-scope runs, preserving page order.
 *
 * Grouping by a fixed scope order instead would put the rail out of step with
 * the page: "You" is an only-me section sitting second, while Sound and
 * Display are only-me sections sitting last, so a fixed order would highlight a
 * chip near the bottom of the rail while the user is at the top of the page. A
 * scope may therefore appear as more than one run, which is accurate.
 */
export function groupEntriesByScopeRun(entries: JumpNavEntry[]): JumpNavEntry[][] {
  return entries.reduce<JumpNavEntry[][]>((runs, entry) => {
    const current = runs[runs.length - 1];
    if (current && current[0].scope === entry.scope) current.push(entry);
    else runs.push([entry]);
    return runs;
  }, []);
}
