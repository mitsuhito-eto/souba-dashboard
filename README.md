# Portfolio Monitor

長期投資の割安判定用 個人ダッシュボード。NASDAQ100 / Gold / BTC / TLT の Z-score 下位2資産に均等配分するシンプル戦略。

- **Data**: Yahoo Finance (週次価格) + FRED (マクロ指標)
- **Strategy**: 4-Asset Z-score Bottom-2 Equal-Weight (現金は持たない前提)
- **Cost**: 無料 (ホスティング・データ取得すべて0円)

## 構成

```
souba-dashboard/
├── index.html              ← React + Recharts (CDN)
├── data.json               ← 日次更新される静的データ
├── src/                    ← UI components
├── scripts/fetch-data.mjs  ← Yahoo + FRED フェッチャ
└── .github/workflows/      ← 毎日 06:00 JST に data.json 更新
```

## ローカル実行

```bash
npm run fetch     # data.json を生成 (FRED_API_KEY が無くても動く)
npm run serve     # http://localhost:5173 で開く
```

## デプロイ手順 (一度きり)

### 1. GitHub にリポジトリ作成

```bash
# このディレクトリで
git remote add origin git@github.com:<your-user>/souba-dashboard.git
git push -u origin main
```

### 2. FRED API キー取得 (マクロ指標用)

1. https://fred.stlouisfed.org/docs/api/api_key.html
2. メールアドレスで登録 → "Request API Key" → 即発行
3. GitHub リポジトリ Settings → Secrets and variables → Actions → New secret
   - Name: `FRED_API_KEY`
   - Value: 取得したキー

※ キー無しでも動くが、マクロ指標が固定ダミー値になります。

### 3. Cloudflare Pages 接続

1. https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Connect to Git
2. GitHub の `souba-dashboard` リポジトリを選択
3. Build settings:
   - Build command: (空欄)
   - Build output directory: `/`
4. Deploy → 数十秒で `<project>.pages.dev` で公開

### 4. データ自動更新の確認

- GitHub の Actions タブで `Update data.json` ワークフローが daily で動く
- 手動実行: Actions → Update data.json → Run workflow
- data.json の更新が main にコミットされ、Cloudflare Pages が自動デプロイ

## 戦略の意味

- **Z-score**: 価格と 200週移動平均(対数) からの偏差を標準偏差で割ったもの
- **Bottom-2**: 4資産中 Z-score が最も低い2つ = 相対的に最も割安
- **常時投資**: キャッシュは持たず、必ずどこかに振り向ける哲学
- **BTC仮説**: BTC が "Digital Gold" として機能しているか (Gold相関 > NDX相関 + 0.10) を恒常表示

## カスタマイズ

- 資産入れ替え: `scripts/fetch-data.mjs` の `ASSETS` 配列を編集
- 配分ルール変更: `data.jsx` で `BUY_IDS` を生成するロジックを差し替え
- 配色: `index.html` の `:root` CSS変数を変更

## 注意

- 投資判断は自己責任
- データは Yahoo Finance / FRED の無料エンドポイント (商用は規約確認)
- 公開リポなので、個人的な保有量や売買履歴を入れないこと
