import { AlertProvider, AlertData } from "./AlertProvider.js";
import { validateWebhookUrl } from "../../utils/validateUrl.js";

export class DiscordAlertProvider implements AlertProvider {
  async sendAlert(channelConfig: any, data: AlertData): Promise<void> {
    const { webhookUrl } = channelConfig;
    if (!webhookUrl) throw new Error("Discord webhookUrl is missing");
    validateWebhookUrl(webhookUrl);

    const isResolution = data.type === "resolution";
    const isEmergency = data.type === "emergency";

    let statusText = "DOWN";
    let color = 0xff4444; // Hex as integer
    let emoji = "🚨";

    if (isResolution) {
      statusText = "RECOVERED";
      color = 0xd9ff00;
      emoji = "✅";
    } else if (isEmergency) {
      statusText = "EMERGENCY: CIRCUIT BREAKER TRIPPED";
      color = 0xff0055;
      emoji = "🔥";
    }

    const payload = {
      username: "Replaysafe Alert",
      embeds: [
        {
          title: isEmergency
            ? `${emoji} ${statusText}`
            : `${emoji} Monitor ${statusText}: ${data.monitor.name}`,
          color: color,
          fields: [
            {
              name: "Status",
              value: statusText,
              inline: true,
            },
            {
              name: "Monitor",
              value: data.monitor.name,
              inline: true,
            },
            ...(data.durationText
              ? [
                  {
                    name: isEmergency ? "Details" : "Downtime",
                    value: data.durationText,
                    inline: true,
                  },
                ]
              : []),
            {
              name: "Description",
              value: data.monitor.description || "No description provided",
            },
          ],
          footer: {
            text: `Replaysafe Monitoring | ID: ${data.monitor.id}`,
          },
          timestamp: new Date().toISOString(),
          url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${error}`);
    }
  }
}
