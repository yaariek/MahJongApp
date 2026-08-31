# House 番 table (計番表)

The user's group's agreed 番 values. **This file is the source of truth** for the
numbers in `evaluators.ts` — when a pattern is implemented, its `fan` must match
the value here. Grow `EVALUATORS` one fixture at a time (see `CLAUDE.md`).

Terms are the user's own (HK-Taiwanese: 胡/糊 both appear in the wild — code uses
糊 per `evaluators.ts` naming rule). Status:

- **done** — evaluator implemented, value matches.
- **ready** — implementable from the current `Hand` + `HandContext` alone.
- **needs wait** — depends on the pre-win wait shape (聽牌 / 單釣 / 雙碰 …), which
  the engine does not model yet.
- **needs flags** — depends on `HandContext.flags` (搶槓 / 海底 / 槓上 / 天 / 地),
  deferred in the UI.
- **needs turn count** — depends on how many draws/discards the hand took.
- **special hand** — not `5 sets + 1 pair`; the parser can't produce it, needs a
  dedicated recogniser.

| Pattern                                             |  番 | Status                                             |
| --------------------------------------------------- | --: | -------------------------------------------------- |
| 無花                                                |   1 | ready                                              |
| 正花                                                |   2 | ready (needs seat→flower-number rule confirmed)    |
| 爛花                                                |   1 | ready (needs definition confirmed)                 |
| 碰出東/南/西/北 — 正風 (門風 or 圈風)               |   2 | done                                               |
| 碰出東/南/西/北 — 客風 (neither)                    |   1 | done                                               |
| 碰出中/發/白 (番子刻)                               |   2 | done                                               |
| 聽牌 (叮)                                           |   5 | needs wait                                         |
| 雞糊                                                |  10 | ready (needs interaction with 平糊/將眼 confirmed) |
| 對碰 (雙碰待)                                       |   1 | needs wait                                         |
| 假獨                                                |   1 | needs wait                                         |
| 獨獨 (單釣)                                         |   2 | needs wait                                         |
| 平糊                                                |   3 | done                                               |
| 將眼 (pair is 2/5/8)                                |   1 | ready                                              |
| 老少 (123 + 789, one suit)                          |   2 | ready                                              |
| 無字 (no honors)                                    |   1 | ready                                              |
| 無字花 (no honors, no flowers)                      |   5 | ready                                              |
| 無字花平大平糊                                      |  10 | ready                                              |
| 海底撈月                                            |  20 | needs flags                                        |
| 自摸 (with an exposed meld)                         |   1 | done                                               |
| 門清 (concealed, won by discard)                    |   3 | done                                               |
| 門清自摸 (不求人)                                   |   5 | done                                               |
| 花上食糊                                            |   1 | needs flags                                        |
| 摃上食糊                                            |   1 | needs flags                                        |
| 搶摃食糊                                            |   1 | needs flags                                        |
| 摃上摃食糊                                          |  30 | needs flags                                        |
| 搶摃上摃食糊                                        |  30 | needs flags                                        |
| 二暗刻                                              |   3 | done                                               |
| 三暗刻                                              |  10 | done                                               |
| 四暗刻                                              |  30 | done                                               |
| 五暗刻                                              |  80 | done                                               |
| 一般高 (2 identical 順, one suit)                   |   3 | ready                                              |
| 三般高                                              |  15 | ready                                              |
| 四般高                                              |  30 | ready                                              |
| 二相逢 (same-rank 順, 2 suits)                      |   2 | ready                                              |
| 三相逢 (三色同順)                                   |  10 | ready                                              |
| 四同順                                              |  20 | ready                                              |
| 五同順                                              |  40 | ready                                              |
| 二兄弟 (same-rank 刻, 2 suits)                      |   3 | done                                               |
| 小三兄弟 (三色同刻, 2 concealed)                    |  10 | done                                               |
| 大三兄弟 (三色同刻)                                 |  15 | done                                               |
| 小三姊妹                                            |   8 | done                                               |
| 大三姊妹                                            |  15 | done                                               |
| 四歸一                                              |   5 | done                                               |
| 四歸二                                              |  10 | done                                               |
| 四歸四                                              |  20 | done                                               |
| 明龍 (123-456-789 one suit, exposed)                |  10 | done                                               |
| 暗龍                                                |  20 | done                                               |
| 明雜龍 (mixed-suit 1-9 run)                         |   8 | done (one leg per suit — 三色)                     |
| 暗雜龍                                              |  15 | done                                               |
| 五門齊 (m + p + s + wind + dragon)                  |  10 | ready                                              |
| 缺一門 (one of m/p/s missing)                       |   5 | ready                                              |
| 混一色 (one suit + honors)                          |  30 | done                                               |
| 清一色 (one suit, no honors)                        |  80 | done                                               |
| 對對糊                                              |  30 | done                                               |
| 全求人 (all sets claimed, win by discard)           |  15 | ready                                              |
| 半求人                                              |   8 | ready (needs def confirmed)                        |
| 七只內                                              |  20 | needs turn count                                   |
| 十只內                                              |  10 | needs turn count                                   |
| 小三元 (2 dragon 刻 + dragon pair)                  |  20 | done                                               |
| 大三元 (3 dragon 刻)                                |  40 | done                                               |
| 小三風 (2 wind 刻 + wind pair)                      |  15 | done                                               |
| 大三風 (3 wind 刻)                                  |  30 | done                                               |
| 小四喜 (3 wind 刻 + wind pair)                      |  60 | done                                               |
| 大四喜 (4 wind 刻)                                  |  80 | done                                               |
| 十三么                                              |  80 | special hand                                       |
| 十六不搭 (九唔搭)                                   |  40 | special hand                                       |
| 間間糊                                              | 100 | ready (needs definition confirmed)                 |
| 嚦咕嚦咕                                            |  40 | special hand                                       |
| 一台花 (4 plants or 4 seasons)                      |  10 | ready                                              |
| 兩台花 (4 plants and 4 seasons)                     |  30 | ready                                              |
| 混么 (terminal/honor in every set + pair, has a 順) |  30 | ready                                              |
| 全帶混么                                            |  10 | ready (needs def confirmed vs 混么)                |
| 全帶么                                              |  15 | ready                                              |
| 清么 (terminal in every set, no honors)             |  80 | ready                                              |
| 人糊                                                |  80 | needs flags                                        |
| 天糊                                                | 100 | needs flags                                        |
| 地糊                                                |  90 | needs flags                                        |

## Definitions the user confirmed (2026-08-31)

1. **Wind 刻 stacking** — a wind 刻 that is BOTH the round wind and the seat wind
   scores **圈風刻 + 門風刻 = 4**. (Implemented.)
2. **雞糊** — "胡出時（不計莊前）只得一番": the hand's own patterns total exactly
   **1 番** (excluding 連莊/拉莊). Such a hand scores 雞糊 = 10. _Open: does the 10
   replace that 1 番 or add to it? Assumed **replace** pending confirmation._
3. **正花** — flower number == seat number (E=1, S=2, W=3, N=4), matched
   separately for the plant set and the season set. **爛花** — a flower whose
   number is not the seat's. _Open: is 正花 = 2 per matching flower or per hand?
   Interaction with 一台花 / 兩台花?_
4. **兄弟** — two 刻子 of the same number in different suits (2 番: 二兄弟 3).
   **小三兄弟** — 二兄弟 plus the pair is that same number in the third suit (10).
   **大三兄弟** — the same number as a 刻 in all three suits (15).
   **姊妹** — two 刻子 of consecutive numbers in the same suit.
   **小三姊妹** — two consecutive 刻 + the pair continues the run, same suit (8).
   **大三姊妹** — three consecutive 刻 in one suit (15).
   **四歸一** — all four copies of one tile used: 3 in a 刻 + 1 in a 順 (5).
   **四歸二** — all four copies: 2 as the pair + 2 in 順子 (10).
   **四歸四** — all four copies, each in a 順子 (20).
5. **間間糊** — 自摸 + 門前 + 對對糊 = 100. _Open: replace or stack with 對對糊 /
   不求人?_

Still to confirm before implementing: the 般高 / 相逢 / 同順 triad (how the three
names divide up 二色/三色/duplicate 順), 全求人 / 半求人, 全帶混么 vs 混么, and the
replace-vs-stack questions in 2 / 3 / 5 above.
