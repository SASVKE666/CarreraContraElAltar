/**
 * Catálogo de la tienda: vehículos y atuendo del novio. Todo se paga con los anillos
 * que se guardan al terminar cada partida (la "cartera").
 * Los artículos con precio 0 son los de serie: siempre están disponibles.
 */
import type { VehicleKind } from './constants';

export type Slot = 'skin' | 'hat' | 'suit' | 'tie' | 'face' | 'pack';
export const SLOTS: { slot: Slot; label: string; icon: string }[] = [
  { slot: 'skin', label: 'Personaje', icon: '🦸' },
  { slot: 'hat', label: 'Sombrero', icon: '🎩' },
  { slot: 'suit', label: 'Traje', icon: '🤵' },
  { slot: 'tie', label: 'Corbata', icon: '🎀' },
  { slot: 'face', label: 'Rostro', icon: '🕶️' },
  { slot: 'pack', label: 'Jetpack', icon: '🍾' },
];

/** Qué tiene puesto el novio en cada ranura (id del artículo sin el prefijo de la ranura) */
export type Outfit = Record<Slot, string>;
export const DEFAULT_OUTFIT: Outfit = { skin: 'novio', hat: 'none', suit: 'classic', tie: 'bow', face: 'none', pack: 'green' };

export interface ShopItem {
  /** id único; los de atuendo son `ranura:nombre`, los vehículos `veh:tipo` */
  id: string;
  name: string;
  desc: string;
  price: number;
  slot?: Slot;
  /** id corto dentro de la ranura */
  key?: string;
  vehicle?: VehicleKind;
  /** Si existe, el artículo es una skin de ese vehículo (y no el vehículo en sí) */
  skinKey?: string;
}

const o = (slot: Slot, key: string, name: string, price: number, desc: string): ShopItem => ({
  id: `${slot}:${key}`,
  slot,
  key,
  name,
  price,
  desc,
});

export const OUTFIT_ITEMS: ShopItem[] = [
  o('skin', 'novio', 'El Novio', 0, 'El de siempre: frac, moño y jetpack de champaña.'),
  o('skin', 'ghost', 'Fantasma de sábana', 500, 'Buuu. La novia no se asusta con nada.'),
  o('skin', 'bunny', 'Conejo de peluche', 500, 'Orejas largas y cola de algodón.'),
  o('skin', 'pirate', 'Pirata', 600, 'Tricornio, parche y rumbo a cualquier parte menos al altar.'),
  o('skin', 'dino', 'Dinosaurio', 600, 'Disfraz de dino con cola y espinas.'),
  o('skin', 'astro', 'Astronauta', 600, 'Casco de burbuja: huye hasta la luna.'),
  o('skin', 'robot', 'Robo-Novio', 700, 'Cero sentimientos, cero compromisos.'),
  o('skin', 'wizard', 'Mago', 700, 'Sombrero estrellado y barba de sabio.'),
  o('skin', 'office', 'Ejecutivo', 700, 'Cabeza lisa, traje azul marino y maletín. Huye de la junta... y de la boda.'),
  o('skin', 'ninja', 'Ninja', 800, 'Sigiloso... hasta que vuela con champaña.'),
  o('skin', 'crab', 'Novio Cangrejo', 800, 'Capucha roja, ojos saltones y pinzas listas.'),

  o('hat', 'none', 'Sin sombrero', 0, 'Pelo al viento.'),
  o('hat', 'cap', 'Gorra de recién casado', 150, 'Para huir con estilo deportivo.'),
  o('hat', 'flowers', 'Corona de flores', 200, 'Por si la novia se ablanda.'),
  o('hat', 'tophat', 'Sombrero de copa', 250, 'Elegancia de boda de gala.'),
  o('hat', 'charro', 'Sombrero charro', 400, '¡Ay, ay, ay! Que suene el mariachi.'),
  o('hat', 'crown', 'Corona de rey', 1200, 'El rey de la fuga.'),

  o('suit', 'classic', 'Frac clásico', 0, 'El traje de siempre.'),
  o('suit', 'navy', 'Azul marino', 200, 'Sobrio y elegante.'),
  o('suit', 'white', 'Blanco playero', 300, 'Boda en la playa (de emergencia).'),
  o('suit', 'wine', 'Burdeos', 300, 'Color vino de la casa.'),
  o('suit', 'pink', 'Rosa chicle', 350, 'Valiente y muy visible.'),
  o('suit', 'gold', 'Dorado de gala', 1000, 'Brilla más que los anillos.'),

  o('tie', 'bow', 'Moño rosa', 0, 'El de serie.'),
  o('tie', 'bowblue', 'Moño azul', 100, 'Algo azul, como manda la tradición.'),
  o('tie', 'tie', 'Corbata roja', 150, 'Larga y ondeando al viento.'),
  o('tie', 'bowgold', 'Moño dorado', 250, 'Con un toque de lujo.'),

  o('face', 'none', 'Sin accesorio', 0, 'A cara descubierta.'),
  o('face', 'mustache', 'Bigote', 200, 'Nadie reconocerá al novio.'),
  o('face', 'shades', 'Gafas de sol', 300, 'Huir con actitud.'),
  o('face', 'monocle', 'Monóculo', 350, 'Muy fino, muy sospechoso.'),

  o('pack', 'green', 'Champaña brut', 0, 'Las botellas de siempre.'),
  o('pack', 'rose', 'Champaña rosé', 200, 'Burbujas rosadas.'),
  o('pack', 'ice', 'Champaña helada', 300, 'Botellas azul hielo.'),
  o('pack', 'gold', 'Champaña de oro', 600, 'Reserva especial.'),
];

/** Los vehículos salen gratis de los regalos de boda; en la tienda solo se compran sus skins.
 *  Precios que tuvieron antes (para reembolsar a quien ya los había comprado). */
export const LEGACY_VEHICLE_PRICES: Record<string, number> = { 'veh:swan': 400, 'veh:limo': 900, 'veh:cupid': 1500 };

/** Skins de vehículo: se compran con la cartera y se ponen al vehículo correspondiente */
const vs = (vehicle: VehicleKind, key: string, name: string, price: number, desc: string): ShopItem => ({
  id: `vskin:${vehicle}:${key}`,
  vehicle,
  skinKey: key,
  name,
  price,
  desc,
});
export const VEHICLE_SKIN_ITEMS: ShopItem[] = [
  vs('swan', 'classic', 'Blanco y rosa', 0, 'El cisne de serie.'),
  vs('swan', 'bubblegum', 'Cisne chicle', 250, 'Rosa de feria.'),
  vs('swan', 'ice', 'Cisne de hielo', 350, 'Frío por fuera, valiente por dentro.'),
  vs('swan', 'midnight', 'Cisne de medianoche', 450, 'Elegante y misterioso.'),
  vs('swan', 'gold', 'Cisne dorado', 600, 'Inflable de lujo.'),
  vs('limo', 'classic', 'Blanca de boda', 0, 'La limusina de serie.'),
  vs('limo', 'candy', 'Limusina chicle', 250, 'Dulce como el pastel.'),
  vs('limo', 'taxi', 'Taxi amarillo', 350, 'Para huir de la ciudad.'),
  vs('limo', 'burger', 'Limo-hamburguesa', 500, 'Pan, carne, queso y ruedas. ¡Con todo!'),
  vs('limo', 'midnight', 'Limusina de medianoche', 450, 'Cristales oscuros, intenciones claras.'),
  vs('limo', 'gold', 'Limusina dorada', 600, 'La más brillante del salón.'),
  vs('cupid', 'classic', 'Concha azul', 0, 'La carroza de serie.'),
  vs('cupid', 'rose', 'Carroza rosa', 250, 'Color de rosas.'),
  vs('cupid', 'jade', 'Carroza de jade', 350, 'Verde jade pulido.'),
  vs('cupid', 'pumpkin', 'Carroza calabaza', 450, 'Cuento de hadas de otoño.'),
  vs('cupid', 'gold', 'Carroza dorada', 600, 'Fulgor de oro puro.'),
];
export const vehicleSkinsOf = (k: VehicleKind) => VEHICLE_SKIN_ITEMS.filter((i) => i.vehicle === k);
export const validVehicleSkin = (k: VehicleKind, key: unknown): key is string =>
  typeof key === 'string' && VEHICLE_SKIN_ITEMS.some((i) => i.vehicle === k && i.skinKey === key);
export const DEFAULT_VEHICLE_SKINS: Record<VehicleKind, string> = { swan: 'classic', limo: 'classic', cupid: 'classic' };

export const SHOP_ITEMS: ShopItem[] = [...VEHICLE_SKIN_ITEMS, ...OUTFIT_ITEMS];
export const ITEM_BY_ID: Record<string, ShopItem> = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i]));

export const itemsOfSlot = (slot: Slot) => OUTFIT_ITEMS.filter((i) => i.slot === slot);

/** ¿Es válido este valor para esa ranura? (para sanear datos guardados) */
export const validKey = (slot: Slot, key: unknown): key is string =>
  typeof key === 'string' && OUTFIT_ITEMS.some((i) => i.slot === slot && i.key === key);

/** Colores de cada traje */
export const SUIT_COLORS: Record<string, { main: string; sash: string }> = {
  classic: { main: '#2b2233', sash: '#e63e6d' },
  navy: { main: '#24407a', sash: '#f6c453' },
  white: { main: '#f4efe4', sash: '#7fb6e8' },
  wine: { main: '#6d1f3b', sash: '#f6c453' },
  pink: { main: '#f08bb5', sash: '#ffffff' },
  gold: { main: '#d9a62b', sash: '#7a1f3d' },
};

/** Colores de las botellas del jetpack: cuerpo y papel/boquilla */
export const PACK_COLORS: Record<string, { body: string; foil: string }> = {
  green: { body: '#2f6b4f', foil: '#f6c453' },
  rose: { body: '#d85a8a', foil: '#ffe3ee' },
  ice: { body: '#4aa3d8', foil: '#e9f7ff' },
  gold: { body: '#d9a62b', foil: '#fff3b8' },
};
