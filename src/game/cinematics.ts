/**
 * Cinemáticas de la Tienda (pestaña «Cinemáticas»).
 *
 * PARA AGREGAR TUS VIDEOS: copia los archivos a `public/assets/cinematics/` con el nombre
 * indicado en `files` de cada cinemática (ver el README de esa carpeta). No hace falta tocar
 * nada más: cuando se cumple la condición y el archivo existe, aparece el botón «Ver».
 * Los títulos y descripciones de abajo son provisionales: cámbialos aquí cuando quieras.
 */
import type { SaveData } from './save';
import { SHOP_ITEMS, OUTFIT_ITEMS, type ShopItem } from './shopData';
import { INTRO_SOURCES, INTRO_POSTER, type VideoSource } from './introSources';

/** Ruta de un video dentro de public/assets/cinematics (respeta la base de Vite) */
const clip = (...names: string[]): VideoSource[] =>
  names.map((n) => ({
    url: `${import.meta.env.BASE_URL}assets/cinematics/${n}`,
    type: n.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4',
  }));

/**
 * Atuendos «dorados» del novio (los que hay que comprar todos para la cinemática dorada).
 * Para sumar o quitar piezas, edita esta lista (ids `ranura:clave` de shopData.ts).
 */
export const GOLDEN_OUTFIT_IDS = ['hat:crown', 'suit:gold', 'tie:bowgold', 'pack:gold'];

export interface Progress {
  done: number;
  total: number;
}

export interface Cinematic {
  id: string;
  title: string;
  /** Qué es / de qué trata (texto provisional para las cinemáticas por añadir) */
  blurb: string;
  /** Videos, en orden de preferencia (se usa el primero que el navegador pueda reproducir) */
  sources: VideoSource[];
  poster?: string;
  /** Texto de la condición para desbloquearla */
  condition: string;
  /** Avance hacia el desbloqueo; null = siempre disponible */
  progress: ((save: SaveData) => Progress) | null;
  /** Etiqueta de lo que se cuenta, p. ej. «atuendos dorados» */
  unit?: string;
}

const owns = (save: SaveData, item: ShopItem) => item.price === 0 || !!save.owned[item.id];

/** Avance de «comprar todos los atuendos dorados» */
export function goldenProgress(save: SaveData): Progress {
  const items = GOLDEN_OUTFIT_IDS.map((id) => OUTFIT_ITEMS.find((i) => i.id === id)).filter((i): i is ShopItem => !!i);
  return { done: items.filter((i) => owns(save, i)).length, total: items.length };
}

/** Avance de «comprar todo»: cada atuendo, personaje y skin de vehículo de la tienda */
export function everythingProgress(save: SaveData): Progress {
  const items = SHOP_ITEMS.filter((i) => i.price > 0);
  return { done: items.filter((i) => owns(save, i)).length, total: items.length };
}

export const CINEMATICS: Cinematic[] = [
  {
    id: 'intro',
    title: 'Introducción',
    blurb: 'La historia de cómo empieza la huida.',
    sources: INTRO_SOURCES,
    poster: INTRO_POSTER,
    condition: 'Disponible desde el inicio',
    progress: null,
  },
  {
    id: 'golden',
    title: 'Cinemática dorada',
    blurb: 'Una escena especial para quien viste al novio de oro de pies a cabeza.',
    sources: clip('dorado.mp4', 'dorado.webm'),
    condition: 'Compra todos los atuendos dorados del novio',
    unit: 'atuendos dorados',
    progress: goldenProgress,
  },
  {
    id: 'complete',
    title: 'Cinemática final',
    blurb: 'El gran final para quien lo tiene absolutamente todo.',
    sources: clip('completo.mp4', 'completo.webm'),
    condition: 'Compra todos los atuendos, personajes y skins de la tienda',
    unit: 'artículos',
    progress: everythingProgress,
  },
];

/** Modo de pruebas: desbloquea todas (localStorage novio_en_fuga_cine_debug = 1) */
function debugUnlocked() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('novio_en_fuga_cine_debug') === '1';
  } catch {
    return false;
  }
}

export const isCinematicUnlocked = (c: Cinematic, save: SaveData) => {
  if (!c.progress || debugUnlocked()) return true;
  const p = c.progress(save);
  return p.total > 0 && p.done >= p.total;
};

/** Ids de las cinemáticas desbloqueadas con este guardado */
export const unlockedCinematics = (save: SaveData) => CINEMATICS.filter((c) => isCinematicUnlocked(c, save)).map((c) => c.id);
