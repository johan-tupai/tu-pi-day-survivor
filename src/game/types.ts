export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vec2;
  radius: number;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  xp: number;
  xpToNext: number;
  level: number;
  projectileCount: number;
  hasOrbitingLeaf: boolean;
  leafAngle: number;
  hasGarlicAura: boolean;
  garlicRadius: number;
  garlicDamage: number;
  invincibleTimer: number;
}

export type EnemyType = 'bug' | 'rat' | 'snake';

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: EnemyType;
  xpValue: number;
}

export interface Projectile extends Entity {
  vel: Vec2;
  damage: number;
  lifetime: number;
}

export interface XpNut extends Entity {
  value: number;
  lifetime: number;
}

export interface DamageNumber {
  pos: Vec2;
  value: number;
  timer: number;
  color: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const UPGRADES: Upgrade[] = [
  { id: 'multi_nut', name: 'Multi-Nut', description: 'Throw +1 projectile', icon: '🌰' },
  { id: 'orbiting_leaf', name: 'Orbiting Leaf', description: 'Shield that damages enemies', icon: '🍃' },
  { id: 'coffee_bean', name: 'Coffee Bean', description: '+20% Movement Speed', icon: '☕' },
  { id: 'garlic_aura', name: 'Garlic Aura', description: 'Damages nearby enemies', icon: '🧄' },
];

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  xpNuts: XpNut[];
  damageNumbers: DamageNumber[];
  camera: Vec2;
  timeRemaining: number;
  killCount: number;
  gamePhase: 'menu' | 'playing' | 'levelup' | 'gameover' | 'victory';
  shootTimer: number;
  spawnTimer: number;
  lastTime: number;
}

export function createInitialState(): GameState {
  return {
    player: {
      pos: { x: 0, y: 0 },
      radius: 18,
      hp: 100,
      maxHp: 100,
      speed: 150,
      xp: 0,
      xpToNext: 20,
      level: 1,
      projectileCount: 1,
      hasOrbitingLeaf: false,
      leafAngle: 0,
      hasGarlicAura: false,
      garlicRadius: 80,
      garlicDamage: 15,
      invincibleTimer: 0,
    },
    enemies: [],
    projectiles: [],
    xpNuts: [],
    damageNumbers: [],
    camera: { x: 0, y: 0 },
    timeRemaining: 180,
    killCount: 0,
    gamePhase: 'menu',
    shootTimer: 0,
    spawnTimer: 0,
    lastTime: 0,
  };
}
