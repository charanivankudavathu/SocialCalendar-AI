(async () => {
    let token = sessionStorage.getItem('sc-token');
    const main = document.querySelector('main'), aside = document.querySelector('aside');
    const api = async (url, method = 'GET', body) => { const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const d = await r.json(); if (!r.ok)
        throw Error(d.error || 'Request failed'); return d; };
    function login() { main.hidden = true; aside.hidden = true; const panel = document.createElement('section'); panel.className = 'glass auth-panel'; panel.innerHTML = '<h1>SocialCalendar <strong>AI</strong></h1><p>Make room for your best ideas.</p><form><label>Name (registration only)<input name="name" maxlength="100"></label><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required minlength="8" maxlength="72"></label><div class="actions"><button value="login">Sign in</button><button value="register" class="secondary">Create account</button></div><p role="status"></p></form>'; document.body.append(panel); panel.querySelector('form').onsubmit = async (e) => { e.preventDefault(); let f = e.currentTarget, status = f.querySelector('[role=status]'); try {
        const d = await api('/api/auth/' + e.submitter.value, 'POST', Object.fromEntries(new FormData(f)));
        sessionStorage.setItem('sc-token', d.token);
        location.reload();
    }
    catch (err) {
        status.textContent = err.message;
    } }; }
    if (!token)
        return login();
    try {
        window.workspace = await api('/api/workspace');
    }
    catch (e) {
        sessionStorage.removeItem('sc-token');
        return login();
    }
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.className = 'muted';
    document.querySelector('header').after(status);
    let queue = Promise.resolve();
    window.persistWorkspace = data => { const snapshot = JSON.parse(JSON.stringify(data)); status.textContent = 'Saving…'; queue = queue.then(() => api('/api/workspace', 'PUT', snapshot)).then(() => { status.textContent = 'Saved to your account'; }).catch(e => { status.textContent = 'Not saved: ' + e.message + ' — retry before leaving.'; const retry = document.createElement('button'); retry.textContent = 'Retry save'; retry.onclick = () => window.persistWorkspace(snapshot); status.append(' ', retry); }); return queue; };
    const logout = document.createElement('button');
    logout.textContent = 'Sign out';
    logout.onclick = async () => { await queue; sessionStorage.removeItem('sc-token'); location.reload(); };
    document.querySelector('aside footer').append(logout);
    if (window.workspace.role === 'admin') {
        const admin = document.createElement('button');
        admin.textContent = 'Admin users';
        admin.onclick = async () => { try {
            const users = await api('/api/admin/users');
            const d = document.createElement('dialog');
            const h = document.createElement('h2');
            h.textContent = 'Registered users';
            d.append(h);
            users.forEach(u => { const p = document.createElement('p'); p.textContent = u.name + ' · ' + u.email + ' · ' + u.role; d.append(p); });
            const b = document.createElement('button');
            b.textContent = 'Close';
            b.onclick = () => d.close();
            d.append(b);
            document.body.append(d);
            d.addEventListener('close', () => d.remove());
            d.showModal();
        }
        catch (e) {
            status.textContent = e.message;
        } };
        document.querySelector('aside footer').append(admin);
    }
    const script = document.createElement('script');
    script.src = 'app.js';
    document.body.append(script);
})();
