// API klient – jen obsah (kurzy/lekce/cvičení), no-auth
const API = {
  async request(endpoint, options = {}) {
    let res;
    try { res = await fetch(AppConfig.apiBase + endpoint, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
    catch (e) { return { error: "Síťová chyba: " + e.message }; }
    const text = await res.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: "Neplatná odpověď serveru", raw: text.slice(0, 200) }; }
    if (!res.ok && data && !data.error) data.error = `HTTP ${res.status}`;
    return data;
  },
  courses: {
    list: () => API.request("courses.php?action=list"),
    detail: (slug) => API.request("courses.php?action=detail&slug=" + encodeURIComponent(slug)),
    lesson: (slug) => API.request("courses.php?action=lesson&slug=" + encodeURIComponent(slug)),
  },
  exercises: {
    list: (lessonId) => API.request("exercises.php?action=list&lesson_id=" + encodeURIComponent(lessonId)),
    submit: (d) => API.request("exercises.php?action=submit", { method: "POST", body: JSON.stringify(d) }),
  },
};
