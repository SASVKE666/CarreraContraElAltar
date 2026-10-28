/**
 * Fuentes del video de intro, en orden de preferencia (se usa la primera que el navegador pueda
 * reproducir). Las URLs las resuelve Vite (con hash y respetando `base`).
 *  1. MP4 H.264 Main + AAC (una sola pista): Safari/iOS, Chrome, Android, Edge.
 *     (el intro.mp4 original trae dos pistas de audio, AAC y AC-3, y no todos los móviles lo toleran)
 *  2. WebM VP9 + Opus: Chromium/Electron sin códecs propietarios (algunos IDEs).
 *  3. El intro.mp4 original (public/assets) como último recurso.
 */
import introMp4 from '../assets/video/intro-compat.mp4';
import introWebm from '../assets/video/intro.webm';
import introPosterUrl from '../assets/video/intro-poster.jpg';

export interface VideoSource {
  url: string;
  type: string;
}

export const INTRO_SOURCES: VideoSource[] = [
  { url: introMp4, type: 'video/mp4; codecs="avc1.4D401F, mp4a.40.2"' },
  { url: introWebm, type: 'video/webm; codecs="vp9, opus"' },
  { url: `${import.meta.env.BASE_URL}assets/intro.mp4`, type: 'video/mp4' },
];
export const INTRO_POSTER = introPosterUrl;
