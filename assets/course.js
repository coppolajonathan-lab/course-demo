/* The Agentic Process in Claude: course interactions.
   Plain JavaScript, no dependencies. Progress is kept in localStorage. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ================= progress ================= */
  const REQUIRED = [1, 2, 3, 4, 5, 7];          // lesson 6 is optional, 8 is the wrap-up
  const ALL = [1, 2, 3, 4, 5, 6, 7];
  const KEY = "agentic-course-v1";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
  const done = new Set(saved.done || []);
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ done: [...done] })); } catch (e) {} }

  const dots = $("progDots");
  ALL.forEach((n) => {
    const a = document.createElement("a");
    a.href = "#b" + n;
    a.setAttribute("aria-label", `Lesson ${n}${n === 6 ? " (optional)" : ""}`);
    a.dataset.n = n;
    dots.appendChild(a);
  });

  function complete(n) {
    if (done.has(n)) return;
    done.add(n); persist(); renderProgress();
  }
  function renderProgress() {
    const req = REQUIRED.filter((n) => done.has(n)).length;
    const pct = Math.round((req / REQUIRED.length) * 100);
    $("progFill").style.width = pct + "%";
    $("progBar").setAttribute("aria-valuenow", pct);
    $("progLabel").textContent = `${req} of ${REQUIRED.length} lessons complete`;
    dots.querySelectorAll("a").forEach((a) => a.classList.toggle("done", done.has(+a.dataset.n)));
    const left = REQUIRED.filter((n) => !done.has(n));
    if (!left.length) {
      $("completeCard").classList.remove("hidden");
      $("completeText").textContent = `You finished every lesson${done.has(6) ? ", including the optional practice" : ""}` +
        (kcFirstTry !== null ? `, and scored ${kcFirstTry} of 5 on your first tries in the knowledge check.` : ".");
      $("remaining").textContent = "";
    } else {
      $("completeCard").classList.add("hidden");
      $("remaining").innerHTML = "Still to do: " + left.map((n) => `<a href="#b${n}">Lesson ${n}</a>`).join(" · ");
    }
  }
  $("reset").addEventListener("click", () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.hash = ""; location.reload();
  });

  /* Lesson 1: continue button */
  document.querySelectorAll("[data-complete]").forEach((b) => b.addEventListener("click", () => {
    complete(+b.dataset.complete);
    if (b.dataset.next) $(b.dataset.next).scrollIntoView({ behavior: "smooth" });
  }));

  /* ================= Lesson 2: flashcards ================= */
  const flipped = new Set();
  document.querySelectorAll("#cards .flip").forEach((card, i) => {
    card.addEventListener("click", () => {
      const on = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", on);
      $("cardsLive").textContent = on ? card.querySelector(".flip__back").textContent : "";
      flipped.add(i);
      if (flipped.size === 3) complete(2);
    });
  });

  /* ================= Lesson 3: process ================= */
  const STEPS = [
    { name: "Goal", title: "Start with the goal", text: "You describe the outcome, not the steps.",
      ex: "“A one-page summary of Q3 customer feedback, top three themes, for my manager.”" },
    { name: "Plan", title: "Plan", text: "The agent breaks the goal into steps.",
      ex: "Find the feedback files, read them, group comments into themes, count each theme, draft the page." },
    { name: "Act", title: "Act", text: "It takes one step using a tool, such as reading a file, searching the web or running code.",
      ex: "Opens the three feedback spreadsheets in the folder you shared." },
    { name: "Check", title: "Check", text: "It looks at the real result before moving on. Anthropic calls this getting “ground truth” from the environment.",
      ex: "One spreadsheet has no comments column, so its plan has to change." },
    { name: "Adjust", title: "Adjust, or ask", text: "It changes the plan, or it stops and asks you when only you can decide. Then the loop repeats until the summary is done.",
      ex: "“The September file has ratings but no comments. Include the ratings, or skip that file?”" }
  ];
  let pStep = 0; const pSeen = new Set();
  const pTabs = document.querySelector("#process .process__steps");
  STEPS.forEach((s, i) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab"); b.id = "pt" + i;
    b.innerHTML = `<span class="n">${i + 1}</span>${esc(s.name)}`;
    b.addEventListener("click", () => { pStep = i; renderProcess(); });
    pTabs.appendChild(b);
  });
  function renderProcess() {
    const s = STEPS[pStep];
    pTabs.querySelectorAll("button").forEach((b, i) => { b.setAttribute("aria-selected", i === pStep); b.tabIndex = i === pStep ? 0 : -1; });
    $("processBody").innerHTML = `<h3>${esc(s.title)}</h3><p class="lede" style="margin:0">${esc(s.text)}</p>
      <div class="example"><b>In our example:</b> ${esc(s.ex)}</div>`;
    $("procPrev").disabled = pStep === 0;
    $("procNext").disabled = pStep === STEPS.length - 1;
    pSeen.add(pStep);
    if (pSeen.size === STEPS.length) complete(3);
  }
  $("procPrev").addEventListener("click", () => { if (pStep > 0) { pStep--; renderProcess(); } });
  $("procNext").addEventListener("click", () => { if (pStep < STEPS.length - 1) { pStep++; renderProcess(); } });
  pTabs.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" && pStep < STEPS.length - 1) { pStep++; renderProcess(); pTabs.children[pStep].focus(); }
    if (e.key === "ArrowLeft" && pStep > 0) { pStep--; renderProcess(); pTabs.children[pStep].focus(); }
  });
  renderProcess();

  /* ================= Lesson 4: tabs ================= */
  const TABS = [
    { name: "Plan & progress", step: "Plan", body: "Claude breaks your request into subtasks and shows each step as it works, so you can follow along or redirect it partway through.",
      img: "1-plan-progress.png", w: 952, h: 202, cap: "One request, several steps: Claude states its plan before it starts.",
      alt: "A Claude conversation. The request reads: Rewrite my resume from my LinkedIn profile as a doc, export a PDF to my Job Search folder, and set up a weekly Monday check of my Gmail for recruiter replies. Claude replies with its plan: pull the LinkedIn profile, build the resume as a doc, export a PDF to the Job Search folder, and set up the Monday Gmail check." },
    { name: "Tools", step: "Act", body: "Claude acts through tools: connectors to your apps, a browser, files in folders you connect, and code run in an isolated environment. You choose which connectors it can use. For big jobs, it can hand parts of the work to sub-agents running in parallel.",
      img: "2-tools-connectors.png", w: 1028, h: 716, cap: "Connectors are Claude's tools. Here, Google Drive, Gmail, Canva and Google Docs are switched on.",
      alt: "Claude's connector directory listing Google Drive, Gmail, Google Calendar, Microsoft 365, Canva, Slack, Google Sheets, Notion, Atlassian, Google Docs, Figma and Supabase. Google Drive, Gmail, Canva and Google Docs show a check mark as connected; the others show a plus button to add them." },
    { name: "Skills & plugins", step: "Act", body: "Skills are saved instructions for doing one kind of task well, such as building a slide deck. Plugins bundle skills, connectors and sub-agents together.",
      img: "3-skills-plugins.png", w: 1232, h: 865, cap: "Skills and plugins are added from Customize, alongside connectors.",
      alt: "Claude's Customize page on the Skills tab, with Connectors and Plugins tabs beside it. It features a Data plugin from Anthropic and lists skills to try or add, including doc-coauthoring, web-artifacts-builder, learn, Plugin Management and Design." },
    { name: "Approvals", step: "Check & Ask", body: "You decide how much Claude can do on its own: Manual, Auto, or Skip all approvals. Auto reviews each action for safety before it runs. Permanently deleting files always needs your explicit “Allow.”",
      img: "4-approvals.png", w: 791, h: 284, cap: "A checkpoint: Claude asks before it writes to your document.",
      alt: "An approval prompt reading: Claude wants to write your resume content (from your LinkedIn profile) to the doc Jonathan Coppola — Resume in Claude Docs. Approve this edit? The options are Approve, Deny, or type something else." },
    { name: "Scheduled tasks & projects", step: "Repeat", body: "A task can run once, or on a schedule in the cloud with no device online. Projects group related tasks with their own files, instructions and memory.",
      img: "5-scheduled-task.png", w: 777, h: 303, cap: "A scheduled task runs the loop again on its own, every Monday.",
      alt: "A scheduled task named Weekly recruiter reply check. Schedule: every Monday at 8:17 AM EST. Permission mode: Auto. Instructions: check Gmail for recruiter replies from the past 7 days." }
  ];
  const STEP_COLOR = { "Plan": "var(--s-plan)", "Act": "var(--s-act)", "Check & Ask": "var(--s-ask)", "Repeat": "var(--s-adjust)" };
  let tIdx = 0; const tSeen = new Set();
  const tList = document.querySelector("#tabs .tablist");
  TABS.forEach((t, i) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "tabPanel"); b.textContent = t.name;
    b.addEventListener("click", () => { tIdx = i; renderTabs(); });
    tList.appendChild(b);
  });
  function renderTabs() {
    const t = TABS[tIdx];
    tSeen.add(tIdx);
    tList.querySelectorAll("button").forEach((b, i) => { b.setAttribute("aria-selected", i === tIdx); b.classList.toggle("seen", tSeen.has(i)); b.tabIndex = i === tIdx ? 0 : -1; });
    $("tabPanel").innerHTML = `<span class="step-tag" style="background:${STEP_COLOR[t.step]}">Loop step: ${esc(t.step)}</span>
      <h3>${esc(t.name)}</h3><p style="margin:0">${esc(t.body)}</p>
      <figure class="shot"><a href="images/tabs/${t.img}" target="_blank" rel="noopener" title="Open full size"><img src="images/tabs/${t.img}" width="${t.w}" height="${t.h}" alt="${esc(t.alt)}" decoding="async"></a>
      <figcaption>${esc(t.cap)} <span class="sr">(Opens full size in a new tab.)</span></figcaption></figure>`;
    if (tSeen.size === TABS.length) complete(4);
  }
  tList.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { tIdx = (tIdx + 1) % TABS.length; renderTabs(); tList.children[tIdx].focus(); }
    if (e.key === "ArrowLeft") { tIdx = (tIdx - 1 + TABS.length) % TABS.length; renderTabs(); tList.children[tIdx].focus(); }
  });
  renderTabs();
  TABS.forEach((t) => { const i = new Image(); i.src = "images/tabs/" + t.img; });

  /* ================= shared quiz helper ================= */
  function quiz(boxId, fbId, name, options, onCorrect) {
    const box = $(boxId);
    options.forEach((o, idx) => {
      const lab = document.createElement("label");
      lab.className = "opt";
      lab.innerHTML = `<input type="radio" name="${name}" value="${idx}"><span>${esc(o.text)}</span>`;
      lab.querySelector("input").addEventListener("change", () => {
        $(fbId).innerHTML = `<div class="fb ${o.correct ? "good" : "try"}"><b>${o.correct ? "Right." : "Not quite."}</b> ${esc(o.fb)}</div>`;
        if (o.correct) onCorrect();
      });
      box.appendChild(lab);
    });
  }

  /* ================= Lesson 5: lab ================= */
  function inline(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<i>$2</i>");
  }
  function md(src) {
    const lines = String(src || "").replace(/\r/g, "").split("\n");
    let html = "", list = null, i = 0;
    const close = () => { if (list) { html += `</${list}>`; list = null; } };
    while (i < lines.length) {
      const l = lines[i]; let m;
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        close();
        const row = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        html += "<table><thead><tr>" + row(l).map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>";
        i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { html += "<tr>" + row(lines[i]).map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>"; i++; }
        html += "</tbody></table>"; continue;
      }
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { close(); html += `<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`; }
      else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== "ul") { close(); html += "<ul>"; list = "ul"; } html += `<li>${inline(m[1])}</li>`; }
      else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); html += "<ol>"; list = "ol"; } html += `<li>${inline(m[1])}</li>`; }
      else if (!l.trim()) { close(); }
      else { close(); html += `<p>${inline(l)}</p>`; }
      i++;
    }
    close();
    return html;
  }

  const lab = { q1: false, end: false, q2: false };
  function labCheck() { if (lab.q1 && lab.end && lab.q2) complete(5); }

  fetch("data/lab_data.json").then((r) => r.json()).then(initLab).catch(() => {
    $("labSrc").textContent = "The lab data couldn't load. Refresh the page to try again.";
  });

  function initLab(D) {
    $("labSrc").innerHTML = D.isSample
      ? "Preview data written by hand. Not real Claude output."
      : `Real responses from the Claude API (${esc(D.model)}), captured ${esc(D.capturedAt)} with a <a href="https://github.com/coppolajonathan-lab/anthropic_lab_demo" target="_blank" rel="noopener">Python script</a>. Nothing is called live.`;
    $("promptVague").textContent = D.comparison.vague.prompt;
    $("promptSpecific").textContent = D.comparison.specific.prompt;
    $("replyVague").innerHTML = md(D.comparison.vague.response);
    $("replySpecific").innerHTML = md(D.comparison.specific.response);
    document.querySelectorAll("[data-reveal]").forEach((btn) => btn.addEventListener("click", () => {
      const el = $("reply" + btn.dataset.reveal);
      const open = el.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", open);
      btn.textContent = open ? "Hide Claude's plan" : "Show Claude's plan";
    }));
    quiz("labQ1", "labQ1fb", "labq1", [
      { text: "Request A, because a short request gives Claude more freedom.", correct: false,
        fb: "Look at Request A's questions: Claude has to ask what you want before its plan can be specific. Freedom without a goal costs a round of back-and-forth." },
      { text: "Request B, because it names the outcome, the audience, the format and the limits.", correct: true,
        fb: "Compare the questions. Request A's ask what the goal even is. Request B's only cover details, so its plan is concrete from step one." },
      { text: "Neither. Claude needs a step-by-step script for every task.", correct: false,
        fb: "Scripting every step turns an agent back into a fixed workflow. Agents plan their own steps once the goal is clear." }
    ], () => { lab.q1 = true; labCheck(); });

    const steps = D.loop.steps;
    let cur = 0, maxSeen = 0;
    const EXPLAIN = {
      Plan: "Claude breaks the goal into steps before touching any tools.",
      Act: "Claude acts by calling a tool. In the API this is a tool_use block: Claude names the tool and its inputs, and your code runs it.",
      Check: "The tool's real result goes back to Claude. Anthropic calls this getting “ground truth” from the environment.",
      Adjust: "Claude compares what it found with its plan, and keeps going or changes course.",
      Ask: "Only you can make this call, so Claude pauses and asks instead of guessing. This is a human checkpoint.",
      Done: "The task is complete, so the loop stops. In the API, the response ends with stop_reason “end_turn” instead of “tool_use”."
    };
    const label = (s) => (s === "Ask" ? "Ask you" : s);
    function titleFor(s) {
      if (s.kind === "tool_call") return s.tool === "ask_user" ? "Claude asks you a question" : `Claude calls ${s.tool}`;
      if (s.kind === "tool_result") return s.from_user ? "Your answer goes back to Claude" : `Result of ${s.tool}`;
      return { Plan: "Claude makes a plan", Adjust: "Claude reviews what it found", Done: "Claude delivers the result" }[s.stage] || "Claude";
    }
    function render() {
      const s = steps[cur], raw = $("vraw").checked;
      $("vchip").className = "chip " + s.stage; $("vchip").textContent = label(s.stage);
      $("vtitle").textContent = titleFor(s);
      $("vmeta").textContent = `Step ${cur + 1} of ${steps.length} · Turn ${s.turn}`;
      document.querySelectorAll(".ring .node").forEach((n) => n.classList.toggle("on", n.dataset.s === s.stage));
      let body = "";
      if (s.kind === "text") {
        body = `<div class="md">${md(s.text)}</div>`;
        if (raw) body += `<pre><code>${esc(JSON.stringify({ type: "text", text: s.text }, null, 2))}</code></pre>`;
      } else if (s.kind === "tool_call") {
        const has = Object.keys(s.input || {}).length;
        body = s.tool === "ask_user" ? `<p><b>Claude:</b> “${esc(s.input.question || "")}”</p>`
          : `<p>Claude chose the <code>${esc(s.tool)}</code> tool${has ? " with these inputs:" : " (no inputs needed)."}</p>` +
            (has ? `<pre><code>${esc(JSON.stringify(s.input, null, 2))}</code></pre>` : "");
        if (raw) body += `<p class="vmeta" style="margin:10px 0 0">Content block in Claude's API response:</p><pre><code>${esc(JSON.stringify(s.raw, null, 2))}</code></pre>`;
      } else {
        body = s.from_user ? `<p><b>You:</b> “${esc(s.output)}”</p>` : `<p>What the tool returned to Claude:</p><pre><code>${esc(s.output)}</code></pre>`;
        if (raw) body += `<p class="vmeta" style="margin:10px 0 0">Sent back to Claude in the next request:</p><pre><code>${esc(JSON.stringify({ type: "tool_result", tool_use_id: "toolu_…", content: s.output }, null, 2))}</code></pre>`;
      }
      body += `<div class="explain"><b>${esc(label(s.stage))}:</b> ${esc(EXPLAIN[s.stage] || "")}</div>`;
      $("vbody").innerHTML = body;
      maxSeen = Math.max(maxSeen, cur);
      const pct = Math.round(((maxSeen + 1) / steps.length) * 100);
      $("vfill").style.width = pct + "%"; $("vbar").setAttribute("aria-valuenow", pct);
      $("vprev").disabled = cur === 0; $("vnext").disabled = cur === steps.length - 1;
      if (cur === steps.length - 1 && !lab.end) { lab.end = true; unlockP3(); }
    }
    $("vprev").addEventListener("click", () => { if (cur > 0) { cur--; render(); } });
    $("vnext").addEventListener("click", () => { if (cur < steps.length - 1) { cur++; render(); } });
    $("vraw").addEventListener("change", render);
    $("viewer").addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") { $("vnext").click(); e.preventDefault(); }
      if (e.key === "ArrowLeft") { $("vprev").click(); e.preventDefault(); }
    });
    function unlockP3() {
      $("labP3lock").classList.add("hidden"); $("labP3").classList.remove("hidden");
      const u = D.loop.usage || { input: 0, output: 0 };
      $("sTurns").textContent = D.loop.turns;
      $("sTools").textContent = steps.filter((s) => s.kind === "tool_call").length;
      $("sTokens").textContent = (u.input + u.output).toLocaleString();
      labCheck();
    }
    quiz("labQ2", "labQ2fb", "labq2", [
      { text: "It skipped the file without mentioning it.", correct: false,
        fb: "Step back through Part 2. Claude didn't hide the problem: it said what was missing in its steps or its final answer." },
      { text: "It checked the real file contents, saw the missing column, and adjusted instead of guessing.", correct: true,
        fb: "That's Check → Adjust. Claude reads the real results rather than assuming each step worked, then changes course: it asks you, or leaves the file out and says so." },
      { text: "It invented comments for September so the counts would include it.", correct: false,
        fb: "Nothing in the brief comes from September comments. Claude worked only from what the tools actually returned." }
    ], () => { lab.q2 = true; labCheck(); });
    render();
  }

  /* ================= Lesson 6: scenario ================= */
  const D1 = [
    { text: "“Look into competitor pricing.”", tag: "Vague goal",
      result: "Claude asks three clarifying questions: which competitors, which products and what format.",
      fb: "Partly right. Claude can still get there, but a vague goal costs you a round of back-and-forth.", kind: "try" },
    { text: "“Compare monthly pricing for our three main competitors' starter plans in a one-page doc I can share Friday. Use their public pricing pages, and cite each one.”", tag: "Outcome + context + limits",
      result: "Claude shows a plan: find three pricing pages, pull the starter-plan prices, build a comparison table, add sources, draft the doc.",
      fb: "Best choice. You gave an outcome, context, a format and a limit, so Claude can plan right away.", kind: "good" },
    { text: "A 10-step list of exactly which sites to open and what to copy.", tag: "Over-scripted",
      result: "Claude follows your steps, but misses a competitor whose pricing moved to a new page.",
      fb: "Not ideal. Over-scripting turns an agent back into a workflow. Describe the result, and let it plan.", kind: "try" }
  ];
  const D2 = [
    { text: "Approve without reading.", tag: "Skipped the check",
      result: "The email goes out with one competitor's price in the wrong currency.",
      fb: "Risky. Approval checkpoints are your Check step. Use them.", kind: "try" },
    { text: "Open the draft, fix one figure, then approve.", tag: "Checked, then approved",
      result: "The corrected brief goes to your manager.",
      fb: "Best choice. You stay in the loop at the moment it matters: before anything leaves your hands.", kind: "good" },
    { text: "Decline, and copy the text into your own email.", tag: "Safe but slow",
      result: "It works, but takes longer.",
      fb: "Fine, but slower. Declining is always safe. Reviewing and approving gets you the same result faster.", kind: "try" }
  ];
  const picks = [];
  function decision(boxId, opts, idx, after) {
    const box = $(boxId), list = box.querySelector(".choices");
    opts.forEach((o, i) => {
      const b = document.createElement("button");
      b.className = "choice"; b.setAttribute("aria-pressed", "false"); b.textContent = o.text;
      b.addEventListener("click", () => {
        list.querySelectorAll(".choice").forEach((c) => { c.disabled = true; c.setAttribute("aria-pressed", c === b); });
        picks[idx] = o;
        box.querySelector(".result").innerHTML = `<div class="mock"><div class="mock-h">What happens</div>${esc(o.result)}</div>
          <div class="fb ${o.kind}"><b>${o.kind === "good" ? "Nice." : "Consider this."}</b> ${esc(o.fb)}</div>
          <button class="btn sm" style="margin-top:10px">Try this decision again</button>`;
        box.querySelector(".result .btn").addEventListener("click", () => {
          list.querySelectorAll(".choice").forEach((c) => { c.disabled = false; c.setAttribute("aria-pressed", "false"); });
          box.querySelector(".result").innerHTML = "";
        });
        after();
      });
      list.appendChild(b);
    });
  }
  decision("d1", D1, 0, () => { $("d2").classList.remove("hidden"); });
  decision("d2", D2, 1, () => {
    if (!picks[0] || !picks[1]) return;
    $("scenarioWrap").classList.remove("hidden");
    $("scenarioRecap").textContent = `You asked with: ${picks[0].tag}. Claude planned and acted. At the checkpoint, you: ${picks[1].tag.toLowerCase()}. That's the loop: Plan → Act → Check → Adjust, with you at the checkpoint.`;
    complete(6);
  });

  /* ================= Lesson 7: knowledge check ================= */
  let kcFirstTry = null;
  const kcState = []; // per question: { answered, firstCorrect }
  const KC = [
    { type: "mc", q: "What makes a system “agentic” rather than a fixed workflow?",
      opts: ["It uses a larger AI model", "It decides its own steps and tool use based on what it finds", "It follows steps a developer coded in advance", "It only answers one question at a time"],
      answer: [1], fb: "Agents direct their own process. Workflows follow a path written in advance." },
    { type: "order", q: "Put the agentic loop in order.", items: ["Plan", "Act", "Check", "Adjust"],
      start: ["Check", "Adjust", "Plan", "Act"], fb: "Plan → Act → Check → Adjust. The loop repeats until the task is done or Claude needs a decision from you." },
    { type: "mc", q: "In the agentic loop, what is the Check step for?",
      opts: ["Asking you for permission before every action", "Looking at the real result of a step before moving on", "Re-reading the original request", "Speeding up the task by skipping steps"],
      answer: [1], fb: "Checking real results, the “ground truth,” is how an agent catches its own mistakes." },
    { type: "mc", q: "Which task request will work best for Claude?",
      opts: ["“Do something with these files.”", "A numbered list of every click to make", "“Summarize Q3 support tickets into a one-page doc with the top three issues and how often each came up.”", "“Be thorough.”"],
      answer: [2], fb: "Give an outcome, context, a format and any limits. Leave the step-by-step planning to Claude." },
    { type: "multi", q: "Which of these can Claude do while running a task? Select all that apply.",
      opts: ["Use connectors to apps you've allowed", "Pause to ask for your approval before an action", "Run a task on a schedule", "Permanently delete files without your explicit approval"],
      answer: [0, 1, 2], fb: "Permanently deleting files always needs your “Allow.” The other three are all part of how Claude runs tasks." }
  ];
  const kcBox = $("kc");
  KC.forEach((item, qi) => {
    kcState[qi] = { answered: false, firstCorrect: null };
    const card = document.createElement("div");
    card.className = "qcard";
    let inner = `<div class="qn">Question ${qi + 1} of ${KC.length}</div><fieldset class="q" style="margin-top:4px"><legend>${esc(item.q)}</legend>`;
    if (item.type === "order") {
      inner += `<ol class="order" aria-label="Current order"></ol>`;
    } else {
      inner += `<div class="opts">` + item.opts.map((o, i) => `<label class="opt"><input type="${item.type === "multi" ? "checkbox" : "radio"}" name="kc${qi}" value="${i}"><span>${esc(o)}</span></label>`).join("") + `</div>`;
    }
    inner += `</fieldset><button class="btn sm solid" style="margin-top:12px">Check answer</button><div class="kcfb" aria-live="polite"></div>`;
    card.innerHTML = inner;
    kcBox.appendChild(card);

    let order = item.start ? [...item.start] : null;
    if (order) {
      const ol = card.querySelector(".order");
      const draw = () => {
        ol.innerHTML = order.map((lbl, i) => `<li><span class="pos">${i + 1}</span><span class="lbl">${esc(lbl)}</span>
          <button aria-label="Move ${esc(lbl)} up" ${i === 0 ? "disabled" : ""} data-mv="${i},-1">↑</button>
          <button aria-label="Move ${esc(lbl)} down" ${i === order.length - 1 ? "disabled" : ""} data-mv="${i},1">↓</button></li>`).join("");
        ol.querySelectorAll("[data-mv]").forEach((b) => b.addEventListener("click", () => {
          const [i, d] = b.dataset.mv.split(",").map(Number);
          [order[i], order[i + d]] = [order[i + d], order[i]];
          draw();
          const target = ol.querySelector(`[data-mv="${i + d},${d}"]`) || ol.querySelector(`[data-mv="${i + d},${-d}"]`);
          if (target) target.focus();
        }));
      };
      draw();
    }
    card.querySelector(".btn").addEventListener("click", () => {
      let ok;
      if (item.type === "order") ok = order.join() === item.items.join();
      else {
        const sel = [...card.querySelectorAll("input:checked")].map((x) => +x.value).sort().join();
        if (!sel) { card.querySelector(".kcfb").innerHTML = `<div class="fb try">Choose an answer first.</div>`; return; }
        ok = sel === [...item.answer].sort().join();
      }
      const st = kcState[qi];
      if (st.firstCorrect === null) st.firstCorrect = ok;
      st.answered = true;
      card.querySelector(".kcfb").innerHTML = `<div class="fb ${ok ? "good" : "try"}"><b>${ok ? "Right." : "Not quite. Try again."}</b> ${ok ? esc(item.fb) : ""}</div>`;
      if (kcState.every((s) => s.answered)) {
        kcFirstTry = kcState.filter((s) => s.firstCorrect).length;
        $("kcScore").classList.remove("hidden");
        $("kcScore").innerHTML = `<b>${kcFirstTry} / ${KC.length}</b><span class="vmeta">correct on the first try</span>`;
        complete(7);
      }
    });
  });

  renderProgress();
})();
