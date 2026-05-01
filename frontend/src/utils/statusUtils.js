/**
 * When status changes, auto-adjust progress to a valid value:
 *   PENDING      → 0
 *   IN_PROGRESS  → 50 (or keep current if already 1–99)
 *   DONE         → 100
 */
export function getDefaultProgressForStatus(status, currentProgress) {
  switch (status) {
    case "PENDING":     return 0;
    case "DONE":        return 100;
    case "IN_PROGRESS":
      if (currentProgress >= 1 && currentProgress <= 99) return currentProgress;
      return 50;
    default:            return currentProgress;
  }
}

export function isValidCombination(status, progress) {
  if (status === "PENDING")     return progress === 0;
  if (status === "DONE")        return progress === 100;
  if (status === "IN_PROGRESS") return progress >= 1 && progress <= 99;
  return false;
}
