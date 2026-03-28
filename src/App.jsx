import React, { useState } from 'react';

const BOARD_SIZE = 15;
const BACKEND_URL = "https://gobang-backend-final.onrender.com"; 

function App() {
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winner, setWinner] = useState(null);

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

  const handleCellClick = async (row, col) => {
    if (board[row][col] !== 0 || isAiThinking || winner) return;
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    if (checkWin(newBoard, row, col)) { setWinner('🎉 你贏了！'); return; }

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
          if (checkWin(finalBoard, aiMove.row, aiMove.col)) setWinner('🤖 AI 贏了！');
          setIsAiThinking(false);
        }, 600);
      }
    } catch (e) { setIsAiThinking(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">GOBANG ONLINE</h1>
      
      <div className="mb-6 px-6 py-2 bg-white rounded-full shadow-md text-lg">
        {winner ? (
          <div className="flex items-center gap-4">
            <span className="font-bold text-red-600">{winner}</span>
            <button onClick={() => {setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0))); setWinner(null);}} className="text-sm bg-blue-500 text-white px-3 py-1 rounded">重開</button>
          </div>
        ) : (
          <span>{isAiThinking ? '🤖 AI 思考中...' : '🟢 輪到你下子'}</span>
        )}
      </div>

      {/* 棋盤外框 (深木色) */}
      <div className="p-3 bg-[#8d6e63] rounded-lg shadow-2xl">
        <div className="bg-[#f3e5ab] border border-[#a1887f] inline-block">
          {board.map((row, rIdx) => (
            <div key={rIdx} className="flex">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer"
                >
                  {/* 水平線 */}
                  <div className="absolute w-full h-[1px] bg-[#a1887f] z-0"></div>
                  {/* 垂直線 */}
                  <div className="absolute h-full w-[1px] bg-[#a1887f] z-0"></div>
                  
                  {/* 棋子 */}
                  {cell !== 0 && (
                    <div className={`
                      w-7 h-7 sm:w-9 sm:h-9 rounded-full z-10 shadow-lg
                      ${cell === 1 
                        ? 'bg-gradient-to-br from-gray-700 to-black' 
                        : 'bg-gradient-to-br from-white to-gray-200 border border-gray-300'}
                    `}></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;