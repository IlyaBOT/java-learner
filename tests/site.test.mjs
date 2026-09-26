import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, platforms } from '../docs/assets/course.js';
import { gradeExam } from '../docs/assets/assessment.js';
import { blankProgress, chapterCounts, normalizeProgress } from '../docs/assets/progress.js';

test('the full course remains navigable and assessable', () => {
  assert.equal(chapters.length, 12);
  assert.equal(platforms.length, 5);
  assert.equal(new Set(chapters.map(c => c.id)).size, chapters.length);
  assert.equal(chapters.reduce((n,c)=>n+c.lessons.length,0), 24);
  assert.equal(chapters.reduce((n,c)=>n+c.tasks.length,0), 36);
  assert.equal(new Set(chapters.flatMap(c=>c.tasks.map(t=>t.id))).size, 36);
  for (const chapter of chapters) {
    assert.equal(chapter.lessons.length, 2, chapter.id);
    assert.deepEqual(chapter.tasks.map(t=>t.level), ['Легко','Средне','Сложно'], chapter.id);
    assert.equal(chapter.exam.length, 4, chapter.id);
    for (const question of chapter.exam) {
      assert.equal(question.options.length, 3, chapter.id);
      assert.ok(question.correct >= 0 && question.correct < question.options.length, chapter.id);
      assert.ok(question.explanation.length > 5, chapter.id);
    }
  }
});

test('three correct answers pass; missing and wrong answers fail', () => {
  const questions = chapters[0].exam;
  const correct = questions.map(q=>q.correct);
  assert.deepEqual(gradeExam(questions, correct).score, 4);
  const oneWrong=[...correct]; oneWrong[0]=(oneWrong[0]+1)%3;
  assert.equal(gradeExam(questions, oneWrong).passed, true);
  const twoWrong=[...oneWrong]; twoWrong[1]=null;
  assert.equal(gradeExam(questions, twoWrong).passed, false);
});

test('progress import rejects unsafe shapes and never imports extra keys', () => {
  assert.throws(()=>normalizeProgress({version:99}),/формат/);
  const restored = normalizeProgress({version:1,lessons:{'00:0':true,other:true},tasks:{'00b':true},exams:{'00':{score:3,attempts:1,passed:true}},drafts:{'00b':'class Test {}'},token:'secret'});
  assert.equal(restored.token,undefined);
  assert.equal(restored.lessons.other,undefined);
  assert.equal(restored.exams['00'].score,3);
  assert.equal(chapterCounts(chapters[0],restored).complete,false);
  const complete=blankProgress();
  for(let i=0;i<2;i++) complete.lessons[`00:${i}`]=true;
  for(const t of chapters[0].tasks) complete.tasks[t.id]=true;
  complete.exams['00']={score:3,attempts:1,passed:true};
  assert.equal(chapterCounts(chapters[0],complete).complete,true);
});
