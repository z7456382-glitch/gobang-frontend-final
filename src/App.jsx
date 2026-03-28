import React, { useState } from 'react';
import './App.css';

// --- 基礎設定 ---
const BOARD_SIZE = 15;
// 請確保這是你的 Render 後端正式網址
const BACKEND_URL = "https://gobang-backend-final.onrender.com"; 

function App() {
  // 1. 初始化棋盤 (15x15 矩陣, 0:空, 1:黑, 2:白)
  const [board, setBoard] = useState(
    Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0))
  );
  const [isAiThinking, setIsAiThinking] = useState(false); // 鎖定棋盤防止連點
  const [winner, setWinner] = useState(null);

  // --- 2. 勝負判斷邏輯 ---
  const checkWin = (currentBoard, r, c) => {
    const color = currentBoard[r][c];
    if (color === 0) return false;
    
    const directions = [
      [0, 1],  // 水平
      [1, 0],  // 垂直
      [1, 1],  // 斜右下
      [1, -1]  // 斜左下
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // 正向延伸
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      // 反向延伸
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && currentBoard[nr][nc] === color) count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  // --- 3. 玩家點擊處理 ---
  const handleCellClick = async (row, col) => {
    // 如果位置已有棋子、AI 正在思考、或已有人獲勝，則不執行
    if (board[row][col] !== 0 || isAiThinking || winner) return;

    // A. 玩家下黑棋 (1)
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);
    
    if (checkWin(newBoard, row, col)) {
      setWinner('🎉 恭喜！你贏了！');
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

      if (!response.ok) throw new Error("AI 伺服器連線失敗");

      const aiMove = await response.json();

      // C. AI 下白棋
      if (aiMove && typeof aiMove.row === 'number') {
        // 稍微延遲 600ms，讓 AI 看起來像在思考，視覺較自然
        setTimeout(() => {
          const finalBoard = newBoard.map(r => [...r]);
          finalBoard[aiMove.row][aiMove.col] = 2;
          setBoard(finalBoard);

          if (checkWin(finalBoard, aiMove.row, aiMove.col)) {
            setWinner('🤖 可惡！AI 贏了！');
          }
          setIsAiThinking(false);
        }, 600);
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("AI 思考好像斷線了，請確認後端是否正常運作。");
      setIsAiThinking(false);
    }
  };

  // 重新開始遊戲
  const resetGame = () => {
    setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    setWinner(null);
    setIsAiThinking(false);
  };

  // --- 4. 畫面渲染 ---
  return (
    <div className="App">
      <h1>GOBANG ONLINE</h1>
      
      <div className="status-bar">
        {winner ? (
          <div className="winner-msg">
            <strong>{winner}</strong>
            <button onClick={resetGame} style={{marginLeft: '15px', cursor: 'pointer'}}>重新開始</button>
          </div>
        ) : (
          <span>
            角色：⚫ <strong>黑棋 [房主]</strong> | 
            狀態：{isAiThinking ? ' 🤖 AI 正在思考中...' : ' 🟢 輪到你下子'}
          </span>
        )}
      </div>

      {/* 棋盤外框容器 */}
      <div className="board-container">
        <div className="board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`cell ${isAiThinking ? 'locked' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {/* 棋子渲染 */}
                  {cell === 1 && <div className="stone black"></div>}
                  {cell === 2 && <div className="stone white"></div>}
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