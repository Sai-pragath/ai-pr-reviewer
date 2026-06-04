#!/bin/bash
set -e

echo "=========================================="
echo "AI Pull Request Reviewer - EC2 Bootstrap"
echo "=========================================="

# 1. Update OS Package Index
echo ">>> Updating apt package listings..."
sudo apt-get update -y

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker CE..."
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
    echo ">>> Docker is already installed: $(docker --version)"
fi

# 3. Enable Docker Daemon on System Startup
sudo systemctl enable docker
sudo systemctl start docker

# 4. Generate local .env configuration file if missing
if [ ! -f .env ]; then
    echo ">>> Creating template .env file..."
    cat <<EOT > .env
# LLM Providers Keys Configuration
# Un-comment and fill in API keys to use Claude or Gemini. If left blank, Stub Reviewer mode is run.
# LLM_PROVIDER=claude
# CLAUDE_API_KEY=your-anthropic-api-key-here

# LLM_PROVIDER=gemini
# GEMINI_API_KEY=your-google-gemini-api-key-here
EOT
    echo "!!! Generated .env file template. Please edit it to add your LLM API Keys before restarting."
fi

# 5. Boot containerized stack using docker compose
echo ">>> Booting system stack via Docker Compose..."
sudo docker compose up --build -d

# 6. Verify service health
echo ">>> Validating service health status..."
sleep 10
sudo docker compose ps

echo "=========================================="
echo "Deployment Finished Successfully!"
echo "Gateway endpoint running on port 80"
echo "Grafana Dashboard running on port 80/grafana"
echo "=========================================="
