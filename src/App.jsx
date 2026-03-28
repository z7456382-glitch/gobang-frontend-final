import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

// 🔗 已經換成你的雲端 Render 網址！
const socket = io('https://gobang-server.onrender.com');
const STONE_SOUND = '/stone.mp3';

function App() {
  const [board, setBoard] = useState(Array(225).fill(null));
  const [isBlackNext, setIsBlackNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [myRole, setMyRole] = useState(null); 
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on('player-info', (data) => {
      setMyRole(data.role);
      setIsHost(data.isHost);
      setGameStarted(data.gameStarted);
    });

    socket.on('game-start-broadcast', () => {
      setGameStarted(true);
    });

    socket.on('receive-move', ({ index, color }) => {
      executeMove(index, color);
    });

    socket.on('game-reset-broadcast', () => {
      setBoard(Array(225).fill(null));
      setIsBlackNext(true);
      setWinner(null);
      setGameStarted(false);
    });

    return () => {
      socket.off('player-info');
      socket.off('game-start-broadcast');
      socket.off('receive-move');
      socket.off('game-reset-broadcast');
    };
  }, [board]);

  const executeMove = (i, color) => {
    if (board[i] || winner) return;
    const audio = new Audio(STONE_SOUND);
    audio.play().catch(() => {});

    const newBoard = [...board];
    newBoard[i] = color;
    setBoard(newBoard);

    const result = checkWinner(newBoard, i);
    if (result) {
      setWinner(result);
    } else {
      setIsBlackNext(color === 'B' ? false : true);
    }
  };

  const handleClick = (i) => {
    if (!gameStarted || board[i] || winner) return;
    const currentTurnColor = isBlackNext ? 'B' : 'W';
    if (myRole === currentTurnColor) {
      socket.emit('send-move', { index: i, color: myRole });
    }
  };

  const handleStartGame = () => socket.emit('start-game-request');
  const handleResetGame = () => socket.emit('reset-game-request');

  const checkWinner = (squares, lastIndex) => {
    const size = 15;
    const x = lastIndex % size;
    const y = Math.floor(lastIndex / size);
    const color = squares[lastIndex];
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let [dx, dy] of directions) {
      let count = 1;
      [[dx, dy], [-dx, -dy]].forEach(([stepX, stepY]) => {
        for (let i = 1; i < 5; i++) {
          const nx = x + stepX * i; const ny = y + stepY * i;
          const idx = ny * size + nx;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && squares[idx] === color) count++;
          else break;
        }
      });
      if (count >= 5) return color;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#ecebe4] p-4 select-none font-sans">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-[#2c2c2c] mb-2 tracking-tighter">GOBANG ONLINE</h1>
        <div className="flex gap-4 bg-white/80 px-6 py-2 rounded-full shadow-md items-center">
          <span className="font-bold text-sm">
            角色: {myRole === 'B' ? '⚫ 黑棋' : myRole === 'W' ? '⚪ 白棋' : '連線中...'} 
            {isHost && <span className="ml-2 text-red-500">[房主]</span>}
          </span>
          <div className="w-[2px] h-4 bg-gray-300"></div>
          <span className="text-sm font-medium">
             狀態: {!gameStarted ? '等待開局' : winner ? '對局結束' : `回合: ${isBlackNext ? '黑' : '白'}`}
          </span>
        </div>
      </div>

      <div className="relative bg-[#eecfa1] shadow-2xl border-[12px] border-[#a67c52]" style={{ width: '600px', height: '600px' }}>
        <div className="absolute inset-0 grid grid-cols-14 grid-rows-14 pointer-events-none" style={{ padding: '20px' }}>
          {Array(196).fill(null).map((_, i) => (
            <div key={i} className="border-t border-l border-[#8b6b4a]/60"></div>
          ))}
          <div className="absolute top-[20px] bottom-[20px] right-[20px] border-r border-[#8b6b4a]/60"></div>
          <div className="absolute left-[20px] right-[20px] bottom-[20px] border-b border-[#8b6b4a]/60"></div>
        </div>

        <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 z-10">
          {board.map((cell, i) => (
            <div key={i} onClick={() => handleClick(i)} className="relative flex items-center justify-center cursor-pointer group">
              {cell && (
                <div className={`absolute w-[80%] h-[80%] rounded-full shadow-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${cell === 'B' ? 'bg-[#1a1a1a]' : 'bg-[#f8f8f8] border border-gray-300'}`} />
              )}
              {!cell && !winner && gameStarted && myRole !== 'spectator' && (
                <div className="absolute w-2 h-2 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
        
        {!gameStarted && (
          <div className="absolute inset-0 z-20 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
             {isHost ? (
               <button onClick={handleStartGame} className="px-10 py-4 bg-[#2c2c2c] text-white text-xl font-bold rounded-full shadow-2xl hover:bg-black transition-all">
                 開始遊戲
               </button>
             ) : (
               <div className="bg-white/90 px-6 py-3 rounded-lg font-bold shadow-lg">等待房主開始...</div>
             )}
          </div>
        )}
      </div>

      {winner && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="text-2xl font-black text-[#2c2c2c]">🎉 {winner === 'B' ? '黑棋' : '白棋'} 獲勝！</div>
          {isHost && (
            <button onClick={handleResetGame} className="px-8 py-2 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-all">
              房主重置遊戲
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;