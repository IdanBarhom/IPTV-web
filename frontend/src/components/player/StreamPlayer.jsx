// src/components/player/StreamPlayer.jsx
import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function StreamPlayer({ url, title }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const video = videoRef.current;
    if (!video) return;

    let hls;

    if (Hls.isSupported() && url.includes(".m3u8")) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="mt-4">
      {title && (
        <h3 className="mb-2 text-sm text-slate-300">
          Now Playing: <span className="font-semibold">{title}</span>
        </h3>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        className="w-full max-h-[60vh] rounded-xl bg-black"
      />
    </div>
  );
}
