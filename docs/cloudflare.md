# Cloudflare公開

## Workers Git連携

Cloudflareの Workers & Pages → Create application → GitHubからインポート → yutateru6-collab/tamago → main。

- Build command: 空欄で可（Wrangler設定のbuild.commandが`npm run build`を実行）
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Node.js: 24

`wrangler.jsonc`は`dist/client`を静的配信する。DBや有料APIは不要。Cloudflareで初回のGitHubリポジトリ接続が必要。

## Pagesを使う場合

Build command: `npm run build`、Output directory: `dist/client`、Node.js: 24。

## GitHub Actionsで公開URLを検証

Actions → Verify → Run workflow → `app_url` に発行されたHTTPS URLを入れる。ローカルビルドのブラウザテスト後、同じ操作を公開URLでも実行する。ブラウザごとに隔離されたテスト用ローカル保存を使うため、利用者の進行データは変更しない。

push時はドメインロジック12件、型検査・ビルド、制作/帰還/保存/悪化のブラウザテストを実行。失敗時の画像とトレースをActions artifactに残す。公開URLテストを実行していない場合、Cloudflare上での検証済みとは扱わない。

## Wrangler取得時のEINTEGRITY対策

Wrangler 4.134.0をdevDependenciesとlockfileに固定。npm ci時に事前インストールし、npxで毎回最新版を解決する経路を避ける。整合性チェックは無効化しない。GitHub ActionsでもWranglerのdry-runを実行する。Cloudflare側のキャッシュが原因なら、ビルドキャッシュを削除して最新コミットで再実行する。
