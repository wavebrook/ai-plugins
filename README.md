# Wavebrook for AI assistants

Connect your AI assistant to your [Wavebrook Dashboard](https://dashboard.wavebrook.com) account. Ask how your NetSignal SDK apps are doing, what you earned and what's holding up a payout, in plain language.

This repo packages the Wavebrook remote MCP server for Claude, ChatGPT, Codex, Cursor, VS Code, Gemini CLI and others. It also ships one skill that teaches the assistant our vocabulary, metrics and common workflows.

MCP server URL:

```
https://mcp.wavebrook.com/mcp
```

You sign in with your Wavebrook Dashboard account. There are no API keys to copy.

## What it can do

- Show your account, apps, DAU, consent % and location %.
- Report earnings by month, app and Partner, and list your payouts.
- Explain alerts, such as a drop in location DAU.
- Read your dashboard notifications and legal documents.
- If you allow changes: add a new app, refresh an app from its store listing and mark notifications as read.

Some things stay in the dashboard: accepting updated terms, payout details, and deleting apps or your account. Wavebrook admins handle Partner activation.

## Privacy

- The assistant only sees what you approve when you sign in. By default that's read-only access to your own account.
- Changes need a separate opt-in: tick **Also let it make changes** on the sign-in screen.
- Disconnect any time at **Account → Connected apps** in the Wavebrook Dashboard.
- Only publisher accounts can connect.

## Install

### Claude.ai and Claude Desktop

1. Go to **Customize → Connectors**.
2. Click **Add custom connector**.
3. Enter the name `Wavebrook` and the URL `https://mcp.wavebrook.com/mcp`.
4. Click **Add**, then **Connect** and sign in.

On Team and Enterprise plans, an Owner adds it at **Organization settings → Connectors → Add → Custom → Web**. Members then connect from **Customize → Connectors**. If the dialog asks for an OAuth client, choose **Register automatically**.

### Claude Code

Install the plugin, which adds the server and the skill:

```sh
claude plugin marketplace add wavebrook/ai-plugins
claude plugin install wavebrook@wavebrook
```

Or add only the server:

```sh
claude mcp add --transport http wavebrook https://mcp.wavebrook.com/mcp
```

Then run `/mcp` in Claude Code and sign in.

### ChatGPT

Developer mode is available on the web for Plus, Pro, Business, Enterprise and Education accounts.

1. Open **Settings → Security and login** and turn on **Developer mode**.
2. Go to [ChatGPT Plugins](https://chatgpt.com/plugins) and select the plus button.
3. Enter the name `Wavebrook` and the MCP server URL `https://mcp.wavebrook.com/mcp`. Choose OAuth if asked.
4. Sign in when prompted.

On Business and Enterprise workspaces, your admin may need to enable developer mode first.

### Codex

Install the plugin:

```sh
codex plugin marketplace add wavebrook/ai-plugins
codex plugin add wavebrook@wavebrook
codex mcp login wavebrook
```

Or add only the server to `~/.codex/config.toml`:

```toml
[mcp_servers.wavebrook]
url = "https://mcp.wavebrook.com/mcp"
```

Then sign in:

```sh
codex mcp login wavebrook
```

### Cursor

[Add to Cursor](https://cursor.com/en/install-mcp?name=wavebrook&config=eyJ1cmwiOiJodHRwczovL2Rhc2hib2FyZC53YXZlYnJvb2suY29tL2FwaS9tY3AifQ==)

If the link doesn't open Cursor, paste this deeplink into your browser:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=wavebrook&config=eyJ1cmwiOiJodHRwczovL2Rhc2hib2FyZC53YXZlYnJvb2suY29tL2FwaS9tY3AifQ==
```

Or add it to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wavebrook": {
      "url": "https://mcp.wavebrook.com/mcp"
    }
  }
}
```

Cursor also reads the plugin in this repo, skill included.

### VS Code and GitHub Copilot

Paste this install link into your browser:

```
vscode:mcp/install?%7B%22name%22%3A%22wavebrook%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fdashboard.wavebrook.com%2Fapi%2Fmcp%22%7D
```

Or add it to `.vscode/mcp.json`:

```json
{
  "servers": {
    "wavebrook": {
      "type": "http",
      "url": "https://mcp.wavebrook.com/mcp"
    }
  }
}
```

VS Code opens a browser window to sign in the first time you use it.

### Gemini CLI

```sh
gemini extensions install https://github.com/wavebrook/ai-plugins
```

Then run `/mcp auth wavebrook` in Gemini CLI and sign in.

### Windsurf

Community-tested only. Add this to your MCP config file (`mcp_config.json`):

```json
{
  "mcpServers": {
    "wavebrook": {
      "serverUrl": "https://mcp.wavebrook.com/mcp"
    }
  }
}
```

### OpenClaw

```sh
openclaw plugins install wavebrook --marketplace wavebrook/ai-plugins
```

OpenClaw loads the MCP server from the plugin. Its docs don't yet confirm OAuth sign-in for remote servers, so this may not connect. If it doesn't, use another client.

## Example prompts

- "How much did my apps earn last month, by Partner?"
- "Compare this month's DAU with last month for each app."
- "Why did location DAU drop on my Android app this week?"
- "What's blocking my next payout?"
- "Do I have any updated terms to accept?"
- "Add this app to my Wavebrook account: https://play.google.com/store/apps/details?id=com.example.app"

## Troubleshooting

- **Sign-in keeps looping or is refused.** You must sign in with an active publisher account. Partner and staff accounts can't connect.
- **"We've updated our terms".** Accept them at [dashboard.wavebrook.com/re-accept](https://dashboard.wavebrook.com/re-accept), then ask again.
- **The assistant can't add apps.** You didn't allow changes at sign-in. Disconnect at **Account → Connected apps**, connect again and tick **Also let it make changes**.
- **Disconnect an assistant.** Go to [Account → Connected apps](https://dashboard.wavebrook.com/account/connected-apps).

## Support

Email [contact@wavebrook.com](mailto:contact@wavebrook.com).

## Licence

MIT. See [LICENSE](LICENSE).
