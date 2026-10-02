import { readFileSync } from "node:fs";
import { basename } from "node:path";
import ts from "typescript";
import { repoFiles } from "./check-shared.ts";

const findings: string[] = [];
for (const file of repoFiles().filter(
  (file) => /\.(ts|tsx)$/.test(file) && !file.startsWith("apps/web/src/generated/"),
)) {
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.(?:ts|tsx)$/.test(basename(file)))
    findings.push(`${file}: use kebab-case filenames`);
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  let pastImports = false;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (pastImports) findings.push(`${file}: keep static imports together at the top`);
    } else pastImports = true;
  }
  function visit(node: ts.Node) {
    const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (
      node.kind === ts.SyntaxKind.AnyKeyword ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node)
    )
      findings.push(`${file}:${line}: type escape`);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier)
      findings.push(`${file}:${line}: re-export`);
    if (ts.isFunctionLike(node) && node.parameters.length > 2)
      findings.push(`${file}:${line}: use a typed options object for 3+ parameters`);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (/@ts-(?:ignore|expect-error|nocheck)|(?:eslint|oxlint)-disable/.test(text))
    findings.push(`${file}: type/lint suppression`);
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else console.log("check:rules passed");
