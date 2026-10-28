# Novio en Fuga

Runner de scroll lateral estilo *Jetpack Joyride*. Es el día de tu boda, te arrepentiste, y escapas con un jetpack de botellas de champaña mientras la novia furiosa te persigue.

## Cómo se juega
- **Mantén presionado** (Espacio, ↑, W, clic o toque) para subir. **Suelta** para caer.
- Esquiva luces eléctricas, torres de copas, arañas de cristal y ramos-misil (avisa un ❤ ! en el borde derecho).
- Cada golpe acerca a la novia; si el medidor de arriba se vacía, te atrapa.
- Recoge anillos (10 pts c/u). Power-ups: **Velo** (aguanta 1 golpe), **Imán**, **Luna de miel** (turbo invencible).
- Pausa: `P` o `Esc`.

## Regalos, vehículos y logros

- **Tienda 🛍️** (menú → Tienda): los anillos que recoges se guardan en una **cartera** al terminar cada partida (también si sales a medias) y se gastan ahí. Puedes **vestir al novio** (sombrero, traje, corbata, rostro y color del jetpack, con vista previa antes de comprar) y cambiarlo por un disfraz o ponerles **skins** a los vehículos. Los vehículos **no se compran**: salen gratis de los regalos. Los precios están en `src/game/shopData.ts`. (Quien ya había comprado vehículos con la versión anterior recibe el reembolso en su cartera al cargar la partida.)
- **Skins 🎨**: cada vehículo tiene skins extra (250–600 💍, p. ej. Cisne de hielo, Taxi amarillo, **Limo-hamburguesa**, Carroza calabaza) que se compran y se ponen desde *Vehículos y skins* (paletas en `src/game/art/vehicles.ts`). En *Atuendo y personajes* hay una sección **Personaje** para cambiar al runner por 10 disfraces originales (Fantasma, Conejo, Pirata, Dinosaurio, Astronauta, Robo-Novio, Mago, Ejecutivo, Ninja y Novio Cangrejo; 500–800 💍, dibujados en `src/game/art/costumes.ts`). Un disfraz reemplaza traje, sombrero, corbata y accesorios (el color del jetpack se conserva) y también se ve montado en los vehículos.
- **Regalos de boda 🎁**: el primero sale cerca de los 400 m y luego uno cada ~900 m en promedio. Al cruzarlos te subes a un vehículo al azar (se destruyen las trampas y misiles en pantalla y no llega ninguno hasta que acaba el título con los controles); aguanta **un golpe** (si te dan, se destruye y sigues con el jetpack, sin castigo de la novia).
  - **Cisne Inflable**: cada toque da un aletazo; mantén para seguir aleteando.
  - **Limusina Recién Casados**: rueda por el piso; mantén para saltar más alto. Aplasta las torres de copas.
  - **Carroza de Cupido**: cada toque invierte la gravedad (piso ⇄ techo).
- **Logros** (menú → Logros): 33 retos en 7 grupos, con barra de progreso.
- El progreso se guarda en `localStorage` (clave `novio_en_fuga_save_v1`) y se puede borrar desde el modal de Logros.

## Inicio estilo Jetpack Joyride

El menú es la fachada de la iglesia con el título y los botones encima. Al pulsar **¡CORRER!** la puerta se abomba, revienta en astillas y el novio sale corriendo hacia el jardín mientras el muro se aleja con el scroll (la novia asoma por el hueco). Al reintentar, la partida arranca directo en la salida. El primer nivel es el jardín, luego el salón y por último la catedral.

## Desarrollo
```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint    # tsc --noEmit
```

## Video de intro
`public/assets/intro.mp4` es el video original y **se conserva tal cual**. Para que cargue en cualquier navegador, celular o IDE, la intro prueba estos formatos en orden (`src/components/IntroSequence.tsx`):

1. `src/assets/video/intro-compat.mp4`: mismo video, H.264 + una sola pista AAC (el original trae AAC y AC-3).
2. `src/assets/video/intro.webm`: VP9 + Opus, para navegadores sin códecs propietarios.
3. `public/assets/intro.mp4`: el original, como último recurso.

Las rutas de 1 y 2 las resuelve Vite (con `base: './'` en `vite.config.ts`), así que no dependen de dónde se sirva el proyecto. Si el video no se puede reproducir, se muestra un aviso con "Reintentar" y "Continuar" en vez de saltarlo en silencio.

## Estructura
- `src/game/engine.ts` – lógica y dibujo del juego (sin React).
- `src/game/constants.ts` – tamaños, colores, zonas, textos y valores de power-ups.
- `src/game/art/` – arte 100% vectorial en canvas: `characters.ts`, `props.ts`, `backgrounds.ts`, `core.ts`.
- `src/game/sound.ts` – efectos con Web Audio y música del gameplay desde `public/assets/music/gameplay.mp3`: suena completa una vez y repite el tramo 16.16 s → 180.73 s (ajustable con `LOOP_START`/`LOOP_END`; el archivo lleva el fundido cruzado horneado). Si la pista no carga, usa la música de boda sintetizada.
- `src/game/art/fx.ts` – postproceso cinematográfico: luz dinámica (resplandores aditivos del novio, anillos, zappers, misiles, regalos y candelabros), sombras suaves de contacto, oclusión en techo/piso, haces de luz y niebla por zona, polvo y destellos sutiles, grano de película y gradación de color/contraste. La capa lejana del fondo sale desenfocada (profundidad de campo, `blur` en `backgrounds.ts`). No cambia ningún diseño y no usa el azar del juego. La calidad se adapta sola a los fps (3 niveles) o se fuerza con `localStorage.novio_en_fuga_fx = 'off' | 'low' | 'mid' | 'high'`.
- `src/game/RunnerCanvas.tsx` – monta el canvas y captura la entrada.
- `src/components/` – menú, game over y cómo jugar.

Todo el arte y los efectos de sonido se generan por código; los únicos archivos externos son el video de intro y la pista de música.
