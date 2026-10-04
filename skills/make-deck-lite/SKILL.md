---
name: make-deck-lite
description: Use when the user asks Copilot in PowerPoint to create or substantially revise a business presentation from a topic, prompt, or attached reference files. Organize evidence, choose slide count, build a clear story, apply a restrained white/black/vermilion/yellow editorial style, and self-review the finished deck.
---

# make-deck-lite

PowerPoint Agent / Copilot 系のエージェントで使う、軽量な資料作成スキル。

このスキルは GitHub 参照・Node/Python 実行・外部 API を前提にしない。PowerPoint Agent 単体で、ユーザーの依頼と添付資料だけを使い、構成・編集・デザイン判断を行う。

## 目的

ユーザーが「〇〇についてスライド作って」と依頼したとき、複雑な内部ルールを意識させず、以下を一貫して行う。

1. 依頼を Brief に整理する
2. 添付資料から根拠を抽出する
3. 1ページ1問・1結論に編集する
4. 適切なページ数を判断する
5. デッキ全体の順番・強弱・視覚リズムを設計する
6. 編集可能な PowerPoint を作る
7. 最後に読みやすさと重複をセルフレビューする

## 前提

- GitHub を読めると仮定しない
- 任意コードを実行できると仮定しない
- 外部の分析基盤があると仮定しない
- ユーザーが与えた資料・PowerPoint 内の内容・会話中の情報を根拠にする
- 根拠のない数値や事実を作らない
- 相関・寄与・因果を混同しない

## 最小入力

ユーザーは次のどれかで依頼できる。

### 最短

「〇〇について、役員向けに6枚くらいで作って」

### 推奨

- テーマ
- 誰向けか
- 何を伝えたい / 決めてほしいか
- 枚数（未指定なら自動）
- 参考資料 / 添付ファイル

不足項目は、資料作成に重大な影響がない限り合理的に補完する。質問攻めにしない。

## Step 1 — Brief

最初に内部で以下を整理する。

- Topic: 何の資料か
- Audience: 誰が読むか
- Objective: 報告 / 説明 / 承認 / 意思決定 / 提案
- Desired outcome: 読後に何を理解・判断・実行してほしいか
- Evidence: 使える資料・数字・図表
- Constraints: 枚数、社内用語、禁止表現、既存フォーマット

ユーザーが「おまかせ」と言った場合は、Audience と Objective に合う一般的な構成を選ぶ。

## Step 2 — Evidence first

資料中の根拠を、次の4種に分ける。

- FACT: 事実
- KPI: 数値
- COMPARISON: 前後 / 店舗差 / 計画差
- INTERPRETATION: 読み取り・示唆

ルール:

- 数値は出典と一致させる
- 元資料が支持しない主張は作らない
- 「原因」と言える根拠がなければ「関連」「寄与」「可能性」「確認が必要」と書く
- 不明点は推測で埋めず「要確認」とする

## Step 3 — Presentation Editor

分析結果や文章を、そのままスライドへ貼らない。

各ページを必ず以下に落とす。

- Question: このページが答える問い
- Claim: 一番伝えたい結論
- Evidence: 結論を支える最小限の根拠

原則は「1ページ1問・1結論」。

タイトルは単なる名詞ではなく、可能な限りメッセージにする。

NG:
- 売上推移
- 課題
- 分析結果

Better:
- 売上は回復したが、道東だけ戻りが鈍い
- 修正率は一部店舗に集中している
- 次に直すべきは棚割と例外運用

## Step 4 — Deck Length

枚数は固定条件ではなく、伝達品質のために調整する。

目安:
- 役員 / 経営: 5〜7枚
- 管理職: 6〜8枚
- 通常説明: 6〜10枚
- 進捗報告: 4〜7枚

判断:
- 同じ役割のページが隣接 → MERGE 候補
- 1枚に情報が多すぎる → SPLIT 候補
- 前ページの要約しかしていない → DROP 候補
- 固有の根拠がある → KEEP

数字や根拠を捨てて無理やり枚数を合わせない。

## Step 5 — Deck Director

デッキ全体でストーリーを作る。

診断・報告資料の基本:

1. Opening — 結論
2. KPI — 重要数字
3. Structure / Drill — どこで起きたか
4. Evidence / Breakdown — 何が寄与したか
5. Interpretation — どう読むか
6. Action — 次に何をするか

6枚の視覚リズム目安:

PEAK → ANCHOR → BRIDGE → PEAK → CALM → PEAK

全部のページを強くしない。

ページ間は、以下のようにつながるようにする。

OPEN → QUANTIFY → DRILL → DECOMPOSE → QUALIFY → RESOLVE

タイトルだけ連続して読んでも、ストーリーが成立することを確認する。

## Step 6 — Visual language

デフォルトのデザイン思想:

- 白〜生成りを主背景
- 黒を主要文字・線
- 朱赤を強調
- 黄をピンポイントのシグナルに使用
- 色数を増やしすぎない
- 太い罫線と細いグリッドを使い分ける
- 大きな数字、強いタイポグラフィ
- 余白を広く取り、要素を詰め込みすぎない
- カードを乱用しない
- スライドごとにシルエットを変える

タイポグラフィ:

- タイトルは短く強く
- 本文は読める大きさを優先
- 文字を小さくして情報を押し込まない
- 数字は可能なら本文より大きくする
- 全文太字にしない

## Step 7 — Page patterns

内容に合わせて使い分ける。

- Opening / Executive Summary
- KPI 3〜4点
- Compare / Before-After
- Flow / Process
- Hierarchy / Drill-down
- Ranked bar / Contribution
- Chart / Trend
- 3 Point Explanation
- Action / Next Step

同じ構成を3ページ以上続けない。

## Step 8 — PowerPoint output

可能なら PowerPoint 内で直接作成・編集する。

条件:

- テキストは編集可能
- 図形・表・チャートも可能な限り編集可能
- 重要な数値を画像に焼き込まない
- 元資料の出典はノートまたは小さな注記で保持
- 元データがない図表は作らない

## Step 9 — Final QA

完成前に最低限確認する。

### Content
- タイトルだけで話が通るか
- 同じことを2ページで言っていないか
- 根拠のない数字がないか
- 相関を原因と書いていないか

### Layout
- タイトルと図が重なっていないか
- 文字が枠からはみ出していないか
- 背景と文字色が同化していないか
- 不自然に文字を縮小していないか
- 1枚だけ情報量が極端に多くないか

### Rhythm
- 全ページがカード構成になっていないか
- PEAK と CALM があるか
- 最後が Action / Decision で閉じているか

## ユーザーへの最終提示

基本は以下だけ見せる。

1. 作った資料
2. 何枚構成にしたか
3. 重要な構成判断を1〜3点
4. 根拠不足・要確認があればその箇所

内部用の EDxx / THxx / Scene Graph / Design Lint などの専門IDは、ユーザーが求めない限り見せない。

## 例

User:

「年末商戦の進捗を部長向けに。添付Excelを使って6枚くらい。結論先出し。」

Skill behavior:

- Excel内の事実・数字を確認
- 6枚を固定せず5〜7枚で最適化
- Opening → KPI → 店舗差 → 商品/カテゴリ → 課題 → Action
- 白/黒/朱赤/黄のデザイン
- 最後に重複・文字被り・根拠をレビュー
- 編集可能なPowerPointとして返す
