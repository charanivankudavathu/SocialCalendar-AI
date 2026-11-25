const { generateContent } = require("./gemini.js");
require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), rateLimit = require('express-rate-limit'), path = require('path');
const app = express();
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || !process.env.MONGODB_URI)
    throw Error('Set MONGODB_URI and JWT_SECRET (32+ characters) in .env');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('X-Frame-Options', 'DENY'); if (req.path.startsWith('/api'))
    res.set('Cache-Control', 'no-store'); next(); });
const User = mongoose.model('User', new mongoose.Schema({ email: { type: String, unique: true, required: true }, name: String, password: String, role: { type: String, default: 'user' }, posts: { type: Array, default: [] }, brand: { type: Object, default: { name: '', audience: '', tone: 'Friendly' } } }, { timestamps: true }));
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const auth = wrap(async (req, res, next) => { let payload; try {
    payload = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), secret, { algorithms: ['HS256'] });
}
catch {
    return res.status(401).json({ error: 'Please sign in again' });
} req.user = await User.findById(payload.sub); if (!req.user)
    return res.status(401).json({ error: 'Account unavailable' }); next(); });
const limit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts; try later' } });
const str = (x, n) => typeof x === 'string' && x.length <= n;
const token = u => jwt.sign({ sub: String(u._id) }, secret, { expiresIn: '8h', algorithm: 'HS256' });
app.get('/api/health', (q, r) => r.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.post('/api/auth/register', limit, wrap(async (q, r) => { let { name, email, password } = q.body; if (!str(name, 100) || !name.trim() || !str(email, 254) || !/^\S+@\S+\.\S+$/.test(email) || !str(password, 72) || password.length < 8 || Buffer.byteLength(password) > 72)
    return r.status(400).json({ error: 'Enter a valid name, email and password (8–72 bytes)' }); email = email.trim().toLowerCase(); let u = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12) }); r.status(201).json({ token: token(u) }); }));
app.post('/api/auth/login', limit, wrap(async (q, r) => { let { email, password } = q.body; if (!str(email, 254) || !str(password, 72))
    return r.status(400).json({ error: 'Invalid credentials' }); let u = await User.findOne({ email: email.trim().toLowerCase() }); if (!u || !await bcrypt.compare(password, u.password))
    return r.status(401).json({ error: 'Invalid credentials' }); r.json({ token: token(u) }); }));
app.get('/api/workspace', auth, (q, r) => r.json({ name: q.user.name, role: q.user.role, posts: q.user.posts, brand: q.user.brand }));
app.put('/api/workspace', auth, wrap(async (q, r) => { let { posts, brand } = q.body; const platforms = ['Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'X']; if (!Array.isArray(posts) || posts.length > 500 || !posts.every(p => p && str(p.id, 80) && p.id && str(p.title, 200) && p.title.trim() && str(p.caption, 4000) && p.caption.trim() && str(p.date, 10) && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && !isNaN(Date.parse(p.date)) && new Date(p.date).toISOString().slice(0, 10) === p.date && platforms.includes(p.platform) && ['Draft', 'Scheduled', 'Published'].includes(p.status)) || new Set(posts.map(p => p.id)).size !== posts.length || !brand || !str(brand.name, 100) || !str(brand.audience, 300) || !['Friendly', 'Professional', 'Creative'].includes(brand.tone))
    return r.status(400).json({ error: 'Invalid workspace data or 500-post limit exceeded' }); await User.updateOne({ _id: q.user._id }, { $set: { posts: posts.map(({ id, title, caption, date, platform, status }) => ({ id, title, caption, date, platform, status })), brand: { name: brand.name, audience: brand.audience, tone: brand.tone } } }); r.json({ ok: true }); }));
app.get('/api/admin/users', auth, wrap(async (q, r) => { if (q.user.role !== 'admin')
    return r.status(403).json({ error: 'Admin access required' }); r.json(await User.find().select('name email role createdAt').limit(500).lean()); }));

// Gemini AI integration

const aiLimit = rateLimit({
    windowMs: 60000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
});

app.post("/api/ai/generate", auth, aiLimit,
    wrap(async (req, res) => {
        const { prompt } = req.body || {};

        if (
            typeof prompt !== "string" ||
            !prompt.trim() ||
            prompt.length > 5000
        ) {
            return res.status(400).json({
                error: "Invalid prompt"
            });
        }

        try {
            const content = await generateContent(prompt);

            if (!content || !content.trim()) {
                return res.status(502).json({
                    error: "Empty AI response"
                });
            }

            res.json({
                success: true,
                content: content,
                model: process.env.GEMINI_MODEL ||
                    "gemini-4-hydrogen"
            });

        } catch (error) {
            console.error("Gemini error:", error.status);

            res.status(503).json({
                error: "AI service temporarily unavailable"
            });
        }
    })
);

app.use('/api', (q, r) => r.status(404).json({ error: 'Unknown API route' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((e, q, r, n) => { if (e.code === 11000)
    return r.status(409).json({ error: 'Email already registered' }); console.error(e.message); r.status(e.status === 400 ? 400 : 500).json({ error: 'Request failed' }); });
mongoose.connect(process.env.MONGODB_URI).then(() => app.listen(process.env.PORT || 8000, () => console.log('SocialCalendar running on port ' + (process.env.PORT || 8000)))).catch(e => { console.error('Database connection failed:', e.message); process.exit(1); });
