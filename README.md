# TECHNO QUIZ — Standalone Desktop & Multi-Laptop Setup Guide

Run TECHNO QUIZ completely offline or across multiple laptops on the same Wi-Fi network without depending on Claude or external cloud services.

---

## 1. Prerequisites

- **Node.js**: Version 18 or higher (Download from [nodejs.org](https://nodejs.org))
- **(Optional) Local LLM**: [Ollama](https://ollama.com/) or [LM Studio](https://lmstudio.ai/) for offline AI question generation.

---

## 2. Quick Start on Your Main Laptop (Host Console)

1. Open your terminal in the project folder:
   ```bash
   cd /path/to/techno-quiz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   # or for live development mode:
   npm run dev
   ```

4. Open your browser on the host laptop:
   ```
   http://localhost:3000
   ```

---

## 3. Connecting Other Laptops / Devices (Buzzer Mode)

Make sure the host laptop and the participant laptops are connected to the **same Wi-Fi or local network**.

1. Look at the terminal output or click **"Connect Laptops"** in the host console header. You will see your local LAN IP address, for example:
   ```
   http://192.168.1.45:3000
   ```

2. On the participant laptops or phones, open that address:
   - To let them choose their team:
     ```
     http://192.168.1.45:3000/?role=buzzer
     ```
   - Or send direct auto-assigned team links:
     - Team 1: `http://192.168.1.45:3000/?role=buzzer&team=0`
     - Team 2: `http://192.168.1.45:3000/?role=buzzer&team=1`
     - Team 3: `http://192.168.1.45:3000/?role=buzzer&team=2`
     - ...up to Team 8 (`&team=7`)

3. All buzzers synchronize instantly over low-latency WebSockets with millisecond timing shown in the **"Live Tracking & Status"** table.

---

## 4. Installing as a Standalone Desktop App (Borderles Window)

You can run TECHNO QUIZ as a native desktop application with no browser bars:

1. Open `http://localhost:3000` in **Google Chrome**, **Microsoft Edge**, or **Brave**.
2. Click the **"Install Desktop App"** button in the top navigation bar (or click the install icon in the browser address bar).
3. The app is now installed on your desktop and in your OS Applications menu as **TECHNO QUIZ**.

---

## 5. (Optional) Using a Local LLM for Question Generation

If you want the host console to generate fresh questions offline:

1. Install and launch **Ollama**:
   ```bash
   ollama run llama3
   ```
   *(Or run LM Studio with the local server enabled on port 1234)*.

2. In the TECHNO QUIZ console, click the **"🤖 Local LLM Studio"** tab.
3. Select **Ollama** (`http://localhost:11434`) and click **"Generate with Local LLM"**.
4. Click **"Add as Bonus Question"** or **"Replace Active Question"** to insert it directly into the game.
