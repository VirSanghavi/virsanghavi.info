import type { Metadata } from "next";
import { agentsPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbNode, graph, webPageNode } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: agentsPage.path,
  title: agentsPage.title,
  description: agentsPage.description,
});

export default function AgentsPage() {
  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: agentsPage.path,
            name: `${agentsPage.title} — ${site.name}`,
            description: agentsPage.description,
          }),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: agentsPage.title, path: agentsPage.path },
          ]),
        ])}
      />
      <section>
        <article className="article">
          <h1>{agentsPage.heading}</h1>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(agentsPage.markdown) }}
          />
        </article>
      </section>
    </main>
  );
}
