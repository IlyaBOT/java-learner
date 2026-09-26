export function gradeExam(questions, answers) {
  if (questions.length === 0) throw new Error('Пустой экзамен');
  const details = questions.map((question, index) => ({
    selected: answers[index], correct: question.correct,
    ok: Number.isInteger(answers[index]) && answers[index] === question.correct,
    explanation: question.explanation
  }));
  const score = details.filter(item => item.ok).length;
  return { score, total: questions.length, passed: score >= Math.ceil(questions.length * 0.75), details };
}
