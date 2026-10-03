# Golden Benchmark Suite v1

`ppt_design` の回帰評価用コーパス。

- **10 decks / 63 slides**
- 業務テーマは過去の実務テーマを元にした構造的ベンチマーク
- **数値はすべて合成・匿名化**。公開リポジトリへ実データを持ち込まない
- 現在のレンダリングは **candidate-golden**。ユーザー承認後に `golden` へ昇格する

## 目的

新機能を追加したときに「今回の1枚が良くなった」ではなく、10種類の資料全体で品質が落ちていないかを検査する。

## カバレッジ

1. AIオーダー運用診断 — executive / diagnostic
2. クーポン効果測定 — evidence / causal caution
3. 売変診断 — ranking / matrix
4. 感謝デー採算 — simulation / decision
5. IDブリッジ — technical architecture
6. 年末発注 — operational plan
7. 生成AI・Cloud投資 — executive proposal
8. Copilotクレジット — cost governance
9. 店舗週報 — workflow redesign
10. 2027デジタルチーム — strategy roadmap

## 各Benchmarkの契約

各 `BMxx.json` は以下を持つ。

- brief / audience / objective
- synthetic evidence
- target slide count
- candidate golden pattern deck
- benchmark tags

`golden.patternDeck` を Scene Graph へ解決し、PPT / HTML / PNGへ再生成できる。

## 評価

`evaluation-rubric.v1.json` の100点満点。特に Content fit / Layout / Render safety は blocking。

## Golden昇格

Review Catalogで `APPROVE GOLDEN` が付いたDeckだけを正式Goldenとする。承認前は candidate-golden。
