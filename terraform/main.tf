terraform {
  required_version = ">=1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "code-runner-700213288059-ap-northeast-1-an"
    key    = "code-runner/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      project   = "code-runner"
      ManagedBy = "terraform"
    }
  }
}