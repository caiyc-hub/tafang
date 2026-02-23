/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Rocket, Trophy, RefreshCw, Globe, Plus, Zap, Bomb } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameState, RewardType } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [rewardToApply, setRewardToApply] = useState<RewardType | null>(null);
  const [rewardReady, setRewardReady] = useState(false);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const handleRewardTrigger = () => {
    setGameState(GameState.REWARD);
    setRewardReady(false);
    setTimeout(() => setRewardReady(true), 1000); // 1 second delay
  };

  const t = {
    title: language === 'zh' ? 'Tina新星防御' : 'Tina Nova Defense',
    start: language === 'zh' ? '开始游戏' : 'START GAME',
    gameOver: language === 'zh' ? '城市沦陷' : 'CITIES FALLEN',
    win: language === 'zh' ? '防御成功' : 'DEFENSE SUCCESS',
    score: language === 'zh' ? '最终得分' : 'FINAL SCORE',
    retry: language === 'zh' ? '再玩一次' : 'PLAY AGAIN',
    instructions: language === 'zh' 
      ? '点击屏幕发射拦截导弹。保护底部的城市和炮台。' 
      : 'Click screen to fire interceptors. Protect cities and batteries at the bottom.',
    preAim: language === 'zh'
      ? '提示：预判敌方火箭的飞行路径进行拦截！'
      : 'Tip: Predict enemy rocket paths to intercept!',
    rewardTitle: language === 'zh' ? '选择你的奖励' : 'CHOOSE YOUR REWARD',
    rewardAddBattery: language === 'zh' ? '增加炮台' : 'ADD BATTERY',
    rewardIncreaseAmmo: language === 'zh' ? '增加弹药' : 'INCREASE AMMO',
    rewardBomb: language === 'zh' ? '投放炸弹' : 'DROP BOMBS',
  };

  const handleRewardSelect = (type: RewardType) => {
    setRewardToApply(type);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
      <div className="game-container relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="scanline" />
        <GameCanvas 
          gameState={gameState}
          onGameOver={() => setGameState(GameState.GAME_OVER)}
          onWin={() => setGameState(GameState.WIN)}
          score={score}
          setScore={setScore}
          language={language}
          onRewardTrigger={handleRewardTrigger}
          rewardToApply={rewardToApply}
          onRewardApplied={() => setRewardToApply(null)}
        />

        <AnimatePresence>
          {gameState === GameState.START && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="mb-8"
              >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-2 italic">
                  {t.title}
                </h1>
                <div className="h-1 w-24 bg-green-500 mx-auto rounded-full" />
              </motion.div>

              <p className="text-gray-400 max-w-md mb-8 text-lg">
                {t.instructions}
              </p>

              <button 
                onClick={() => setGameState(GameState.PLAYING)}
                className="group relative px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:bg-green-400 transition-all duration-300 flex items-center gap-2 overflow-hidden"
              >
                <Shield className="w-6 h-6" />
                {t.start}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>

              <div className="mt-12 text-xs font-mono text-gray-500 uppercase tracking-widest">
                {t.preAim}
              </div>
            </motion.div>
          )}

          {gameState === GameState.REWARD && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
              className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center text-center p-6"
            >
              <h2 className="text-4xl font-bold text-white mb-8 tracking-tight italic">
                {t.rewardTitle}
              </h2>
              
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl transition-opacity duration-500 ${rewardReady ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <button 
                  onClick={() => rewardReady && handleRewardSelect(RewardType.ADD_BATTERY)}
                  className="flex flex-col items-center gap-4 p-6 bg-white/10 hover:bg-green-500/20 border border-white/10 hover:border-green-500/50 rounded-2xl transition-all group"
                >
                  <Plus className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white">{t.rewardAddBattery}</span>
                </button>

                <button 
                  onClick={() => rewardReady && handleRewardSelect(RewardType.INCREASE_AMMO)}
                  className="flex flex-col items-center gap-4 p-6 bg-white/10 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all group"
                >
                  <Zap className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white">{t.rewardIncreaseAmmo}</span>
                </button>

                <button 
                  onClick={() => rewardReady && handleRewardSelect(RewardType.BOMB)}
                  className="flex flex-col items-center gap-4 p-6 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-2xl transition-all group"
                >
                  <Bomb className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white">{t.rewardBomb}</span>
                </button>
              </div>
            </motion.div>
          )}

          {(gameState === GameState.GAME_OVER || gameState === GameState.WIN) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
            >
              <div className="mb-6">
                {gameState === GameState.WIN ? (
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                ) : (
                  <Rocket className="w-20 h-20 text-red-500 mx-auto mb-4 animate-bounce" />
                )}
                <h2 className={`text-5xl font-bold mb-2 ${gameState === GameState.WIN ? 'text-yellow-400' : 'text-red-500'}`}>
                  {gameState === GameState.WIN ? t.win : t.gameOver}
                </h2>
              </div>

              <div className="mb-8">
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">{t.score}</p>
                <p className="text-6xl font-mono font-bold text-white">{score}</p>
              </div>

              <button 
                onClick={() => setGameState(GameState.PLAYING)}
                className="px-8 py-4 bg-green-500 text-black font-bold text-xl rounded-full hover:bg-green-400 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-6 h-6" />
                {t.retry}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="absolute top-4 right-4 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center gap-2 text-xs font-bold"
        >
          <Globe className="w-4 h-4" />
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
    </div>
  );
}
