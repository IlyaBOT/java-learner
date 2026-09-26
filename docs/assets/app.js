import { chapters, platforms } from './course.js';
import { gradeExam } from './assessment.js';
import { STORAGE_KEY, chapterCounts, loadProgress, normalizeProgress, saveProgress } from './progress.js';

const root = document.getElementById('app');
const progress = loadProgress();
const quizState = Object.create(null);
let selectedPlatform = 'win-modern';
const repo = 'https://github.com/IlyaBOT/java-learner';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const renderPrompt = value => escapeHTML(value)
  .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/g, '<code>$1</code>')
  .replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/g, '<em>$1</em>');
const courseUrl = (id, tab='overview') => `#/chapter/${id}/${tab}`;

function route() {
  const parts = location.hash.match(/^#\/chapter\/(\d{2})\/(overview|theory|practice|exam)$/);
  const chapter = parts ? chapters.find(c => c.id === parts[1]) : null;
  return chapter ? { chapter, tab: parts[2] } : { chapter: null, tab: null };
}

function sidebar(active) {
  return `<aside class="sidebar"><a class="brand" href="#/" aria-label="На главную"><span class="brand-mark">J</span><span><strong>Java / лаборатория</strong><small>учись · запускай · коммить</small></span></a>
    <nav class="side-nav" aria-label="Главы"><a class="side-link side-overview ${active ? '' : 'active'}" href="#/">⌂ <span class="side-title">Обзор курса</span></a>
    ${chapters.map(c => `<a class="side-link ${active?.id === c.id ? 'active' : ''}" href="${courseUrl(c.id)}" ${active?.id === c.id ? 'aria-current="page"' : ''}><span class="side-index">${c.id}</span><span class="side-title">${escapeHTML(c.title)}</span>${chapterCounts(c,progress).complete ? '<span class="side-check" aria-label="пройдено">✓</span>' : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom">Прогресс хранится в этом браузере. Решения хранятся в твоих коммитах.<a href="${repo}" target="_blank" rel="noopener noreferrer">Репозиторий ↗</a></div></aside>`;
}

function topbar(chapter) {
  const finished = chapters.filter(c => chapterCounts(c,progress).complete).length;
  return `<header class="topbar"><div class="crumb">JAVA / <span>${chapter ? `ГЛАВА ${chapter.id} · ${escapeHTML(chapter.title)}` : 'УЧЕБНЫЙ МАРШРУТ'}</span></div><div class="top-progress">${finished} / ${chapters.length} глав</div></header>`;
}

function footer() {
  return `<footer class="footer"><span>JAVA / ЛАБОРАТОРИЯ</span><a href="${repo}" target="_blank" rel="noopener noreferrer">Исходники ↗</a><a href="${repo}/actions" target="_blank" rel="noopener noreferrer">Проверки CI ↗</a><span>Черновики остаются в браузере до экспорта или коммита.</span></footer>`;
}

function overviewHome() {
  const lessonDone = chapters.reduce((n,c)=>n+chapterCounts(c,progress).doneLessons,0);
  const taskDone = chapters.reduce((n,c)=>n+chapterCounts(c,progress).doneTasks,0);
  const next = chapters.find(c=>!chapterCounts(c,progress).complete) || chapters[0];
  return `<div class="hero"><div class="eyebrow">ПРАКТИЧЕСКИЙ КУРС · JAVA С НУЛЯ</div><h1>Пойми язык.<br><em>Собери своими руками.</em></h1><p>12 глав от настройки JDK на XP и Snow Leopard до потоков, HTTP и собственного CLI. Короткая теория, задания трёх уровней, мини-экзамены и реальные файлы в GitHub.</p><div class="hero-actions"><a class="btn primary" href="${courseUrl(next.id)}">${lessonDone ? 'Продолжить обучение' : 'Начать с установки'} →</a><a class="btn ghost" href="${repo}" target="_blank" rel="noopener noreferrer">Открыть репозиторий ↗</a></div></div>
    <div class="stats"><div class="stat"><strong>${lessonDone} / 24</strong><span>уроков прочитано</span></div><div class="stat"><strong>${taskDone} / 36</strong><span>заданий выполнено</span></div><div class="stat"><strong>${chapters.filter(c=>chapterCounts(c,progress).passed).length} / 12</strong><span>экзаменов сдано</span></div></div>
    <div class="section-head"><div><div class="eyebrow">ПУТЬ</div><h2>От Hello World до своего проекта</h2></div><p>Любую главу можно открыть сразу.</p></div>
    <div class="card-grid">${chapters.map(c=>{const p=chapterCounts(c,progress);return `<a class="card" href="${courseUrl(c.id)}"><div class="num">ГЛАВА ${c.id} / ${escapeHTML(c.stage.toUpperCase())}</div><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.subtitle)}</p><div class="card-foot"><span>${p.complete ? 'Пройдено ✓' : `${p.doneLessons}/${c.lessons.length} уроков · ${p.doneTasks}/${c.tasks.length} задач`}</span><span class="level">${escapeHTML(c.time)}</span></div></a>`}).join('')}</div>
    <div class="section-head"><h2>Прогресс и работы</h2></div><div class="notice"><p>Черновики и результаты экзаменов лежат в <strong>localStorage этого браузера</strong>. Экспортируй JSON для переноса на другой компьютер. Решения из <code>work/</code> коммить в Git — Actions проверит их после push. Экспорт JSON можно сохранить в <code>results/</code>, если хочешь фиксировать и результаты тестов (файл будет виден в публичном репозитории).</p></div><div class="actions" style="margin-top:16px"><button class="btn" data-action="export">Скачать прогресс JSON</button><button class="btn" data-action="import">Импортировать JSON</button><input class="sr-only" type="file" id="progress-file" accept="application/json,.json" aria-label="Выбрать файл прогресса"></div><p id="import-status" role="status" class="feedback"></p>`;
}

function platformSelector() {
  const selected = platforms.find(p=>p.id===selectedPlatform) || platforms[0];
  return `<div class="section-head"><div><div class="eyebrow">ВЫБОР СИСТЕМЫ</div><h2>Настрой свой маршрут</h2></div></div>
  <div class="platform-tabs" role="group" aria-label="Платформа">${platforms.map(p=>`<button class="platform-tab ${p.id===selected.id?'selected':''}" data-action="platform" data-platform="${p.id}" aria-pressed="${p.id===selected.id}">${escapeHTML(p.label)}</button>`).join('')}</div>
  <div class="platform-content article" id="platform-content"><h3>${escapeHTML(selected.title)}</h3>${selected.html}</div>
  <p class="notice warning" style="margin-top:18px">Поддержка старых ОС зависит от конкретного билда JDK и IDE. Старые установщики применяй на изолированной ретро-машине; задания поздних глав проверяй на современной JVM или в GitHub Actions. <a href="${repo}/blob/main/SETUP.md">Таблица совместимости и источники ↗</a></p>`;
}

function chapterOverview(c) {
  const p=chapterCounts(c,progress);
  return `<div class="stats"><div class="stat"><strong>${p.doneLessons} / ${c.lessons.length}</strong><span>уроков</span></div><div class="stat"><strong>${p.doneTasks} / ${c.tasks.length}</strong><span>упражнений</span></div><div class="stat"><strong>${p.passed ? 'Сдан' : '—'}</strong><span>мини-экзамен</span></div></div>
  <div class="section-head"><div><div class="eyebrow">ЧЕМУ НАУЧИШЬСЯ</div><h2>Цели главы</h2></div></div><div class="intro-list">${c.goals.map((goal,i)=>`<div class="intro-item"><b>0${i+1}</b>${escapeHTML(goal)}</div>`).join('')}</div>
  ${c.id==='00'?platformSelector():''}
  <div class="section-head"><h2>Маршрут</h2></div><div class="card-grid"><a href="${courseUrl(c.id,'theory')}" class="card"><div class="num">01 / ТЕОРИЯ</div><h3>${c.lessons.length} урока</h3><p>Прочитай, запусти примеры, отметь понятные разделы.</p><div class="card-foot">Перейти →</div></a><a href="${courseUrl(c.id,'practice')}" class="card"><div class="num">02 / ПРАКТИКА</div><h3>3 уровня</h3><p>Черновик в браузере и файлы для решений в репозитории.</p><div class="card-foot">Перейти →</div></a><a href="${courseUrl(c.id,'exam')}" class="card"><div class="num">03 / ПРОВЕРКА</div><h3>Мини-экзамен</h3><p>4 вопроса, проходной балл — 3. Попытки не ограничены.</p><div class="card-foot">Перейти →</div></a></div>`;
}

function theory(c) {
  return `<div class="content-width article"><div class="notice">Прочитай материал и запусти код локально. Отметка урока фиксирует твою самооценку; она не проверяет исполнение Java.</div>${c.lessons.map((l,i)=>`<section class="lesson"><div class="lesson-meta"><h2><span class="eyebrow">${String(i+1).padStart(2,'0')} / </span>${escapeHTML(l.title)}</h2></div>${l.html}<button class="btn complete ${progress.lessons[`${c.id}:${i}`]?'primary':''}" data-action="lesson" data-id="${c.id}:${i}" aria-pressed="${!!progress.lessons[`${c.id}:${i}`]}">${progress.lessons[`${c.id}:${i}`]?'✓ Урок отмечен':'Отметить как изученный'}</button></section>`).join('')}<div class="actions" style="margin-top:26px"><a href="${courseUrl(c.id,'practice')}" class="btn primary">К упражнениям →</a></div></div>`;
}

function practice(c) {
  const levels={'Легко':'easy','Средне':'medium','Сложно':'hard'};
  return `<div class="content-width"><div class="notice"><p>Пиши решение в редакторе ниже для наброска. <strong>Браузер не компилирует Java.</strong> Файлы <code>work/</code> запусти локально или проверь CI после push. Отметка выполнения — твоё подтверждение после проверки.</p></div>
    <div class="section-head"><div><div class="eyebrow">ТРЕНИРОВКА</div><h2>Задания главы ${c.id}</h2></div><p>Легко → средне → сложно</p></div>
    ${c.tasks.map((t,i)=>`<article class="task"><div class="task-top"><span class="meta">ЗАДАНИЕ ${String(i+1).padStart(2,'0')} / ${c.id}</span><span class="difficulty ${levels[t.level]}">${t.level.toUpperCase()}</span></div><h3>${escapeHTML(t.title)}</h3><p>${renderPrompt(t.prompt)}</p>${t.file?`<p class="task-file">Файл: <a href="${repo}/blob/main/${t.file}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.file)} ↗</a></p>`:''}<label class="meta" for="draft-${t.id}">ТВОЙ ЧЕРНОВИК · СОХРАНЯЕТСЯ В БРАУЗЕРЕ</label><textarea id="draft-${t.id}" data-draft="${t.id}" spellcheck="false" placeholder="Здесь можно наметить решение или вставить свой код…">${escapeHTML(progress.drafts[t.id]||'')}</textarea><div class="actions"><button class="btn" data-action="seed" data-id="${t.id}">Вставить заготовку</button><button class="btn" data-action="copy" data-id="${t.id}">Скопировать черновик</button><button class="btn ${progress.tasks[t.id]?'primary':''}" data-action="task" data-id="${t.id}" aria-pressed="${!!progress.tasks[t.id]}">${progress.tasks[t.id]?'✓ Проверено мной':'Проверил локально · готово'}</button></div><div class="feedback" role="status" id="feedback-${t.id}"></div><details><summary>Подсказка</summary><p>${escapeHTML(t.hint)}</p></details></article>`).join('')}
    <a href="${courseUrl(c.id,'exam')}" class="btn primary">К мини-экзамену →</a></div>`;
}

function exam(c) {
  const state=quizState[c.id];const saved=progress.exams[c.id];
  return `<div class="content-width exam"><div class="notice"><p>4 вопроса по текущей главе. Сдать: <strong>минимум 3 правильных ответа</strong>. После отправки увидишь объяснения. Результат сохраняется в этом браузере.</p></div>${saved?`<p class="pill" style="display:inline-block;margin-top:18px">Лучший результат: ${saved.score} / 4 · попыток: ${saved.attempts}${saved.passed?' · сдано ✓':''}</p>`:''}
    <form id="exam-form" data-chapter="${c.id}" novalidate>${c.exam.map((question,i)=>`<div class="question"><fieldset><legend>${String(i+1).padStart(2,'0')}. ${escapeHTML(question.text)}</legend>${question.options.map((opt,j)=>{const checked=state?.answers[i]===j;const status=state?.result?(j===question.correct?'correct':checked?'wrong':''):'';return `<label class="choice ${status}"><input type="radio" name="q${i}" value="${j}" ${checked?'checked':''} ${state?.result?'disabled':''}><span>${escapeHTML(opt)}</span></label>`}).join('')}${state?.result?`<p class="explanation">${state.result.details[i].ok?'Верно.':'Неверно.'} ${escapeHTML(question.explanation)}</p>`:''}</fieldset></div>`).join('')}
    ${state?.result?`<div class="exam-result ${state.result.passed?'':'fail'}" role="status"><strong>${state.result.passed?'Экзамен сдан':'Пока не сдан'} · ${state.result.score} / ${state.result.total}</strong><div>${state.result.passed?'Можешь идти дальше.':'Разбери объяснения и попробуй снова.'}</div></div><button class="btn" type="button" data-action="retry" data-id="${c.id}">Пройти ещё раз</button>`:`<button class="btn primary" type="submit">Проверить ответы</button><p id="exam-error" role="alert" class="feedback"></p>`}</form>
    ${state?.result?.passed?`<div class="actions" style="margin-top:22px"><a class="btn" href="${courseUrl(chapters[chapters.indexOf(c)+1]?.id||'00')}">Следующая глава →</a></div>`:''}</div>`;
}

function render() {
  const { chapter, tab }=route();
  const tabs=[['overview','Обзор'],['theory','Теория'],['practice','Практика'],['exam','Экзамен']];
  const body=chapter?`<div class="course-head"><span class="eyebrow">ГЛАВА ${chapter.id} · ${escapeHTML(chapter.stage.toUpperCase())} · ${escapeHTML(chapter.time)}</span><h1>${escapeHTML(chapter.title)}</h1><p>${escapeHTML(chapter.subtitle)}</p></div><nav class="tabbar" aria-label="Разделы главы">${tabs.map(([key,label])=>`<a href="${courseUrl(chapter.id,key)}" class="tab ${tab===key?'active':''}" ${tab===key?'aria-current="page"':''}>${label}${key==='exam'&&chapterCounts(chapter,progress).passed?' <span class="dot">✓</span>':''}</a>`).join('')}</nav>${tab==='overview'?chapterOverview(chapter):tab==='theory'?theory(chapter):tab==='practice'?practice(chapter):exam(chapter)}`:overviewHome();
  root.innerHTML=`<div class="shell">${sidebar(chapter)}<div class="main">${topbar(chapter)}<main class="container" id="main">${body}</main>${footer()}</div></div>`;
  document.title=chapter?`${chapter.title} — Java / лаборатория`:'Java / лаборатория';
}

function commitProgress() {
  if (!saveProgress(progress)) console.warn('Не удалось записать localStorage: экспортируй черновики вручную.');
}

root.addEventListener('click', async e => {
  const btn=e.target.closest('[data-action]');if(!btn)return;
  const {action,id}=btn.dataset;
  if(action==='lesson'){progress.lessons[id]=!progress.lessons[id];if(!progress.lessons[id])delete progress.lessons[id];commitProgress();render();}
  if(action==='task'){progress.tasks[id]=!progress.tasks[id];if(!progress.tasks[id])delete progress.tasks[id];commitProgress();render();}
  if(action==='platform'){selectedPlatform=btn.dataset.platform;render();document.querySelector('.platform-tabs')?.scrollIntoView({block:'nearest'});}
  if(action==='seed'){
    const task=chapters.flatMap(c=>c.tasks).find(t=>t.id===id),input=document.querySelector(`[data-draft="${id}"]`);
    if(input && task && (!input.value || confirm('Заменить текущий черновик заготовкой?'))){input.value=task.starter;progress.drafts[id]=input.value;commitProgress();input.focus();}
  }
  if(action==='copy'){
    const value=document.querySelector(`[data-draft="${id}"]`)?.value||'';
    const info=document.getElementById(`feedback-${id}`);
    try {await navigator.clipboard.writeText(value);info.textContent='Скопировано в буфер обмена.';}
    catch {info.textContent='Не удалось скопировать: выдели текст и нажми Ctrl/Cmd+C.';}
  }
  if(action==='retry'){delete quizState[id];render();}
  if(action==='export'){
    const blob=new Blob([JSON.stringify(progress,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='java-learner-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  if(action==='import')document.getElementById('progress-file')?.click();
});

root.addEventListener('input', e => {
  if(e.target.matches('textarea[data-draft]')){progress.drafts[e.target.dataset.draft]=e.target.value;commitProgress();}
});

root.addEventListener('keydown',e=>{
  if(e.key==='Tab'&&e.target.matches('textarea[data-draft]')){e.preventDefault();const input=e.target,start=input.selectionStart,end=input.selectionEnd;input.setRangeText('    ',start,end,'end');progress.drafts[input.dataset.draft]=input.value;commitProgress();}
});

root.addEventListener('submit',e=>{
  if(e.target.id!=='exam-form')return;
  e.preventDefault();const form=e.target,c=chapters.find(ch=>ch.id===form.dataset.chapter);
  const answers=c.exam.map((_,i)=>{const checked=form.querySelector(`input[name="q${i}"]:checked`);return checked?Number(checked.value):null;});
  if(answers.some(answer=>answer===null)){form.querySelector('#exam-error').textContent='Ответь на все четыре вопроса.';return;}
  const result=gradeExam(c.exam,answers),old=progress.exams[c.id];
  progress.exams[c.id]={score:Math.max(result.score,old?.score??0),attempts:(old?.attempts??0)+1,passed:result.passed||old?.passed===true};
  quizState[c.id]={answers,result};commitProgress();render();document.querySelector('.exam')?.scrollIntoView({block:'start'});
});

root.addEventListener('change',async e=>{
  if(e.target.id!=='progress-file'||!e.target.files[0])return;
  const status=document.getElementById('import-status');
  try {
    if(e.target.files[0].size>2_000_000)throw new Error('Файл слишком большой (максимум 2 МБ).');
    const imported=normalizeProgress(JSON.parse(await e.target.files[0].text()));
    // Explicitly replace: avoids mixing results from different users or revisions.
    for(const key of ['lessons','tasks','exams','drafts'])progress[key]=imported[key];
    commitProgress();render();document.getElementById('import-status').textContent='Прогресс загружен. Старые данные заменены.';
  }catch(err){status.textContent=`Не удалось импортировать: ${err.message}`;}
});

window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
render();
