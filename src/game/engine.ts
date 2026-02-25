import { GameState, Enemy, EnemyType, Vec2, Pickup } from './types';

const BASE_SHOOT_INTERVAL = 1.0;
const PROJECTILE_SPEED = 300;
const PROJECTILE_DAMAGE = 20;
const PROJECTILE_LIFETIME = 2.0;
const PICKUP_LIFETIME = 10.0;
const LEAF_ORBIT_RADIUS = 50;
const LEAF_ORBIT_SPEED = 3 * 3.14;
const LEAF_DAMAGE = 30;
const PICKUP_RADIUS = 40;
const ENEMY_DAMAGE_COOLDOWN = 0.5;
const PI = 3.14;

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

function getXpMultiplier(timeRemaining: number): number {
  if (timeRemaining <= 60) return PI * PI; // ~9.86x after 2:00
  if (timeRemaining <= 120) return PI;      // ~3.14x after 1:00 left shown as 2:00 on clock
  return 1;
}

function createEnemy(type: EnemyType, playerPos: Vec2, canvasW: number, canvasH: number, bossKills: number = 0): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = Math.max(canvasW, canvasH) * 0.6;
  const pos = {
    x: playerPos.x + Math.cos(angle) * spawnDist,
    y: playerPos.y + Math.sin(angle) * spawnDist,
  };

  // Enemy stat boost: 10% per boss killed
  const boost = 1 + bossKills * 0.1;

  switch (type) {
    case 'bug':
      return { pos, radius: 10, hp: Math.round(30 * boost), maxHp: Math.round(30 * boost), speed: (80 + Math.random() * 30) * boost, damage: Math.round(8 * boost), type, xpValue: 5 };
    case 'rat':
      return { pos, radius: 14, hp: Math.round(60 * boost), maxHp: Math.round(60 * boost), speed: (55 + Math.random() * 20) * boost, damage: Math.round(12 * boost), type, xpValue: 10 };
    case 'snake':
      return { pos, radius: 18, hp: Math.round(120 * boost), maxHp: Math.round(120 * boost), speed: (35 + Math.random() * 15) * boost, damage: Math.round(20 * boost), type, xpValue: 20 };
    case 'boss': {
      // Boss = 5x the strongest normal enemy (snake), plus boss kill boost
      const mult = 5 * boost;
      return {
        pos,
        radius: Math.round(18 * mult),
        hp: Math.round(120 * mult),
        maxHp: Math.round(120 * mult),
        speed: 30,
        damage: Math.round(20 * mult),
        type,
        xpValue: 100,
      };
    }
  }
}

function getShootInterval(multiNutLevel: number): number {
  // Each level reduces interval by 5%, min 0.3s
  return Math.max(0.3, BASE_SHOOT_INTERVAL * Math.pow(0.95, multiNutLevel));
}

export interface GameEvents {
  levelUp: boolean;
  shot: boolean;
  playerDamaged: boolean;
  healed: boolean;
  timerExtended: boolean;
  screenCleared: boolean;
  bossSpawned: boolean;
  enemiesKilled: number;
}

export function updateGame(
  state: GameState,
  dt: number,
  input: Vec2,
  canvasW: number,
  canvasH: number,
): GameEvents {
  const events: GameEvents = { levelUp: false, shot: false, playerDamaged: false, healed: false, timerExtended: false, screenCleared: false, bossSpawned: false, enemiesKilled: 0 };
  if (state.gamePhase !== 'playing') return events;

  const { player } = state;

  // Timer
  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    state.timeRemaining = 0;
    state.gamePhase = 'victory';
    return events;
  }

  // Boss spawn every 100 kills
  while (state.killCount >= state.nextBossAt) {
    state.enemies.push(createEnemy('boss', player.pos, canvasW, canvasH, state.bossKills));
    state.nextBossAt += 100;
    events.bossSpawned = true;
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
    const count = state.timeRemaining < 60 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      state.enemies.push(createEnemy(type, player.pos, canvasW, canvasH, state.bossKills));
    }
    if (state.timeRemaining <= 120 && Math.random() < 0.3) {
      state.enemies.push(createEnemy('bug', player.pos, canvasW, canvasH, state.bossKills));
    }
    if (state.timeRemaining <= 60 && Math.random() < 0.2) {
      state.enemies.push(createEnemy('rat', player.pos, canvasW, canvasH, state.bossKills));
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
  const shootInterval = getShootInterval(player.multiNutLevel);
  state.shootTimer -= dt;
  if (state.shootTimer <= 0 && state.enemies.length > 0) {
    state.shootTimer = shootInterval;
    events.shot = true;
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

  // Pie Crust (formerly Garlic Aura)
  if (player.hasPieCrust) {
    const dmgMultiplier = player.pieCrustLevel;
    const actualDamage = player.pieCrustDamage * dmgMultiplier;
    for (const e of state.enemies) {
      if (dist(player.pos, e.pos) < player.pieCrustRadius + e.radius) {
        e.hp -= actualDamage * dt;
        if (Math.random() < 0.1) {
          state.damageNumbers.push({
            pos: { x: e.pos.x + (Math.random() - 0.5) * 20, y: e.pos.y - 10 },
            value: Math.round(actualDamage * dt * 10),
            timer: 0.5,
            color: '#c084fc',
          });
        }
      }
    }

    // Attract pickups within pie crust radius
    for (const p of state.pickups) {
      const d = dist(player.pos, p.pos);
      if (d < player.pieCrustRadius && d > PICKUP_RADIUS) {
        const dir = normalize({ x: player.pos.x - p.pos.x, y: player.pos.y - p.pos.y });
        const attractSpeed = 120;
        p.pos.x += dir.x * attractSpeed * dt;
        p.pos.y += dir.y * attractSpeed * dt;
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
        events.playerDamaged = true;
        if (player.hp <= 0) {
          player.hp = 0;
          state.gamePhase = 'gameover';
          return events;
        }
        break;
      }
    }
  }

  // XP multiplier
  const xpMult = getXpMultiplier(state.timeRemaining);

  // Remove dead enemies, spawn drops
  const alive: typeof state.enemies = [];
  for (const e of state.enemies) {
    if (e.hp <= 0) {
      state.killCount++;

      // XP drop (always)
      state.pickups.push({
        pos: { x: e.pos.x, y: e.pos.y },
        radius: 6,
        type: 'xp',
        value: Math.round(e.xpValue * xpMult),
        lifetime: PICKUP_LIFETIME,
      });

      // Boss drops durian + grants stat boost
      if (e.type === 'boss') {
        state.bossKills++;
        state.pickups.push({
          pos: { x: e.pos.x + 20, y: e.pos.y },
          radius: 12,
          type: 'boss_durian',
          value: 0,
          lifetime: PICKUP_LIFETIME / 2,
        });
      } else {
        // 5% health pie
        if (Math.random() < 0.05) {
          state.pickups.push({
            pos: { x: e.pos.x + 15, y: e.pos.y + 10 },
            radius: 8,
            type: 'health_pie',
            value: 0.5,
            lifetime: PICKUP_LIFETIME,
          });
        }
        // 1% timer extension
        if (Math.random() < 0.01) {
          state.pickups.push({
            pos: { x: e.pos.x - 15, y: e.pos.y + 10 },
            radius: 8,
            type: 'timer_extension',
            value: 15,
            lifetime: PICKUP_LIFETIME,
          });
        }
      }

      events.enemiesKilled++;
    } else {
      alive.push(e);
    }
  }
  state.enemies = alive;

  // Collect pickups
  state.pickups = state.pickups.filter((p) => {
    p.lifetime -= dt;
    if (p.lifetime <= 0) return false;
    if (dist(player.pos, p.pos) < PICKUP_RADIUS) {
      switch (p.type) {
        case 'xp':
          player.xp += p.value;
          break;
        case 'health_pie':
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * p.value);
          state.damageNumbers.push({
            pos: { x: player.pos.x, y: player.pos.y - 25 },
            value: Math.round(player.maxHp * p.value),
            timer: 1.0,
            color: '#22c55e',
          });
          events.healed = true;
          break;
        case 'timer_extension':
          state.timeRemaining += p.value;
          state.damageNumbers.push({
            pos: { x: player.pos.x, y: player.pos.y - 30 },
            value: p.value,
            timer: 1.0,
            color: '#38bdf8',
          });
          events.timerExtended = true;
          break;
          // Kill all visible enemies
          for (const e of state.enemies) {
            e.hp = 0;
          }
          state.damageNumbers.push({
            pos: { x: player.pos.x, y: player.pos.y - 35 },
            value: 9999,
            timer: 1.5,
            color: '#f59e0b',
          });
          events.screenCleared = true;
          break;
      }
      return false;
    }
    return true;
  });

  // Level up check
  if (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);
    state.gamePhase = 'levelup';
    events.levelUp = true;
    return events;
  }

  // Update damage numbers
  state.damageNumbers = state.damageNumbers.filter((d) => {
    d.timer -= dt;
    d.pos.y -= 30 * dt;
    return d.timer > 0;
  });

  // Cleanup projectiles
  state.projectiles = state.projectiles.filter((p) => p.lifetime > 0);

  // Cull far-away enemies (but not boss)
  state.enemies = state.enemies.filter((e) => e.type === 'boss' || dist(e.pos, player.pos) < 1200);

  return events;
}

export function applyUpgrade(state: GameState, upgradeId: string) {
  const { player } = state;
  switch (upgradeId) {
    case 'multi_nut':
      player.projectileCount++;
      player.multiNutLevel++;
      break;
    case 'orbiting_leaf':
      player.hasOrbitingLeaf = true;
      break;
    case 'coffee_bean':
      player.speed *= 1.2;
      break;
    case 'pie_crust':
      if (player.hasPieCrust) {
        player.pieCrustLevel++;
        player.pieCrustRadius += 20;
      } else {
        player.hasPieCrust = true;
        player.pieCrustLevel = 1;
      }
      break;
  }
  state.gamePhase = 'playing';
}
