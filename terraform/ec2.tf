data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] #canonial

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "code_runner_deployer"
  public_key = file(var.ssh_public_key_path)
}

# SSM access for GitHub Actions deployment
resource "aws_iam_role" "ssm_role" {
  name = "code-runner-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = { Name = "code-runner-ssm-role" }
}

# pre-specified managed policy by aws
resource "aws_iam_role_policy_attachment" "ssm_managed" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "code-runner-ssm-profile"
  role = aws_iam_role.ssm_role.name
}

resource "aws_instance" "code_runner" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = aws_key_pair.deployer.key_name
  iam_instance_profile   = aws_iam_instance_profile.ssm_profile.name

  user_data = file("${path.module}/scripts/bootstrap.sh")

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = { Name = "code-runner-server" }
}
