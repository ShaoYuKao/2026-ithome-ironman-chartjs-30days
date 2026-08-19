# Day 20 - 30 天手把手學會 Chart.js｜響應式設計（Responsive）

> Day 19 我們讓圖表「聽得懂」使用者的滑鼠操作；今天要處理另一個同樣關鍵、卻常常被忽略的問題：**圖表在不同螢幕尺寸下，該怎麼正確地縮放？** 手機、平板、桌機的畫面寬度差異很大，如果圖表沒有做好響應式設計（Responsive Design），輕則圖表被裁切、變形，重則整個版面跑版、圖例（legend）擠成一團，讓使用者根本看不清楚資料。今天我們要徹底搞懂 Chart.js 內建的 `responsive`、`maintainAspectRatio`、`aspectRatio` 這三個核心選項，理解它們背後「canvas 渲染尺寸與顯示尺寸互相獨立」的原理，並學會如何搭配 CSS（Flexbox / Grid、Media Query）打造出真正能適應各種裝置的圖表版面。

## 一、核心觀念：canvas 的「渲染尺寸」與「顯示尺寸」是兩回事

在動手設定任何響應式選項之前，一定要先理解一件事：`<canvas>` 元素其實有**兩種尺寸**，而且它們互不相干：

- **渲染尺寸（render size）**：也就是 `canvas.width`、`canvas.height`（或 HTML 屬性 `width="400" height="200"`），這決定了畫布**實際有多少像素可以繪圖**，只能用「數字」表示，不能寫 `50%` 或 `40vh` 這種相對值。
- **顯示尺寸（display size）**：也就是 CSS 的 `canvas.style.width`、`canvas.style.height`，這決定了瀏覽器**在畫面上把這張圖顯示成多大**，可以自由使用 `%`、`vh`、`vw` 等相對單位。

問題在於：**瀏覽器不會自動幫你把顯示尺寸換算回渲染尺寸**。也就是說，如果只靠 CSS 把 canvas 的顯示尺寸設成 `40vh`、`80vw`，實際的繪圖解析度並不會跟著改變，結果就是圖表被「硬拉伸」，看起來模糊、比例失真。

以下三種寫法都是官方文件明確指出**無法正常運作**的錯誤示範：

```html
<!-- 錯誤 1：直接在 canvas 屬性上寫相對值，canvas 完全不會跟著縮放 -->
<canvas height="40vh" width="80vw"></canvas>

<!-- 錯誤 2：用 CSS 直接設定 canvas 尺寸，圖表雖然會跟著變大變小，但畫面會模糊失真 -->
<canvas style="height:40vh; width:80vw;"></canvas>

<!-- 錯誤 3：只靠 margin 置中，沒有專屬容器，canvas 會不斷持續縮小 -->
<canvas style="margin: 0 auto;"></canvas>
```

正因為「渲染尺寸」與「顯示尺寸」的換算沒辦法只靠瀏覽器原生機制自動完成，Chart.js 才提供了 `responsive`、`maintainAspectRatio` 等選項，在背後幫我們監控「容器顯示尺寸的變化」，並主動呼叫程式碼去同步更新 canvas 的渲染尺寸——這就是為什麼 Chart.js 一直強調「圖表必須被放在一個專屬容器裡」的原因，下一節會詳細說明。

## 二、`responsive`：讓圖表跟著容器自動縮放

```js
const chart = new Chart(ctx, {
  type: 'bar',
  data: data,
  options: {
    responsive: true // 這也是預設值
  }
});
```

`responsive` 預設就是 `true`。開啟之後，Chart.js 會監控圖表容器（下一節會說明的「dedicated container」）的尺寸變化，只要容器的顯示尺寸改變（例如使用者縮放瀏覽器視窗、或版面因為 RWD 斷點而重新排列），Chart.js 就會自動重新計算並更新 canvas 的渲染尺寸，讓圖表維持清晰、不失真。

如果某張圖表明確不需要響應式效果（例如列印用的固定尺寸縮圖、或後台管理系統中位置永遠固定的小圖示），可以把 `responsive` 設為 `false`，此時圖表會維持 `<canvas>` 標籤原本設定的固定寬高，不再監控容器尺寸變化，也能省下一些不必要的效能開銷。

## 三、`maintainAspectRatio` 與 `aspectRatio`：控制圖表的長寬比例

`responsive` 決定了「圖表會不會跟著容器縮放」，而 `maintainAspectRatio` 與 `aspectRatio` 則進一步決定「縮放的時候，圖表的長寬比例要不要固定」。

```js
options: {
  responsive: true,
  maintainAspectRatio: true, // 預設值也是 true
  aspectRatio: 2             // 寬度是高度的 2 倍；圓餅圖類（doughnut、pie、polarArea、radar）預設為 1
}
```

- **`maintainAspectRatio: true`（預設）**：無論容器怎麼縮放，圖表都會**維持固定的長寬比例**（由 `aspectRatio` 決定），並依照容器「寬度」來自動換算出對應的高度。這種模式最大的好處是「不用擔心圖表被壓扁或拉長」，但缺點是：如果容器本身的高度是固定的（例如卡片高度寫死 `height: 260px`），圖表可能不會乖乖填滿整個容器高度，而是依照比例算出自己想要的高度。
- **`maintainAspectRatio: false`**：圖表會完全依照容器的寬度**與高度**來縮放，不再堅持固定比例。這種模式很適合「容器高度已經被 CSS 明確控制」的情境（例如 Dashboard 的卡片版面，每張卡片都是固定高度），此時我們反而希望圖表填滿整個卡片，而不是自己算一個比例出來。
- **`aspectRatio`**：只有在 `maintainAspectRatio: true` 時才有意義，數值代表 `寬度 / 高度`。例如 `aspectRatio: 2` 表示寬度是高度的兩倍（比較扁平、適合折線圖、長條圖）；`aspectRatio: 1` 則是正方形（常用於圓餅圖、雷達圖，也是這類圖表的預設值）。

## 四、必須遵守的規則：專屬容器（Dedicated Container）

Chart.js 判斷「容器尺寸有沒有改變」的方式，並不是直接觀察 `<canvas>` 本身，而是透過 canvas 的**父層容器（parent container）**。這也是為什麼官方文件特別強調：**圖表的父容器必須設定 `position: relative`，而且這個容器裡面只能放這一個 canvas**，不能塞進其他文字、按鈕等元素一起共用同一個容器。

```html
<div class="chart-container" style="position: relative; height: 40vh; width: 80vw;">
  <canvas id="chart"></canvas>
</div>
```

這種寫法之所以能運作，是因為：

1. 外層 `.chart-container` 可以自由使用 `%`、`vh`、`vw` 等相對單位，交給瀏覽器的版面引擎（layout engine）去計算出實際的像素尺寸。
2. Chart.js 內部使用 `ResizeObserver`（在不支援的環境會退回其他偵測方式）監控這個容器的**實際渲染尺寸**。
3. 一旦容器尺寸改變，Chart.js 就會把新的尺寸同步寫回 canvas 的渲染尺寸（`canvas.width` / `canvas.height`），確保畫面既能跟著版面縮放，也不會因為只靠 CSS 拉伸而變得模糊。

如果想要用 JavaScript「手動」觸發圖表縮放，也是透過修改容器的尺寸來達成，而不是直接改 canvas：

```js
chart.canvas.parentNode.style.height = '128px';
chart.canvas.parentNode.style.width = '128px';
// 注意：若要讓上面這段程式碼正確改變「高度」，maintainAspectRatio 必須設為 false，
// 否則 Chart.js 仍然會依照 aspectRatio 自行算出高度，而不會採用容器實際設定的高度。
```

## 五、Flexbox / Grid 版面下的常見陷阱：`min-width: 0`

在使用 Flexbox 或 CSS Grid 排版多張圖表時（例如 Dashboard 常見的「一列多欄卡片」版面），有一個容易被忽略、卻很常導致版面跑版的細節：**Flex / Grid 的子元素預設有一個隱性的 `min-width`（`auto`）**，這會讓內容較「寬」的元素（例如圖表 canvas）撐開整個容器，造成版面溢出（overflow）。

解法很簡單：把負責包住圖表的那個 Grid / Flex 子元素，明確設定 `min-width: 0`：

```html
<div class="grid-container" style="display: grid;">
  <div class="chart-container" style="min-width: 0; position: relative;">
    <canvas id="chart"></canvas>
  </div>
</div>
```

## 六、實作：`responsive` / `maintainAspectRatio` / `aspectRatio` 互動實驗室

此範例提供了一個「可以拖曳縮放的容器」，搭配三個控制項：

- 勾選框：切換 `responsive` 開關
- 勾選框：切換 `maintainAspectRatio` 開關
- 下拉選單：切換 `aspectRatio`（1、2、3）

HTML 版面內容如下：
```html
<div class="toolbar">
  <label>
    <input type="checkbox" id="responsiveToggle" checked />
    responsive
  </label>
  <label>
    <input type="checkbox" id="maintainToggle" checked />
    maintainAspectRatio
  </label>
  <label>
    aspectRatio
    <select id="aspectRatioSelect">
      <option value="1">1（正方形）</option>
      <option value="2" selected>2（預設，寬是高的 2 倍）</option>
      <option value="3">3（更扁平）</option>
    </select>
  </label>
  <label>
    resizeDelay(ms)
    <input type="number" id="resizeDelayInput" value="0" min="0" step="50" style="width: 70px;" />
  </label>
</div>
<div id="status">尚未觸發 onResize</div>
<div class="chart-container" id="chartContainer">
  <canvas id="demoChart"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1"></script>
```

JavaScript 程式碼內容如下：
```js
const ctx = document.getElementById('demoChart');
const statusEl = document.getElementById('status');

const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [{
      label: '每月銷售量',
      data: [65, 59, 80, 81, 56, 72],
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    resizeDelay: 0,
    // onResize 會在圖表實際完成重新繪製「之後」被呼叫，
    // 適合用來記錄尺寸、或依照新尺寸動態切換其他 UI（例如圖例位置）
    onResize: (chartInstance, newSize) => {
      statusEl.textContent =
        `onResize 觸發：新的畫布尺寸 -> 寬 ${Math.round(newSize.width)}px、高 ${Math.round(newSize.height)}px`;
    },
    plugins: {
      title: { display: true, text: 'responsive 設定示範圖表' }
    }
  }
});

const responsiveToggle = document.getElementById('responsiveToggle');
const maintainToggle = document.getElementById('maintainToggle');
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const resizeDelayInput = document.getElementById('resizeDelayInput');

// 每個選項改變時，直接修改 chart.options 對應屬性，再呼叫 update() 讓設定生效
responsiveToggle.addEventListener('change', () => {
  chart.options.responsive = responsiveToggle.checked;
  chart.update();
});

// 之後可以直接修改 chart.options 上對應的屬性，再呼叫 update() 讓設定生效
maintainToggle.addEventListener('change', () => {
  chart.options.maintainAspectRatio = maintainToggle.checked;
  chart.update();
});

aspectRatioSelect.addEventListener('change', () => {
  chart.options.aspectRatio = Number(aspectRatioSelect.value);
  chart.update();
});

resizeDelayInput.addEventListener('change', () => {
  chart.options.resizeDelay = Number(resizeDelayInput.value) || 0;
});
```

![實作：`responsive` / `maintainAspectRatio` / `aspectRatio` 互動實驗室](images/20260820075557.png)

打開此範例後，建議依序做以下三個實驗，實際感受三個選項之間的關係：

1. 保持 `maintainAspectRatio` 勾選、`aspectRatio` 設為 `2`，拖曳容器右下角改變寬高，觀察圖表**永遠維持寬是高的兩倍**，即使容器被拖成接近正方形，圖表本身依然是扁平的長方形（在容器內置中對齊）。
2. 取消勾選 `maintainAspectRatio`，再重複拖曳容器，這次圖表會**完全貼合容器的寬與高**，不再管原本的比例，容器多高圖表就多高、容器多寬圖表就多寬。
3. 取消勾選 `responsive`，此時無論怎麼拖曳容器，圖表都不會有任何反應——因為 Chart.js 已經不再監控容器尺寸變化了。

## 七、`onResize` 與 `resizeDelay`：監控與節流

- **`onResize(chart, newSize)`**：每次圖表完成一次重新繪製之後都會呼叫這個回呼函式，適合用來記錄目前的畫布尺寸、或是在尺寸改變後觸發其他自訂邏輯（例如依照新尺寸決定要不要顯示某些次要的 UI 元素）。今天的 `example01` 就用它把目前的畫布尺寸即時顯示在畫面上的狀態列。
- **`resizeDelay`（預設 `0`）**：使用者拖曳視窗邊框、或是縮放視窗時，`resize` 事件其實會非常密集地連續觸發，如果圖表資料量大、繪製邏輯複雜，每次都立刻重繪可能會讓畫面感覺卡頓。把 `resizeDelay` 設定為一個小的毫秒數（例如 `100`），Chart.js 就會**延遲（debounce）**這段時間之後才真正執行重繪，只要在延遲時間內又發生了新的尺寸變化，就會重新計時，等使用者「真正停止拖曳」之後才觸發一次重繪，藉此換取更流暢的操作體驗。

```js
options: {
  resizeDelay: 100,
  onResize: (chart, newSize) => {
    console.log('圖表已重新繪製，目前尺寸：', newSize);
  }
}
```

## 八、常見誤區與注意事項

1. **直接在 canvas 上用 CSS 或 HTML 屬性寫相對尺寸**：例如 `<canvas style="width: 80vw;">`，圖表雖然「看起來」會變大變小，但因為渲染尺寸沒有同步更新，畫面會模糊、失真。正確做法永遠是「在外層容器上寫相對尺寸，讓 Chart.js 自己去同步 canvas」。
2. **容器沒有 `position: relative`**：Chart.js 監控容器尺寸變化的機制，仰賴容器是「相對定位（或其他非 `static` 定位）」，如果忘記加上 `position: relative`，響應式效果可能完全不會生效，或是計算出錯誤的尺寸。
3. **一個容器塞了不只一個 canvas，或容器裡混雜了其他元素**：官方文件明確要求「容器必須是圖表專屬的」，如果同一個容器裡還有標題文字、按鈕等其他內容，會干擾 Chart.js 對容器尺寸的判斷，導致縮放行為不正確。
4. **在 Grid / Flex 版面忘記設定 `min-width: 0`**：這是最容易被忽略、卻最常導致「圖表把整個版面撐爆、跑出水平捲軸」的問題，只要是多欄式的圖表版面，養成習慣一律加上這行 CSS。
5. **`maintainAspectRatio: false` 卻沒有讓容器的高度是明確的**：一旦關閉 `maintainAspectRatio`，圖表就會完全依賴容器的實際高度來決定自己的高度；如果容器本身的高度是 `auto`（沒有明確指定），可能會讓圖表變成高度趨近於 `0`（幾乎看不見）或不斷塌縮，因此關閉 `maintainAspectRatio` 時，一定要確保容器有一個明確的高度來源（固定像素、`vh`、Flex/Grid 分配到的高度等）。
6. **用 `window.resize` 事件做太頻繁、太重的邏輯**：`resize` 事件在拖曳視窗邊框時會非常密集地觸發，如果在監聽函式裡做複雜運算（例如重新整批建立圖表），畫面會明顯卡頓。優先善用 Chart.js 內建的 `resizeDelay` 做 debounce，或改用 `matchMedia` 的 `change` 事件（只在真正跨越斷點時才觸發），減少不必要的運算。

---

明天（Day 21）是**第三週總複習與小專案**：我們會把這三週學到的「串接靜態 JSON／後端 API／CSV 資料」「動態資料更新」「互動事件處理」「響應式設計」全部整合在一起，練習串接一個公開 API（例如天氣、匯率、疫情資料），做出一個具備即時性、互動性、又能適應各種裝置尺寸的完整小專案。

## 參考資源

- [Chart.js](https://www.chartjs.org/)
- [Chart.js GitHub](https://github.com/chartjs/Chart.js)
