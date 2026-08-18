// server.js
// Day 18 範例：模擬「即時股價」的後端 API
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public')); // 直接開啟 http://localhost:3000/index.html 也能測試前端頁面

// 在伺服器端維護目前的股價狀態，模擬每次請求都是「當下最新的股價」
let currentPrice = 500;

function nextPrice() {
  // 隨機漫步：每次請求都在前一次股價基礎上做小幅波動
  const delta = (Math.random() - 0.5) * 8;
  currentPrice = Math.max(50, currentPrice + delta);
  return Number(currentPrice.toFixed(2));
}

// GET /api/stock -> 回傳「單一時間點」的最新股價
// 前端會用 setInterval 定時呼叫這支 API，模擬即時股價走勢
app.get('/api/stock', (req, res) => {
  res.json({
    symbol: 'DEMO',
    price: nextPrice(),
    timestamp: Date.now()
  });
});

app.listen(PORT, () => {
  console.log(`Day18 即時股價模擬 API 已啟動：http://localhost:${PORT}/api/stock`);
});
