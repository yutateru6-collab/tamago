# Cloudflare公開

## Workers Git連携

Cloudflareの Workers & Pages → Create application → GitHubからインポート → yutateru6-collab/tamago → main。

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Node.js: 24

`wrangler.jsonc`は`dist/client`を静的配信する。DBや有料APIは不要。Cloudflareで初回のGitHubリポジトリ接続が必要。

## Pagesを使う場合

Build command: `npm run build`、Output directory: `dist/client`、Node.js: 24。

## GitHub Actionsで公開URLを検証

Actions → Verify → Run workflow → `app_url` に発行されたHTTPS URLを入れる。ローカルビルドのブラウザテスト後、同じ操作を公開URLでも実行する。ブラウザごとに隔離されたテスト用ローカル保存を使うため、利用者の進行データは変更しない。

push時はドメインロジック12件、型検査・ビルド、制作/帰還/保存/悪化のブラウザテストを実行。失敗時の画像とトレースをActions artifactに残す。公開URLテストを実行していない場合、Cloudflare上での検証済みとは扱わない。
