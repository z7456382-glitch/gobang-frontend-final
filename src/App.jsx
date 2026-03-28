import React, { useState } from 'react';
import './App.css';

// --- 設定 ---
const BOARD_SIZE = 15;
const BACKEND_URL = "https://gobang-backend-final.onrender.com"; // 確保這是你的 Render 網址

function App() {
  // 初始化棋盤 (15x15, 0:空, 1:黑, 2:白)
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0))
  );
  const [isAiThinking, setIsAiThinking] = useState(false); // 鎖定棋盤不讓玩家亂點
  const [winner, setWinner] = useState(null);

  // 當玩家 (黑棋) 點擊棋盤
  const handleCellClick = async (row, col) => {
    if (board[row][col] !== 0 || isAiThinking || winner) return; // 鎖定或有子則不能點

    // 1. 玩家下黑棋 (1)
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    
    // 簡單的勝負判斷 (黑棋下完後)
    if (checkWin(newBoard, row, col)) {
      setWinner('🎉 恭喜！你（黑棋）贏了！');
      return;
    }

    // 2. 呼叫後端 API 問 AI (白棋) 的下一步
    setIsAiThinking(true); // 鎖定棋盤
    console.log("🤖 電腦正在思考中...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard, playerColor: 2 }) // AI 是白棋 (2)
      });

      if (!response.ok) throw new Error("API 回傳錯誤");

      const aiMove = await response.json(); // 接收 coordinates {"row": x, "col": y}

      // 3. AI 下白棋 (2)
      if (aiMove && typeof aiMove.row === 'number') {
        setTimeout(() => { // 稍微延遲一下，讓使用者感覺 AI 在思考
          const finalBoard = newBoard.map(row => [...row]);
          finalBoard[aiMove.row][aiMove.col] = 2;
          setBoard(finalBoard);

          // 簡單的勝負判斷 (白棋下完後)
          if (checkWin(finalBoard, aiMove.row, aiMove.col)) {
            setWinner('🤖 可惡！電腦（白棋）贏了！');
          }
          setIsAiThinking(false); // 解鎖棋盤
        }, 1000); // 延遲 1 秒
      } else {
        throw new Error("AI 回傳了無效的座標");
      }

    } catch (error) {
      console.error("❌ 連線 AI 失敗:", error);
      alert("AI 思考好像斷線了，請重新整理頁面。");
      setIsAiThinking(false);
    }
  };

  // --- 簡易五子棋勝負判斷邏輯 ---
  const checkWin = (currentBoard, r, c) => {
    const color = currentBoard[r][c];
    if (color === 0) return false;
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1] // 垂直, 水平, 斜右下, 斜左下
    ];
    for (const [dr, dc] of directions) {
      let count = 1;
      // 正向檢查
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      // 反向檢查
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    setWinner(null);
    setIsAiThinking(false);
  };

  // --- 渲染 UI ---
  return (
    <div className="App">
      <h1 className="text-3xl font-bold my-4">五子棋 (PVE vs Gemini AI)</h1>
      <div className="status-bar mb-4">
        {winner ? (
          <div className="text-xl font-bold text-red-600">
            {winner}
            <button onClick={resetGame} className="ml-4 px-4 py-1 bg-blue-500 text-white rounded">重新開始</button>
          </div>
        ) : (
          <p className="text-lg">我是 ⚫ 黑棋 | {isAiThinking ? '🤖 電腦正在思考中...' : '👉 請你下子'}</p>
        )}
      </div>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell ${isAiThinking ? 'locked' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell === 1 && <div className="stone black"></div>}
                {cell === 2 && <div className="stone white"></div>}
              </div>
            ))}
          </div>
        )
        )}
      </div>
    </div>
  );
}

export default App;