// server.js
// Day 16｜串接後端 API（RESTful）— Express 後端範例
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 允許前端頁面（不同來源）呼叫這支 API，避免 CORS 問題
app.use(cors());

// 模擬資料庫裡的「近六個月各產品線營收」資料
const salesData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月'],
  products: [
    { name: '筆記型電腦', revenue: [120, 135, 128, 150, 162, 158] },
    { name: '平板電腦', revenue: [80, 75, 90, 95, 88, 102] },
    { name: '智慧手錶', revenue: [40, 52, 48, 60, 65, 70] }
  ]
};

/**
 * GET /api/sales
 * 回傳銷售資料，並支援兩個測試用的 query string：
 *   - delay：模擬網路延遲（毫秒），例如 /api/sales?delay=2000
 *   - error=1：故意回傳 500 錯誤，方便練習錯誤處理，例如 /api/sales?error=1
 */
app.get('/api/sales', (req, res) => {
  const delay = Number(req.query.delay) || 0;
  const shouldError = req.query.error === '1';

  setTimeout(() => {
    if (shouldError) {
      return res.status(500).json({ message: '伺服器發生錯誤，請稍後再試。' });
    }
    res.json(salesData);
  }, delay);
});

// 提供 public 資料夾內的靜態檔案（index.html、CSS 等）
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Express 伺服器已啟動：http://localhost:${PORT}`);
});
