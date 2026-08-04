// API wrapper — safe fetch with mock fallback for file:// and offline dev
import { MOCK_COURSES, getMockLessons, getMockLesson, getMockQuizQuestions } from './mockData.js';

const USE_MOCK = location.protocol === 'file:';

async function safeFetch(url, fallback) {
    if (USE_MOCK) return fallback;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data ?? json;
    } catch (e) {
        console.warn(`API nedostupné (${url}), používám mock data`, e.message);
        return fallback;
    }
}

export const api = {
    getKurzy: () =>
        safeFetch('/api/kurzy', MOCK_COURSES),

    getKurz: (slug) =>
        safeFetch(`/api/kurzy/${slug}`, MOCK_COURSES.find(c => c.slug === slug)),

    getKurzLekce: (slug) =>
        safeFetch(`/api/kurzy/${slug}/lekce`, getMockLessons(slug)),

    getLekce: (id) =>
        safeFetch(`/api/lekce/${id}`, getMockLesson(id)),

    getKviz: (lessonId) =>
        safeFetch(`/api/kviz/${lessonId}`, getMockQuizQuestions(lessonId)),

    saveProgress: async (lessonId, skore = null) => {
        if (USE_MOCK) {
            console.log(`[MOCK] Progress uložen: lekce ${lessonId}, skore: ${skore}`);
            return { ok: true, xp_ziskano: 10, xp_celkem: 100, level: 1, level_up: false };
        }
        try {
            const res = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: lessonId, skore })
            });
            return await res.json();
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }
};