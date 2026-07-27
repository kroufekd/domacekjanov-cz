/**
 * Replaces `{name}` placeholders in an editable string. Unknown placeholders
 * are left untouched so a typo in the Studio never renders as `undefined`.
 */
export function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
