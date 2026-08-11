# WEB Code Runner  

>Web上でコードを実行するコードランナープロジェクトです。  
>ユーザーが提出したコードを隔離された環境で実行し、実行結果を返還します。
---

# Demo

---

# Features

- 
- 
- 
- 
- 
- 
- 

---

# Architecture Overview

```mermaid
flowchart LR
    A[Frontend] --> B[API Server]
    B --> C[Execution Backend]
    C --> D[Docker + gVisor + seccomp<br/>隔離実行環境]
    D --> B
```
---

# Backend architecture  
![Deploy README](src/README.md)
---

# Devops architecture  
![Deploy README](terraform/README.md)
---

# Deploy steps
![Deploy README](.github/workflows/README.md)
---

# Tech Stack

## Frontend

- 
-

## Backend

- TypeScript
- Hono
- Docker

## Devops

- Terraform

## Cloud

- AWS EC2

## Deployment

- GitHub Actions

---

# Challenge

## 

---

## 

---

## 

---

# Goals

- 
- 
- 
- 
- 
- 
- 

---
