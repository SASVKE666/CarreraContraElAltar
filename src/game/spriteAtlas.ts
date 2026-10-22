/**
 * Sprite Atlas coordinate definitions and rendering utilities
 * for the Player Runner and Bride Pursuer from uploaded sprite sheets.
 */

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const RUNNER_SPRITE_URL = '/assets/aistudio/Hoja_de_sprites_de_corredor_2D_76a6e2d4.png';
export const BRIDE_SPRITE_URL = '/assets/aistudio/Hoja_de_sprites_de_novia_monstruosa_bad5798d.png';

export const RUNNER_FRAMES = {
  // Row 2: CORRER DERECHA (10 frames)
  run: Array.from({ length: 10 }, (_, i) => ({
    sx: 180 + i * 130,
    sy: 135,
    sw: 130,
    sh: 85,
  })),
  // Row 4: SALTAR DERECHA (Frames de ascenso)
  jump: [
    { sx: 180, sy: 320, sw: 130, sh: 98 },
    { sx: 310, sy: 320, sw: 130, sh: 98 },
    { sx: 440, sy: 320, sw: 130, sh: 98 },
  ],
  // Row 6: CAER DERECHA (Frames de picada hacia el suelo)
  fall: [
    { sx: 180, sy: 485, sw: 130, sh: 60 },
    { sx: 310, sy: 485, sw: 130, sh: 60 },
    { sx: 440, sy: 485, sw: 130, sh: 60 },
  ],
  // Row 8: DESLIZARSE DERECHA (6 frames agachado a ras de suelo)
  slide: Array.from({ length: 6 }, (_, i) => ({
    sx: 180 + i * 130,
    sy: 612,
    sw: 130,
    sh: 72,
  })),
};

export const BRIDE_FRAMES = {
  // Row 2: CORRER DERECHA (10 frames de trote)
  run: Array.from({ length: 10 }, (_, i) => ({
    sx: 180 + i * 130,
    sy: 135,
    sw: 130,
    sh: 83,
  })),
  // Row 8: ATAQUE / PERSECUCIÓN DERECHA (7 frames zancada furiosa y rodillo)
  attack: Array.from({ length: 7 }, (_, i) => ({
    sx: 180 + i * 130,
    sy: 610,
    sw: 130,
    sh: 89,
  })),
};

/**
 * Draws a sprite frame using Bottom Center anchor point (matching Unity 2D standard).
 * @param ctx 2D Canvas context
 * @param img Loaded HTMLImageElement
 * @param frame Sub-rectangle in the sprite sheet
 * @param pivotX X coordinate at the character's feet
 * @param pivotY Y coordinate at the character's feet (on ground or in air)
 * @param targetWidth Desired display width
 * @param targetHeight Desired display height
 */
export function drawSpriteBottomCenter(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: SpriteFrame,
  pivotX: number,
  pivotY: number,
  targetWidth: number,
  targetHeight: number
) {
  const drawX = Math.round(pivotX - targetWidth / 2);
  const drawY = Math.round(pivotY - targetHeight);

  ctx.drawImage(
    img,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    drawX,
    drawY,
    targetWidth,
    targetHeight
  );
}
