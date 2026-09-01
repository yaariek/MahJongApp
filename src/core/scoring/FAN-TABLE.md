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

| Pattern                                            |  番 | Status                                                        |
| -------------------------------------------------- | --: | ------------------------------------------------------------- |
| 無花                                               |   1 | ready                                                         |
| 正花                                               |   2 | ready (needs seat→flower-number rule confirmed)               |
| 爛花                                               |   1 | ready (needs definition confirmed)                            |
| 碰出東/南/西/北 — 正風 (門風 or 圈風)              |   2 | done                                                          |
| 碰出東/南/西/北 — 客風 (neither)                   |   1 | done                                                          |
| 碰出中/發/白 (番子刻)                              |   2 | done                                                          |
| 聽牌 (叮)                                          |   5 | needs wait                                                    |
| 雞糊                                               |  10 | ready (needs interaction with 平糊/將眼 confirmed)            |
| 對碰 (雙碰待)                                      |   1 | needs wait                                                    |
| 假獨                                               |   1 | needs wait                                                    |
| 獨獨 (單釣)                                        |   2 | needs wait                                                    |
| 平糊                                               |   3 | done                                                          |
| 將眼 (pair is 2/5/8)                               |   1 | done                                                          |
| 老少 (123 + 789, one suit)                         |   2 | done                                                          |
| 無字 (no honors)                                   |   1 | done                                                          |
| 無字花 (no honors, no flowers)                     |   5 | ready                                                         |
| 無字花平大平糊                                     |  10 | ready                                                         |
| 海底撈月                                           |  20 | needs flags                                                   |
| 自摸 (with an exposed meld)                        |   1 | done                                                          |
| 門清 (concealed, won by discard)                   |   3 | done                                                          |
| 門清自摸 (不求人)                                  |   5 | done                                                          |
| 花上食糊                                           |   1 | needs flags                                                   |
| 摃上食糊                                           |   1 | needs flags                                                   |
| 搶摃食糊                                           |   1 | needs flags                                                   |
| 摃上摃食糊                                         |  30 | needs flags                                                   |
| 搶摃上摃食糊                                       |  30 | needs flags                                                   |
| 二暗刻                                             |   3 | done                                                          |
| 三暗刻                                             |  10 | done                                                          |
| 四暗刻                                             |  30 | done                                                          |
| 五暗刻                                             |  80 | done                                                          |
| 一般高 (2 identical 順, one suit)                  |   3 | done                                                          |
| 三般高                                             |  15 | done                                                          |
| 四般高                                             |  30 | done                                                          |
| 二相逢 (same-rank 順, 2 suits)                     |   2 | done                                                          |
| 三相逢 (三色同順)                                  |  10 | done                                                          |
| 四同順                                             |  20 | done                                                          |
| 五同順                                             |  40 | n/a (needs 5 copies of one 順 — impossible in a 16-tile hand) |
| 二兄弟 (same-rank 刻, 2 suits)                     |   3 | done                                                          |
| 小三兄弟 (三色同刻, 2 concealed)                   |  10 | done                                                          |
| 大三兄弟 (三色同刻)                                |  15 | done                                                          |
| 小三姊妹                                           |   8 | done                                                          |
| 大三姊妹                                           |  15 | done                                                          |
| 四歸一                                             |   5 | done                                                          |
| 四歸二                                             |  10 | done                                                          |
| 四歸四                                             |  20 | done                                                          |
| 明龍 (123-456-789 one suit, exposed)               |  10 | done                                                          |
| 暗龍                                               |  20 | done                                                          |
| 明雜龍 (mixed-suit 1-9 run)                        |   8 | done (one leg per suit — 三色)                                |
| 暗雜龍                                             |  15 | done                                                          |
| 五門齊 (m + p + s + wind + dragon)                 |  10 | done                                                          |
| 缺一門 (one of m/p/s missing)                      |   5 | done                                                          |
| 混一色 (one suit + honors)                         |  30 | done                                                          |
| 清一色 (one suit, no honors)                       |  80 | done                                                          |
| 對對糊                                             |  30 | done                                                          |
| 全求人 (all sets claimed, 單釣 win by discard)     |  15 | done                                                          |
| 半求人 (all sets claimed, 單釣 self-draw; no 暗槓) |   8 | done                                                          |
| 七只內                                             |  20 | needs turn count                                              |
| 十只內                                             |  10 | needs turn count                                              |
| 小三元 (2 dragon 刻 + dragon pair)                 |  20 | done                                                          |
| 大三元 (3 dragon 刻)                               |  40 | done                                                          |
| 小三風 (2 wind 刻 + wind pair)                     |  15 | done                                                          |
| 大三風 (3 wind 刻)                                 |  30 | done                                                          |
| 小四喜 (3 wind 刻 + wind pair)                     |  60 | done                                                          |
| 大四喜 (4 wind 刻)                                 |  80 | done                                                          |
| 十三么                                             |  80 | special hand                                                  |
| 十六不搭 (九唔搭)                                  |  40 | special hand                                                  |
| 間間糊                                             | 100 | ready (needs definition confirmed)                            |
| 嚦咕嚦咕                                           |  40 | special hand                                                  |
| 一台花 (4 plants or 4 seasons)                     |  10 | ready                                                         |
| 兩台花 (4 plants and 4 seasons)                    |  30 | ready                                                         |
| 混么 (whole hand only 1/9 + 字, no 順)             |  30 | done                                                          |
| 全帶混么 (every group carries 1/9 or 字, has 順)   |  10 | done                                                          |
| 全帶么                                             |  15 | done                                                          |
| 清么 (terminal in every set, no honors)            |  80 | done                                                          |
| 人糊                                               |  80 | needs flags                                                   |
| 天糊                                               | 100 | needs flags                                                   |
| 地糊                                               |  90 | needs flags                                                   |

## Definitions the user confirmed (2026-08-31)

1. **Wind 刻 stacking** — a wind 刻 that is BOTH the round wind and the seat wind
   scores **圈風刻 + 門風刻 = 4**. (Implemented.)
2. **雞糊** — "胡出時（不計莊前）只得一番": the hand's own patterns total exactly
   **1 番** (excluding 連莊/拉莊). Such a hand scores 雞糊 = 10, **replacing** that
   1 番. (Not yet implemented — needs a finalize pass in `scoreHand`.)
3. **正花** — flower number == seat number (seatWind E/S/W/N → 1/2/3/4), matched
   separately for the plant set (hp1-4) and the season set (hs1-4), **2 番 per
   matching flower**. **爛花** — a flower whose number is not the seat's, **1 番
   each**. (Seat number comes from `HandContext.seatWind`, already present.)
4. **兄弟** — two 刻子 of the same number in different suits (二兄弟 3).
   **小三兄弟** — 二兄弟 plus the pair is that same number in the third suit (10).
   **大三兄弟** — the same number as a 刻 in all three suits (15).
   **姊妹** — two 刻子 of consecutive numbers in the same suit.
   **小三姊妹** — two consecutive 刻 + the pair continues the run, same suit (8).
   **大三姊妹** — three consecutive 刻 in one suit (15).
   **四歸一** — all four copies of one tile used: 3 in a 刻 + 1 in a 順 (5).
   **四歸二** — all four copies: 2 as the pair + 2 in 順子 (10).
   **四歸四** — all four copies, each in a 順子 (20).
5. **間間糊** — 自摸 + 門前 + 對對糊 = 100, **replacing** 對對糊 + 不求人. (Not yet
   implemented — same finalize pass as 雞糊.)
6. **般高** — two identical 順 (same suit + ranks): 一般高 3 / 三般高 15 / 四般高 30
   for 2 / 3 / 4 copies. **相逢** — the same 順 rank in different suits: 二相逢 2 /
   三相逢 10 for 2 / 3 suits. **四同順** — four 順 of one rank in any mix of suits
   (20); when it applies you do NOT also count 三相逢 / 一般高 / 三般高 for that
   rank. (Implemented.)
7. **半求人** — 全副牌落地 (all five sets are claimed melds), 單釣 pair wait, won
   by 自摸. 明槓 counts as 落地; 暗槓 does not. **全求人** is the same but won on a
   discard. (Implemented.)
8. **混么** — 全副牌都是么九及番子 (every tile is a 1/9 or 字牌; no 順) = 30.
   **全帶混么** — 每一組合都有么九或番子 (every set + pair carries a 1/9 or 字牌,
   with a 順) = 10. So 混么 30 (no 順) > 全帶混么 10 (with 順) > … and the pure
   versions 清么 80 / 全帶么 15 sit alongside. (Implemented.)
9. **無字 / 無花 / 無字花 / 大平糊 — one mutually-exclusive ladder, top tier only:**
   - **大平糊 10** — 平糊 + no 字牌 + no 花. Counted _instead of_ 平糊 (3) and
     instead of 無字花.
   - **無字花 5** — no 字牌 + no 花, hand is not a 平糊. Instead of 無字 + 無花.
   - **無字 1** — no 字牌 (but holds ≥1 花).
   - **無花 1** — no 花 (but holds ≥1 字牌).

   So the current standalone `mouZi` (無字 1) evaluator must be folded into this
   ladder, which also needs `hand.flowers`. (Blocked on 花 plumbing.)

Still to confirm: do 正花 / 爛花 stack with 一台花 (10, all 4 of one set) / 兩台花
(30, all 8)? i.e. all 8 flowers — is that 兩台花 30 alone, or 兩台花 + 2 正花 +
6 爛花?
