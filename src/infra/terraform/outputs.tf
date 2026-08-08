output "instance_public_ip" {
  description = "Public IP of the code-runner EC2 instance"
  value       = aws_instance.code_runner.public_ip
}

output "instance_id" {
  description = "Instance ID of the code-runner EC2 instance (used for SSM commands in CI/CD)"
  value = aws_instance.code_runner.id
}

output "ssh_command" {
  description = "Quick SSH command to connect"
  value       = "ssh -i C:/Users/k0105/Downloads/my-ec2-key.pem ubuntu@${aws_instance.code_runner.public_ip}"
}