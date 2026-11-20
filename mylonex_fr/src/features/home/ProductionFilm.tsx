import { useEffect, useRef, useState } from "react";
import Image from "../../shared/components/SiteImage";

const filmSource = "/images/landing/textile-production.mp4";
const poster = "/images/landing/production-fabric.jpg";

export default function ProductionFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const near = useRef(false);
  const userPaused = useRef(false);
  const automaticPause = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    setInteractive(true);
    if (!window.IntersectionObserver) return;
    const motion = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = async () => {
      if (!near.current || document.hidden || !motion.matches || connection?.saveData) {
        if (!video.paused) {
          automaticPause.current = true;
          video.pause();
        }
        return;
      }
      if (!userPaused.current) {
        try { await video.play(); } catch { setPlaying(false); }
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      near.current = entry.isIntersecting;
      void sync();
    }, { threshold: .2 });
    observer.observe(video);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [failed]);

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      userPaused.current = true;
      video.pause();
    } else {
      userPaused.current = false;
      try { await video.play(); } catch { setPlaying(false); }
    }
  };

  return (
    <figure className="production-film">
      <div className="production-film-frame">
        {failed ? (
          <Image src={poster} alt="Textile production machinery" fill sizes="(max-width: 1023px) 90vw, 750px" className="object-cover" />
        ) : (
          <video ref={videoRef} src={filmSource} poster={poster} preload="none" controls muted loop playsInline
            aria-label="Illustrative footage of an automated textile weaving machine"
            onPlay={() => { userPaused.current = false; setPlaying(true); }}
            onPause={() => {
              if (!automaticPause.current) userPaused.current = true;
              automaticPause.current = false;
              setPlaying(false);
            }} onError={() => setFailed(true)} />
        )}
        {interactive && !failed && (
          <button type="button" className={`production-film-toggle ${playing ? "is-playing" : ""}`}
            onClick={toggle} aria-label={playing ? "Pause textile film" : "Play textile film"}>
            <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{playing ? "Pause film" : "Play textile film"}
          </button>
        )}
      </div>
      <figcaption>
        <span>Textile production in motion · illustrative footage</span>
        <a href="https://www.pexels.com/video/industrial-textile-factory-automated-weaving-32243781/" target="_blank" rel="noreferrer">Usman AbdulrasheedGambo / Pexels ↗</a>
      </figcaption>
    </figure>
  );
}
