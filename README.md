# Honor of Kings (HoK) Random Lane & Hero Roulette

Honor of Kings（オナー・オブ・キングス）のチーム練習やドラフトシナジー向上のための、ランダムレーン＆ヒーローくじ引き（ルーレット）Webアプリケーションです。

## 特徴

- **Vue 3 (Composition API) + Vite + Bulma** による軽量かつ高速なSPA。
- **レーン別Tier対応**: `HOK.csv` の「クラッシュ」「ミドル」「ファーム」「ジャングル」「ローム」各カラムに入力されたTier（S/A/B/C等）を解析し、レーンごとのTierフィルターや重み付けに対応。
- **バイリンガル表示**: `English Name / 日本語名` の併記で、多言語クライアントのプレイヤー同士でも即座に認識可能。
- **カスケード除外（ドラフト連携）**: 上位スロット（Player 1〜5）で決定されたレーンおよびヒーローを、下位スロットで自動的にロック・除外。
- **2ステップルーレット & 減速シャッフル**:
  - Step 1: レーン抽選（手動除外/決定も可能）
  - Step 2: ヒーロー抽選（Tierチェックボックス、BANリスト対応）
  - 臨場感のある減速シャッフルアニメーション（クリックで即時スキップ可能）
- **Discord出力 & パーティ共有URL**:
  - ワンクリックでDiscord用テキストをクリップボードにコピー
  - `?cl=1&jg=79...` のようなクエリパラメータによる編成共有リンクの生成・読み取り専用サマリー表示対応。

## ディレクトリ構成

```text
hok-shuffle/
├── HOK.csv                     # 元データCSV（日本語名、全体Tier、スタイル、レーン別Tier）
├── scripts/
│   └── csv-to-json.js          # CSV -> JSON 変換スクリプト
├── src/
│   ├── data/
│   │   └── heroes.json         # 生成されたヒーローデータ（120名）
│   ├── stores/
│   │   └── rouletteStore.js    # リアクティブ状態管理（カスケード除外、BAN、共有）
│   ├── components/
│   │   └── PlayerRouletteSlot.vue # プレイヤースロットUI（Step 1 & Step 2）
│   ├── App.vue                 # メインレイアウト、パーティサマリー、ツールバー
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## 利用手順

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. CSVからJSONへの変換
```bash
npm run convert
```
※ `dev` および `build` コマンド実行時にも自動的に `npm run convert` が先行して実行されます。

### 3. 開発サーバーの起動
```bash
npm run dev
```

### 4. プロダクションビルド（GitHub Pages等向け）
```bash
npm run build
```
`dist/` ディレクトリに静的ファイルが出力されます（相対パス `./` で構成されているため、GitHub Pages等でそのまま配信可能）。
