/**
 * Indent each line except the first one
 */
export function indent(str: string): string {
  const prefix = "  ";
  return str
    .split("\n")
    .map((line, i) => (i > 0 ? prefix + line : line))
    .join("\n");
}
