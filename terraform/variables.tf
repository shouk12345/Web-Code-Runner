variable "my_ip_cidr" {
  description = "Your local IP in CIDR form , e.g. 1.2.3.4/32. used to restrict ssh access"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}