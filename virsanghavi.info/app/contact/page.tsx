import type { Metadata } from "next";
import { contactPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbNode,
  graph,
  organizationNode,
  personNode,
  webPageNode,
} from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: contactPage.path,
  title: contactPage.title,
  description: contactPage.description,
});

export default function ContactPage() {
  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: contactPage.path,
            name: `${contactPage.title} ${site.name}`,
            description: contactPage.description,
            type: "ContactPage",
          }),
          personNode(),
          organizationNode(),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: contactPage.title, path: contactPage.path },
          ]),
        ])}
      />
      <section>
        <article className="article">
          <h1>{contactPage.heading}</h1>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(contactPage.markdown) }}
          />
        </article>
      </section>
    </main>
  );
}
