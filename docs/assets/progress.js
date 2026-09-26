export const STORAGE_KEY = 'java-learner-progress-v1';
export const blankProgress = () => ({ version: 1, lessons: {}, tasks: {}, exams: {}, drafts: {} });

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Never trust an imported file, even if it was previously exported by this site.
export function normalizeProgress(value) {
  if (!isPlainObject(value) || value.version !== 1) throw new Error('Неизвестный формат прогресса');
  const result = blankProgress();
  for (const key of ['lessons', 'tasks', 'exams', 'drafts']) {
    if (!isPlainObject(value[key])) continue;
    for (const [id, entry] of Object.entries(value[key])) {
      if (!/^[0-9]{2}(?:[:][0-9]+|[a-z])?$/.test(id) || id === '__proto__') continue;
      if (key === 'lessons' || key === 'tasks') {
        if (entry === true) result[key][id] = true;
      } else if (key === 'drafts') {
        if (typeof entry === 'string') result.drafts[id] = entry.slice(0, 100000);
      } else if (isPlainObject(entry) && Number.isInteger(entry.score) && entry.score >= 0 && entry.score <= 4 && Number.isInteger(entry.attempts) && entry.attempts >= 0) {
        result.exams[id] = { score: entry.score, attempts: Math.min(entry.attempts, 9999), passed: entry.passed === true };
      }
    }
  }
  return result;
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : blankProgress();
  } catch { return blankProgress(); }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

export function chapterCounts(chapter, progress) {
  const doneLessons = chapter.lessons.filter((_, index) => progress.lessons[`${chapter.id}:${index}`]).length;
  const doneTasks = chapter.tasks.filter(task => progress.tasks[task.id]).length;
  const passed = progress.exams[chapter.id]?.passed === true;
  return { doneLessons, doneTasks, passed, complete: doneLessons === chapter.lessons.length && doneTasks === chapter.tasks.length && passed };
}
