import { GameState, Enemy, EnemyType, Vec2 } from './types';

const SHOOT_INTERVAL = 1.0;
const PROJECTILE_SPEED = 300;
const PROJECTILE_DAMAGE = 20;
const PROJECTILE_LIFETIME = 2.0;
const XP_NUT_LIFETIME = 10.0;
const LEAF_ORBIT_RADIUS = 50;
const LEAF_ORBIT_SPEED = 3;
const LEAF_DAMAGE = 30;
const PICKUP_RADIUS = 40;
const ENEMY_DAMAGE_COOLDOWN = 0.5;

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function getSpawnInterval(timeRemaining: number): number {
  if (timeRemaining > 120) return 0.8;
  if (timeRemaining > 60) return 0.6;
  return 0.4;
}

function getEnemyType(timeRemaining: number): EnemyType {
  if (timeRemaining > 120) return 'bug';
  if (timeRemaining > 60) return 'rat';
  return 'snake';
}

function createEnemy(type: EnemyType, playerPos: Vec2, canvasW: number, canvasH: number): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = Math.max(canvasW, canvasH) * 0.6;
  const pos = {
    x: playerPos.x + Math.cos(angle) * spawnDist,
    y: playerPos.y + Math.sin(angle) * spawnDist,
  };

  switch (type) {
    case 'bug':
      return { pos, radius: 10, hp: 30, maxHp: 30, speed: 80 + Math.random() * 30, damage: 8, type, xpValue: 5 };
    case 'rat':
      return { pos, radius: 14, hp: 60, maxHp: 60, speed: 55 + Math.random() * 20, damage: 12, type, xpValue: 10 };
    case 'snake':
      return { pos, radius: 18, hp: 120, maxHp: 120, speed: 35 + Math.random() * 15, damage: 20, type, xpValue: 20 };
  }
}

export function updateGame(
  state: GameState,
  dt: number,
  input: Vec2,
  canvasW: number,
  canvasH: number,
  playSound: () => void
): { levelUp: boolean } {
  if (state.gamePhase !== 'playing') return { levelUp: false };

  const { player } = state;

  // Timer
  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    state.timeRemaining = 0;
    state.gamePhase = 'victory';
    return { levelUp: false };
  }

  // Player movement
  const moveDir = normalize(input);
  player.pos.x += moveDir.x * player.speed * dt;
  player.pos.y += moveDir.y * player.speed * dt;

  // Invincibility
  if (player.invincibleTimer > 0) player.invincibleTimer -= dt;

  // Camera
  state.camera.x = player.pos.x - canvasW / 2;
  state.camera.y = player.pos.y - canvasH / 2;

  // Spawn enemies
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const type = getEnemyType(state.timeRemaining);
    // Spawn a few extras as time goes on
    const count = state.timeRemaining < 60 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      state.enemies.push(createEnemy(type, player.pos, canvasW, canvasH));
    }
    // Also mix in earlier types
    if (state.timeRemaining <= 120 && Math.random() < 0.3) {
      state.enemies.push(createEnemy('bug', player.pos, canvasW, canvasH));
    }
    if (state.timeRemaining <= 60 && Math.random() < 0.2) {
      state.enemies.push(createEnemy('rat', player.pos, canvasW, canvasH));
    }
    state.spawnTimer = getSpawnInterval(state.timeRemaining);
  }

  // Move enemies toward player
  for (const e of state.enemies) {
    const dir = normalize({ x: player.pos.x - e.pos.x, y: player.pos.y - e.pos.y });
    e.pos.x += dir.x * e.speed * dt;
    e.pos.y += dir.y * e.speed * dt;
  }

  // Auto-shoot
  state.shootTimer -= dt;
  if (state.shootTimer <= 0 && state.enemies.length > 0) {
    state.shootTimer = SHOOT_INTERVAL;
    // Find nearest enemies
    const sorted = [...state.enemies].sort((a, b) => dist(a.pos, player.pos) - dist(b.pos, player.pos));
    for (let i = 0; i < player.projectileCount && i < sorted.length; i++) {
      const target = sorted[i];
      const dir = normalize({ x: target.pos.x - player.pos.x, y: target.pos.y - player.pos.y });
      state.projectiles.push({
        pos: { x: player.pos.x, y: player.pos.y },
        radius: 5,
        vel: { x: dir.x * PROJECTILE_SPEED, y: dir.y * PROJECTILE_SPEED },
        damage: PROJECTILE_DAMAGE,
        lifetime: PROJECTILE_LIFETIME,
      });
    }
  }

  // Move projectiles
  for (const p of state.projectiles) {
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.lifetime -= dt;
  }

  // Orbiting leaf
  if (player.hasOrbitingLeaf) {
    player.leafAngle += LEAF_ORBIT_SPEED * dt;
    const leafPos = {
      x: player.pos.x + Math.cos(player.leafAngle) * LEAF_ORBIT_RADIUS,
      y: player.pos.y + Math.sin(player.leafAngle) * LEAF_ORBIT_RADIUS,
    };
    // Damage enemies touching leaf
    for (const e of state.enemies) {
      if (dist(leafPos, e.pos) < e.radius + 10) {
        e.hp -= LEAF_DAMAGE * dt;
        state.damageNumbers.push({
          pos: { x: e.pos.x, y: e.pos.y - 10 },
          value: Math.round(LEAF_DAMAGE * dt),
          timer: 0.6,
          color: '#4ade80',
        });
      }
    }
  }

  // Garlic aura
  if (player.hasGarlicAura) {
    for (const e of state.enemies) {
      if (dist(player.pos, e.pos) < player.garlicRadius + e.radius) {
        e.hp -= player.garlicDamage * dt;
        if (Math.random() < 0.1) {
          state.damageNumbers.push({
            pos: { x: e.pos.x + (Math.random() - 0.5) * 20, y: e.pos.y - 10 },
            value: Math.round(player.garlicDamage * dt * 10),
            timer: 0.5,
            color: '#c084fc',
          });
        }
      }
    }
  }

  // Projectile-enemy collision
  for (const p of state.projectiles) {
    if (p.lifetime <= 0) continue;
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      if (dist(p.pos, e.pos) < p.radius + e.radius) {
        e.hp -= p.damage;
        p.lifetime = 0;
        state.damageNumbers.push({
          pos: { x: e.pos.x, y: e.pos.y - 15 },
          value: p.damage,
          timer: 0.7,
          color: '#fbbf24',
        });
        break;
      }
    }
  }

  // Enemy-player collision
  if (player.invincibleTimer <= 0) {
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      if (dist(player.pos, e.pos) < player.radius + e.radius) {
        player.hp -= e.damage;
        player.invincibleTimer = ENEMY_DAMAGE_COOLDOWN;
        state.damageNumbers.push({
          pos: { x: player.pos.x, y: player.pos.y - 20 },
          value: e.damage,
          timer: 0.8,
          color: '#ef4444',
        });
        if (player.hp <= 0) {
          player.hp = 0;
          state.gamePhase = 'gameover';
          return { levelUp: false };
        }
        break;
      }
    }
  }

  // Remove dead enemies, spawn XP
  const alive: typeof state.enemies = [];
  for (const e of state.enemies) {
    if (e.hp <= 0) {
      state.killCount++;
      state.xpNuts.push({
        pos: { x: e.pos.x, y: e.pos.y },
        radius: 6,
        value: e.xpValue,
        lifetime: XP_NUT_LIFETIME,
      });
      playSound();
    } else {
      alive.push(e);
    }
  }
  state.enemies = alive;

  // Collect XP nuts
  const remainingNuts = state.xpNuts.filter((n) => {
    n.lifetime -= dt;
    if (n.lifetime <= 0) return false;
    if (dist(player.pos, n.pos) < PICKUP_RADIUS) {
      player.xp += n.value;
      return false;
    }
    return true;
  });
  state.xpNuts = remainingNuts;

  // Level up check
  if (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);
    state.gamePhase = 'levelup';
    return { levelUp: true };
  }

  // Update damage numbers
  state.damageNumbers = state.damageNumbers.filter((d) => {
    d.timer -= dt;
    d.pos.y -= 30 * dt;
    return d.timer > 0;
  });

  // Cleanup projectiles
  state.projectiles = state.projectiles.filter((p) => p.lifetime > 0);

  // Cull far-away enemies
  state.enemies = state.enemies.filter((e) => dist(e.pos, player.pos) < 1200);

  return { levelUp: false };
}

export function applyUpgrade(state: GameState, upgradeId: string) {
  const { player } = state;
  switch (upgradeId) {
    case 'multi_nut':
      player.projectileCount++;
      break;
    case 'orbiting_leaf':
      player.hasOrbitingLeaf = true;
      break;
    case 'coffee_bean':
      player.speed *= 1.2;
      break;
    case 'garlic_aura':
      if (player.hasGarlicAura) {
        player.garlicRadius += 20;
        player.garlicDamage += 5;
      } else {
        player.hasGarlicAura = true;
      }
      break;
  }
  state.gamePhase = 'playing';
}
