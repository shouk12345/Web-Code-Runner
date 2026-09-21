# .github/workflows/ — CI/CD Pipeline
GitHub Actionsを用いてCI/CDを実装しました。
AWS EC2インスタンスへの自動デプロイを含みます。
 
## デプロイ流れ
 
```mermaid
flowchart TD
    A["push to main"] --> B["AWS 資格証明で認証<br/>(IAM User: github-actions-deployer)"]
    B --> C["タッグ(Name=code-runner-server) 基準<br/>実行中のインスタンス動的参照"]
    C --> D{"SSM Agent<br/>Online?"}
    D -- No --> E["Fail: インスタンス確認要請エラー"]
    D -- Yes --> F["デプロイ命令をSSMへ伝送"]
    F --> G["命令実行結果プーリング"]
    G --> H{"Status == Success?"}
    H -- No --> I["Fail: エラーログ出力"]
    H -- Yes --> J["デプロイ成功"]
```

`main` ブランチへpushされるとGitHub Actionsが自動的にデプロイします. SSHを通した直接接続の代わりにAWS Systems Manager(SSM)を使用し, EC2の22番ポートをCIランナーに開放しなくとも命令を遠隔で実行します。
 
## 必要なGitHub Secrets
 
| Secret名 | 用途 |
|---|---|
| `DEPLOY_AWS_ACCESS_KEY_ID` | GitHub ActionsがAWS API(SSM, EC2)を呼び出すためのIAM UserのAccess Key |
| `DEPLOY_AWS_SECRET_ACCESS_KEY` | 上記Access KeyのSecret |
 
> `EC2_INSTANCE_ID`は登録しません。 インスタンスを再生成(destroy/apply)するたびにIDが変わるため, タッグ基準でワークフローが毎回動的に参照します。
 
## デプロイ用IAM User権限
 
`github-actions-deployer`という名前の専用IAM Userを作成し, 以下の最小権限のみを与えます (`AdministratorAccess`を与えない):
 
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations",
        "ssm:DescribeInstanceInformation",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    }
  ]
}
```
 
## SSM選択理由
 
```mermaid
flowchart LR
    subgraph optA["オプションA: SSH開放"]
        A1["Security Groupを<br/>0.0.0.0/0へ開放"] --> A2["ポート22が<br/>インターネットに露出"]
    end
    subgraph optB["オプションB: SSM"]
        B1["IAM基盤認証のみを採用"] --> B2["ポート22は<br/>本人接続用IPのみ維持"]
    end
```
 
GitHub Actionsランナーは毎度違うIPから接続するため、Security Groupを特定IPのみ許容する方式とは合いませんでした。セキュリティ隔離をプロジェクトの重要事項としているため、デプロイ経路で不必要なポート開放を避けるためSSM方式を採用しました。
 
## Secret登録方法
 
```bash
gh secret set DEPLOY_AWS_ACCESS_KEY_ID
gh secret set DEPLOY_AWS_SECRET_ACCESS_KEY
```
 
登録されたsecret目録確認 (値はマスキングされ表示されない):
```bash
gh secret list
```

---

# Frontend Deploy — GitHub Pages

`frontend/`配下の変更が`main`にpushされると, GitHub ActionsがVite + Reactアプリをビルドし, GitHub Pagesへ自動デプロイします。バックエンドのデプロイ(SSM経由)とは完全に独立したワークフローです。

## デプロイ流れ

```mermaid
flowchart TD
    A["push to main<br/>(frontend/** 変更時のみ)"] --> B["Node.js セットアップ<br/>+ npm ci"]
    B --> C["npm run build<br/>(frontend/dist生成)"]
    C --> D["Pages用アーティファクトとして<br/>アップロード"]
    D --> E["GitHub Pagesへデプロイ"]
    E --> F["公開URL発行"]
```

バックエンドのデプロイとの違いは, **AWS認証情報や外部Secretを一切必要としない**点です。GitHub Actionsに標準で付与される`GITHUB_TOKEN`(OIDC経由の短命トークン)だけでPagesへのデプロイが完結します。

## トリガー条件

`frontend/**`以下のファイルが変更されたpushのみでワークフローが起動します。バックエンドのみの変更ではこのワークフローは動作しません。

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
  workflow_dispatch:
```

## 事前設定 — Pages Source

このワークフローが機能するには, リポジトリの **Settings → Pages → Build and deployment → Source** を **"GitHub Actions"** に設定する必要があります(デフォルトの"Deploy from a branch"のままでは動作しません)。

## Base Path設定

GitHub Pagesは`https://<username>.github.io/<repo-name>/`というサブパス配下で公開されるため, `frontend/vite.config.ts`で`base`をリポジトリ名に合わせて明示的に指定しています。指定を忘れるとビルド後のアセットパスが崩れ, 白画面になります。

```ts
export default defineConfig({
  plugins: [react()],
  base: '/repo-name/',
})
```

## バックエンドとの接続

フロントエンド(GitHub Pages)とバックエンドAPI(EC2上のHonoサーバー)は異なるoriginとなるため, バックエンド側でCORS設定が必要です(詳細は`src/README.md`参照)。