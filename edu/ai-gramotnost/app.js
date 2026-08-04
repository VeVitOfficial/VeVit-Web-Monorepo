// Boot (no-auth): načte kurz a nastartuje router. Progress/XP/achievementy z LocalProgress (localStorage).
async function boot() {
  LocalProgress.load();
  // načti kurz (obsah z DB)
  const c = await API.courses.detail(AppConfig.courseSlug);
  if (c && !c.error) AppState.setCourse(c);
  AppState.setProgress(LocalProgress.load());
  // odemčut early bird / night owl (časové achievementy) při vstupu
  LocalProgress.checkAchievements();
  Router.init();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
