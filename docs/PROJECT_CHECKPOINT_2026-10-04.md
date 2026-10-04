# Project Checkpoint — 2026-10-04

## 現在地

`ppt_design` の第一目標は、**業務素材から、デザインが整った一定品質以上の編集可能PowerPointを安定して生成すること**。

現時点で以下は概ね成立している。

- Pattern / Theme / Composition / Density の設計体系
- Shared Scene Graph を経由した HTML / PPTX 生成
- Design Lint / PPT-SAFE QA
- Golden Benchmark Suite v1（10 Deck / 63 Slides）
- GitHub Actions による Visual QA / Render smoke / Visual Diff
- Typography & Density QA
- Readability QA
- Deck Director v3.1 の Agenda / Section Divider 判定
- 長いタイトルと右上ナビタグの衝突を避けるヘッダー設計ルール

## 今回の実例から得た重要な設計知見

### 1. 分かりやすさはデザインだけではなく Content Architecture で決まる

「ARC無し分析基盤接続方法」は見た目が新しいわけではないが、

- 1ページ = 1〜3個の作業
- 手順番号が一本道
- 画面キャプチャがその場の操作を直接示す
- 最後に完了条件がある

ため、認知負荷が低い。

一方、年末迎春商材計画は、前年振り返り・計画値・商品明細・市場分析・売場・レシピ等が同じ階層で並び、情報量は豊富だが「何を理解してほしいか」で十分に編集されていなかった。

今後は各スライドで最低限、以下を持つ。

- `slideJob`
- `question`
- `primaryClaim`
- `evidence`
- `detailMode: main | supporting | appendix`

`primaryClaim` が作れないページは、そのまま本編に入れない。

### 2. 長いタイトルと章タグの衝突は個別修正ではなくテンプレート問題

正式ルールとして、

- 小ラベル / 右上章タグはナビゲーション帯へ分離
- その下にタイトル専用領域を確保
- タイトルは原則2行以内
- 長い場合は短文化 / 改行
- タイトルとナビタグの矩形衝突をQA対象にする

を採用する。

### 3. グラフ装飾は意味が明示できる場合のみ使う

年末迎春再編集版のカテゴリ診断では、意味が曖昧だった赤い縦線を削除した。

- 伝えたい基準線
- 色分け
- ラベル
- 右側の示唆

で十分読める場合、不要な装飾線は使わない。

## 年末迎春商材計画の再編集実例

元の33ページ資料を、発注起案・年末商戦計画の参考用途に再編集。

主なストーリー：

1. 表紙
2. Executive Summary
3. 2025振り返り
4. 2025カテゴリ診断
5. 2026数値計画
6. 需要タイミング分析
7. 2026基本戦略
8. 主力商品・販促
9. SKU政策
10. 売場展開
11. 実行スケジュール
12. 以降 詳細・補足・Appendix

実運用で次に深める分析候補：

- カテゴリ別売上構成比
- カテゴリ別荒利額構成比
- 前年比
- 消化率
- 週別需要
- 販促有無

例：`売上構成比 × 金額前年比`、バブルサイズ=`荒利額構成比` でカテゴリ重要度と成長性を判断する。

ただし、**このプロジェクトの現在の主目的は高度分析ではなく、一定品質の業務PPTを安定して作れる基盤を完成させること**。

## 次のフェーズ：運用・配布

デザイン追加より、実際の利用方法を固定する。

### 理想ワークフロー

```text
ユーザー
「このPPT / PDF / Excel / CSV / メモから資料を作って」
    ↓
スキル持ち生成AI
- Audience
- Objective
- Decision expected
- Story
- Main / Appendix
- Slide job
- Claim
- Evidence
を整理
    ↓
DECK-SPEC-v1.json
    ↓
ppt_design
    ↓
Schema Validation
Presentation Editor
Deck Length Editor
Deck Director
Agenda / Section判定
Pattern Resolver
Readability / Density Guard
Scene Graph
    ↓
PPTX / HTML / Montage / QA report
```

AIには座標やフォントサイズを直接決めさせない。
AIは「内容・意図」を決め、`ppt_design` が「レイアウト・デザイン・品質」を担う。

### 最終的な操作イメージ

```bash
ppt-design build deck-spec.json
```

出力：

```text
output/
  final.pptx
  final.html
  montage.png
  qa-report.json
  deck-spec.resolved.json
```

## 配布形態の方針

最終的には **配布できる Skill + 説明用 Repository + Prompt** にする。

### 1. Skill

Skill が担当すること：

- 素材を読む
- 目的・対象者・意思決定を整理
- ストーリーを作る
- 本編 / Appendixを分ける
- `DECK-SPEC-v1.json` を生成
- `ppt_design` に渡す
- QA結果を確認

### 2. 配布用Repository

開発repoとは別に、利用者向けスターターrepoを想定。

```text
ppt-design-starter/
  README.md
  QUICKSTART_JA.md
  skills/ppt-design/SKILL.md
  prompts/
    create-deck.md
    redesign-existing-deck.md
    analyze-and-build.md
  schemas/deck-spec-v1.schema.json
  examples/
    executive-report/
    seasonal-order-plan/
    analysis-report/
    operation-manual/
  docs/
    HOW_IT_WORKS.md
    INPUT_GUIDE.md
    REVIEW_GUIDE.md
    TROUBLESHOOTING.md
```

### 3. Prompt

Skill非対応AIでも使えるように、同じ思想のコピペPromptを用意する。

## 次に作るもの

優先順位：

1. `DECK-SPEC-v1` 正式仕様
2. `Deck Spec Compiler`
3. `ppt-design build deck-spec.json`
4. 配布用 `SKILL.md`
5. コピペPrompt
6. `QUICKSTART_JA.md`
7. 匿名化サンプル2〜3本
8. 利用者向け `ppt-design-starter` repository

目標：**他の人が30分以内に使い始められる配布パッケージ**。

## 現在の判断

ここまでで「業務PPTを一定品質で作る」基盤は十分形になった。
次はデザインの細部追加ではなく、`DECK-SPEC-v1` を中心に運用・配布・再現性へ進む。
