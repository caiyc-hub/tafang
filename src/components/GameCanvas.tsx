import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, 
  Missile, 
  EnemyRocket, 
  Explosion, 
  City, 
  Battery,
  RewardType 
} from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  BATTERY_POSITIONS, 
  CITY_POSITIONS, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_SPEED, 
  MISSILE_SPEED, 
  ENEMY_SPEED_MIN, 
  ENEMY_SPEED_MAX,
  WIN_SCORE,
  SCORE_PER_KILL,
  COLORS,
  REWARD_TIME,
  EXTRA_BATTERY_POSITIONS
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: () => void;
  onWin: () => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  language: 'zh' | 'en';
  onRewardTrigger: () => void;
  rewardToApply: RewardType | null;
  onRewardApplied: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  onWin, 
  score, 
  setScore,
  language,
  onRewardTrigger,
  rewardToApply,
  onRewardApplied
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game Entities
  const missilesRef = useRef<Missile[]>([]);
  const enemiesRef = useRef<EnemyRocket[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const citiesRef = useRef<City[]>(
    CITY_POSITIONS.map((pos, i) => ({ ...pos, id: `city-${i}`, alive: true }))
  );
  const batteriesRef = useRef<Battery[]>(
    BATTERY_POSITIONS.map((pos, i) => ({ ...pos, id: `battery-${i}`, alive: true, ammo: pos.maxAmmo, maxAmmo: pos.maxAmmo }))
  );

  const [ammoStatus, setAmmoStatus] = useState<number[]>(BATTERY_POSITIONS.map(b => b.maxAmmo));
  const timeElapsedRef = useRef<number>(0);
  const rewardTriggeredRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);

  const prevGameStateRef = useRef<GameState>(gameState);

  // Explicit reset function called from App
  const resetGame = useCallback(() => {
    missilesRef.current = [];
    enemiesRef.current = [];
    explosionsRef.current = [];
    citiesRef.current = CITY_POSITIONS.map((pos, i) => ({ ...pos, id: `city-${i}`, alive: true }));
    const initialBatteries = BATTERY_POSITIONS.map((pos, i) => ({ ...pos, id: `battery-${i}`, alive: true, ammo: pos.maxAmmo, maxAmmo: pos.maxAmmo }));
    batteriesRef.current = initialBatteries;
    setScore(0);
    setAmmoStatus(initialBatteries.map(b => b.ammo));
    timeElapsedRef.current = 0;
    rewardTriggeredRef.current = false;
    lastTimeRef.current = performance.now();
  }, [setScore]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameStateRef.current !== GameState.REWARD) {
      resetGame();
    }
    prevGameStateRef.current = gameState;
  }, [gameState, resetGame]);

  // Handle Reward Application
  useEffect(() => {
    if (rewardToApply) {
      if (rewardToApply === RewardType.ADD_BATTERY) {
        // Find an extra position not already used
        const currentPositions = batteriesRef.current.map(b => ({ x: b.x, y: b.y }));
        const nextPos = EXTRA_BATTERY_POSITIONS.find(p => !currentPositions.some(cp => cp.x === p.x));
        if (nextPos) {
          batteriesRef.current.push({
            ...nextPos,
            id: `battery-extra-${batteriesRef.current.length}`,
            alive: true,
            ammo: nextPos.maxAmmo,
            maxAmmo: nextPos.maxAmmo
          });
        }
      } else if (rewardToApply === RewardType.INCREASE_AMMO) {
        // Increase ammo for all alive batteries
        batteriesRef.current.forEach(b => {
          if (b.alive) {
            b.maxAmmo += 20;
            b.ammo += 20;
          }
        });
      } else if (rewardToApply === RewardType.BOMB) {
        // Trigger 3 random bombs
        for (let i = 0; i < 3; i++) {
          explosionsRef.current.push({
            id: `bomb-${Math.random()}`,
            x: 100 + Math.random() * (GAME_WIDTH - 200),
            y: 100 + Math.random() * (GAME_HEIGHT - 300),
            radius: 5,
            maxRadius: EXPLOSION_MAX_RADIUS * 3,
            expanding: true
          });
        }
      }
      setAmmoStatus([...batteriesRef.current.map(b => b.ammo)]);
      onRewardApplied();
    }
  }, [rewardToApply, onRewardApplied]);

  const spawnEnemy = useCallback(() => {
    const startX = Math.random() * GAME_WIDTH;
    const startY = 0;
    
    // Target either a city or a battery
    const targets = [...citiesRef.current.filter(c => c.alive), ...batteriesRef.current.filter(b => b.alive)];
    if (targets.length === 0) return;
    
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    const newEnemy: EnemyRocket = {
      id: Math.random().toString(36).substr(2, 9),
      x: startX,
      y: startY,
      startX,
      startY,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      speed: ENEMY_SPEED_MIN + Math.random() * (ENEMY_SPEED_MAX - ENEMY_SPEED_MIN)
    };
    
    enemiesRef.current.push(newEnemy);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    // Find closest battery with ammo
    let bestBatteryIdx = -1;
    let minDistance = Infinity;

    batteriesRef.current.forEach((battery, idx) => {
      if (battery.alive && battery.ammo > 0) {
        const dist = Math.abs(battery.x - targetX);
        if (dist < minDistance) {
          minDistance = dist;
          bestBatteryIdx = idx;
        }
      }
    });

    if (bestBatteryIdx !== -1) {
      const battery = batteriesRef.current[bestBatteryIdx];
      battery.ammo--;
      setAmmoStatus([...batteriesRef.current.map(b => b.ammo)]);

      const newMissile: Missile = {
        id: Math.random().toString(36).substr(2, 9),
        startX: battery.x,
        startY: battery.y,
        x: battery.x,
        y: battery.y,
        targetX,
        targetY,
        progress: 0,
        speed: MISSILE_SPEED,
        batteryIndex: bestBatteryIdx
      };
      missilesRef.current.push(newMissile);
    }
  };

  const update = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING) {
      lastTimeRef.current = time;
      draw();
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    timeElapsedRef.current += deltaTime;

    // Check Reward Trigger - Only if at least one battery is alive
    if (timeElapsedRef.current >= REWARD_TIME) {
      const anyBatteryAlive = batteriesRef.current.some(b => b.alive);
      if (anyBatteryAlive) {
        timeElapsedRef.current -= REWARD_TIME;
        onRewardTrigger();
        return;
      }
    }

    // Spawn enemies
    if (Math.random() < 0.02) {
      spawnEnemy();
    }

    // Update Missiles
    missilesRef.current = missilesRef.current.filter(m => {
      m.progress += m.speed;
      m.x = m.startX + (m.targetX - m.startX) * m.progress;
      m.y = m.startY + (m.targetY - m.startY) * m.progress;
      
      if (m.progress >= 1) {
        // Create explosion
        explosionsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: m.targetX,
          y: m.targetY,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          expanding: true
        });
        return false;
      }
      return true;
    });

    // Update Explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      if (exp.expanding) {
        exp.radius += EXPLOSION_SPEED;
        if (exp.radius >= exp.maxRadius) {
          exp.expanding = false;
        }
      } else {
        exp.radius -= EXPLOSION_SPEED;
      }
      return exp.radius > 0;
    });

    // Update Enemies
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      enemy.progress += enemy.speed;
      enemy.x = enemy.startX + (enemy.targetX - enemy.startX) * enemy.progress;
      enemy.y = enemy.startY + (enemy.targetY - enemy.startY) * enemy.progress;

      // Check collision with explosions
      const hitByExplosion = explosionsRef.current.some(exp => {
        const dx = enemy.x - exp.x;
        const dy = enemy.y - exp.y;
        return Math.sqrt(dx * dx + dy * dy) < exp.radius;
      });

      if (hitByExplosion) {
        setScore(prev => {
          const newScore = prev + SCORE_PER_KILL;
          if (newScore >= WIN_SCORE) {
            onWin();
          }
          return newScore;
        });
        return false;
      }

      // Check if reached target
      if (enemy.progress >= 1) {
        // Damage city or battery
        citiesRef.current.forEach(city => {
          if (city.alive && Math.abs(city.x - enemy.x) < 20 && Math.abs(city.y - enemy.y) < 20) {
            city.alive = false;
          }
        });
        batteriesRef.current.forEach(battery => {
          if (battery.alive && Math.abs(battery.x - enemy.x) < 20 && Math.abs(battery.y - enemy.y) < 20) {
            battery.alive = false;
            setAmmoStatus([...batteriesRef.current.map(b => b.ammo)]);
          }
        });

        // Check lose condition
        const anyBatteryAlive = batteriesRef.current.some(b => b.alive);
        if (!anyBatteryAlive) {
          onGameOver();
        }

        return false;
      }
      return true;
    });

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onGameOver, onWin, setScore, spawnEnemy]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Neon Background Shapes
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    // Grid with perspective feel (simulated)
    for (let i = 0; i <= GAME_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= GAME_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(GAME_WIDTH, i);
      ctx.stroke();
    }

    // Decorative Tech Circles
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 210, 0, Math.PI * 2);
    ctx.setLineDash([20, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Ground
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 550, GAME_WIDTH, 50);
    
    // Ground Neon Line
    const groundGradient = ctx.createLinearGradient(0, 550, GAME_WIDTH, 550);
    groundGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    groundGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
    groundGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.strokeStyle = groundGradient;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0ff';
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.lineTo(GAME_WIDTH, 550);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Cities
    citiesRef.current.forEach(city => {
      if (city.alive) {
        ctx.fillStyle = COLORS.CITY;
        ctx.fillRect(city.x - 15, city.y - 10, 30, 10);
        ctx.fillRect(city.x - 10, city.y - 20, 20, 10);
      }
    });

    // Draw Batteries
    batteriesRef.current.forEach(battery => {
      if (battery.alive) {
        // Battery Base
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = COLORS.BATTERY;
        ctx.lineWidth = 2;
        ctx.fillRect(battery.x - 20, battery.y - 15, 40, 15);
        ctx.strokeRect(battery.x - 20, battery.y - 15, 40, 15);
        
        // Turret
        ctx.fillStyle = COLORS.BATTERY;
        ctx.fillRect(battery.x - 8, battery.y - 25, 16, 10);
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.BATTERY;
        ctx.strokeRect(battery.x - 8, battery.y - 25, 16, 10);
        ctx.shadowBlur = 0;
        
        // Ammo text
        ctx.fillStyle = COLORS.TEXT;
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(battery.ammo.toString(), battery.x, battery.y + 15);
      }
    });

    // Draw Enemies
    enemiesRef.current.forEach(enemy => {
      // Trail
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.startX, enemy.startY);
      ctx.lineTo(enemy.x, enemy.y);
      ctx.stroke();
      
      // Rocket Body (Diamond shape)
      ctx.fillStyle = COLORS.ENEMY;
      ctx.shadowBlur = 12;
      ctx.shadowColor = COLORS.ENEMY;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 8);
      ctx.lineTo(enemy.x + 6, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + 8);
      ctx.lineTo(enemy.x - 6, enemy.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Missiles
    missilesRef.current.forEach(missile => {
      // Glowing Trail
      const trailGradient = ctx.createLinearGradient(missile.startX, missile.startY, missile.x, missile.y);
      trailGradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
      trailGradient.addColorStop(1, 'rgba(0, 255, 0, 0.6)');
      
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(missile.startX, missile.startY);
      ctx.lineTo(missile.x, missile.y);
      ctx.stroke();
      
      // Missile Head
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0f0';
      ctx.beginPath();
      ctx.arc(missile.x, missile.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Target X (Tech Reticle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(missile.targetX, missile.targetY, 6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(missile.targetX - 8, missile.targetY);
      ctx.lineTo(missile.targetX + 8, missile.targetY);
      ctx.moveTo(missile.targetX, missile.targetY - 8);
      ctx.lineTo(missile.targetX, missile.targetY + 8);
      ctx.stroke();
    });

    // Draw Explosions
    explosionsRef.current.forEach(exp => {
      const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.5, '#ff0');
      gradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="w-full h-full object-contain"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
        <div className="text-xl font-bold font-mono text-white">
          {language === 'zh' ? '得分: ' : 'SCORE: '}
          <span className="text-green-400">{score}</span>
        </div>
        <div className="text-sm font-mono text-gray-400">
          {language === 'zh' ? '目标: ' : 'GOAL: '} {WIN_SCORE}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-none">
        {ammoStatus.map((ammo, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mb-1 ${batteriesRef.current[i].alive ? 'bg-orange-500' : 'bg-red-900'}`} />
            <div className="text-xs font-mono text-white">{ammo}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameCanvas;
