# Cinemáticas de la Tienda

Aquí van los videos de las cinemáticas que se desbloquean en la pestaña **Cinemáticas** de la Tienda.
(La introducción ya viene incluida y no necesita archivos aquí.)

| Cinemática | Se desbloquea al… | Archivo(s) a colocar aquí |
|---|---|---|
| Cinemática dorada | comprar todos los atuendos dorados (corona de rey, frac dorado, moño dorado y champaña de oro) | `dorado.mp4` (y opcional `dorado.webm`) |
| Cinemática final | comprar absolutamente todo (atuendos, personajes y skins de vehículos) | `completo.mp4` (y opcional `completo.webm`) |

Basta con copiar el archivo con ese nombre: el botón «Ver» aparece solo cuando se cumple la condición.

**Formato recomendado:** MP4 con video H.264 y audio AAC (el que mejor funciona en celulares y navegadores).
Un `.webm` (VP9 + Opus) es opcional como alternativa.

**Cambiar nombres, textos o condiciones:** edita `src/game/cinematics.ts` (lista `CINEMATICS` y `GOLDEN_OUTFIT_IDS`).
**Agregar una cinemática más:** añade otra entrada a `CINEMATICS` con su `sources: clip('archivo.mp4')`.

Para probar sin comprar todo, en la consola del navegador:
`localStorage.setItem('novio_en_fuga_cine_debug','1')` y recarga: todas las cinemáticas quedan desbloqueadas.
