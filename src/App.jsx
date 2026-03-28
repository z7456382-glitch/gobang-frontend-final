// 在 App.jsx 中找到 checkWin，整段替換成這個：
const checkWin = (board, r, c) => {
  const color = board[r][c];
  if (color === 0) return false;
  
  const BOARD_SIZE = board.length;
  // 四個方向：水平、垂直、對角線右下、對角線左下
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    
    // 正向檢查
    for (let i = 1; i < 5; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === color) {
        count++;
      } else {
        break;
      }
    }
    
    // 反向檢查
    for (let i = 1; i < 5; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === color) {
        count++;
      } else {
        break;
      }
    }
    
    // 如果連成 5 子以上，判定為勝利
    if (count >= 5) return true;
  }
  return false;
};