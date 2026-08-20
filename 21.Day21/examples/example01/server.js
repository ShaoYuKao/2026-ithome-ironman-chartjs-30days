// server.js
// Day 21 小專案：串接公開匯率 API（Frankfurter，https://frankfurter.dev）
// 扮演「後端代理（Proxy）」的角色：
//   1. 幫前端統一呼叫外部公開 API，避免瀏覽器直接呼叫第三方網域時的 CORS 疑慮。
//   2. 把外部 API「一列一筆」的原始格式，轉換成 Chart.js 好用的 { dates, series } 結構。
//   3. 加上簡單的記憶體快取（in-memory cache），減少短時間內重複呼叫外部 API 的次數。
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public')); // 直接開啟 http://localhost:3000/index.html 也能測試前端頁面

// Frankfurter 是一個「不需要 API 金鑰」的免費公開匯率 API，資料來源為多國央行
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v2/rates';

// 簡單的記憶體快取：key -> { data, expireAt }
// 因為匯率資料一天內不會頻繁變動，快取 5 分鐘可以大幅減少外部 API 的呼叫次數
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function toDateString(date) {
  return date.toISOString().slice(0, 10); // 轉成 'YYYY-MM-DD'
}

// GET /api/rates?base=TWD&quotes=USD,JPY,EUR&days=30
// base：本位幣別；quotes：要比較的目標幣別（可多個，用逗號分隔）；days：回溯天數
app.get('/api/rates', async (req, res) => {
  const base = String(req.query.base || 'TWD').toUpperCase();
  const quotes = String(req.query.quotes || 'USD,JPY,EUR').toUpperCase();
  const days = Math.min(Number(req.query.days) || 30, 90); // 最多查 90 天，避免單次請求過大

  const cacheKey = `${base}|${quotes}|${days}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expireAt > Date.now()) {
    return res.json({ ...cached.data, fromCache: true });
  }

  const today = new Date();
  const fromDate = new Date();
  fromDate.setDate(today.getDate() - days);

  const url = `${FRANKFURTER_URL}?base=${base}&quotes=${quotes}&from=${toDateString(fromDate)}`;

  try {
    const response = await fetch(url); // Node.js 18+ 內建 fetch，不需要額外安裝套件
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `外部匯率 API 回應錯誤（HTTP ${response.status}）`);
    }

    // Frankfurter 回傳的原始格式是「一列一筆」：
    // [{ date: '2025-06-01', base: 'TWD', quote: 'USD', rate: 0.03349 }, ...]
    const rows = await response.json();

    // 把資料轉換成「同一天、多個幣別」的結構，方便前端一次畫出多條折線
    const dates = [...new Set(rows.map((row) => row.date))].sort();
    const quoteList = quotes.split(',');
    const series = {};
    quoteList.forEach((quote) => {
      const rateByDate = new Map(
        rows.filter((row) => row.quote === quote).map((row) => [row.date, row.rate])
      );
      series[quote] = dates.map((date) => rateByDate.get(date) ?? null);
    });

    const payload = { base, dates, series, updatedAt: new Date().toISOString() };
    cache.set(cacheKey, { data: payload, expireAt: Date.now() + CACHE_TTL_MS });
    res.json({ ...payload, fromCache: false });
  } catch (error) {
    console.error('取得匯率資料失敗：', error.message);
    res.status(502).json({ message: `無法取得匯率資料：${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Day21 匯率儀表板 API 已啟動：http://localhost:${PORT}`);
});
