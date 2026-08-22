import type { Metadata } from "next";
import { privacyPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbNode, graph, webPageNode } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: privacyPage.path,
  title: privacyPage.title,
  description: privacyPage.description,
});

export default function PrivacyPage() {
  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: privacyPage.path,
            name: `${privacyPage.title} | ${site.name}`,
            description: privacyPage.description,
          }),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: privacyPage.title, path: privacyPage.path },
          ]),
        ])}
      />
      <section>
        <article className="article">
          <h1>{privacyPage.heading}</h1>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(privacyPage.markdown) }}
          />
        </article>
      </section>
    </main>
  );
}
