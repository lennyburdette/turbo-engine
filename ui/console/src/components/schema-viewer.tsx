import { useMemo } from "react";

interface SchemaViewerProps {
  /** Raw schema text (GraphQL SDL, OpenAPI YAML, etc.) */
  schema: string;
  /** Optional language hint; defaults to auto-detect */
  language?: "graphql" | "yaml" | "json";
  className?: string;
}

/**
 * Lightweight schema viewer with basic CSS-based syntax highlighting.
 * Supports GraphQL SDL and OpenAPI YAML/JSON.
 */
export function SchemaViewer({
  schema,
  language,
  className = "",
}: SchemaViewerProps) {
  const detected = language ?? detectLanguage(schema);
  const highlighted = useMemo(
    () => highlight(schema, detected),
    [schema, detected],
  );

  return (
    <div
      className={`overflow-auto rounded-lg border border-gray-200 bg-gray-950 p-4 ${className}`}
    >
      <pre className="text-sm leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

function detectLanguage(text: string): "graphql" | "yaml" | "json" {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (
    /^(type |schema |input |enum |interface |union |scalar |directive |extend |query |mutation |subscription )/m.test(
      trimmed,
    )
  )
    return "graphql";
  return "yaml";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(text: string, lang: "graphql" | "yaml" | "json"): string {
  switch (lang) {
    case "graphql":
      return highlightGraphQL(text);
    case "yaml":
      return highlightYaml(text);
    case "json":
      return highlightJson(text);
  }
}

function highlightGraphQL(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let escaped = escapeHtml(line);

      // Comments
      if (/^\s*#/.test(escaped)) {
        return `<span class="syntax-comment">${escaped}</span>`;
      }

      // Directives (@deprecated, etc.)
      escaped = escaped.replace(
        /@\w+/g,
        (m) => `<span class="syntax-directive">${m}</span>`,
      );

      // Keywords
      escaped = escaped.replace(
        /\b(type|input|enum|interface|union|scalar|schema|extend|query|mutation|subscription|implements|fragment|on)\b/g,
        (m) => `<span class="syntax-keyword">${m}</span>`,
      );

      // Built-in types
      escaped = escaped.replace(
        /\b(String|Int|Float|Boolean|ID)\b/g,
        (m) => `<span class="syntax-type">${m}</span>`,
      );

      // String literals
      escaped = escaped.replace(
        /"[^"]*"/g,
        (m) => `<span class="syntax-string">${m}</span>`,
      );

      // Punctuation
      escaped = escaped.replace(
        /[{}[\]():!]/g,
        (m) => `<span class="syntax-punctuation">${m}</span>`,
      );

      return escaped;
    })
    .join("\n");
}

function highlightYaml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let escaped = escapeHtml(line);

      // Comments
      if (/^\s*#/.test(escaped)) {
        return `<span class="syntax-comment">${escaped}</span>`;
      }

      // Keys (word followed by colon)
      escaped = escaped.replace(
        /^(\s*)([\w./-]+)(:)/,
        (_m, space: string, key: string, colon: string) =>
          `${space}<span class="syntax-field">${key}</span><span class="syntax-punctuation">${colon}</span>`,
      );

      // String values in quotes
      escaped = escaped.replace(
        /("[^"]*"|'[^']*')/g,
        (m) => `<span class="syntax-string">${m}</span>`,
      );

      // Boolean and null
      escaped = escaped.replace(
        /\b(true|false|null)\b/g,
        (m) => `<span class="syntax-keyword">${m}</span>`,
      );

      return escaped;
    })
    .join("\n");
}

function highlightJson(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let escaped = escapeHtml(line);

      // String keys
      escaped = escaped.replace(
        /("[\w@$]+")\s*:/g,
        (_m, key: string) =>
          `<span class="syntax-field">${key}</span><span class="syntax-punctuation">:</span>`,
      );

      // String values
      escaped = escaped.replace(
        /:\s*("[^"]*")/g,
        (_m, val: string) =>
          `: <span class="syntax-string">${val}</span>`,
      );

      // Numbers
      escaped = escaped.replace(
        /:\s*(\d+\.?\d*)/g,
        (_m, val: string) => `: <span class="syntax-type">${val}</span>`,
      );

      // Booleans & null
      escaped = escaped.replace(
        /\b(true|false|null)\b/g,
        (m) => `<span class="syntax-keyword">${m}</span>`,
      );

      // Braces / brackets
      escaped = escaped.replace(
        /[{}[\]]/g,
        (m) => `<span class="syntax-punctuation">${m}</span>`,
      );

      return escaped;
    })
    .join("\n");
}
