export enum GameState {
  START,
  PLAYING,
  REWARD,
  GAME_OVER,
  WIN
}

export enum RewardType {
  ADD_BATTERY = 'ADD_BATTERY',
  INCREASE_AMMO = 'INCREASE_AMMO',
  BOMB = 'BOMB'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface Missile extends Entity {
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  progress: number; // 0 to 1
  speed: number;
  batteryIndex: number;
}

export interface EnemyRocket extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  expanding: boolean;
}

export interface City extends Entity {
  alive: boolean;
}

export interface Battery extends Entity {
  alive: boolean;
  ammo: number;
  maxAmmo: number;
}
