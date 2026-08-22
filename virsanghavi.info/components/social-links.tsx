import type { ReactNode } from "react";
import { site } from "@/lib/site";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  ResumeIcon,
  XIcon,
} from "./icons";

export type SocialLink = {
  href: string;
  title: string;
  external?: boolean;
  icon: ReactNode;
};

/**
 * The one canonical list of contact/social links, rendered identically in the
 * homepage hero and the site footer.
 */
export const socialLinks: SocialLink[] = [
  { href: `tel:${site.phone.replace(/-/g, "")}`, title: "Phone", icon: <PhoneIcon /> },
  { href: `mailto:${site.email}`, title: "Email", icon: <MailIcon /> },
  {
    href: "https://linkedin.com/in/vir-sanghavi",
    title: "LinkedIn",
    external: true,
    icon: <LinkedInIcon />,
  },
  {
    href: "https://instagram.com/vir.sanghavi13",
    title: "Instagram",
    external: true,
    icon: <InstagramIcon />,
  },
  { href: "https://x.com/virsanghavi13", title: "X", external: true, icon: <XIcon /> },
  {
    href: `https://github.com/${site.github}`,
    title: "GitHub",
    external: true,
    icon: <GitHubIcon />,
  },
  { href: site.resumePath, title: "Resume", external: true, icon: <ResumeIcon /> },
];

export function SocialRow({ className }: { className: string }) {
  return (
    <div className={className}>
      {socialLinks.map((link) => (
        <a
          key={link.title}
          href={link.href}
          title={link.title}
          aria-label={link.title}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
