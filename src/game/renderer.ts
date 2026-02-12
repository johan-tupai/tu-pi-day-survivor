import { GameState, Vec2 } from './types';

const GRASS_TILE = 64;

function drawGrass(ctx: CanvasRenderingContext2D, camera: Vec2, w: number, h: number) {
  const startX = Math.floor(camera.x / GRASS_TILE) * GRASS_TILE;
  const startY = Math.floor(camera.y / GRASS_TILE) * GRASS_TILE;

  for (let x = startX; x < camera.x + w + GRASS_TILE; x += GRASS_TILE) {
    for (let y = startY; y < camera.y + h + GRASS_TILE; y += GRASS_TILE) {
      const sx = x - camera.x;
      const sy = y - camera.y;
      const shade = ((x / GRASS_TILE + y / GRASS_TILE) % 2 === 0) ? '#2d5a1e' : '#336b24';
      ctx.fillStyle = shade;
      ctx.fillRect(sx, sy, GRASS_TILE, GRASS_TILE);
    }
  }
}

function worldToScreen(pos: Vec2, camera: Vec2): Vec2 {
  return { x: pos.x - camera.x, y: pos.y - camera.y };
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  // Background
  drawGrass(ctx, state.camera, w, h);

  const { camera, player } = state;

  // Garlic aura
  if (player.hasGarlicAura) {
    const sp = worldToScreen(player.pos, camera);
    const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, player.garlicRadius);
    grad.addColorStop(0, 'rgba(192, 132, 252, 0.12)');
    grad.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, player.garlicRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // XP Nuts
  for (const nut of state.xpNuts) {
    const sp = worldToScreen(nut.pos, camera);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, nut.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Enemies
  for (const e of state.enemies) {
    const sp = worldToScreen(e.pos, camera);
    let color: string;
    let eyeColor = '#fff';
    switch (e.type) {
      case 'bug': color = '#ef4444'; break;
      case 'rat': color = '#a855f7'; break;
      case 'snake': color = '#14b8a6'; break;
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(sp.x - e.radius * 0.3, sp.y - e.radius * 0.2, e.radius * 0.25, 0, Math.PI * 2);
    ctx.arc(sp.x + e.radius * 0.3, sp.y - e.radius * 0.2, e.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sp.x - e.radius * 0.3, sp.y - e.radius * 0.2, e.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(sp.x + e.radius * 0.3, sp.y - e.radius * 0.2, e.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = e.radius * 2;
      const barH = 3;
      const bx = sp.x - barW / 2;
      const by = sp.y - e.radius - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
    }
  }

  // Projectiles
  for (const p of state.projectiles) {
    const sp = worldToScreen(p.pos, camera);
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Orbiting leaf
  if (player.hasOrbitingLeaf) {
    const leafPos = {
      x: player.pos.x + Math.cos(player.leafAngle) * 50,
      y: player.pos.y + Math.sin(player.leafAngle) * 50,
    };
    const sp = worldToScreen(leafPos, camera);
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(player.leafAngle);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Player (squirrel-like shape)
  {
    const sp = worldToScreen(player.pos, camera);
    const flash = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0;

    if (!flash) {
      // Tail
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(sp.x - 6, sp.y + 12, 12, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Belly
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + 4, player.radius * 0.55, player.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(sp.x - 10, sp.y - 16, 6, 0, Math.PI * 2);
      ctx.arc(sp.x + 10, sp.y - 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sp.x - 6, sp.y - 4, 5, 0, Math.PI * 2);
      ctx.arc(sp.x + 6, sp.y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(sp.x - 5, sp.y - 4, 2.5, 0, Math.PI * 2);
      ctx.arc(sp.x + 7, sp.y - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Damage numbers
  for (const d of state.damageNumbers) {
    const sp = worldToScreen(d.pos, camera);
    ctx.save();
    ctx.globalAlpha = Math.min(1, d.timer * 2);
    ctx.font = 'bold 16px Nunito';
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText(String(d.value), sp.x, sp.y);
    ctx.fillText(String(d.value), sp.x, sp.y);
    ctx.restore();
  }
}
