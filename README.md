# AI-Powered Pull Request Reviewer

An automated code review agent that listens to GitHub Pull Request webhooks, analyzes diffs using LLMs (Anthropic Claude / Google Gemini), and posts line-by-line feedback comments back onto the PR. It features a React-based admin panel for configuring rules, monitoring review history, and examining team analytics, alongside an observability stack (cAdvisor, Prometheus, Grafana).

## Architecture Overview

```
                                      +--------------------------+
                                      |         GitHub           |
                                      +---+------------------^---+
                                          | Webhook          | POST
                                          | (HMAC verification) Inline comments
                                          v                  |
+-----------------------------------------+------------------+---+
| AWS EC2 Server / Docker Orchestration                          |
|                                                                |
|  +--------------------+      +--------------------+            |
|  |   Nginx Gateway    |----->|   React Frontend   |            |
|  |     (Port 80)      |      |   (Admin Panel)    |            |
|  +---------+----------+      +--------------------+            |
|            |                                                   |
|            v /api                                              |
|  +--------------------+      +--------------------+            |
|  |   Spring Boot      |----->|      LLM API       |            |
|  |     Backend        |      | (Gemini / Claude)  |            |
|  +---------+----------+      +--------------------+            |
|            |                                                   |
|            v                                                   |
|  +--------------------+                                        |
|  |     PostgreSQL     |                                        |
|  |  (History/Rules)   |                                        |
|  +--------------------+                                        |
|                                                                |
|  +--------------------+      +--------------------+            |
|  |      cAdvisor      |----->|     Prometheus     |            |
|  | (Container Stats)  |      |   (Data Scraping)  |            |
|  +--------------------+      +---------+----------+            |
|                                        |                       |
|                                        v                       |
|                              +--------------------+            |
|                              |      Grafana       |            |
|                              |  (Dashboards/Act)  |            |
|                              +--------------------+            |
+----------------------------------------------------------------+
```

---

## Directory Structure

- `/backend`: Spring Boot application. Includes signature checks, GitHub clients, Claude/Gemini adapters, and database logs.
- `/frontend`: React + TypeScript admin panel powered by Vite and a custom dark theme design system.
- `/docker`: Containment configuration subfolders (Nginx configuration and Prometheus metrics-scraping guidelines).
- `docker-compose.yml`: Orchestrates DB, backend, frontend, gateway, and monitoring services.
- `deploy.sh`: One-click setup/bootstrap script for AWS EC2 instances.

---

## Local Setup

### Prerequisite Versions
- Java 17+
- Node.js 18+
- Maven 3.8+

### 1. Running the Spring Boot Backend
1. Modify database credentials in `backend/src/main/resources/application.properties` to connect to a local PostgreSQL database instance.
2. Build and run:
   ```bash
   cd backend
   mvn clean spring-boot:run
   ```
3. The API will start on `http://localhost:8080`. Seeding queries will automatically initialize review rules if the DB is fresh.

### 2. Running the React Frontend
1. Install dependencies and start the Vite development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. The UI will run on `http://localhost:5173`. Requests to `/api` are automatically proxied to the backend.

---

## AWS EC2 Deployment Guide

Follow these steps to deploy the application on a single EC2 server instance:

### Step 1: Launch an AWS EC2 Instance
1. Go to AWS Console &rarr; EC2 &rarr; Launch Instance.
2. Select **Ubuntu Server 22.04 LTS** as the Amazon Machine Image (AMI).
3. Choose an instance size of **t3.medium** (2 vCPUs, 4 GB RAM recommended to build container assets).
4. Configure Security Group Rules to open these inbound ports:
   - **80** (HTTP) - Main Web Gateway (accessing React Admin and API)
   - **22** (SSH) - Terminal Access
5. Download your PEM key pair and launch the instance.

### Step 2: Clone the Repository and Bootstrap
1. SSH into your newly created EC2 instance:
   ```bash
   ssh -i "your-key.pem" ubuntu@<your-ec2-ip>
   ```
2. Transfer or clone this project folder structure to the instance.
3. Move into the project directory:
   ```bash
   cd ai-pr-reviewer
   ```
4. Make the script executable and execute the installer:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *Note: This script installs Docker Engine, setups configuration directories, generates a `.env` template, and boots the container stack.*

### Step 3: Configure LLM Credentials
1. Open the generated `.env` configuration file:
   ```bash
   nano .env
   ```
2. Set your preferred LLM Provider (`claude` or `gemini`) and fill in the API keys:
   ```env
   # Example: Using Google Gemini
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSyD...
   ```
3. Save and close the file (`Ctrl+O`, `Enter`, `Ctrl+X`).
4. Restart the container stack to apply environmental changes:
   ```bash
   sudo docker compose down
   sudo docker compose up -d
   ```

---

## Webhook Integration Setup

1. Open the **React Admin Panel** by going to `http://<your-ec2-ip>` in your web browser.
2. Select **Repositories** from the sidebar menu.
3. Fill in the organization name and repository name in the **Connect GitHub Repository** card.
4. Input your GitHub Personal Access Token (PAT) (requires `repo` scope to retrieve diff files and post reviews).
5. Input a secure webhook signature secret passphrase (e.g. `supersecret-webhook-key`). Save the connection form.
6. Open your GitHub Repository &rarr; **Settings** &rarr; **Webhooks** &rarr; **Add Webhook**:
   - **Payload URL**: `http://<your-ec2-ip>/api/v1/webhooks/github`
   - **Content Type**: `application/json`
   - **Secret**: *Use the exact same passphrase configured in step 5*
   - **Trigger Events**: Choose *Let me select individual events* and check **Pull Requests**.
7. Click **Add Webhook**. The system is now registered and will trigger reviews automatically on new commits/PRs!

---

## Observability & Performance Tracking

- **Prometheus Panel**: Exposes raw JVM and container metrics.
- **Grafana Server**: View system metrics dashboards.
  - URL: `http://<your-ec2-ip>/grafana/`
  - Default Username: `admin`
  - Default Password: `adminpassword` (Configured inside `docker-compose.yml` - change on production setup).
  - *Data Source configuration*: Connect Prometheus data source via target `http://prometheus:9090`.
