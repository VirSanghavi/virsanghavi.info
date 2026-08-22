import { SocialRow } from "./social-links";

export function SiteFooter() {
  return (
    <footer id="site-footer">
      <div className="content-wrap">
        <hr className="border" />
      </div>
      <div className="footer-inner">
        <SocialRow className="footer-socials" />
      </div>
    </footer>
  );
}
