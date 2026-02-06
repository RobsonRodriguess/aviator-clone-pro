"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Volume2, VolumeX, History, User, Wallet, AlertCircle, Ban } from "lucide-react";

const socket = io("http://localhost:3001", { transports: ["websocket"] });

type Player = { name: string; bet: number; cashout: number | null; profit: number | null; avatar: string };

export default function AviatorGame() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'WAITING' | 'FLYING' | 'CRASHED'>('WAITING');
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  
  const [balance, setBalance] = useState(200.00); 
  // Valor visual do input, permite vazio
  const [betAmount, setBetAmount] = useState<number | ''>(10.00); 
  const [isBetting, setIsBetting] = useState(false);
  const [activeBet, setActiveBet] = useState(false);
  
  const balanceRef = useRef(balance); 
  const betAmountRef = useRef(betAmount);
  const isBettingRef = useRef(isBetting);

  const [bots, setBots] = useState<Player[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorShake, setErrorShake] = useState(false);

  const audioFly = useRef<HTMLAudioElement | null>(null);
  const audioCrash = useRef<HTMLAudioElement | null>(null);
  const audioWin = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aviator_balance');
    if (saved) setBalance(parseFloat(saved));

    if (typeof window !== "undefined") {
      audioFly.current = new Audio("/sounds/fly.mp3");
      audioFly.current.loop = true;
      audioCrash.current = new Audio("/sounds/crash.mp3");
      audioWin.current = new Audio("/sounds/win.mp3");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aviator_balance', balance.toString());
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { isBettingRef.current = isBetting; }, [isBetting]);

  const playSound = (type: 'fly' | 'crash' | 'win') => {
    if (!soundEnabled) return;
    if (type === 'fly') audioFly.current?.play().catch(() => {});
    if (type === 'crash') {
      audioFly.current?.pause();
      if (audioFly.current) audioFly.current.currentTime = 0;
      audioCrash.current?.play().catch(() => {});
    }
    if (type === 'win') audioWin.current?.play().catch(() => {});
  };

  useEffect(() => {
    socket.on("game-waiting", (data) => {
      setGameState('WAITING');
      setCountdown(data.countdown);
      setMultiplier(1.0);
      generateBots();
    });

    socket.on("game-start", () => {
      setGameState('FLYING');
      setCountdown(0);
      playSound('fly');

      // 🛑 Confirma a aposta na hora que começa
      if (isBettingRef.current) {
        const currentBet = typeof betAmountRef.current === 'number' ? betAmountRef.current : 0;
        const currentBalance = balanceRef.current;

        // ✅ Verifica se tem saldo e se a aposta é válida
        if (currentBalance >= currentBet && currentBet > 0) {
          setActiveBet(true);
          setIsBetting(false);
          setBalance(prev => {
             const newBal = prev - currentBet;
             balanceRef.current = newBal;
             return newBal;
          });
          socket.emit('place-bet', { amount: currentBet });
        } else {
          setIsBetting(false);
          triggerError();
        }
      }
    });

    socket.on("multiplier-update", (val) => {
      setMultiplier(val);
      updateBots(val);
    });

    socket.on("game-crash", (data) => {
      setGameState('CRASHED');
      setActiveBet(false);
      setHistory(prev => [data.crashPoint, ...prev].slice(0, 25));
      playSound('crash');
    });

    socket.on("bet-win", (data) => {
      setActiveBet(false);
      setBalance(prev => prev + data.winAmount);
      playSound('win');
    });

    return () => {
      socket.off("game-waiting"); socket.off("game-start");
      socket.off("multiplier-update"); socket.off("game-crash"); socket.off("bet-win");
    };
  }, [soundEnabled]);

  const triggerError = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  const handleMainButton = () => {
    const currentBet = typeof betAmount === 'number' ? betAmount : 0;

    if (gameState === 'FLYING' && activeBet) {
      socket.emit('cashout');
    } else {
      if (!isBetting) {
         // 🚫 Nada de apostar zero ou negativo
         if (currentBet <= 0) {
            triggerError();
            return;
         }
         // 🚫 Sem saldo, sem aposta
         if (currentBet > balance) {
            triggerError();
            return;
         }
      }
      setIsBetting(prev => !prev);
    }
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setBetAmount('');
        return;
    }
    setBetAmount(parseFloat(val));
  };

  const adjustBet = (amount: number) => {
    setBetAmount(prev => {
        const val = typeof prev === 'number' ? prev : 0;
        return Math.max(0, val + amount);
    });
  };

  const generateBots = () => {
    const names = ["AlphaBet", "CryptoWhale", "ElonMusk", "ToTheMoon", "CrashHunter", "LuckyLuke", "TraderJoe", "BtcKing", "EthFan"];
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"];
    const newBots = Array.from({ length: 18 }).map(() => ({
      name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 999),
      bet: Math.floor(Math.random() * 500) + 10,
      cashout: null, profit: null,
      avatar: colors[Math.floor(Math.random() * colors.length)]
    }));
    setBots(newBots);
  };

  const updateBots = (curr: number) => {
    setBots(prev => prev.map(bot => {
      if (!bot.cashout && Math.random() > 0.96) {
        return { ...bot, cashout: curr, profit: parseFloat((bot.bet * curr).toFixed(2)) };
      }
      return bot;
    }));
  };

  const getGraphData = () => {
    const width = 1200;
    const height = 600;
    const progress = Math.min((multiplier - 1) / 3, 1);
    const x = progress * width;
    const y = height - (progress * height * 0.85);
    const path = `M 0 ${height} Q ${x * 0.4} ${height} ${x} ${y}`;
    const fillPath = `${path} L ${x} ${height} L 0 ${height} Z`;
    return { path, fillPath, x, y };
  };

  const { path, fillPath, x, y } = getGraphData();

  const displayBetAmount = typeof betAmount === 'number' ? betAmount : 0;

  return (
    <div className="flex h-screen w-full bg-[#0a0b0c] text-slate-200 overflow-hidden font-sans select-none">
      
      {/* ⬅️ Sidebar Esquerda */}
      <div className="w-[400px] flex flex-col bg-[#131518] border-r border-white/5 z-20 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#131518]">
          <div className="text-2xl font-black italic tracking-tighter text-red-500 flex items-center gap-1">
             <span className="text-white not-italic font-sans font-bold bg-red-600 px-1 rounded text-lg">AV</span>
             AVIATOR
          </div>
        </div>

        <div className="p-4 bg-[#1a1d21] m-4 rounded-xl border border-white/5 shadow-inner">
           <div className="flex bg-[#0a0b0c] p-1 rounded-full mb-4 border border-white/5">
              <button className="flex-1 py-2 rounded-full bg-[#2a2e35] text-white text-xs font-bold shadow">Manual</button>
              <button className="flex-1 py-2 rounded-full text-slate-500 text-xs font-bold hover:text-white">Auto</button>
           </div>

           <div className="mb-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1 px-1">
                 <span>Valor da Aposta</span>
                 <span className={`${balance < displayBetAmount ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    Saldo: R$ {balance.toFixed(2)}
                 </span>
              </div>
              
              {/* 🔢 Input de Aposta */}
              <div className={`flex items-center gap-1 bg-[#0a0b0c] p-1 rounded-lg border relative transition-colors ${displayBetAmount <= 0 || balance < displayBetAmount ? 'border-red-500' : 'border-white/10'}`}>
                 <button onClick={() => adjustBet(-1)} className="w-10 h-10 bg-[#2a2e35] hover:bg-[#353a42] rounded-md text-white font-bold transition">-</button>
                 
                 <input 
                    type="number" 
                    value={betAmount}
                    onChange={handleBetChange}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-center text-white font-bold text-xl outline-none placeholder:text-slate-700"
                 />
                 
                 <button onClick={() => adjustBet(1)} className="w-10 h-10 bg-[#2a2e35] hover:bg-[#353a42] rounded-md text-white font-bold transition">+</button>
              </div>
              
              {/* ⚠️ Avisos de Erro */}
              {balance < displayBetAmount ? (
                 <div className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 justify-center animate-pulse">
                    <AlertCircle size={10}/> SALDO INSUFICIENTE
                 </div>
              ) : displayBetAmount <= 0 && betAmount !== '' ? (
                 <div className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 justify-center animate-pulse">
                    <Ban size={10}/> VALOR INVÁLIDO
                 </div>
              ) : null}

              <div className="grid grid-cols-4 gap-2 mt-2">
                 {[10, 20, 50, 100].map(val => (
                    <button key={val} onClick={() => setBetAmount(val)} className="bg-[#2a2e35] hover:bg-[#353a42] text-xs font-bold text-slate-400 hover:text-white py-1.5 rounded transition">
                       {val}
                    </button>
                 ))}
              </div>
           </div>

           {/* 🔘 Botão Principal */}
           <button 
              onClick={handleMainButton}
              disabled={gameState === 'CRASHED'}
              className={`
                 w-full h-24 rounded-lg text-2xl font-black uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] relative overflow-hidden group
                 ${errorShake ? 'animate-[shake_0.4s_ease-in-out] bg-red-900 border-red-900' : ''}
                 ${activeBet && gameState === 'FLYING'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black border-b-4 border-amber-700' 
                    : isBetting 
                       ? 'bg-red-500 hover:bg-red-400 text-white border-b-4 border-red-800' 
                       : 'bg-green-600 hover:bg-green-500 text-white border-b-4 border-green-800'
                 }
                 ${gameState === 'CRASHED' ? 'opacity-50 grayscale cursor-not-allowed' : ''}
              `}
           >
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                 {activeBet && gameState === 'FLYING' ? (
                    <>
                       <span className="text-xs font-bold uppercase opacity-70 mb-1">SACAR AGORA</span>
                       <span className="text-4xl drop-shadow-md">R$ {(displayBetAmount * multiplier).toFixed(2)}</span>
                    </>
                 ) : isBetting ? (
                    <>
                       <span className="text-xl">AGUARDANDO</span>
                       <span className="text-[10px] opacity-70 mt-1 font-medium">Próxima rodada...</span>
                    </>
                 ) : (
                    <>
                       <span className="text-3xl drop-shadow-lg">APOSTAR</span>
                    </>
                 )}
              </div>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"/>
           </button>
        </div>

        {/* 📜 Lista de Jogadores */}
        <div className="flex-1 flex flex-col overflow-hidden">
           <div className="px-4 py-2 bg-[#1a1d21] border-y border-white/5 flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>{bots.length} Jogadores</span>
              <span>Total: R$ {(bots.reduce((a,b)=>a+b.bet,0) + (activeBet?displayBetAmount:0)).toFixed(0)}</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {activeBet && (
                 <div className="flex justify-between items-center p-2 rounded bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-black font-bold text-xs"><User size={14}/></div>
                       <span className="text-sm font-bold text-green-400">Você</span>
                    </div>
                    <div className="text-sm text-slate-200">R$ {displayBetAmount}</div>
                    <div className="text-sm text-slate-500">-</div>
                 </div>
              )}
              {bots.map((bot, i) => (
                 <div key={i} className={`flex justify-between items-center p-2 rounded transition hover:bg-white/5 ${bot.cashout ? 'bg-green-500/5 border border-green-500/10' : ''}`}>
                    <div className="flex items-center gap-2">
                       <div className={`w-6 h-6 rounded ${bot.avatar} flex items-center justify-center text-white text-[10px] font-bold opacity-80`}>
                          {bot.name.charAt(0)}
                       </div>
                       <span className="text-xs text-slate-400 font-medium w-20 truncate">{bot.name}</span>
                    </div>
                    <div className="text-xs text-slate-300">R$ {bot.bet}</div>
                    <div className={`text-xs font-bold w-16 text-right ${bot.cashout ? 'text-green-400' : 'text-slate-600'}`}>
                       {bot.cashout ? `${bot.cashout.toFixed(2)}x` : '-'}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* ✈️ Área do Jogo */}
      <div className="flex-1 flex flex-col bg-[#0a0b0c] relative">
         <div className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-[#0a0b0c] z-10">
            <div className="flex items-center gap-2">
               <History size={16} className="text-slate-500"/>
               <div className="flex gap-2">
                  {history.map((val, i) => (
                     <div key={i} className={`px-2 py-0.5 rounded text-xs font-bold border border-white/5 ${parseFloat(val) < 2 ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'}`}>
                        {val}x
                     </div>
                  ))}
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-[#131518] px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
                  <div className="flex flex-col items-end">
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Saldo Real</span>
                     <span className="text-sm font-bold text-white font-mono">R$ {balance.toFixed(2)}</span>
                  </div>
                  <Wallet className="text-green-500" size={18}/>
               </div>
               <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#131518] hover:bg-[#2a2e35] text-slate-400 hover:text-white transition">
                  {soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
               </button>
            </div>
         </div>

         <div className="flex-1 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[#0a0b0c]">
               <div className="absolute inset-0 opacity-[0.03] bg-[size:60px_60px] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]"/>
               {gameState === 'FLYING' && (
                  <>
                     <div className="absolute inset-0 opacity-20 animate-bg-move bg-[size:100px_100px] bg-[radial-gradient(white_1px,transparent_1px)]"/>
                     <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-600/5 to-transparent transition-opacity duration-1000"/>
                  </>
               )}
            </div>

            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
               {gameState === 'WAITING' && (
                  <div className="flex flex-col items-center justify-center">
                     <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-red-500 animate-spin"/>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-red-500">{countdown.toFixed(1)}</div>
                     </div>
                     <div className="text-3xl font-black text-white uppercase italic tracking-widest">Preparando</div>
                     <div className="text-sm text-slate-500 font-bold mt-2">DECOLAGEM EM BREVE</div>
                     <div className="w-64 h-1 bg-slate-800 mt-6 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 transition-all duration-100 ease-linear" style={{ width: `${(countdown/5)*100}%` }}/>
                     </div>
                  </div>
               )}
               {gameState === 'CRASHED' && (
                  <div className="flex flex-col items-center animate-shake">
                     <div className="text-8xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] font-variant-numeric tracking-tighter">FLEW AWAY!</div>
                     <div className="mt-4 px-6 py-2 bg-red-600/20 border border-red-600/50 rounded-lg backdrop-blur text-red-400 font-mono font-bold text-2xl">{history[0]}x</div>
                  </div>
               )}
               {gameState === 'FLYING' && (
                  <div className="text-[120px] font-black text-white leading-none drop-shadow-2xl tracking-tighter tabular-nums z-20">{multiplier.toFixed(2)}x</div>
               )}
            </div>

            {gameState !== 'WAITING' && (
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1200 600" preserveAspectRatio="none">
                  <defs>
                     <linearGradient id="gradGraph" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                     </linearGradient>
                     <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                           <feMergeNode in="coloredBlur"/>
                           <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                     </filter>
                  </defs>
                  <path d={fillPath} fill="url(#gradGraph)" className="transition-all duration-75 ease-linear"/>
                  <path d={path} fill="none" stroke="#ef4444" strokeWidth="6" filter="url(#glow)" vectorEffect="non-scaling-stroke" className="transition-all duration-75 ease-linear"/>
                  {gameState === 'FLYING' && (
                     <g transform={`translate(${x}, ${y})`}>
                        <circle r="6" fill="white" className="animate-ping absolute opacity-50"/>
                        <circle r="4" fill="white"/>
                        <g transform="rotate(-15) translate(10, -10)">
                           <path d="M2 12h20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 2" className="animate-pulse"/>
                           <path d="M40 25L10 10L10 40L40 25Z" fill="#ef4444" stroke="white" strokeWidth="2" filter="url(#glow)"/>
                        </g>
                     </g>
                  )}
               </svg>
            )}
         </div>
      </div>
    </div>
  );
}