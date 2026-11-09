import "server-only";

// Průběh třídy učitele: žáci, zadané lekce a stav každé lekce u každého žáka (ze serverového
// průběhu). Podklad pro přehled učitele, detail třídy a stránku Průběh žáků.

import { assignmentState, type AssignmentState } from "./school";
import { groupAssignments, groupMemberIds, progressOf, schoolStudentsByIds, type Assignment, type Group, type SchoolStudent } from "./store";

export type CellState = "todo" | "started" | "done";

export type GroupReport = {
  students: SchoolStudent[];
  assignments: Assignment[];
  /** userId → lessonId → stav */
  states: Map<string, Map<string, CellState>>;
  lastActivity: Map<string, string>;
  /** Podle zadané lekce: kolik žáků splnilo, kolik je po termínu. */
  perAssignment: Map<string, { done: number; late: number }>;
  /** Podle žáka: splněné zadané lekce a lekce po termínu. */
  perStudent: Map<string, { done: number; late: number }>;
};

export function stateOf(report: GroupReport, userId: string, lessonId: string): CellState {
  return report.states.get(userId)?.get(lessonId) ?? "todo";
}

export function taskState(report: GroupReport, userId: string, assignment: Assignment): AssignmentState {
  return assignmentState(stateOf(report, userId, assignment.lessonId) === "done", assignment.dueAt);
}

export async function groupReport(group: Group): Promise<GroupReport> {
  const ids = await groupMemberIds(group.id);
  const [students, assignments, rows] = await Promise.all([
    schoolStudentsByIds(group.schoolId, ids),
    groupAssignments(group.id),
    progressOf(ids),
  ]);
  const states = new Map<string, Map<string, CellState>>();
  const lastActivity = new Map<string, string>();
  for (const row of rows) {
    if (!row.lessonId.startsWith(`${group.category}-`)) continue;
    if (!states.has(row.userId)) states.set(row.userId, new Map());
    states.get(row.userId)!.set(row.lessonId, row.status);
    if ((lastActivity.get(row.userId) ?? "") < row.updatedAt) lastActivity.set(row.userId, row.updatedAt);
  }
  const report: GroupReport = { students, assignments, states, lastActivity, perAssignment: new Map(), perStudent: new Map() };
  for (const assignment of assignments) {
    const counts = { done: 0, late: 0 };
    for (const student of students) {
      const state = taskState(report, student.userId, assignment);
      if (state === "done") counts.done++;
      if (state === "late") counts.late++;
      const mine = report.perStudent.get(student.userId) ?? { done: 0, late: 0 };
      if (state === "done") mine.done++;
      if (state === "late") mine.late++;
      report.perStudent.set(student.userId, mine);
    }
    report.perAssignment.set(assignment.lessonId, counts);
  }
  return report;
}
