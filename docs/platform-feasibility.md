# 技術的な実現性

結論：探索・制作の留守中進行は実現しやすい。難所は「スマホを使っていなかった」ことをOSの制限内で正しく判断する部分。

| 項目 | 対応 |
|---|---|
| 留守中の探索・制作 | 常時描画せず、次回起動時に確かな時間区間から結果を計算 |
| iOS | Family Controls / Device Activity。個人の承認、プライバシー保護された選択、スケジュール/閾値などに制約。任意の生の全端末使用履歴を取れるとは限らない |
| Android | UsageStatsManager。ユーザーによる利用状況アクセス許可が必要。イベント保持期間・端末状態による欠損あり |
| ブラウザ | タブ非表示や画面を閉じたことは分かっても、他アプリの使用を測れない |
| 権限取消/欠損 | 不明として停止。キャラが悪化する理由にしない |
| 電池 | 毎秒バックグラウンド実行を避け、OSイベントと起動時の再計算を使う |
| プライバシー | 集計結果を端末内で扱う方針。生のアプリ使用履歴をサーバーへ送らない |

iOSは配布前のFamily Controls entitlement申請が別途必要。ここはWebのコードだけでは確認できない。Mac/Xcodeと実機で技術検証した後、ゲームの正確な計測ルールを決める。

「使用時間が少ない」を「全時間スマホを置いた」と置き換えない。選択アプリだけ測る場合は、その範囲をユーザーにも明示する。遅延通知やイベント欠落に対して誤罰しないことを優先する。

## 一次資料（2026-09-17確認）

- [Apple: What's new in Screen Time API](https://developer.apple.com/videos/play/wwdc2022/110336/) — 個人認証、Device Activity、プライバシー。
- [Apple: Family Controls](https://developer.apple.com/documentation/familycontrols) — 配布用権限。
- [Android: UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager) — 使用状況へのアクセスとイベントの制約。
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — 可視性判定とタイマー抑制。
