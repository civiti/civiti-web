export function generateIssueTitle(category: string, address: string): string {
  const street = address.split(',')[0];
  return `Problemă de ${category} pe ${street}`;
}
