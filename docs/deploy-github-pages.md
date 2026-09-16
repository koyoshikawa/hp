# 公開手順: GitHub Pages ＋ sian.bz（2026-09-16）

## 構成

- リポジトリ: https://github.com/koyoshikawa/hp （公開、masterブランチのルートを配信）
- GitHub Pages カスタムドメイン: `sian.bz`（リポジトリ直下の `CNAME` ファイル）
- DNS: ムームードメイン（ムームーDNS）管理。メールはGoogle Workspace（MX設定済み）

## GitHub側（完了済み・Claude作業）

1. リポジトリ `koyoshikawa/hp` 作成、masterをプッシュ
2. Pages有効化（source: master / ルート）
3. カスタムドメイン `sian.bz` 設定（`CNAME` ファイル）
4. DNS反映・証明書発行後に HTTPS強制（https_enforced）をONにする ← **未・DNS反映待ち**

## ムームーDNS側（ユーザー作業）

ムームードメインのコントロールパネル → 「ムームーDNS」→ sian.bz の「変更」→ **カスタム設定** で
以下の**5行を追加**する（既存行はそのまま残す）:

| サブドメイン | 種別 | 内容 |
|---|---|---|
| （空欄） | A | 185.199.108.153 |
| （空欄） | A | 185.199.109.153 |
| （空欄） | A | 185.199.110.153 |
| （空欄） | A | 185.199.111.153 |
| www | CNAME | koyoshikawa.github.io |

### ⚠️ 注意

- **既存のMXレコード（SMTP.GOOGLE.COM）は絶対に削除・変更しない**（メールが止まります）
- 上記はWeb用のA/CNAMEの追加のみ。他の行には触らない

## 反映確認

1. 設定後、数分〜1時間程度で `http://sian.bz/` が表示される（最大48時間）
2. 表示されたらClaudeに「DNS設定したよ」と伝える → 確認の上、HTTPS強制をONにする
   （GitHubのSSL証明書発行はDNS反映後、自動で最大24時間）
3. 以降のサイト更新は `git push` だけで数分後に反映される

## トラブル時

- `nslookup sian.bz` で 185.199.108〜111.153 が返れば DNS はOK
- Pagesの状態: https://github.com/koyoshikawa/hp/settings/pages
