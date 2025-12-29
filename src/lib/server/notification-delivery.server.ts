// Type imports only
import type {
  AlertRule,
  AlertDetails,
  NotificationsSent,
} from "@/database/schema/alerts";

interface DeliverNotificationsParams {
  userId: string;
  alertHistoryId: string;
  rule: AlertRule;
  channels: {
    email?: boolean;
    webhook?: boolean;
    inApp?: boolean;
  };
  appName?: string;
  integrationName?: string;
  message: string;
  details: AlertDetails;
}

/**
 * Main notification delivery function
 * Delivers notifications through configured channels
 */
export async function deliverNotifications(params: DeliverNotificationsParams): Promise<void> {
  // Dynamic imports
  const { getDb } = await import("./get-db");
  const { eq } = await import("drizzle-orm");
  const { alertHistory } = await import("@/database/schema/alerts");
  const { getUserNotificationPreferences } = await import("./alerts.server");

  const db = await getDb();
  const { userId, alertHistoryId, rule, channels, appName, integrationName, message, details } = params;

  // Get user notification preferences
  const prefs = await getUserNotificationPreferences(userId);

  // Check if notifications are globally disabled
  if (prefs && !prefs.globalEnabled) {
    return;
  }

  // Check quiet hours
  if (prefs?.quietHoursEnabled && isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, prefs.timezone)) {
    return;
  }

  const notificationResults: NotificationsSent = {};

  // Deliver in-app notification
  if (channels.inApp && (prefs?.inAppEnabled ?? true)) {
    notificationResults.inApp = await deliverInAppNotification({
      userId,
      alertHistoryId,
      rule,
      appName,
      integrationName,
      message,
    });
  }

  // Deliver email notification
  if (channels.email && prefs?.emailEnabled && prefs.emailAddress) {
    notificationResults.email = await deliverEmailNotification({
      emailAddress: prefs.emailAddress,
      rule,
      appName,
      integrationName,
      message,
      details,
    });
  }

  // Deliver webhook notification
  if (channels.webhook && prefs?.webhookEnabled && prefs.webhookUrl) {
    notificationResults.webhook = await deliverWebhookNotification({
      webhookUrl: prefs.webhookUrl,
      webhookSecret: prefs.webhookSecret,
      webhookHeaders: prefs.webhookHeaders as Record<string, string> | null,
      alertHistoryId,
      rule,
      appName,
      integrationName,
      message,
      details,
    });
  }

  // Update alert history with notification results
  await db
    .update(alertHistory)
    .set({
      notificationsSent: notificationResults,
      updatedAt: new Date(),
    })
    .where(eq(alertHistory.id, alertHistoryId));
}

/**
 * Deliver in-app notification
 */
async function deliverInAppNotification(params: {
  userId: string;
  alertHistoryId: string;
  rule: AlertRule;
  appName?: string;
  integrationName?: string;
  message: string;
}): Promise<{ sent: boolean; sentAt?: string; error?: string }> {
  try {
    // Dynamic imports
    const { createInAppNotificationEntry } = await import("./alerts.server");

    const { userId, alertHistoryId, rule, appName, integrationName, message } = params;

    const targetName = appName || integrationName || "Unknown";
    const title = `${getSeverityEmoji(rule.severity || "warning")} ${rule.name}`;
    const fullMessage = `${targetName}: ${message}`;

    await createInAppNotificationEntry({
      userId,
      alertHistoryId,
      title,
      message: fullMessage,
      severity: rule.severity,
      linkType: appName ? "app" : integrationName ? "integration" : "alert",
      linkId: rule.appId || rule.integrationId || alertHistoryId,
    });

    return { sent: true, sentAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error delivering in-app notification:", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Failed to deliver in-app notification",
    };
  }
}

/**
 * Deliver email notification
 * Note: This is a placeholder implementation. In production, you would integrate
 * with an email service like SendGrid, AWS SES, Postmark, etc.
 */
async function deliverEmailNotification(params: {
  emailAddress: string;
  rule: AlertRule;
  appName?: string;
  integrationName?: string;
  message: string;
  details: AlertDetails;
}): Promise<{ sent: boolean; sentAt?: string; error?: string }> {
  try {
    const { emailAddress, rule, appName, integrationName, message, details } = params;

    const targetName = appName || integrationName || "Unknown";
    const subject = `[${rule.severity?.toUpperCase()}] ${rule.name} - ${targetName}`;

    // Build email body
    const body = buildEmailBody({
      ruleName: rule.name,
      targetName,
      message,
      details,
      severity: rule.severity || "warning",
    });

    // In production, send email via email service
    // For now, log the email that would be sent
    console.log("📧 Would send email notification:", {
      to: emailAddress,
      subject,
      body,
    });

    // Placeholder: In a real implementation, you would call your email service here
    // Example with SendGrid:
    // await sendgrid.send({ to: emailAddress, subject, html: body });

    // For demonstration, we'll simulate success
    // In production, remove this and implement actual email sending
    return { sent: true, sentAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error delivering email notification:", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Failed to deliver email notification",
    };
  }
}

/**
 * Deliver webhook notification
 */
async function deliverWebhookNotification(params: {
  webhookUrl: string;
  webhookSecret?: string | null;
  webhookHeaders?: Record<string, string> | null;
  alertHistoryId: string;
  rule: AlertRule;
  appName?: string;
  integrationName?: string;
  message: string;
  details: AlertDetails;
}): Promise<{ sent: boolean; sentAt?: string; error?: string; statusCode?: number }> {
  try {
    const {
      webhookUrl,
      webhookSecret,
      webhookHeaders,
      alertHistoryId,
      rule,
      appName,
      integrationName,
      message,
      details,
    } = params;

    const payload = {
      id: alertHistoryId,
      type: "alert",
      timestamp: new Date().toISOString(),
      alert: {
        ruleName: rule.name,
        ruleId: rule.id,
        triggerType: rule.triggerType,
        severity: rule.severity,
      },
      target: {
        type: appName ? "app" : integrationName ? "integration" : "unknown",
        name: appName || integrationName,
        id: rule.appId || rule.integrationId,
      },
      message,
      details,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "AppMap-Alerts/1.0",
      ...webhookHeaders,
    };

    // Add signature if secret is provided
    if (webhookSecret) {
      const signature = await generateWebhookSignature(JSON.stringify(payload), webhookSecret);
      headers["X-AppMap-Signature"] = signature;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        sent: true,
        sentAt: new Date().toISOString(),
        statusCode: response.status,
      };
    } else {
      return {
        sent: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }
  } catch (error) {
    console.error("Error delivering webhook notification:", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Failed to deliver webhook notification",
    };
  }
}

/**
 * Generate HMAC signature for webhook payloads
 */
async function generateWebhookSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Build email body HTML
 */
function buildEmailBody(params: {
  ruleName: string;
  targetName: string;
  message: string;
  details: AlertDetails;
  severity: "info" | "warning" | "critical";
}): string {
  const { ruleName, targetName, message, details, severity } = params;

  const severityColors = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  const color = severityColors[severity];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AppMap Alert</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background-color: ${color}; padding: 20px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${getSeverityEmoji(severity)} ${ruleName}</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333333;">
        <strong>${targetName}</strong>
      </p>
      <p style="margin: 0 0 16px; font-size: 16px; color: #666666;">
        ${message}
      </p>
      ${
        details.previousStatus && details.currentStatus
          ? `
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #666666;">
          Status: <span style="color: ${details.previousStatus === "online" ? "#22c55e" : "#ef4444"}">${details.previousStatus}</span> → <span style="color: ${details.currentStatus === "online" ? "#22c55e" : "#ef4444"}">${details.currentStatus}</span>
        </p>
      </div>
      `
          : ""
      }
      ${
        details.consecutiveFailures
          ? `
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          Consecutive failures: ${details.consecutiveFailures}
        </p>
      </div>
      `
          : ""
      }
      ${
        details.responseTime
          ? `
      <div style="background-color: #fefce8; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #854d0e;">
          Response time: ${details.responseTime}ms
        </p>
      </div>
      `
          : ""
      }
      ${
        details.error
          ? `
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          Error: ${details.error}
        </p>
      </div>
      `
          : ""
      }
    </div>
    <div style="background-color: #f5f5f5; padding: 16px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999999;">
        This alert was sent by AppMap. <a href="#" style="color: #3b82f6;">Manage your notification settings</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: "info" | "warning" | "critical"): string {
  switch (severity) {
    case "info":
      return "ℹ️";
    case "warning":
      return "⚠️";
    case "critical":
      return "🚨";
    default:
      return "📢";
  }
}

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(
  start: string | null | undefined,
  end: string | null | undefined,
  timezone: string | null | undefined
): boolean {
  if (!start || !end) return false;

  try {
    const tz = timezone || "UTC";
    const now = new Date();

    // Get current time in the specified timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const currentTime = formatter.format(now);
    const [currentHour, currentMinute] = currentTime.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Normal case (e.g., 09:00 - 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

/**
 * Send a test notification through all enabled channels
 */
export async function sendTestNotification(userId: string): Promise<{
  email?: { sent: boolean; error?: string };
  webhook?: { sent: boolean; error?: string; statusCode?: number };
  inApp?: { sent: boolean; error?: string };
}> {
  // Dynamic imports
  const { getUserNotificationPreferences } = await import("./alerts.server");

  const prefs = await getUserNotificationPreferences(userId);
  const results: any = {};

  // Test in-app notification
  if (prefs?.inAppEnabled ?? true) {
    results.inApp = await deliverInAppNotification({
      userId,
      alertHistoryId: "test",
      rule: {
        id: "test",
        name: "Test Notification",
        severity: "info",
      } as AlertRule,
      message: "This is a test notification",
    });
  }

  // Test email notification
  if (prefs?.emailEnabled && prefs.emailAddress) {
    results.email = await deliverEmailNotification({
      emailAddress: prefs.emailAddress,
      rule: {
        name: "Test Notification",
        severity: "info",
      } as AlertRule,
      message: "This is a test notification",
      details: {},
    });
  }

  // Test webhook notification
  if (prefs?.webhookEnabled && prefs.webhookUrl) {
    results.webhook = await deliverWebhookNotification({
      webhookUrl: prefs.webhookUrl,
      webhookSecret: prefs.webhookSecret,
      webhookHeaders: prefs.webhookHeaders as Record<string, string> | null,
      alertHistoryId: "test",
      rule: {
        id: "test",
        name: "Test Notification",
        triggerType: "status_change",
        severity: "info",
      } as AlertRule,
      message: "This is a test notification",
      details: {},
    });
  }

  return results;
}
