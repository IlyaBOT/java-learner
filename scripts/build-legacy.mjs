import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { chapters, platforms } from '../docs/assets/course.js';

const output = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/legacy.html');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prompt = s => escape(s)
  .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/g,'<code>$1</code>')
  .replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/g,'<em>$1</em>');

const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Java / лаборатория — текстовая версия</title>
<style>
body{font:16px/1.55 Arial,Helvetica,sans-serif;background:#f3f1eb;color:#212e33;margin:0;padding:0}
.page{max-width:850px;margin:0 auto;background:#fff;min-height:100%;padding:28px 40px 80px}
h1,h2,h3{line-height:1.25}h1{font-size:34px}h2{font-size:27px;border-bottom:2px solid #dfa36c;padding-bottom:9px;margin-top:45px}h3{margin-top:26px}
a{color:#206c61}a:hover{text-decoration:none}p,li{margin:10px 0}ul,ol{padding-left:27px}
pre{background:#15222a;color:#d8f5e5;padding:16px;overflow:auto;font:14px/1.5 Consolas,Menlo,monospace}
code{font-family:Consolas,Menlo,monospace;background:#e8eeeb;padding:2px 3px}pre code{background:none;color:inherit;padding:0}
.note{background:#fff2dc;border-left:4px solid #d89652;padding:13px;margin:20px 0}.chapter{page-break-before:always}.task{border:1px solid #d4ddd8;padding:14px;margin:15px 0}
.exam{background:#edf4f0;padding:18px;margin:20px 0}.answers{border-top:1px solid #9ab6a6;margin-top:22px;padding-top:10px}
@media print{body{background:white}.page{padding:0}.task,.exam,pre{page-break-inside:avoid}a{text-decoration:none;color:#212e33}}
</style></head><body><div class="page"><h1 id="top">Java / лаборатория</h1>
<p>Текстовая и офлайн-версия полного курса. Её можно открыть через <code>file://</code> без JavaScript даже в старом браузере. Для автоматической проверки экзаменов и сохранения черновиков используй <a href="index.html">интерактивный сайт</a> на современном устройстве. Основные решения пиши в <a href="https://github.com/IlyaBOT/java-learner">репозитории</a>.</p>
<p class="note"><strong>Маршрут:</strong> прочитай теорию → сделай три упражнения → ответь на четыре вопроса без подсказок → сверь ключ (проходной результат 3/4) → проверь готовый Java-файл через <code>scripts/check.sh</code> или GitHub Actions.</p>
<h2>Содержание</h2><ol>${chapters.map(c=>`<li><a href="#ch${c.id}">${escape(c.id)} · ${escape(c.title)}</a> — ${escape(c.subtitle)}</li>`).join('')}</ol>
<h2>Установка Java и среды разработки</h2><p>Выбери свою платформу. Команды проверки показаны внутри каждого раздела; <code>java</code> и <code>javac</code> должны находиться и иметь согласованные версии. Подробная таблица и источники есть в <a href="https://github.com/IlyaBOT/java-learner/blob/main/SETUP.md">SETUP.md</a>.</p>
${platforms.map(p=>`<h3>${escape(p.title)}</h3>${p.html}`).join('\n')}
${chapters.map(c=>`<div class="chapter" id="ch${c.id}"><h2>${escape(c.id)} · ${escape(c.title)}</h2><p>${escape(c.subtitle)} Время: ${escape(c.time)}.</p>
<h3>Цели</h3><ul>${c.goals.map(goal=>`<li>${escape(goal)}</li>`).join('')}</ul>
${c.lessons.map((l,i)=>`<h3>Урок ${i+1}. ${escape(l.title)}</h3>${l.html}`).join('\n')}
<h3>Практика</h3>${c.tasks.map((t,i)=>`<div class="task"><strong>${i+1}. ${escape(t.title)} · ${escape(t.level)}</strong><p>${prompt(t.prompt)}</p>${t.file?`<p>Файл: <code>${escape(t.file)}</code></p>`:''}<p><em>Подсказка:</em> ${escape(t.hint)}</p><pre><code>${escape(t.starter)}</code></pre></div>`).join('\n')}
<div class="exam"><h3>Мини-экзамен · 3 из 4 для зачёта</h3>${c.exam.map((question,i)=>`<p><strong>${i+1}. ${escape(question.text)}</strong></p><ol type="A">${question.options.map(opt=>`<li>${escape(opt)}</li>`).join('')}</ol>`).join('\n')}
<div class="answers"><strong>Ключ для самопроверки:</strong><ol>${c.exam.map(question=>`<li>${'ABC'[question.correct]}. ${escape(question.explanation)}</li>`).join('')}</ol></div></div>
<p><a href="#ch${chapters[chapters.indexOf(c)+1]?.id||'00'}">Следующая глава →</a> · <a href="#top">К началу</a></p></div>`).join('\n')}
<p>Готово. Файл сгенерирован из того же содержания, что и интерактивный курс.</p></div></body></html>
`;

if (process.argv.includes('--check')) {
  const existing = await readFile(output, 'utf8');
  if (existing !== html) { console.error('docs/legacy.html устарел: запусти node scripts/build-legacy.mjs'); process.exitCode = 1; }
  else console.log('Текстовая версия актуальна.');
} else {
  await writeFile(output, html, 'utf8');
  console.log('Обновлён docs/legacy.html');
}
