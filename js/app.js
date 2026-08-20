// --- STATE & ROUTER ---
const appDiv = document.getElementById('app');
let currentQuestionData = null;

// --- BASE PATH FIX ---
// Some question/explanation HTML has hardcoded absolute image paths
// (e.g. src="/Previous Year Questions/.../img.png"). These work locally
// (served from root) but break on GitHub Pages project sites, which are
// served from a subpath like /repo-name/. This rewrites them at render time.
const BASE_URL = (() => {
  if (location.hostname.endsWith('github.io')) {
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    return firstSegment ? `/${firstSegment}` : '';
  }
  return ''; // local dev — unchanged behavior
})();

function fixAssetPaths(html) {
  if (!html) return html;
  return html.replace(/(src|href)="\//g, `$1="${BASE_URL}/`);
}

function router() {
  const hash = window.location.hash;
  if (!hash || hash === '#/') {
    renderHomePage();
  } else if (hash.startsWith('#/paper/')) {
    const folderName = decodeURIComponent(hash.replace('#/paper/', ''));
    renderWorkspacePage(folderName);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// --- HOME PAGE VIEW ---
async function renderHomePage() {
  appDiv.innerHTML = `<div class="flex items-center justify-center p-20 text-gray-400">Loading PYQ Hub...</div>`;
  
  try {
    const response = await fetch('./Previous Year Questions/manifest.json');
    const papers = await response.json();

    let cardsHTML = '';
    papers.forEach(paper => {
      const routeUrl = `#/paper/${encodeURIComponent(paper.folderName)}`;
      cardsHTML += `
        <div class="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-emerald-500 transition duration-300 flex flex-col justify-between group">
          <div>
            <span class="text-xs font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded mb-4 inline-block">INTERACTIVE SIMULATOR</span>
            <h3 class="text-2xl font-semibold mb-2">${paper.title}</h3>
            <p class="text-gray-400 text-sm mb-6">${paper.questionCount || 65} Questions</p>
          </div>
          <a href="${routeUrl}" class="flex items-center gap-2 text-white font-medium group-hover:text-emerald-400 transition-colors">
            LAUNCH WORKSPACE <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      `;
    });

    appDiv.innerHTML = `
      <header class="border-b border-gray-800 bg-gray-950 px-8 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold tracking-tight">GATECS.IO</h1>
          <span class="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE DATABASE ACTIVE
          </span>
        </div>
      </header>

      <main class="max-w-6xl mx-auto w-full px-6 py-12 flex-grow">
        <div class="mb-12">
          <h2 class="text-4xl md:text-5xl font-extrabold mb-4">CRACK THE GATE CS GATEWAY</h2>
          <p class="text-gray-400 text-lg max-w-2xl">Interactive testing environment with real-time answer verification and step-by-step logic sheets.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cardsHTML}
        </div>
      </main>
    `;

    lucide.createIcons();
  } catch (err) {
    appDiv.innerHTML = `<div class="p-10 text-red-500">Error loading manifest: ${err.message}</div>`;
  }
}

// --- WORKSPACE PAGE VIEW (Full-width stage & top horizontal palette) ---
function renderWorkspacePage(folderName) {
  // Generate horizontal palette items (1 to 65)
  let paletteHTML = '';
  for (let i = 1; i <= 65; i++) {
    paletteHTML += `
      <button id="p-btn-${i}" onclick="loadQuestion('${folderName}', ${i})" 
        class="min-w-[40px] h-10 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0">
        ${i}
      </button>`;
  }

  appDiv.innerHTML = `
    <!-- Top Bar -->
    <header class="border-b border-gray-800 bg-gray-950 px-6 py-3 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <a href="#/" class="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm font-medium">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Home
        </a>
        <div class="h-4 w-px bg-gray-800"></div>
        <h1 class="text-base font-bold text-white">${folderName}</h1>
      </div>
    </header>

    <!-- Horizontal Question Palette Bar -->
    <div class="border-b border-gray-800 bg-gray-950/50 px-6 py-3">
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        ${paletteHTML}
      </div>
    </div>

    <!-- Main Question Workspace (Full Width) -->
    <main class="max-w-5xl mx-auto w-full flex-grow p-6 md:p-8 flex flex-col justify-between">
      <div>
        <!-- Question Meta Header -->
        <div id="question-header" class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800">
          <h2 id="q-number" class="text-2xl font-bold">Select a Question</h2>
          <div id="q-meta" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Dynamic Question Stage -->
        <div id="question-stage" class="text-gray-300">
          Click any question number in the top palette to load.
        </div>
      </div>

      <!-- Action Footer -->
      <div id="action-footer" class="mt-8 pt-4 border-t border-gray-800 flex justify-between items-center hidden">
        <button id="check-btn" onclick="checkAnswer('${folderName}')" disabled 
          class="px-6 py-2.5 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed transition-all">
          Check Answer
        </button>
      </div>
    </main>
  `;
  
  lucide.createIcons();
  loadQuestion(folderName, 1); // Default to Q1
}

// --- QUESTION FETCHER ---
async function loadQuestion(folderName, qNumber) {
  const stage = document.getElementById('question-stage');
  const qNumHeading = document.getElementById('q-number');
  const qMeta = document.getElementById('q-meta');
  const actionFooter = document.getElementById('action-footer');
  const checkBtn = document.getElementById('check-btn');

  // Highlight active button in horizontal palette
  document.querySelectorAll('[id^="p-btn-"]').forEach(btn => btn.classList.remove('border-emerald-500', 'text-emerald-400'));
  const activeBtn = document.getElementById(`p-btn-${qNumber}`);
  if (activeBtn) activeBtn.classList.add('border-emerald-500', 'text-emerald-400');

  qNumHeading.innerText = `Question ${qNumber}`;
  stage.innerHTML = `<span class="text-gray-400">Loading question content...</span>`;
  checkBtn.disabled = true;
  actionFooter.classList.add('hidden');

  try {
    const filePath = `./Previous Year Questions/${folderName}/questions/question${qNumber}.json`;
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("Question JSON file not found");
    
    currentQuestionData = await response.json();
    const qData = currentQuestionData;

    // 1. Render Meta Badges (Type, Marks, Negative Marks, Topics)
    const correctMarks = qData["correct marks"] || qData.marks || 1;
    const negativeMarks = qData["negative marks"] !== undefined ? qData["negative marks"] : 0;
    const topicsList = Array.isArray(qData.topics) ? qData.topics.join(', ') : 'General';

    qMeta.innerHTML = `
      <span class="text-xs font-semibold bg-gray-800 text-gray-300 px-2.5 py-1 rounded border border-gray-700">${qData.type}</span>
      <span class="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20">+${correctMarks} Marks</span>
      <span class="text-xs font-semibold bg-red-500/10 text-red-400 px-2.5 py-1 rounded border border-red-500/20">-${negativeMarks} Marks</span>
      <span class="text-xs bg-gray-900 text-gray-400 px-2.5 py-1 rounded border border-gray-800">Topics: ${topicsList}</span>
    `;

    // 2. Asset Image
    let assetImgHtml = '';
    if (qData.assetImage) {
      const imagePath = `./Previous Year Questions/${folderName}/assets/${qData.assetImage}`;
      assetImgHtml = `<div class="my-4"><img src="${imagePath}" alt="Question Diagram" class="max-w-full rounded bg-white p-2 border border-gray-700"></div>`;
    }

    // 3. Code Block
    let codeHtml = qData.codeBlock ? `<pre class="bg-gray-900 border border-gray-800 text-emerald-400 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto"><code>${qData.codeBlock}</code></pre>` : '';

    // 4. Options Input Setup
    let optionsHtml = '';
    if (qData.type === 'MCQ' || qData.type === 'MSQ') {
      optionsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">`;
      qData.options.forEach((opt, index) => {
        const key = String.fromCharCode(65 + index);
        let optContent = opt;

        // Custom Image Syntax parsing
        if (typeof opt === 'string' && opt.startsWith('[IMG:') && opt.endsWith(']')) {
          const imgFile = opt.slice(5, -1).trim();
          const imgPath = `./Previous Year Questions/${folderName}/assets/${imgFile}`;
          optContent = `<img src="${imgPath}" alt="Option ${key}" class="max-h-36 w-auto object-contain rounded bg-white p-2 border border-gray-700">`;
        }

        const inputType = qData.type === 'MCQ' ? 'radio' : 'checkbox';
        optionsHtml += `
          <label id="opt-container-${key}" class="flex items-start gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-700 cursor-pointer transition-all">
            <input type="${inputType}" name="q_option" value="${key}" onchange="handleInputChange()" class="mt-1 accent-emerald-500 w-4 h-4">
            <div class="flex-grow">
              <span class="font-bold text-gray-200">(${key})</span> 
              <span class="opt-text text-gray-300 ml-1">${optContent}</span>
              <div id="feedback-${key}" class="text-xs font-semibold mt-2 hidden"></div>
            </div>
          </label>
        `;
      });
      optionsHtml += `</div>`;
    } else if (qData.type === 'NAT') {
      optionsHtml = `
        <div class="mt-6 max-w-sm">
          <label class="block text-sm font-medium text-gray-400 mb-2">Enter Numerical Answer:</label>
          <input type="number" step="any" id="nat-input" oninput="handleInputChange()" placeholder="e.g. 42 or 3.14" 
            class="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 text-lg font-mono">
          <div id="nat-feedback" class="text-sm font-semibold mt-3 hidden"></div>
        </div>
      `;
    }

    // Inject Main Question HTML
    stage.innerHTML = `
      <div id="q-text" class="text-lg leading-relaxed"></div>
      ${assetImgHtml}
      ${codeHtml}
      ${optionsHtml}
      <div id="solution-box" class="mt-8 p-6 rounded-xl bg-gray-900 border border-gray-800 hidden">
        <h4 class="text-base font-bold text-emerald-400 mb-2">Explanation</h4>
        <div id="explanation-text" class="text-gray-300 text-sm leading-relaxed mb-4"></div>
        <div id="video-box"></div>
      </div>
    `;

    // Render Math text
    const textTarget = document.getElementById('q-text');
    textTarget.innerHTML = fixAssetPaths(qData.questionText);
    
    renderMathInElement(textTarget, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    });

    document.querySelectorAll('.opt-text').forEach(el => {
      renderMathInElement(el, {
        delimiters: [{left: '$', right: '$', display: false}],
        throwOnError: false
      });
    });

    actionFooter.classList.remove('hidden');

  } catch (error) {
    stage.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">Error loading question: ${error.message}</div>`;
  }
}

// --- INPUT EVENT HANDLER ---
function handleInputChange() {
  const checkBtn = document.getElementById('check-btn');
  const type = currentQuestionData.type;

  if (type === 'MCQ' || type === 'MSQ') {
    const checked = document.querySelectorAll('input[name="q_option"]:checked');
    checkBtn.disabled = checked.length === 0;
  } else if (type === 'NAT') {
    const natVal = document.getElementById('nat-input').value.trim();
    checkBtn.disabled = natVal === '';
  }
}

// --- CHECK ANSWER & GRADING ENGINE ---
function checkAnswer(folderName) {
  const qData = currentQuestionData;
  const checkBtn = document.getElementById('check-btn');
  checkBtn.disabled = true; // Freeze button

  if (qData.type === 'MCQ' || qData.type === 'MSQ') {
    const inputs = document.querySelectorAll('input[name="q_option"]');
    const correctAnswers = qData.answer || [];

    inputs.forEach(input => {
      input.disabled = true; // Freeze input controls
      const key = input.value;
      const isSelected = input.checked;
      const isCorrect = correctAnswers.includes(key);

      const container = document.getElementById(`opt-container-${key}`);
      const feedback = document.getElementById(`feedback-${key}`);

      feedback.classList.remove('hidden');

      if (isSelected && isCorrect) {
        container.className = "flex items-start gap-3 p-4 rounded-xl border-2 border-emerald-500 bg-emerald-500/10";
        feedback.className = "text-xs font-semibold mt-2 text-emerald-400";
        feedback.innerText = "✓ You selected correct option";
      } else if (isSelected && !isCorrect) {
        container.className = "flex items-start gap-3 p-4 rounded-xl border-2 border-red-500 bg-red-500/10";
        feedback.className = "text-xs font-semibold mt-2 text-red-400";
        feedback.innerText = "✕ You selected wrong option";
      } else if (!isSelected && isCorrect) {
        container.className = "flex items-start gap-3 p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10";
        feedback.className = "text-xs font-semibold mt-2 text-amber-400";
        feedback.innerText = "⚠ You missed this answer";
      }
    });

  } else if (qData.type === 'NAT') {
    const natInput = document.getElementById('nat-input');
    natInput.disabled = true;
    const userVal = parseFloat(natInput.value);
    const feedback = document.getElementById('nat-feedback');
    feedback.classList.remove('hidden');

    // Parse target range
    let min, max;
    if (typeof qData.answer === 'object' && !Array.isArray(qData.answer)) {
      min = qData.answer.min;
      max = qData.answer.max;
    } else if (Array.isArray(qData.answer)) {
      min = parseFloat(qData.answer[0]);
      max = qData.answer.length > 1 ? parseFloat(qData.answer[1]) : min;
    } else {
      min = parseFloat(qData.answer);
      max = min;
    }

    const isCorrect = !isNaN(userVal) && userVal >= min && userVal <= max;
    const rangeText = min === max ? `${min}` : `${min} to ${max}`;

    if (isCorrect) {
      natInput.className = "w-full border-2 border-emerald-500 bg-emerald-500/10 rounded-lg p-3 text-emerald-400 font-mono text-lg";
      feedback.className = "text-sm font-semibold mt-3 text-emerald-400";
      feedback.innerText = `✓ You answered correctly! Answer Range: [${rangeText}]`;
    } else {
      natInput.className = "w-full border-2 border-red-500 bg-red-500/10 rounded-lg p-3 text-red-400 font-mono text-lg";
      feedback.className = "text-sm font-semibold mt-3 text-red-400";
      feedback.innerText = `✕ You answered wrong. Correct Answer Range: [${rangeText}]`;
    }
  }

  // Render Explanation Box
  if (qData.explanation || qData.videoUrl) {
    const solutionBox = document.getElementById('solution-box');
    const expText = document.getElementById('explanation-text');
    const videoBox = document.getElementById('video-box');

    solutionBox.classList.remove('hidden');
    
    if (qData.explanation) {
      expText.innerHTML = fixAssetPaths(qData.explanation);
      renderMathInElement(expText, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }

    if (qData.videoUrl) {
      videoBox.innerHTML = `
        <a href="${qData.videoUrl}" target="_blank" class="inline-flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors">
          <i data-lucide="video" class="w-4 h-4"></i> Watch Video Solution
        </a>
      `;
      lucide.createIcons();
    }
  }
}