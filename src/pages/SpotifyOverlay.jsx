import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import "../styles/spotify-overlay.css";

const SPECTRUM_BARS = [
  12, 18, 28, 48, 30, 42, 56, 68, 44, 36, 58, 28,
  22, 34, 46, 62, 74, 42, 30, 26, 44, 34, 28, 38,
  50, 32, 26, 34, 42, 28, 36, 30, 44, 52, 34, 28,
  24, 30, 36, 28, 34, 40, 30, 26, 32, 46, 64, 78,
  58, 42, 32, 28, 36, 52, 70, 82, 54, 42, 34, 28,
  44, 58, 72, 92, 76, 62, 52, 40, 32, 24,
];

const DEFAULT_TRACK = {
  id: "spotify-overlay-demo",
  name: "Esperando Spotify",
  artists: "Sin musica activa",
  album: "DARK Ops",
  albumArt: "",
  durationMs: 180000,
  progressMs: 0,
  isPlaying: false,
  syncedAt: Date.now(),
};

export default function SpotifyOverlay() {
  const [track, setTrack] = useState(DEFAULT_TRACK);
  const [tick, setTick] = useState(() => Date.now());

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/spotify/overlay");
      const nextTrack = normalizeTrack(data);
      setTrack((prev) => nextTrack || { ...prev, isPlaying: false });
    } catch {
      setTrack((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  useEffect(() => {
    document.body.classList.add("spotify-overlay-body");
    document.documentElement.classList.add("spotify-overlay-html");
    return () => {
      document.body.classList.remove("spotify-overlay-body");
      document.documentElement.classList.remove("spotify-overlay-html");
    };
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadStatus, 0);
    const poll = setInterval(loadStatus, 5000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(poll);
    };
  }, [loadStatus]);

  useEffect(() => {
    const clock = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(clock);
  }, []);

  const progress = useMemo(() => {
    const elapsed = track.isPlaying ? tick - track.syncedAt : 0;
    return Math.min(track.durationMs, Math.max(0, track.progressMs + elapsed));
  }, [tick, track]);

  const progressPercent = track.durationMs > 0
    ? Math.min(100, Math.max(0, (progress / track.durationMs) * 100))
    : 0;

  return (
    <main className="spotify-overlay-stage" aria-label="Overlay de Spotify">
      <section className="spotify-overlay-widget">
        <div className="spotify-overlay-art-area">
          <div className={`spotify-vinyl ${track.isPlaying ? "is-playing" : ""}`} aria-hidden="true">
            <span />
          </div>

          <div className="spotify-cover">
            {track.albumArt ? (
              <img src={track.albumArt} alt={track.album || track.name} />
            ) : (
              <div className="spotify-cover-fallback">
                <strong>{track.name}</strong>
                <span>{track.artists}</span>
              </div>
            )}
            <div className="spotify-cover-caption">
              <strong>{track.name}</strong>
              <span>{track.artists}</span>
            </div>
          </div>
        </div>

        <div className="spotify-overlay-info">
          <div className="spotify-now">
            <SpotifyIcon />
            <span>REPRODUCIENDO EN SPOTIFY</span>
          </div>

          <h1>{track.name}</h1>
          <h2>{track.artists}</h2>

          <div className="spotify-progress-row">
            <time>{formatDuration(progress)}</time>
            <div className="spotify-progress" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <time>{formatDuration(track.durationMs)}</time>
          </div>

          <div className="spotify-spectrum" aria-hidden="true">
            {SPECTRUM_BARS.map((height, index) => (
              <span
                key={`${height}-${index}`}
                style={{
                  "--bar-height": `${height}%`,
                  "--bar-delay": `${(index % 12) * 75}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0Zm5.5 17.31c-.22.36-.7.47-1.06.24-2.9-1.77-6.55-2.17-10.86-1.19-.42.1-.84-.16-.94-.58-.1-.42.16-.84.58-.94 4.73-1.08 8.78-.62 12.03 1.36.37.23.48.72.25 1.11Zm1.47-3.28c-.28.45-.86.59-1.31.32-3.31-2.04-8.36-2.63-12.27-1.44-.5.15-1.03-.13-1.18-.63-.15-.5.13-1.03.63-1.18 4.46-1.35 10.02-.69 13.81 1.64.45.28.59.86.32 1.29Zm.13-3.42c-3.98-2.36-10.55-2.58-14.35-1.43-.6.18-1.23-.16-1.41-.75-.18-.6.16-1.23.75-1.41 4.36-1.32 11.61-1.06 16.17 1.65.54.32.72 1.02.4 1.56-.32.54-1.02.71-1.56.38Z" />
    </svg>
  );
}

function normalizeTrack(data) {
  const source = data?.current || data?.track || data?.item || null;
  if (!source) return null;

  const durationMs = readDurationMs(source);
  const progressMs = readProgressMs(data, source);

  return {
    id: source.id || source.uri || `${source.name}-${source.artists}`,
    name: source.name || source.title || "Sin titulo",
    artists: normalizeArtists(source.artists || source.artist),
    album: source.album || source.album_name || "",
    albumArt: readAlbumArt(source),
    durationMs,
    progressMs,
    isPlaying: data?.is_playing ?? data?.isPlaying ?? source.is_playing ?? source.isPlaying ?? true,
    syncedAt: Date.now(),
  };
}

function normalizeArtists(artists) {
  if (Array.isArray(artists)) {
    return artists.map((artist) => artist?.name || artist).filter(Boolean).join(", ");
  }
  return artists || "Spotify";
}

function readAlbumArt(track) {
  if (track.album_art) return track.album_art;
  if (track.albumArt) return track.albumArt;
  if (track.image) return track.image;
  if (track.cover) return track.cover;
  if (Array.isArray(track.images) && track.images[0]?.url) return track.images[0].url;
  if (Array.isArray(track.album?.images) && track.album.images[0]?.url) return track.album.images[0].url;
  return "";
}

function readDurationMs(track) {
  const raw = track.duration_ms ?? track.durationMs ?? track.duration;
  if (Number.isFinite(Number(raw))) {
    const value = Number(raw);
    return value < 1000 ? value * 1000 : value;
  }
  return parseDurationLabel(track.duration_label || track.durationLabel) || DEFAULT_TRACK.durationMs;
}

function readProgressMs(data, track) {
  const raw = data?.progress_ms ?? data?.progressMs ?? data?.progress ?? track.progress_ms ?? track.progressMs ?? track.progress;
  if (!Number.isFinite(Number(raw))) return DEFAULT_TRACK.progressMs;
  const value = Number(raw);
  return value < 1000 ? value * 1000 : value;
}

function parseDurationLabel(label = "") {
  const parts = String(label).split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 2) return ((parts[0] * 60) + parts[1]) * 1000;
  if (parts.length === 3) return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
  return 0;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
