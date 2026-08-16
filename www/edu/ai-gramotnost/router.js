// Hash routing (no-auth): #dashboard, #course, #lesson/slug, #profile
const Router = {
  current: "",
  init() { window.addEventListener("hashchange", () => this.handle()); this.handle(); },
  handle() {
    const hash = location.hash.slice(1) || ""; const parts = hash.split("/"); const seg = parts[0] || "dashboard";
    this.current = seg;
    document.title = "AI Gramotnost – " + this.titleFor(seg);
    try {
      if (seg === "lesson" && parts[1]) renderLesson(decodeURIComponent(parts.slice(1).join("/")));
      else if (seg === "milestone" && parts[1]) renderMilestone(decodeURIComponent(parts[1]), Math.max(1, Number(parts[2] || 1)));
      else if (seg === "course") renderCourse();
      else if (seg === "profile") renderProfile();
      else renderDashboard();
    } catch (e) { console.error(e); renderError("Chyba zobrazení: " + e.message); }
    window.scrollTo(0, 0);
  },
  titleFor(seg) { return { dashboard: "Domů", course: "Kurz", lesson: "Lekce", milestone: "Milník", profile: "Profil" }[seg] || seg; },
  navigate(path) { location.hash = path; },
};
