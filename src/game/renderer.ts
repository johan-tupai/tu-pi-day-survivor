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

function drawPiSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.font = `bold ${size}px serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('π', x, y);
  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  // Background
  drawGrass(ctx, state.camera, w, h);

  const { camera, player } = state;

  // Pie Crust aura
  if (player.hasPieCrust) {
    const sp = worldToScreen(player.pos, camera);
    // Fill
    const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, player.pieCrustRadius);
    grad.addColorStop(0, 'rgba(210, 160, 80, 0.08)');
    grad.addColorStop(0.7, 'rgba(210, 160, 80, 0.05)');
    grad.addColorStop(1, 'rgba(180, 120, 50, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, player.pieCrustRadius, 0, Math.PI * 2);
    ctx.fill();

    // Crust edge - scalloped pie crust pattern
    ctx.save();
    ctx.strokeStyle = '#c8940a';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    const segments = 24;
    const bumpSize = 6;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const midAngle = ((i + 0.5) / segments) * Math.PI * 2;
      const r = player.pieCrustRadius;
      const px = sp.x + Math.cos(angle) * r;
      const py = sp.y + Math.sin(angle) * r;
      const cpx = sp.x + Math.cos(midAngle) * (r + bumpSize);
      const cpy = sp.y + Math.sin(midAngle) * (r + bumpSize);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Pickups (visuals are 2x size, hitbox unchanged)
  for (const pickup of state.pickups) {
    const sp = worldToScreen(pickup.pos, camera);
    const vr = pickup.radius * 2; // visual radius = 2x
    switch (pickup.type) {
      case 'xp': {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, vr + 2, 0, Math.PI * 2);
        ctx.fill();
        drawPiSymbol(ctx, sp.x, sp.y + 1, 22, '#451a03');
        break;
      }
      case 'health_pie': {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(sp.x - 6, sp.y, vr, 0, Math.PI * 2);
        ctx.arc(sp.x + 6, sp.y, vr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - vr);
        ctx.lineTo(sp.x + 4, sp.y - vr - 10);
        ctx.stroke();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(sp.x + 8, sp.y - vr - 6, 8, 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
        drawPiSymbol(ctx, sp.x, sp.y + 1, 20, '#fff');
        break;
      }
      case 'timer_extension': {
        ctx.fillStyle = '#facc15';
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(-0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, vr + 8, vr - 4, 0, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
        drawPiSymbol(ctx, sp.x, sp.y - 1, 18, '#451a03');
        break;
      }
      case 'boss_durian': {
        const r = vr;
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f6212';
        const spikes = 10;
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * Math.PI * 2;
          const sx2 = sp.x + Math.cos(a) * (r + 10);
          const sy2 = sp.y + Math.sin(a) * (r + 10);
          ctx.beginPath();
          ctx.moveTo(
            sp.x + Math.cos(a - 0.2) * r,
            sp.y + Math.sin(a - 0.2) * r
          );
          ctx.lineTo(sx2, sy2);
          ctx.lineTo(
            sp.x + Math.cos(a + 0.2) * r,
            sp.y + Math.sin(a + 0.2) * r
          );
          ctx.fill();
        }
        drawPiSymbol(ctx, sp.x, sp.y + 1, 24, '#fff');
        break;
      }
    }
  }

  // Enemies
  for (const e of state.enemies) {
    const sp = worldToScreen(e.pos, camera);
    let color: string;
    switch (e.type) {
      case 'bug': color = '#ef4444'; break;
      case 'rat': color = '#a855f7'; break;
      case 'snake': color = '#14b8a6'; break;
      case 'boss': color = '#dc2626'; break;
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = e.type === 'boss' ? 'rgba(255,50,50,0.6)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = e.type === 'boss' ? 3 : 2;
    ctx.stroke();

    // Boss glow
    if (e.type === 'boss') {
      ctx.save();
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(255,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, e.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Eyes
    const eyeScale = e.type === 'boss' ? 0.2 : 0.3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sp.x - e.radius * eyeScale, sp.y - e.radius * 0.2, e.radius * 0.25, 0, Math.PI * 2);
    ctx.arc(sp.x + e.radius * eyeScale, sp.y - e.radius * 0.2, e.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sp.x - e.radius * eyeScale, sp.y - e.radius * 0.2, e.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(sp.x + e.radius * eyeScale, sp.y - e.radius * 0.2, e.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (e.hp < e.maxHp) {
      const barW = e.radius * 2;
      const barH = e.type === 'boss' ? 5 : 3;
      const bx = sp.x - barW / 2;
      const by = sp.y - e.radius - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = e.type === 'boss' ? '#ff4444' : '#ef4444';
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

  // Player (squirrel)
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
