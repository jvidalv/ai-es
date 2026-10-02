import { drawSocialIcon } from "../lib/social-art";
import type { SocialIconKind } from "../lib/social-art";

export function SocialIcon({ kind }: { kind: SocialIconKind }) {
  return (
    <canvas
      className="social-icon"
      width="128"
      height="128"
      aria-hidden="true"
      ref={(canvas) => {
        if (canvas) drawSocialIcon(canvas, kind);
      }}
    />
  );
}
