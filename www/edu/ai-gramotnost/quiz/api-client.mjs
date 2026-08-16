import { getCsrfToken } from '/assets/shared/session.js';

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-Token'] = getCsrfToken();
  }
  const response = await fetch(`/edu/api/quiz/${path}`, { credentials: 'same-origin', ...options, headers });
  const body = await response.json().catch(() => ({ error: 'Neplatná odpověď serveru.' }));
  if (!response.ok) throw new Error(body.error || 'Požadavek se nepodařilo dokončit.');
  return body;
}

export const QuizApi = {
  state: () => request('state.php'),
  profile: () => request('profile.php'),
  setDifficulty: (difficulty) => request('profile.php', { method: 'POST', body: JSON.stringify({ difficulty }) }),
  evaluate: (attempt) => request('evaluate.php', { method: 'POST', body: JSON.stringify(attempt) }),
  microtask: (entry) => request('microtask.php', { method: 'POST', body: JSON.stringify(entry) }),
  submission: (submission) => request('submission.php', { method: 'POST', body: JSON.stringify(submission) }),
  scheduleReview: (questionIds) => request('review-queue.php', { method: 'POST', body: JSON.stringify({ question_ids: questionIds }) }),
  peerReviews: () => request('peer-review.php'),
  savePeerReview: (submissionId, scores) => request('peer-review.php', { method: 'POST', body: JSON.stringify({ submission_id: submissionId, scores }) }),
  poll: (questionId) => request(`poll.php?question_id=${encodeURIComponent(questionId)}`),
  milestoneConfig: (milestone, attempt = 1) => request(`milestone-config.php?milestone=${encodeURIComponent(milestone)}&attempt=${encodeURIComponent(attempt)}`),
  milestone: (milestone, answers, attempt = 1, reflection = []) => request('milestone.php', { method: 'POST', body: JSON.stringify({ milestone, answers, attempt, reflection }) }),
  checkMilestone: (milestone, questionId, answer, attempt = 1) => request('milestone-check.php', { method: 'POST', body: JSON.stringify({ milestone, question_id: questionId, answer, attempt }) }),
  calibration: () => request('calibration.php'),
  warmup: (lessonSlug) => request(`warmup.php?lesson_slug=${encodeURIComponent(lessonSlug)}`),
  saveWarmup: (payload) => request('warmup.php', { method: 'POST', body: JSON.stringify(payload) }),
  selfAssessment: () => request('self-assessment.php'),
  saveSelfAssessment: (estimate) => request('self-assessment.php', { method: 'POST', body: JSON.stringify({ estimate }) }),
  prediction: (body) => request('predictions/create.php', { method: 'POST', body: JSON.stringify({ body }) }),
};
