import React from 'react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

const Row: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex gap-3 items-start">
    <div className="text-2xl w-9 text-center shrink-0">{icon}</div>
    <div>
      <div className="font-display text-[#7a1f3d] text-sm sm:text-base">{title}</div>
      <div className="text-[#4a1230] text-xs sm:text-sm leading-snug">{children}</div>
    </div>
  </div>
);

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-full overflow-y-auto rounded-3xl border-4 border-[#2a1420] bg-gradient-to-b from-[#fff4e0] to-[#f9c5d3] p-5 shadow-[0_8px_0_#2a1420]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 border-2 border-[#2a1420]" aria-label="Cerrar">
          <X className="w-4 h-4 text-[#2a1420]" />
        </button>
        <h3 className="font-display text-2xl text-rose-600 mb-3">MANUAL DE FUGA</h3>

        <div className="space-y-3">
          <Row icon="🍾" title="Vuela con tu jetpack">
            <b>Mantén presionado</b> (Espacio, ↑, W, clic o toque) para subir. <b>Suelta</b> para caer.
          </Row>
          <Row icon="👰" title="La novia te persigue">
            Cada golpe la acerca. Si el medidor de arriba se vacía, ¡te atrapa! Se aleja un poquito si recoges anillos.
          </Row>
          <Row icon="⚡" title="Esquiva los peligros">
            Luces eléctricas, torres de copas, arañas de cristal y <b>ramos-misil</b>. Cuando aparezca un <b>❤ !</b> al borde derecho, ¡sube o baja, viene un ramo!
          </Row>
          <Row icon="💍" title="Anillos">Cada anillo vale 10 puntos. Las rutas de anillos suelen marcar el camino seguro.</Row>
          <Row icon="💫" title="Power-ups">
            <b>Velo</b>: aguanta un golpe. <b>Imán</b>: atrae los anillos. <b>Luna de miel</b>: turbo invencible que rompe todo y te aleja de la novia.
          </Row>
          <Row icon="🛍️" title="Tienda">
            Los anillos que recoges se guardan al terminar cada partida. Gástalos en la tienda: <b>vestir al novio</b>, <b>cambiarlo por un disfraz</b>, y comprar <b>skins</b> para los vehículos.
          </Row>
          <Row icon="🎁" title="Regalos de boda y vehículos">
            Cruza un regalo para subirte a un vehículo (son gratis): <b>Cisne Inflable</b> (toca para aletear), <b>Limusina</b> (salta y aplasta las torres de copas) o <b>Carroza de Cupido</b> (toca para invertir la gravedad). Cada uno aguanta un golpe.
          </Row>
          <Row icon="🏆" title="Logros">Cumple retos para desbloquear logros. Míralos en el menú.</Row>
          <Row icon="⏸️" title="Pausa">Pulsa P o Esc. El juego se pausa solo si cambias de pestaña.</Row>
        </div>

        <button onClick={onClose} className="btn-primary mt-5 w-full">¡A correr!</button>
      </div>
    </div>
  );
};
