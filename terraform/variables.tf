variable "my_ip_cidr" {
  description = "Your local IP in CIDR form , e.g. 1.2.3.4/32. used to restrict ssh access"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to your local SSH public key (e.g. ~/.ssh/id_ed25519.pub)"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}