import { getVevitUser } from '../auth.js';

/**
 * Initialize comments section for a lesson.
 * @param {number} lessonId — the lesson ID from URL params
 * @param {string} containerId — DOM id where comments render
 */
export function initComments(lessonId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Offline detection
    if (location.protocol === 'file:') {
        container.innerHTML = `
            <div class="flex items-center gap-3 mb-6">
                <i data-lucide="message-square" class="w-5 h-5 text-accent"></i>
                <h3 class="font-bold text-[#f0f0f0]">Komentáře</h3>
            </div>
            <div class="bg-[#161616] border border-white/8 rounded-xl p-5 text-center">
                <p class="text-[#9ca3af] text-sm">Komentáře jsou dostupné po nasazení na server.</p>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const state = {
        lessonId,
        comments: [],
        total: 0,
        offset: 0,
        user: getVevitUser(),
        submitting: false,
        replyingTo: null,
    };

    renderShell(container, state);
    fetchComments(state, container);
}

// ─── RENDERING ───

function renderShell(container, state) {
    const user = state.user;
    container.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <i data-lucide="message-square" class="w-5 h-5 text-accent"></i>
            <h3 class="font-bold text-[#f0f0f0]">Komentáře</h3>
            <span id="comment-count" class="bg-white/8 text-[#9ca3af] text-xs px-2.5 py-1 rounded-full">0</span>
        </div>
        ${user
            ? renderCommentForm(user)
            : `<div class="bg-[#161616] border border-white/8 rounded-xl p-5 text-center mb-6">
                <p class="text-[#9ca3af] text-sm">
                    <a href="https://account.vevit.fun" class="text-accent hover:underline">Přihlas se</a>
                    pro přidání komentáře
                </p>
            </div>`
        }
        <div id="comments-list"></div>
        <div id="comments-loading" class="space-y-3">
            ${skeletonCard()}${skeletonCard()}${skeletonCard()}
        </div>
        <div id="load-more-wrapper" class="hidden mt-4 text-center"></div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Bind submit
    if (user) bindCommentForm(container, state);
}

function renderCommentForm(user, parentId = null, isReply = false) {
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname || user.nick || 'U')}&background=10b981&color=0d0d0d&size=80`;
    const placeholder = isReply ? 'Napiš odpověď...' : 'Napiš komentář...';
    const btnText = isReply ? 'Odpovědět' : 'Přidat komentář';
    const formId = parentId ? `reply-form-${parentId}` : 'comment-form';
    const textareaId = parentId ? `reply-textarea-${parentId}` : 'comment-textarea';

    return `
        <div id="${formId}" class="${isReply ? 'ml-8 mt-3' : 'mb-6'}">
            <div class="flex gap-3">
                <img src="${escapeAttr(avatarUrl)}" alt="" class="w-8 h-8 rounded-lg object-cover shrink-0 mt-1">
                <div class="flex-1">
                    <textarea id="${textareaId}"
                        class="bg-[#161616] border border-white/8 rounded-xl p-4 w-full text-sm text-[#f0f0f0] resize-none min-h-[${isReply ? '64' : '96'}px] focus:border-accent focus:outline-none placeholder:text-[#6b7280]"
                        placeholder="${placeholder}" maxlength="2000"></textarea>
                    <div class="flex items-center justify-between mt-2">
                        <span id="${textareaId}-counter" class="text-xs text-[#6b7280]">0/2000</span>
                        <div class="flex gap-2">
                            ${isReply ? `<button type="button" onclick="document.getElementById('reply-form-${parentId}').remove()" class="px-4 py-2 text-sm text-[#9ca3af] hover:text-[#f0f0f0] transition-colors">Zrušit</button>` : ''}
                            <button type="button" data-submit-btn="${parentId || 'root'}" class="px-5 py-2 text-sm font-bold bg-accent text-[#0d0d0d] rounded-xl hover:bg-[#059669] transition-colors disabled:opacity-40 disabled:cursor-not-allowed" disabled>${btnText}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function skeletonCard() {
    return `<div class="skeleton h-20 w-full rounded-xl"></div>`;
}

function renderCommentsList(container, state) {
    const list = document.getElementById('comments-list');
    const loading = document.getElementById('comments-loading');
    const countEl = document.getElementById('comment-count');

    if (loading) loading.classList.add('hidden');

    if (state.comments.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="message-square" class="w-10 h-10 text-[#374151] mx-auto mb-3"></i>
                <p class="text-[#6b7280]">Zatím žádné komentáře. Buď první!</p>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    list.innerHTML = state.comments.map(c => renderComment(c, state)).join('');
    countEl.textContent = state.total;
    updateLoadMore(state);

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindCommentActions(container, state);
}

function renderComment(comment, state) {
    const user = state.user;
    const isOwn = user && user.id === comment.user_id;
    const likedClass = comment.user_liked ? 'text-red-500' : 'text-[#6b7280]';
    const heartFill = comment.user_liked ? 'fill-current' : '';
    const avatarUrl = comment.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_nick || 'U')}&background=10b981&color=0d0d0d&size=80`;
    const pinnedBadge = comment.is_pinned ? `<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">📌 Připnuto</span>` : '';
    const timeAgoStr = timeAgo(comment.created_at);

    let actions = `
        <button data-like-btn="${comment.id}" class="flex items-center gap-1 text-xs ${likedClass} hover:text-red-400 transition-colors group/like">
            <svg class="w-4 h-4 ${heartFill} group-hover/like:scale-110 transition-transform" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${comment.user_liked ? 'currentColor' : 'none'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span data-like-count="${comment.id}">${comment.likes || 0}</span>
        </button>`;

    // Reply button only for top-level comments
    if (comment.parent_id === null && user) {
        actions += `<button data-reply-btn="${comment.id}" class="text-xs text-[#6b7280] hover:text-accent transition-colors">Odpovědět</button>`;
    }
    if (isOwn || (user && (user.role === 'admin'))) {
        actions += `<button data-delete-btn="${comment.id}" class="text-xs text-[#6b7280] hover:text-red-400 transition-colors">Smazat</button>`;
    }

    let repliesHtml = '';
    if (comment.replies && comment.replies.length > 0) {
        repliesHtml = `
            <div class="ml-8 border-l-2 border-accent/20 pl-4 mt-3 space-y-3">
                ${comment.replies.map(r => renderComment(r, state)).join('')}
            </div>`;
    }

    return `
        <div data-comment-id="${comment.id}" class="bg-[#161616] border border-white/6 rounded-xl p-4 mb-3">
            <div class="flex items-start gap-3">
                <img src="${escapeAttr(avatarUrl)}" alt="" class="w-8 h-8 rounded-lg object-cover shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="text-sm font-semibold text-[#f0f0f0]">${escapeHtml(comment.user_nick)}</span>
                        ${pinnedBadge}
                        <span class="text-xs text-[#6b7280]">${timeAgoStr}</span>
                    </div>
                    <p class="text-sm text-[#9ca3af] leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(comment.content)}</p>
                    <div class="flex items-center gap-4 mt-2">${actions}</div>
                </div>
            </div>
            <div id="reply-container-${comment.id}"></div>
        </div>${repliesHtml}`;
}

function updateLoadMore(state) {
    const wrapper = document.getElementById('load-more-wrapper');
    if (!wrapper) return;
    const remaining = state.total - state.offset - 20;
    if (remaining > 0) {
        wrapper.innerHTML = `<button id="load-more-btn" class="px-6 py-2.5 text-sm font-semibold bg-[#1e1e1e] border border-white/8 rounded-xl hover:border-accent/30 transition-colors">Načíst další komentáře</button>`;
        wrapper.classList.remove('hidden');
        document.getElementById('load-more-btn').addEventListener('click', () => loadMoreComments(state));
    } else {
        wrapper.classList.add('hidden');
    }
}

// ─── DATA FETCHING ───

async function fetchComments(state, container) {
    try {
        const res = await fetch(`/api/comments?lesson_id=${state.lessonId}&offset=0&limit=20`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        state.comments = json.data.comments;
        state.total = json.data.total;
        state.offset = 0;
        renderCommentsList(container, state);
    } catch (e) {
        const loading = document.getElementById('comments-loading');
        if (loading) loading.innerHTML = `<p class="text-center text-[#6b7280] py-4">Nepodařilo se načíst komentáře.</p>`;
    }
}

async function loadMoreComments(state) {
    const newOffset = state.offset + 20;
    try {
        const res = await fetch(`/api/comments?lesson_id=${state.lessonId}&offset=${newOffset}&limit=20`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        state.comments = [...state.comments, ...json.data.comments];
        state.total = json.data.total;
        state.offset = newOffset;
        const container = document.getElementById('comments-section') || document.getElementById('comments-list').parentElement;
        renderCommentsList(container, state);
    } catch (e) {
        // Keep existing comments visible on error
    }
}

// ─── EVENT BINDING ───

function bindCommentForm(container, state) {
    const textarea = document.getElementById('comment-textarea');
    const btn = document.querySelector('[data-submit-btn="root"]');
    const counter = document.getElementById('comment-textarea-counter');

    if (!textarea || !btn) return;

    textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        counter.textContent = `${textarea.value.length}/2000`;
        btn.disabled = len === 0 || state.submitting;
    });

    btn.addEventListener('click', () => submitComment(state, container, textarea, btn));
}

function bindCommentActions(container, state) {
    // Like buttons
    container.querySelectorAll('[data-like-btn]').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = parseInt(btn.dataset.likeBtn);
            toggleLike(commentId, state, container);
        });
    });

    // Reply buttons
    container.querySelectorAll('[data-reply-btn]').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = parseInt(btn.dataset.replyBtn);
            showReplyForm(commentId, state, container);
        });
    });

    // Delete buttons
    container.querySelectorAll('[data-delete-btn]').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = parseInt(btn.dataset.deleteBtn);
            deleteComment(commentId, state, container);
        });
    });
}

// ─── ACTIONS ───

async function submitComment(state, container, textarea, btn, parentId = null) {
    const content = textarea.value.trim();
    if (!content || state.submitting) return;

    state.submitting = true;
    btn.disabled = true;
    btn.textContent = 'Odesílám...';

    try {
        const body = { lesson_id: state.lessonId, content };
        if (parentId) body.parent_id = parentId;

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (res.status === 429) {
            const json = await res.json();
            alert(json.error || 'Příliš mnoho komentářů.');
            return;
        }
        if (!res.ok) throw new Error('Failed');

        textarea.value = '';
        const counter = textarea.nextElementSibling?.querySelector?.('[id$="-counter"]');
        if (counter) counter.textContent = '0/2000';

        // Refresh comments
        await fetchComments(state, container);
    } catch (e) {
        alert('Nepodařilo se odeslat komentář.');
    } finally {
        state.submitting = false;
        btn.disabled = false;
        btn.textContent = parentId ? 'Odpovědět' : 'Přidat komentář';
    }
}

async function toggleLike(commentId, state, container) {
    const btn = container.querySelector(`[data-like-btn="${commentId}"]`);
    const countEl = container.querySelector(`[data-like-count="${commentId}"]`);
    if (!btn || !countEl) return;

    // Find comment in state for optimistic update
    const comment = findComment(state.comments, commentId);
    const wasLiked = comment ? comment.user_liked : false;

    // Optimistic update
    const newLiked = !wasLiked;
    const newCount = comment ? (comment.likes + (newLiked ? 1 : -1)) : 0;
    if (comment) {
        comment.user_liked = newLiked;
        comment.likes = Math.max(0, newCount);
    }
    updateLikeUI(btn, countEl, newLiked, Math.max(0, newCount));

    try {
        const res = await fetch('/api/comments/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ comment_id: commentId }),
        });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (comment) {
            comment.user_liked = json.liked;
            comment.likes = json.likes;
        }
        updateLikeUI(btn, countEl, json.liked, json.likes);
    } catch (e) {
        // Revert on error
        if (comment) {
            comment.user_liked = wasLiked;
            comment.likes = wasLiked ? Math.max(0, newCount - 1) : newCount;
        }
        updateLikeUI(btn, countEl, wasLiked, wasLiked ? Math.max(0, newCount - 1) : newCount);
    }
}

function updateLikeUI(btn, countEl, liked, count) {
    const svg = btn.querySelector('svg');
    if (liked) {
        btn.classList.remove('text-[#6b7280]');
        btn.classList.add('text-red-500');
        svg.setAttribute('fill', 'currentColor');
        svg.classList.add('fill-current');
    } else {
        btn.classList.remove('text-red-500');
        btn.classList.add('text-[#6b7280]');
        svg.setAttribute('fill', 'none');
        svg.classList.remove('fill-current');
    }
    countEl.textContent = count;
}

function showReplyForm(commentId, state, container) {
    const replyContainer = document.getElementById(`reply-container-${commentId}`);
    if (!replyContainer || !state.user) return;

    // Remove existing reply form if any
    const existing = replyContainer.querySelector('[id^="reply-form-"]');
    if (existing) {
        existing.remove();
        return;
    }

    // Remove any other open reply forms
    container.querySelectorAll('[id^="reply-form-"]').forEach(f => f.remove());

    replyContainer.innerHTML = renderCommentForm(state.user, commentId, true);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const textarea = document.getElementById(`reply-textarea-${commentId}`);
    const btn = container.querySelector(`[data-submit-btn="${commentId}"]`);
    const counter = document.getElementById(`reply-textarea-${commentId}-counter`);

    if (textarea && btn) {
        textarea.addEventListener('input', () => {
            counter.textContent = `${textarea.value.length}/2000`;
            btn.disabled = textarea.value.trim().length === 0 || state.submitting;
        });
        btn.addEventListener('click', () => submitComment(state, container, textarea, btn, commentId));
    }
    textarea?.focus();
}

async function deleteComment(commentId, state, container) {
    if (!confirm('Opravdu chceš smazat tento komentář?')) return;

    try {
        const res = await fetch(`/api/comments?id=${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed');

        // Refresh comments
        await fetchComments(state, container);
    } catch (e) {
        alert('Nepodařilo se smazat komentář.');
    }
}

// ─── HELPERS ───

function findComment(comments, id) {
    for (const c of comments) {
        if (c.id === id) return c;
        if (c.replies) {
            const found = findComment(c.replies, id);
            if (found) return found;
        }
    }
    return null;
}

function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'právě teď';
    if (diffMin < 60) return `před ${diffMin} minutami`;
    if (diffHrs < 24) return `před ${diffHrs} hodinami`;
    if (diffDays < 7) return `před ${diffDays} dny`;

    // Format as Czech date: 3. 1. 2025
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}. ${month}. ${year}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}