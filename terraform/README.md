# terraform/ — インフラ構築とバックエンド実行フロー
 
AWSインフラをTerraformで管理しています。
 
## Terraformが作成するリソース
 
```mermaid
flowchart TD
    subgraph VPC["VPC (10.0.0.0/16)"]
        subgraph Subnet["Public Subnet"]
            EC2["EC2 (t3.small, Ubuntu 22.04)"]
            SG["Security Group<br/>SSH: 自分のIPのみ許可 / HTTP,HTTPS: 全体公開"]
            IAM["IAM Instance Profile<br/>(SSMコマンド受信用の権限)"]
            EC2 --- SG
            EC2 --- IAM
        end
        IGW["Internet Gateway"]
        RT["Route Table<br/>0.0.0.0/0 → IGW"]
        Subnet --> RT --> IGW
    end
    S3["S3 backend<br/>(Terraform state)"]
    EC2 -. "user_data(bootstrap.sh)<br/>起動時にDocker/Nodeを自動インストール" .-> EC2
```
 
Stateファイルは、S3 backend(`code-runner-tfstate-*`)でリモート管理しています。
 
### ファイル構成
 
| ファイル | 役割 |
|---|---|
| `main.tf` | Provider、S3 backendの設定 |
| `vpc.tf` | VPC、Subnet、IGW、Route Table |
| `security_groups.tf` | インバウンド/アウトバウンドのルール |
| `ec2.tf` | AMIの検索、Key Pair、IAM Role/Instance Profile、EC2インスタンス |
| `variables.tf` | 入力変数（自分のIP、SSHキーのパスなど） |
| `outputs.tf` | Public IP、Instance ID、SSH接続コマンドの出力 |
| `scripts/bootstrap.sh` | EC2初回起動時にDocker + Node.jsをインストール |
 
## ローカルでの実行方法
 
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# my_ip_cidr, ssh_public_key_path の値を入力
 
terraform init
terraform plan
terraform apply
```
 
## バックエンド起動の流れ（EC2起動 〜 サーバー起動まで）
 
```mermaid
sequenceDiagram
    participant EC2 as EC2 Instance
    participant Boot as bootstrap.sh (user_data)
    participant PM2 as pm2
 
    EC2->>Boot: 初回起動時に自動実行
    Boot->>Boot: Dockerをインストール (docker-ce, containerdなど)
    Boot->>Boot: ubuntuユーザーをdockerグループに追加
    Boot->>Boot: Node.jsをインストール
    Note over Boot: （手動またはCIで）リポジトリをclone → npm ci
    Boot->>PM2: pm2 start (Honoサーバー)
    PM2->>PM2: pm2 startup + pm2 save<br/>（再起動時にも自動復旧）
```
 
## コード実行リクエストの処理フロー（Dockerによる隔離）
 
```mermaid
sequenceDiagram
    participant Client as Client (Browser)
    participant Hono as Hono Server
    participant Backend as ExecutionBackend
    participant Docker as Docker Container
    participant Judge as Judge
 
    Client->>Hono: コードを送信 (通信方式は現在検討中)
    Hono->>Backend: run()
    Backend->>Docker: spawn (named container)
    Note over Docker: gVisor(runsc)ランタイム<br/>+ seccompプロファイル<br/>（許可されたsyscallのみホワイトリスト方式で通過）
    Docker-->>Backend: 実行結果 / TLE(exitCode 137)
    Backend->>Docker: docker kill（コンテナのクリーンアップ）
    Backend->>Judge: 結果を渡す
    Judge->>Judge: 採点
    Judge-->>Client: 結果を返却
```
 
> gVisor/seccompの詳細設定は、M3.3で追加予定です。
 
## SSMアクセス（デプロイ用）
 
EC2には、SSHポート以外にAWS SSM経由でもコマンドを受け取れるよう、IAM Roleが付与されています。これはCI/CDがSSHを使わずにデプロイするための仕組みです。詳細は [`.github/workflows/README.md`](../.github/workflows/README.md)（準備中）を参照してください。
 
## リソースの削除（コスト管理）
 
```bash
terraform destroy   # 全リソースを削除
```
 
インスタンスのみ一時停止する場合:
```bash
aws ec2 stop-instances --instance-ids $(terraform output -raw instance_id)
```
 
## 7. 稼働状況について
 
コスト管理のため、インスタンスは普段停止しています。デモをご覧になりたい場合は、Issueなどでご連絡いただければ即座に起動いたします。