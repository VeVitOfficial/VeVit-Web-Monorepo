export function getVevitUser() {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('vevit_auth='));
    if (!cookie) return null;
    try {
        return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
    } catch {
        return null;
    }
}

export function formatXP(xp) {
    if (xp >= 1000) return (xp / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(xp);
}

export function getLevel(xp) {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function getLevelTitle(level) {
    if (level >= 20) return 'Legenda';
    if (level >= 15) return 'Mistr';
    if (level >= 10) return 'Expert';
    if (level >= 5) return 'Zasvěcený';
    return 'Nováček';
}