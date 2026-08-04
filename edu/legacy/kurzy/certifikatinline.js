import { generateCertificate, downloadCertificate, shareCertificate } from '../js/components/certificate.js';
import { getVevitUser } from '../js/auth.js';

const params = new URLSearchParams(location.search);
const uuid = params.get('uuid');
const slug = params.get('slug');
const content = document.getElementById('content');

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-[#1e1e1e] border border-white/10 text-white text-sm font-medium shadow-lg';
    toast.style.animation = 'fadeUp 0.3s ease both';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

if (uuid) {
    // Public verification page
    showLoading();
    try {
        const res = await fetch(`/edu/legacy/api/certificates/verify?uuid=${encodeURIComponent(uuid)}`);
        if (!res.ok) {
            if (res.status === 404) {
                showError('Certifikát nenalezen', 'Tento certifikát neexistuje nebo byl zneplatněn.');
            } else {
                showError('Chyba', 'Nepodařilo se ověřit certifikát.');
            }
            throw new Error('API error');
        }
        const json = await res.json();
        const data = json.data;

        const dateStr = new Intl.DateTimeFormat('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(data.issued_at));

        content.innerHTML = `
            <div class="text-center mb-8">
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>
                    <span class="text-sm font-bold text-emerald-400">Certifikát ověřen</span>
                </div>
                <h1 class="text-3xl font-extrabold text-[#f0f0f0] mb-2">${escHtml(data.user_name || data.user_nick)}</h1>
                <p class="text-[#9ca3af]">dokončil/a kurz <strong class="text-[#f0f0f0]">${escHtml(data.course_title)}</strong></p>
                <p class="text-xs text-[#6b7280] mt-2">${dateStr}</p>
            </div>
            <div id="cert-canvas-container" class="border border-white/8 rounded-2xl overflow-hidden shadow-2xl mb-6"></div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button id="btn-download" class="px-6 py-3 bg-accent hover:bg-[#059669] text-[#0d0d0d] font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> Stáhnout PNG
                </button>
                <button id="btn-linkedin" class="px-6 py-3 bg-[#1e1e1e] border border-white/8 hover:border-accent/30 text-[#9ca3af] hover:text-[#f0f0f0] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="linkedin" class="w-4 h-4"></i> Sdílet na LinkedIn
                </button>
                <button id="btn-copy" class="px-6 py-3 bg-[#1e1e1e] border border-white/8 hover:border-accent/30 text-[#9ca3af] hover:text-[#f0f0f0] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="link" class="w-4 h-4"></i> Kopírovat odkaz
                </button>
            </div>`;
        lucide.createIcons();

        // Render canvas
        const certData = {
            userName: data.user_name || data.user_nick,
            userNick: data.user_nick,
            courseName: data.course_title,
            courseSlug: data.course_slug,
            uuid: data.uuid,
            issuedAt: data.issued_at,
        };
        const canvas = await generateCertificate(certData);
        const container = document.getElementById('cert-canvas-container');
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        container.appendChild(canvas);

        // Bind buttons
        document.getElementById('btn-download').addEventListener('click', () => downloadCertificate(certData));

        document.getElementById('btn-linkedin').addEventListener('click', () => {
            const verifyUrl = `https://edu.vevit.fun/pages/certifikat.html?uuid=${data.uuid}`;
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`, '_blank');
        });

        document.getElementById('btn-copy').addEventListener('click', async () => {
            await shareCertificate(data.uuid);
            showToast('Odkaz zkopírován!');
        });

    } catch (e) {
        // Error already shown
    }

} else if (slug) {
    // Own certificate for a course
    const user = getVevitUser();
    if (!user) {
        content.innerHTML = `
            <div class="bg-[#161616] border border-white/8 rounded-xl p-8 text-center">
                <i data-lucide="lock" class="w-10 h-10 text-[#6b7280] mx-auto mb-3"></i>
                <p class="text-[#9ca3af] text-sm">
                    <a href="https://account.vevit.fun" class="text-accent hover:underline">Přihlas se</a>
                    pro zobrazení certifikátu
                </p>
            </div>`;
        lucide.createIcons();
    } else {
        showLoading();
        try {
            const res = await fetch('/edu/legacy/api/certificates/my', { credentials: 'include' });
            const json = await res.json();
            const certs = json.data || [];
            const cert = certs.find(c => c.course_slug === slug);

            if (!cert) {
                content.innerHTML = `
                    <div class="bg-[#161616] border border-white/8 rounded-xl p-8 text-center">
                        <i data-lucide="x-circle" class="w-10 h-10 text-[#6b7280] mx-auto mb-3"></i>
                        <h2 class="text-lg font-bold text-[#f0f0f0] mb-2">Kurz ještě není dokončen</h2>
                        <p class="text-[#9ca3af] text-sm mb-4">Dokonč všechny lekce kurzu pro získání certifikátu.</p>
                        <a href="kurz.html?slug=${encodeURIComponent(slug)}" class="inline-block px-5 py-2.5 bg-accent hover:bg-[#059669] text-[#0d0d0d] font-bold rounded-xl transition-colors">Zpět na kurz</a>
                    </div>`;
                lucide.createIcons();
            } else {
                const certData = {
                    userName: cert.user_name || cert.user_nick || user.nickname || user.nick || 'Uživatel',
                    userNick: cert.user_nick || user.nickname || user.nick || 'user',
                    courseName: cert.course_title,
                    courseSlug: cert.course_slug,
                    uuid: cert.uuid,
                    issuedAt: cert.issued_at,
                };

                const dateStr = new Intl.DateTimeFormat('cs-CZ', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }).format(new Date(cert.issued_at));

                content.innerHTML = `
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                            <i data-lucide="award" class="w-5 h-5 text-emerald-400"></i>
                            <span class="text-sm font-bold text-emerald-400">Tvůj certifikát</span>
                        </div>
                        <h1 class="text-3xl font-extrabold text-[#f0f0f0] mb-2">${escHtml(certData.userName)}</h1>
                        <p class="text-[#9ca3af]">dokončil/a kurz <strong class="text-[#f0f0f0]">${escHtml(cert.course_title)}</strong></p>
                        <p class="text-xs text-[#6b7280] mt-2">${dateStr}</p>
                    </div>
                    <div id="cert-canvas-container" class="border border-white/8 rounded-2xl overflow-hidden shadow-2xl mb-6"></div>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button id="btn-download" class="px-6 py-3 bg-accent hover:bg-[#059669] text-[#0d0d0d] font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="download" class="w-4 h-4"></i> Stáhnout PNG
                        </button>
                        <button id="btn-linkedin" class="px-6 py-3 bg-[#1e1e1e] border border-white/8 hover:border-accent/30 text-[#9ca3af] hover:text-[#f0f0f0] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="linkedin" class="w-4 h-4"></i> Sdílet na LinkedIn
                        </button>
                        <button id="btn-copy" class="px-6 py-3 bg-[#1e1e1e] border border-white/8 hover:border-accent/30 text-[#9ca3af] hover:text-[#f0f0f0] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <i data-lucide="link" class="w-4 h-4"></i> Kopírovat odkaz
                        </button>
                    </div>`;
                lucide.createIcons();

                const canvas = await generateCertificate(certData);
                const container = document.getElementById('cert-canvas-container');
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                container.appendChild(canvas);

                document.getElementById('btn-download').addEventListener('click', () => downloadCertificate(certData));

                document.getElementById('btn-linkedin').addEventListener('click', () => {
                    const verifyUrl = `https://edu.vevit.fun/pages/certifikat.html?uuid=${cert.uuid}`;
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`, '_blank');
                });

                document.getElementById('btn-copy').addEventListener('click', async () => {
                    await shareCertificate(cert.uuid);
                    showToast('Odkaz zkopírován!');
                });
            }
        } catch (e) {
            showError('Chyba', 'Nepodařilo se načíst certifikát.');
        }
    }

} else {
    // No params — show certificate list or error
    const user = getVevitUser();
    if (!user) {
        content.innerHTML = `
            <div class="bg-[#161616] border border-white/8 rounded-xl p-8 text-center">
                <i data-lucide="lock" class="w-10 h-10 text-[#6b7280] mx-auto mb-3"></i>
                <p class="text-[#9ca3af] text-sm">
                    <a href="https://account.vevit.fun" class="text-accent hover:underline">Přihlas se</a>
                    pro zobrazení certifikátů
                </p>
            </div>`;
        lucide.createIcons();
    } else {
        showLoading();
        try {
            const res = await fetch('/edu/legacy/api/certificates/my', { credentials: 'include' });
            const json = await res.json();
            const certs = json.data || [];

            if (certs.length === 0) {
                content.innerHTML = `
                    <div class="text-center py-12">
                        <i data-lucide="award" class="w-12 h-12 text-[#374151] mx-auto mb-4"></i>
                        <h2 class="text-xl font-bold text-[#f0f0f0] mb-2">Zatím žádné certifikáty</h2>
                        <p class="text-[#6b7280] text-sm">Dokonči kurz a získej svůj první certifikát!</p>
                        <a href="programovani.html" class="inline-block mt-4 px-5 py-2.5 bg-accent hover:bg-[#059669] text-[#0d0d0d] font-bold rounded-xl transition-colors">Prohlédnout kurzy</a>
                    </div>`;
            } else {
                content.innerHTML = `
                    <h1 class="text-2xl font-extrabold text-[#f0f0f0] mb-6">Moje certifikáty</h1>
                    <div class="space-y-3">
                        ${certs.map(c => {
                            const dateStr = new Intl.DateTimeFormat('cs-CZ', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            }).format(new Date(c.issued_at));
                            return `
                                <a href="certifikat.html?uuid=${c.uuid}" class="flex items-center gap-4 bg-[#161616] border border-white/6 rounded-xl p-4 hover:border-accent/20 transition-colors group">
                                    <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                        <i data-lucide="award" class="w-5 h-5 text-accent"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <span class="font-semibold text-[#f0f0f0] group-hover:text-accent transition-colors">${escHtml(c.course_title)}</span>
                                        <span class="block text-xs text-[#6b7280] mt-0.5">${dateStr}</span>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-[#6b7280] shrink-0"></i>
                                </a>`;
                        }).join('')}
                    </div>`;
            }
            lucide.createIcons();
        } catch (e) {
            showError('Chyba', 'Nepodařilo se načíst certifikáty.');
        }
    }
}

function showLoading() {
    content.innerHTML = `<div class="text-center py-12"><div class="skeleton h-8 w-48 rounded mx-auto mb-4"></div><div class="skeleton h-64 w-full rounded-2xl mb-4"></div><div class="skeleton h-12 w-48 rounded mx-auto"></div></div>`;
}

function showError(title, msg) {
    content.innerHTML = `
        <div class="text-center py-12">
            <i data-lucide="alert-circle" class="w-12 h-12 text-[#6b7280] mx-auto mb-4"></i>
            <h2 class="text-xl font-bold text-[#f0f0f0] mb-2">${title}</h2>
            <p class="text-[#6b7280] text-sm">${msg}</p>
        </div>`;
    lucide.createIcons();
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
