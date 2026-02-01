const ISSUE_CREATION_SESSION_KEYS = [
  'civica_selected_category',
  'civica_uploaded_photos',
  'civica_current_location',
  'civica_complete_issue_data',
  'civica_selected_authorities',
  'civica_issue_title',
  'civica_issue_title_customized',
] as const;

export function clearIssueCreationSession(): void {
  for (const key of ISSUE_CREATION_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
}
