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
  multiNutLevel: number;
  hasOrbitingLeaf: boolean;
  leafAngle: number;
  leafLevel: number;
  hasPieCrust: boolean;
  pieCrustLevel: number;
  pieCrustRadius: number;
  pieCrustDamage: number;
  invincibleTimer: number;
}

export type EnemyType = 'bug' | 'rat' | 'snake' | 'boss';

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

export type PickupType = 'xp' | 'health_pie' | 'timer_extension' | 'boss_durian';

export interface Pickup extends Entity {
  type: PickupType;
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
  { id: 'multi_nut', name: 'Multi-Nut', description: 'Throw +1 projectile & faster fire', icon: '🌰' },
  { id: 'orbiting_leaf', name: 'Orbiting Leaf', description: 'Shield that damages enemies', icon: '🍃' },
  { id: 'coffee_bean', name: 'Coffee Bean', description: '+20% Movement Speed', icon: '☕' },
  { id: 'pie_crust', name: 'Pie Crust', description: 'Damages nearby enemies & attracts drops', icon: '🥧' },
];

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  damageNumbers: DamageNumber[];
  camera: Vec2;
  timeRemaining: number;
  killCount: number;
  gamePhase: 'menu' | 'playing' | 'levelup' | 'gameover' | 'victory';
  shootTimer: number;
  spawnTimer: number;
  lastTime: number;
  bossSpawned: boolean;
  bossKills: number;
  nextBossAt: number;
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
      multiNutLevel: 0,
      hasOrbitingLeaf: false,
      leafAngle: 0,
      leafLevel: 0,
      hasPieCrust: false,
      pieCrustLevel: 0,
      pieCrustRadius: 80,
      pieCrustDamage: 15,
      invincibleTimer: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    damageNumbers: [],
    camera: { x: 0, y: 0 },
    timeRemaining: 180,
    killCount: 0,
    gamePhase: 'menu',
    shootTimer: 0,
    spawnTimer: 0,
    lastTime: 0,
    bossSpawned: false,
    bossKills: 0,
    nextBossAt: 100,
  };
}
