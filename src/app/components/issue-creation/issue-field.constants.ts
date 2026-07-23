import { IssueStatus, normalizeStatus } from '../../types/civica-api.types';

/**
 * Single source of truth for issue field constraints, shared by the create wizard
 * and the edit-issue editor so validators never drift between the two flows.
 */
export const ISSUE_TITLE_MAX = 150;
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;
export const TEXTAREA_MAX = 1000;
export const MIN_AUTHORITIES = 1;
export const MAX_AUTHORITIES = 5;
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_MB = 10;

/**
 * Statuses in which an issue's creator may edit it.
 * Editing a Rejected/Active issue re-enters the approval queue (status -> Submitted);
 * editing a Submitted/UnderReview issue updates it in place (already pending).
 * Not editable: Resolved, Cancelled, Unspecified, Draft (Draft is currently unreachable
 * from the create flow — add it here if/when the backend can produce it).
 */
export const EDITABLE_BY_OWNER_STATUSES: IssueStatus[] = [
  'Rejected',
  'Active',
  'Submitted',
  'UnderReview',
];

/** Whether an issue in the given status may be edited by its owner. Case-insensitive. */
export function isOwnerEditableStatus(status: string | null | undefined): boolean {
  return EDITABLE_BY_OWNER_STATUSES.includes(normalizeStatus(status));
}
