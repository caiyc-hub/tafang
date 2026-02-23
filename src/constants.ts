export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const BATTERY_POSITIONS = [
  { x: 80, y: 560, maxAmmo: 20 },
  { x: 400, y: 560, maxAmmo: 40 },
  { x: 720, y: 560, maxAmmo: 20 },
];

export const CITY_POSITIONS = [
  { x: 180, y: 570 },
  { x: 260, y: 570 },
  { x: 340, y: 570 },
  { x: 460, y: 570 },
  { x: 540, y: 570 },
  { x: 620, y: 570 },
];

export const EXPLOSION_MAX_RADIUS = 40;
export const EXPLOSION_SPEED = 1.5;
export const MISSILE_SPEED = 0.02;
export const ENEMY_SPEED_MIN = 0.0005;
export const ENEMY_SPEED_MAX = 0.0015;

export const REWARD_TIME = 20; // seconds
export const WIN_SCORE = 1000;

export const EXTRA_BATTERY_POSITIONS = [
  { x: 240, y: 560, maxAmmo: 30 },
  { x: 560, y: 560, maxAmmo: 30 },
];
export const SCORE_PER_KILL = 20;

export const COLORS = {
  BACKGROUND: '#0a0a0a',
  MISSILE: '#00ff00',
  ENEMY: '#ff4444',
  EXPLOSION: '#ffffff',
  CITY: '#4488ff',
  BATTERY: '#ffaa00',
  TEXT: '#ffffff',
};
