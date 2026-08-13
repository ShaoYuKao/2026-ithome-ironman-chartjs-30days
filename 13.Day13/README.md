# Day 13 - 30 天手把手學會 Chart.js｜動畫效果（Animations）

> 昨天（Day 12）我們把圖例（Legend）與提示框（Tooltip）這兩個「互動外掛」摸得很熟了。今天要來看 Chart.js 另一個開箱即用、卻常被忽略細節的內建能力——**動畫（Animations）**。Chart.js 預設就會用漂亮的動畫呈現圖表，但如果你不了解背後的設定邏輯，遇到「動態更新資料時動畫怪怪的」「想要逐筆資料慢慢畫出來」這類需求時，就會不知道從何下手。今天會完整拆解 `animation`、`animations`、`transitions` 三大設定，並實作「逐步顯示」與「動態更新」兩個常見情境。

## 一、動畫在 Chart.js 中的定位

Chart.js 從你呼叫 `new Chart(...)` 的那一刻起，就會自動幫圖表加上進場動畫：長條圖從 0 長高、折線圖從基準線畫出曲線、圓餅圖從中心展開扇形……這一切都不需要額外設定。

這些動畫效果統一由設定物件中的 `options.animation`、`options.animations`、`options.transitions` 三個層級控制：

```js
options: {
  animation: { /* 動畫整體時間、緩動函式等「共用」設定 */ },
  animations: { /* 針對特定「屬性」的動畫設定，例如 x、y、color */ },
  transitions: { /* 針對特定「情境（模式）」的動畫設定，例如 hide、show、resize */ }
}
```

三者的關係可以這樣理解：

| 層級 | 命名空間 | 作用範圍 | 白話說明 |
| --- | --- | --- | --- |
| `animation` | `options.animation` | 全域共用設定 | 動畫要花多久、用什麼緩動曲線，是所有動畫的「預設值」 |
| `animations` | `options.animations[key]` | 特定屬性（如 `x`、`y`、`color`） | 針對某個屬性客製化動畫方式，可覆蓋 `animation` 的預設值 |
| `transitions` | `options.transitions[mode]` | 特定情境（如 `active`、`hide`、`show`、`resize`） | 針對「使用者互動情境」客製化動畫，例如滑鼠 hover 時的動畫要比較快 |

這三者都可以設定在 `options`（全圖表）、`data.datasets[i]`（單一資料集）層級，讓不同 dataset 呈現不同的動畫節奏。

## 二、`animation`：整體動畫的基礎設定

最常用、也最容易理解的就是 `options.animation`，它控制動畫「要花多久」與「用什麼節奏跑完」：

```js
options: {
  animation: {
    duration: 1000,       // 動畫時間（毫秒），預設 1000
    easing: 'easeOutQuart', // 緩動函式，預設 'easeOutQuart'
    delay: 0,              // 動畫開始前的延遲（毫秒）
    loop: false            // 是否無限循環播放
  }
}
```

| 屬性 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `duration` | `number` | `1000` | 動畫執行的總時間（毫秒）。設為 `0` 等於關閉動畫。 |
| `easing` | `string` | `'easeOutQuart'` | 動畫的緩動曲線，決定「加速／減速」的節奏感，詳見下一節。 |
| `delay` | `number` | `undefined` | 動畫開始前的等待時間（毫秒），可搭配 [scriptable options](#六、逐步顯示效果progressive-animation) 做出「逐筆延遲」的進場效果。 |
| `loop` | `boolean` | `undefined` | 設為 `true` 時動畫會無限循環播放，適合用來做展示用的動態效果（例如: Day 13 範例中的「呼吸感」折線）。 |

> 💡 **小提醒**：`delay`、`loop`、`easing`、`duration` 都是 **Scriptable Options**（可以是函式），這代表你可以依照資料索引（`context.dataIndex`）動態計算每個資料點的動畫參數，這正是實現「逐步顯示」效果的關鍵，稍後會示範。

## 三、認識緩動函式（Easing）

`easing` 決定動畫「快慢變化的節奏」，Chart.js 內建了完整的一套緩動函式，常見分類方式為 `easeIn`（先慢後快）、`easeOut`（先快後慢）、`easeInOut`（先慢中快後慢）：

```js
options: {
  animation: {
    easing: 'easeOutBounce' // 結尾會有彈跳效果，適合強調「資料到位」的瞬間
  }
}
```

常用選項一覽：

| 分類 | 可用值 |
| --- | --- |
| 線性 | `linear` |
| Quad / Cubic / Quart / Quint | `easeInQuad`、`easeOutQuad`、`easeInOutQuad`（Cubic / Quart / Quint 依此類推） |
| Sine / Expo / Circ | `easeInSine`、`easeOutExpo`、`easeInOutCirc`…… |
| Elastic（彈性） | `easeInElastic`、`easeOutElastic`、`easeInOutElastic` |
| Back（回彈超出後拉回） | `easeInBack`、`easeOutBack`、`easeInOutBack` |
| Bounce（彈跳） | `easeInBounce`、`easeOutBounce`、`easeInOutBounce` |

**選擇建議**：

- 一般資料呈現用 `easeOutQuart`（預設值）就很自然，先快後慢，符合「資料快速抵達、緩緩定位」的直覺。
- 想要活潑、有回饋感的互動（例如按鈕點擊後更新資料）可以試試 `easeOutBack` 或 `easeOutBounce`。
- 做效能敏感的即時圖表（例如即時股價），建議用 `linear` 或縮短 `duration`，避免動畫追不上資料更新的速度。

## 四、`animations`：針對特定屬性客製化動畫

如果你想要「x、y 位置」用一種動畫節奏，「顏色」用另一種節奏，就要用到 `options.animations`。它是一個物件，**key 是你自訂的動畫設定名稱**，內容則描述這個設定要套用在哪些屬性上：

```js
options: {
  animations: {
    numbers: {
      properties: ['x', 'y', 'borderWidth', 'radius', 'tension'],
      type: 'number',
      duration: 800,
      easing: 'easeOutCubic'
    },
    colors: {
      properties: ['color', 'borderColor', 'backgroundColor'],
      type: 'color',
      duration: 1500,
      easing: 'easeInOutQuad'
    }
  }
}
```

| 屬性 | 說明 |
| --- | --- |
| `properties` | 這個動畫設定要套用的屬性名稱陣列，預設是這個 key 自己的名稱（例如 key 叫 `tension`，預設就套用在 `tension` 屬性上）。 |
| `type` | 動畫的插值方式：`'number'`（數字漸變）、`'color'`（顏色漸變）、`'boolean'`（布林值切換）。大多數情況 Chart.js 能透過 `typeof` 自動判斷，但顏色一定要手動指定 `type: 'color'`。 |
| `from` / `to` | 動畫的起始值／結束值，不設定時分別使用「目前值」與「更新後的值」。 |
| `fn` | 自訂插值函式 `(from, to, factor) => value`，取代預設的插值邏輯，適合做特殊的動畫曲線。 |

其實 `numbers` 與 `colors` 正是 Chart.js **內建的兩組預設動畫**，分別對應數值型屬性（`x`、`y`、`borderWidth`、`radius`、`tension`）與顏色型屬性（`color`、`borderColor`、`backgroundColor`）。上面的範例就是把這兩組預設值改寫成不同的時長與緩動曲線。

### 4.1 讓某條線的張力（tension）持續呼吸

一個很適合展示 `animations` 彈性的例子，是讓折線圖的曲線張力（`tension`）在 0 到 1 之間無限循環變化，做出「呼吸」般的視覺效果：

```js
options: {
  animations: {
    tension: {
      duration: 1000,
      easing: 'linear',
      from: 1,
      to: 0,
      loop: true
    }
  }
}
```

這裡 `tension` 這個 key 本身就是屬性名稱，所以不需要額外寫 `properties`。

## 五、`transitions`：依「情境」客製化動畫

Chart.js 內建了 5 種核心「轉場模式（mode）」，分別對應不同的使用者操作情境：

| Mode | 觸發時機 |
| --- | --- |
| `active` | 滑鼠移入資料點（hover）時 |
| `hide` | 透過圖例或 API（`chart.hide()`）隱藏某個 dataset 時 |
| `show` | 透過圖例或 API（`chart.show()`）顯示某個 dataset 時 |
| `resize` | 圖表容器大小改變時 |
| `reset` | 圖表重新繪製整體（例如 `chart.reset()`）時 |

Chart.js 內建的預設轉場行為：

```js
transitions: {
  active: {
    animation: { duration: 400 } // hover 動畫要更快，才有即時回饋感
  },
  resize: {
    animation: { duration: 0 } // 縮放視窗時不需要動畫，避免視覺延遲
  },
  show: {
    animations: {
      colors: { type: 'color', properties: ['borderColor', 'backgroundColor'], from: 'transparent' },
      visible: { type: 'boolean', duration: 0 }
    }
  },
  hide: {
    animations: {
      colors: { type: 'color', properties: ['borderColor', 'backgroundColor'], to: 'transparent' },
      visible: { type: 'boolean', easing: 'easeInExpo' }
    }
  }
}
```

也就是說，當你點擊圖例隱藏某個 dataset 時，Chart.js 其實是先把該 dataset 的顏色**淡出成透明**，等動畫跑完才真正把它隱藏，這也是為什麼「隱藏/顯示資料集」的動畫看起來如此順暢的原因。

你也可以自訂全新的轉場模式，並搭配 `chart.update(mode)` 手動觸發：

```js
options: {
  transitions: {
    myCustomMode: {
      animation: {
        duration: 500,
        easing: 'easeOutBack'
      }
    }
  }
}

// 之後在程式中：
chart.update('myCustomMode');
```

## 六、逐步顯示效果（Progressive Animation）

「逐步顯示」是動畫設定最常被拿來詢問的需求：想要資料點一個接一個「依序」畫出來，而不是全部同時動畫完成。做法是利用 `delay` 屬性的 **Scriptable Options** 特性，依照資料索引計算不同的延遲時間：

```js
options: {
  animation: {
    onComplete: () => {
      delayed = true; // 動畫完成後標記，避免之後的互動（如 hover）也被延遲影響
    },
    delay: (context) => {
      let delay = 0;
      if (context.type === 'data' && context.mode === 'default' && !delayed) {
        delay = context.dataIndex * 100 + context.datasetIndex * 200;
      }
      return delay;
    }
  }
}
```

拆解一下這段程式碼在做什麼：

- `context.type === 'data'`：確保只針對「資料點」的動畫做延遲設定，避免影響座標軸等其他元素。
- `context.mode === 'default'`：只在圖表**初次載入**時套用延遲效果，避免每次 hover 互動時都要重新等待。
- `context.dataIndex * 100`：每往後一個資料點，就多延遲 100 毫秒，做出「依序畫出」的效果。
- `context.datasetIndex * 200`：如果有多個 dataset，讓每個 dataset 之間也錯開時間，视覺上更有層次感。
- 搭配 `onComplete` 把 `delayed` 標記為 `true`，代表「進場動畫已經跑完」，之後的互動動畫（例如 hover）就不會再被延遲影響。

## 七、動態更新圖表資料：`update()`

前面幾節談的都是「圖表怎麼動」，這一節來看「什麼時候觸發動畫」。當你修改了 `chart.data` 裡的內容後，呼叫 `chart.update()` 就會讓 Chart.js 比較新舊資料的差異，並且**自動用動畫呈現這個變化**：

```js
// 修改資料
myChart.data.datasets[0].data[2] = 50;

// 觸發更新，Chart.js 會自動把「3月」的數值從舊的值動畫到 50
myChart.update();
```

`update(mode)` 可以帶入一個 `mode` 參數，指定要使用哪一種轉場（也就是前面第五節介紹的 `transitions`）：

```js
myChart.update('active');       // 使用 active 模式的動畫設定（較快）
myChart.update('none');         // 特殊值：這次更新完全不使用動畫
myChart.update(ctx => ctx.datasetIndex === 0 ? 'active' : 'none'); // 依 dataset 決定
```

### 7.1 常見情境：定時刷新即時資料

```js
function addRandomData() {
  myChart.data.datasets.forEach((dataset) => {
    dataset.data.push(Math.floor(Math.random() * 100));
    dataset.data.shift(); // 移除最舊的一筆，維持固定筆數的「捲動」效果
  });
  myChart.data.labels.push(new Date().toLocaleTimeString());
  myChart.data.labels.shift();
  myChart.update();
}

setInterval(addRandomData, 2000);
```

這種「每隔幾秒推入新資料、移除最舊資料」的寫法，是即時圖表（如監控儀表板）最常見的模式，`update()` 會讓新資料以平滑的動畫方式滑入畫面。

### 7.2 新增／刪除整個 dataset

新增或刪除 `data.datasets` 裡的整個項目，`update()` 一樣能正確處理進場／退場動畫，不需要額外設定：

```js
myChart.data.datasets.push({
  label: '新增的資料集',
  data: [12, 19, 3, 5, 2, 3]
});
myChart.update(); // 新的 dataset 會以淡入的方式出現
```

## 八、停用動畫

某些情境（例如大量資料即時更新、單元測試截圖比對）並不需要動畫，甚至動畫還會造成效能負擔，這時可以直接關閉：

```js
// 關閉整個圖表的所有動畫
const chart = new Chart(ctx, {
  type: 'line',
  data,
  options: {
    animation: false
  }
});

// 或是執行期間動態關閉
chart.options.animation = false;              // 全部動畫都關閉
chart.options.animations.colors = false;       // 只關閉顏色動畫
chart.options.animations.x = false;            // 只關閉 x 屬性動畫
chart.options.transitions.active.animation.duration = 0; // 關閉 hover 動畫

// 單次更新不使用動畫（不影響其他設定）
chart.update('none');
```

> ⚠️ **常見誤區**：把 `animation.duration` 設成 `0` 只能關閉「主要動畫」，`transitions` 底下各個 mode（例如 `active`、`resize`）有自己獨立的 `duration`，如果沒有一併調整，hover 或縮放視窗時可能還是會看到動畫效果。

## 九、動畫回呼（Callbacks）：`onProgress` 與 `onComplete`

Chart.js 提供 `onProgress` 與 `onComplete` 兩個回呼函式，讓你可以在動畫進行過程中同步做其他事情，例如顯示一個外部的進度條：

```js
options: {
  animation: {
    onProgress: (animation) => {
      const progress = animation.currentStep / animation.numSteps;
      progressBar.style.width = `${progress * 100}%`;
    },
    onComplete: (animation) => {
      console.log('動畫完成！', animation.initial ? '（初次載入）' : '（資料更新）');
    }
  }
}
```

回呼函式會收到一個物件，包含：

| 屬性 | 說明 |
| --- | --- |
| `chart` | 目前的 Chart 實例 |
| `currentStep` | 目前動畫執行到第幾步 |
| `numSteps` | 這次動畫總共需要的步數 |
| `initial` | 是否為圖表「第一次」載入時的動畫 |

這兩個回呼**只能設定在 `options.animation` 這個最上層的命名空間**，不能設定在 `animations` 或 `transitions` 底下的個別項目中。

## 十、常見誤區與注意事項

1. **想要「立刻更新、不要動畫」卻忘記加 `'none'`**：直接呼叫 `chart.update()` 一定會套用動畫設定，若不想要動畫，要明確傳入 `chart.update('none')`，或是把對應的 `duration` 設為 `0`。
2. **`delay` / `loop` 設定在錯的層級**：如果只想對「初始進場」動畫加上逐步延遲，切記在 `context.mode === 'default'` 時才套用邏輯，否則 hover 等互動也會被拖慢。
3. **顏色動畫忘記加 `type: 'color'`**：在 `animations` 自訂設定中，如果屬性名稱不是 Chart.js 預設認得的顏色屬性，記得手動加上 `type: 'color'`，否則會被誤判成數字動畫而出錯或無效果。
4. **即時圖表資料更新太快，動畫來不及跑完**：如果資料更新頻率（如每 500 毫秒）比動畫時間（預設 1000 毫秒）還快，畫面會顯得雜亂。建議縮短 `duration` 或直接設為 `0`。
5. **`resize` 動畫忘記考慮**：預設 `resize` 的 `duration` 就是 `0`（沒有動畫），這是刻意設計避免使用者拖曳視窗時產生延遲感，除非有特殊需求，通常不建議修改。

## 參考資源

- [Chart.js](https://www.chartjs.org/)
- [Chart.js GitHub](https://github.com/chartjs/Chart.js)
