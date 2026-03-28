import React, { useState } from 'react';

// --- 基礎設定 ---
const BOARD_SIZE = 15;
// 請確保這是你的 Render 後端正式網址
const BACKEND_URL = "https://gobang-backend-final.onrender.com"; 

function App() {
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0))
  );
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winner, setWinner] = useState(null);

  // --- 1. 勝負判斷邏輯 ---
  const checkWin = (currentBoard, r, c) => {
    const color = currentBoard[r][c];
    if (color === 0) return false;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  // --- 2. 玩家點擊處理 ---
  const handleCellClick = async (row, col) => {
    if (board[row][col] !== 0 || isAiThinking || winner) return;

    // A. 玩家下黑棋 (1)
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    
    if (checkWin(newBoard, row, col)) {
      setWinner('🎉 恭喜！你贏了！');
      
      // 【進化關鍵】玩家贏了，發送報告給後端資料庫讓 AI 學習
      fetch(`${BACKEND_URL}/api/report-defeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lastMoves: `對手在 [${row}, ${col}] 連成五子擊敗了你。你當時沒能擋住對手的連線！` 
        })
      });
      return;
    }

    // B. 呼叫 AI (白棋 2)
    setIsAiThinking(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard, playerColor: 2 })
      });

      const aiMove = await response.json();

      if (aiMove && typeof aiMove.row === 'number') {
        setTimeout(() => {
          const finalBoard = newBoard.map(r => [...r]);
          finalBoard[aiMove.row][aiMove.col] = 2;
          setBoard(finalBoard);

          if (checkWin(finalBoard, aiMove.row, aiMove.col)) {
            setWinner('🤖 哼！這次是 AI 贏了！');
          }
          setIsAiThinking(false);
        }, 500);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setIsAiThinking(false);
    }
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    setWinner(null);
    setIsAiThinking(false);
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-black mb-6 text-slate-800 tracking-widest">GOBANG MASTER AI</h1>
      
      {/* 狀態欄 */}
      <div className="mb-6 px-8 py-3 bg-white rounded-2xl shadow-xl flex items-center gap-6">
        {winner ? (
          <div className="flex items-center gap-4 animate-bounce">
            <span className="font-bold text-red-500 text-xl">{winner}</span>
            <button 
              onClick={resetGame} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-lg text-sm transition-colors"
            >
              再挑戰一次
            </button>
          </div>
        ) : (
          <div className="text-slate-600 font-medium">
            {isAiThinking ? (
              <span className="flex items-center gap-2 text-indigo-600">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                AI 正在讀取歷史教訓並思考中...
              </span>
            ) : (
              "🟢 輪到你了，請下子"
            )}
          </div>
        )}
      </div>

      {/* 棋盤容器 (深色木框) */}
      <div className="p-4 bg-[#795548] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="bg-[#f3e5ab] border border-[#d7ccc8] inline-block shadow-inner">
          {board.map((row, rIdx) => (
            <div key={rIdx} className="flex">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer group"
                >
                  {/* 水平十字線 */}
                  <div className="absolute w-full h-[1px] bg-[#a1887f] opacity-60"></div>
                  {/* 垂直十字線 */}
                  <div className="absolute h-full w-[1px] bg-[#a1887f] opacity-60"></div>
                  
                  {/* 棋子 */}
                  {cell !== 0 && (
                    <div className={`
                      w-7 h-7 sm:w-9 sm:h-9 rounded-full z-10 shadow-lg transform transition-transform scale-110
                      ${cell === 1 
                        ? 'bg-gradient-to-br from-zinc-700 to-black' 
                        : 'bg-gradient-to-br from-white to-zinc-300 border border-zinc-400'}
                    `}></div>
                  )}

                  {/* 懸停預覽 */}
                  {!winner && cell === 0 && !isAiThinking && (
                    <div className="w-4 h-4 rounded-full bg-black opacity-0 group-hover:opacity-10 z-0"></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-slate-400 text-xs text-center leading-relaxed">
        AI 進化模式：已開啟<br/>
        敗北數據會存入 MongoDB，每局結束後 AI 都會變得更難纏。
      </div>
    </div>
  );
}

export default App;