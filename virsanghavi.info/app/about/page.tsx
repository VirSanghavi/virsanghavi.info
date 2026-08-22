import type { Metadata } from "next";
import { aboutPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";
import { GithubCalendar } from "@/components/github-calendar";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbNode, graph, personNode, webPageNode } from "@/lib/structured-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: aboutPage.path,
  title: aboutPage.title,
  description: aboutPage.description,
  ogType: "profile",
  image: site.photo,
});

export default function AboutPage() {
  return (
    <main>
      <JsonLd
        data={graph([
          webPageNode({
            path: aboutPage.path,
            name: `${aboutPage.title} ${site.name}`,
            description: aboutPage.description,
            type: "ProfilePage",
          }),
          personNode(),
          breadcrumbNode([
            { name: site.name, path: "/" },
            { name: aboutPage.title, path: aboutPage.path },
          ]),
        ])}
      />
      <section>
        <div className="about-section">
          <h1>{aboutPage.heading}</h1>
          <div className="about-layout">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="about-img" src={site.photo} alt={site.name} width={220} height={293} />
            <div
              className="about-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(aboutPage.markdown) }}
            />
          </div>

          <GithubCalendar />

          <h2 style={{ marginTop: "2rem", fontSize: "1.3rem" }}>Stay Connected</h2>
          <p>
            If you&apos;d like to connect or have questions about my work, feel free to reach out
            through any of the links below, or see the <a href="/contact">contact page</a> for
            everything in one place.
          </p>
        </div>
      </section>
    </main>
  );
}
