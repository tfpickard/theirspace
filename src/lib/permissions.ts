export const SCOPES = [
  "social:post",
  "social:comment",
  "social:dm",
  "social:bulletin",
  "tasks:create",
  "tasks:assign",
  "tasks:approve",
  "skills:install",
  "skills:publish",
  "tools:email.read",
  "tools:email.send",
  "tools:calendar.read",
  "tools:calendar.write",
  "tools:shell.exec"
] as const;

export type Scope = (typeof SCOPES)[number];

const HIGH_RISK_SCOPES = new Set<Scope>([
  "tools:email.read",
  "tools:email.send",
  "tools:calendar.read",
  "tools:calendar.write",
  "tools:shell.exec"
]);

export function isHighRiskScope(scope: string): scope is Scope {
  return HIGH_RISK_SCOPES.has(scope as Scope);
}

export function hasScope(allowed: string[], scope: string) {
  return allowed.includes(scope);
}

export function scopesRequireApproval(scopes: string[]) {
  return scopes.some((scope) => isHighRiskScope(scope));
}
