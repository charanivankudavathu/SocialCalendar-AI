const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const read = (k, d) => { try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
}
catch {
    return d;
} };
let posts = window.workspace.posts, brand = window.workspace.brand, page = 'Dashboard', month = new Date(), editing = null;
const save = () => window.persistWorkspace({ posts, brand });
const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const icons = [['Dashboard', '#a78bfa', 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'], ['Calendar', '#22d3ee', 'M3 6h18v15H3z M7 3v6 M17 3v6 M3 11h18'], ['AI Studio', '#c4b5fd', 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z'], ['Brand Kit', '#f472b6', 'M12 3a9 9 0 1 0 9 9 M12 3a9 9 0 0 1 9 9 M7 10h1 M12 7h1 M16 11h1'], ['Analytics', '#34d399', 'M3 3v18h18 M7 16v-5 M12 16V6 M17 16v-8']];
function nav() { $('#nav').innerHTML = icons.map(([n, c, p]) => `<button class="${page === n ? 'active' : ''}" data-page="${n}"><svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"><path d="${p}"/></svg>${n}</button>`).join(''); }
;
function list() { return posts.length ? posts.map(p => `<div class="post"><div><b>${esc(p.title)}</b><p class="muted">${esc(p.date)} · ${esc(p.platform)} · ${esc(p.status)}</p><p>${esc(p.caption)}</p></div><div class="actions"><button class="secondary" data-edit="${esc(p.id)}">Edit</button><button class="secondary" data-delete="${esc(p.id)}">Delete</button></div></div>`).join('') : '<p class="muted">No posts yet. Create a post or generate an AI-powered calendar in AI Studio.</p>'; }
function render() { nav(); let html = ''; if (page === 'Dashboard')
    html = `<h1>Less planning.<br><strong>More creating.</strong></h1><p class="muted">A little more space for your best ideas.</p><div class="actions"><button data-page="AI Studio">Generate my calendar</button><button class="secondary" data-page="Calendar">Explore calendar</button></div><div class="metrics" style="margin-top:28px">${['Draft', 'Scheduled', 'Published'].map(s => `<div class="glass"><span class="muted">${s} posts</span><div class="number">${posts.filter(p => p.status === s).length}</div></div>`).join('')}</div><div class="glass"><h2>Content workspace</h2>${list()}</div>`; if (page === 'Calendar') {
    let y = month.getFullYear(), m = month.getMonth(), start = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    html = `<h1>Content calendar</h1><div class="glass"><div class="actions"><button data-month="-1">‹</button><h2>${month.toLocaleString('en', { month: 'long', year: 'numeric' })}</h2><button data-month="1">›</button></div><div class="calendar">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<small>${d}</small>`).join('')}${'<div></div>'.repeat(start)}${Array.from({ length: days }, (_, i) => { let d = dateStr(new Date(y, m, i + 1)); return `<div class="day">${i + 1}${posts.filter(p => p.date === d).map(p => `<button class="event" data-edit="${esc(p.id)}">${esc(p.title)}</button>`).join('')}</div>`; }).join('')}</div></div><button id="export">Export CSV</button>`;
} if (page === 'AI Studio')
    html = `<h1>Content studio</h1><p class="muted">Create personalized content calendars powered by Gemini AI.</p><form id="generate" class="glass"><div class="formgrid"><label>Brand name<input name="name" required value="${esc(brand.name)}"></label><label>Audience<input name="audience" required value="${esc(brand.audience)}"></label><label>Platform<select name="platform">${['Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'X'].map(p => `<option>${p}</option>`).join('')}</select></label><label>Duration<select name="days"><option>7</option><option>15</option><option>30</option></select></label><label>Start date<input type="date" name="start" required value="${dateStr(new Date())}"></label></div><button>Generate AI content calendar</button></form><div class="glass">${list()}</div>`; if (page === 'Brand Kit')
    html = `<h1>Brand kit</h1><form id="brandForm" class="glass"><label>Brand name<input name="name" value="${esc(brand.name)}" required></label><label>Target audience<input name="audience" value="${esc(brand.audience)}"></label><label>Brand voice<select name="tone">${['Friendly', 'Professional', 'Creative'].map(t => `<option ${brand.tone === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><button>Save brand</button></form>`; if (page === 'Analytics')
    html = `<h1>Content analytics</h1><p class="muted">Account planning statistics, not live social engagement.</p><div class="glass">${['Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'X'].map(p => { let n = posts.filter(x => x.platform === p).length; return `<p>${p} · ${n}</p><div style="background:#ffffff12;border-radius:8px;height:12px"><div style="background:linear-gradient(90deg,#8b5cf6,#22d3ee);height:12px;border-radius:8px;width:${posts.length ? n / posts.length * 100 : 0}%"></div></div>`; }).join('')}</div>`; $('#view').innerHTML = html; }
function edit(p) { editing = p?.id ?? null; let f = $('#postForm'); f.reset(); Object.entries(p ?? { date: dateStr(new Date()) }).forEach(([k, v]) => { if (f.elements.namedItem(k))
    f.elements.namedItem(k).value = v; }); $('#editor').showModal(); }
document.addEventListener('click', e => { let b = e.target.closest('button'); if (!b)
    return; if (b.dataset.page) {
    page = b.dataset.page;
    render();
} if (b.dataset.month) {
    month = new Date(month.getFullYear(), month.getMonth() + Number(b.dataset.month), 1);
    render();
} if (b.dataset.edit)
    edit(posts.find(p => p.id === b.dataset.edit)); if (b.dataset.delete && confirm('Delete this post?')) {
    posts = posts.filter(p => p.id !== b.dataset.delete);
    save();
    render();
} if (b.id === 'new')
    edit(); if (b.id === 'cancel')
    $('#editor').close(); if (b.id === 'export') {
    let cell = v => '"' + String(v).replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""') + '"';
    let csv = ['Title,Date,Platform,Caption,Status', ...posts.map(p => [p.title, p.date, p.platform, p.caption, p.status].map(cell).join(','))].join('\n');
    let u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    let a = document.createElement('a');
    a.href = u;
    a.download = 'content-calendar.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
} });
document.addEventListener('submit', e => { e.preventDefault(); let d = Object.fromEntries(new FormData(e.target)); if (e.target.id === 'postForm') {
    let p = { ...d, id: editing ?? crypto.randomUUID() };
    posts = editing ? posts.map(x => x.id === editing ? p : x) : [...posts, p];
    save();
    $('#editor').close();
} if (e.target.id === 'brandForm') {
    brand = d;
    save();
} if (e.target.id === 'generate') {
    let topics = ['Brand introduction', 'Useful tips', 'Behind the scenes', 'Audience question', 'Product spotlight', 'Community story', 'Weekly recap'];
    for (let i = 0; i < Number(d.days); i++) {
        let dt = new Date(d.start + 'T12:00:00');
        dt.setDate(dt.getDate() + i);
        let topic = topics[i % 7];
        posts.push({ id: crypto.randomUUID(), title: topic, date: dateStr(dt), platform: d.platform, status: 'Draft', caption: `${d.name}: ${topic}. Share something useful with ${d.audience}. ${brand.tone === 'Professional' ? 'Discover more about our work.' : 'Tell us what you think!'} #ContentPlanning` });
    }
    save();
} render(); });
document.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse')
    return; let c = $('.cursor'); c.style.display = 'block'; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
render();


// ==========================================
// REAL GEMINI AI INTEGRATION
// ==========================================

let geminiBusy = false;

document.addEventListener("submit", async function(event) {

    const form = event.target;

    if (form.id !== "generate") {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (geminiBusy) {
        return;
    }

    const data = Object.fromEntries(new FormData(form));

    const days = Number(data.days);

    const token = sessionStorage.getItem("sc-token");

    if (!token) {
        alert("Please sign in again.");
        return;
    }

    if (![7, 15, 30].includes(days)) {
        alert("Invalid calendar duration.");
        return;
    }

    if (posts.length + days > 500) {
        alert("Workspace post limit reached.");
        return;
    }

    const start = new Date(data.start + "T12:00:00");

    if (Number.isNaN(start.getTime())) {
        alert("Please select a valid date.");
        return;
    }

    const button = form.querySelector('button[type="submit"]')
        || form.querySelector("button");

    geminiBusy = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Generating with Gemini AI...";
    }

    try {

        const prompt = `
You are a professional social media content strategist.

Generate exactly ${days} social media posts.

Brand: ${data.name}
Audience: ${data.audience}
Platform: ${data.platform}
Tone: ${data.tone || brand.tone || "Friendly"}
Theme: ${data.theme || "Brand awareness"}
Language: ${data.language || "English"}

Requirements:
- Unique and creative titles.
- Engaging captions.
- Relevant hashtags.
- Suitable calls to action.
- Platform-specific content.
- Avoid repetitive ideas.
- Do not invent brand facts.
- Keep captions concise.

Return ONLY a valid JSON array.

Format:

[
    {
        "title": "Post title",
        "caption": "Caption with hashtags"
    }
]

Return exactly ${days} objects.
Do not include explanations or markdown.
`;

        const response = await fetch("/api/ai/generate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({ prompt })

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "AI generation failed"
            );
        }

        if (typeof result.content !== "string") {
            throw new Error("Invalid AI response.");
        }

        const clean = result.content
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");

        const generated = JSON.parse(clean);

        if (
            !Array.isArray(generated) ||
            generated.length !== days
        ) {
            throw new Error(
                "AI returned an incomplete calendar. Try again."
            );
        }

        const newPosts = generated.map((item, index) => {

            if (
                !item ||
                typeof item.title !== "string" ||
                typeof item.caption !== "string" ||
                !item.title.trim() ||
                !item.caption.trim()
            ) {
                throw new Error("Invalid generated post.");
            }

            const date = new Date(start);

            date.setDate(date.getDate() + index);

            const formattedDate =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0");

            return {
                id: crypto.randomUUID(),
                title: item.title.trim().slice(0, 200),
                caption: item.caption.trim().slice(0, 4000),
                platform: data.platform,
                date: formattedDate,
                status: "Draft"
            };

        });

        if (posts.length + newPosts.length > 500) {
            throw new Error("Workspace post limit reached.");
        }

        posts.push(...newPosts);

        await window.persistWorkspace({
            posts,
            brand
        });

        render();

        alert(
            days + " AI posts generated! Check the account save status."
        );

    } catch (error) {

        console.error("Gemini error:", error);

        alert(
            error.message || "AI generation failed. Try again."
        );

    } finally {

        geminiBusy = false;

        if (button) {
            button.disabled = false;
            button.textContent = "Generate AI content calendar";
        }

    }

}, true);

