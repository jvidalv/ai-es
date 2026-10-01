import React from "react";
import { Play, ArrowUpRight } from "lucide-react";

export function YoutubeEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <figure className="youtube-block">
      <div className="youtube-player">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button className="youtube-consent" onClick={() => setPlaying(true)}>
            <span className="youtube-play">
              <Play size={28} fill="currentColor" />
            </span>
            <strong>{title}</strong>
            <span>Reproducir vídeo</span>
            <small>Al reproducir, se conecta con YouTube.</small>
          </button>
        )}
      </div>
      <figcaption>
        <span>{title}</span>
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">
          Abrir en YouTube <ArrowUpRight size={13} />
        </a>
      </figcaption>
    </figure>
  );
}
