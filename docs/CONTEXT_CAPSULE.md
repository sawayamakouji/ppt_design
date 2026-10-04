# ppt_design — Context Capsule

このファイルは、長い開発履歴を毎回読み直さずに作業を継続するための圧縮コンテキスト。

## 目的

`ppt_design` は分析基盤ではなく、**Evidence を伝わる PowerPoint に変換する資料生成基盤**。

Core responsibility:

`BRIEF + EVIDENCE -> 編集 -> 枚数最適化 -> 順序/強弱 -> ページ表現 -> PPT/HTML -> QA`

## 正規パイプライン

1. Brief Resolver
2. Content Planner
3. Presentation Editor
4. Deck Length Editor
5. Deck Director v3
6. A/B/C design directions
7. Pattern Resolver
8. Scene Graph
9. Design Lab
10. PPT / HTML
11. Design Lint / PPT-SAFE QA

## 境界

### Core

- 資料の目的・対象者を整理
- 根拠から掲載内容を選ぶ
- 1ページ1問・1結論へ編集
- ページ数を KEEP / MERGE / SPLIT / DROP で調整
- ページ順とタイトル連鎖を最適化
- デッキ全体の視覚リズムを設計
- PowerPoint / HTML を生成
- 文字被り・重複・視認性・ストーリーをQA

### Non-Core / Prototype

以下は分析側であり、`ppt_design` の標準実行には依存しない。

- Insight Engine
- Driver Explorer
- Causal Test Planner
- DiD / PSM / AIPW 等の推定実行

分析結果は外部で作成し、Evidence として `ppt_design` に渡す。

## デザイン思想

基本配色:

- 白 / 生成り: ベース
- 黒: 本文・罫線
- 朱赤: 主アクセント
- 黄: ピンポイントのシグナル

特徴:

- エディトリアル / 雑誌的
- 強いタイポグラフィ
- 太い枠線 + 細いグリッド
- 大きな数字
- 高コントラスト
- 装飾を増やしすぎない
- 余白を積極的に使う
- カード連続を避け、ページシルエットを変える

## 編集原則

- 1ページ1問・1結論
- 分析文をそのままKPI欄へ入れない
- 数字を主役、説明をラベル/補足へ分離
- タイトルだけでストーリーが通るようにする
- 同じ根拠を隣接ページで繰り返さない
- 相関・寄与・因果を混同しない
- 根拠がない数値を作らない

## Deck Length

目安:

- 役員: 5〜7枚
- 管理職: 6〜8枚
- 通常: 6〜10枚
- 進捗: 4〜7枚

自動編集は安全・可逆な操作だけ。

- KEEP
- MERGE
- SPLIT
- DROP（optionalかつ重複時のみ）

Opening / Action / locked slide / unique evidence は保護する。

## Deck Director

診断・報告の基本ストーリー:

`Opening -> KPI -> Hierarchy -> Breakdown -> Interpretation -> Action`

6枚の標準エネルギー:

`PEAK -> ANCHOR -> BRIDGE -> PEAK -> CALM -> PEAK`

ページ間:

`OPEN -> QUANTIFY -> DRILL -> DECOMPOSE -> QUALIFY -> RESOLVE`

Deck Director v3 は、必要なら並び順を修正し、表示見出しを連鎖させる。ただし数字・根拠・因果レベルは変更しない。

## 入口設計

入口は複数でよい。Core engine は1つ。

候補:

- PowerPoint Agent / Copilot
- Copilot Studio
- ChatGPT
- Codex / Claude Code
- GitHub Pages / Cloudflare UI
- API

### PowerPoint Agent向け

`skills/make-deck-lite/SKILL.md` を軽量入口として使う。

この軽量版は GitHub / コード実行 / API を前提にせず、PowerPoint Agent単体で使える資料編集ルールを圧縮したもの。

### フル版

将来必要なら `DECK-REQUEST-v1 -> API -> ppt_design engine` を追加する。

## 現在の優先順位

1. `make-deck-lite` を実際の PowerPoint Agent / Copilot で試す
2. 生成結果の失敗例を収集
3. 軽量スキル側へ再現性の高いルールだけ戻す
4. API / Web UI は必要になってから追加する

## コンテキスト運用

今後は、古い実装ログやPRの細部を毎回コンテキストへ展開しない。

通常はこの Capsule と最新のCore仕様だけを読む。

詳細履歴が必要な場合のみ、該当する docs / PR / tool source を追加で参照する。
