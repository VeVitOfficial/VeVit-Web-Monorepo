const TYPES = new Set(['mcq', 'multi', 'truefalse_rapid', 'sort_buckets', 'order', 'match', 'slider', 'hotspot', 'hallucination_hunt', 'blind_test', 'wager', 'poll', 'branching', 'prompt_lab', 'open_rubric', 'microtask']);

export function typeModulePath(type) {
  return typeof type === 'string' && TYPES.has(type) ? `./types/${type}.mjs` : null;
}

export async function loadType(type) {
  const path = typeModulePath(type);
  if (!path) throw new Error('Nepodporovaný typ otázky.');
  const loaded = await import(path);
  return loaded.createRenderer();
}
