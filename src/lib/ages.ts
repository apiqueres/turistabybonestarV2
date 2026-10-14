/** "5 y 8 años" from the per-child ages answer; empty slots are skipped. */
export function formatAges(v: unknown): string {
  const ages = Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
  if (!ages.length) return "Sin indicar";
  const list = ages.length === 1 ? String(ages[0]) : `${ages.slice(0, -1).join(", ")} y ${ages[ages.length - 1]}`;
  return `${list} ${ages.length === 1 && ages[0] === 1 ? "año" : "años"}`;
}
