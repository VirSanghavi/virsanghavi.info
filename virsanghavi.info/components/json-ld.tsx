/**
 * Emits a JSON-LD block. `JSON.stringify` output is escaped so a `<` in any
 * value can never break out of the script element.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // Structured data is generated from typed objects above, never user input.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
