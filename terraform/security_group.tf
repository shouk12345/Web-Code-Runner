resource "aws_security_group" "app" {
  name        = "code-runner-sg"
  description = "HTTP/S open"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "API (via API Gateway)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "code-runner-sg" }
}

