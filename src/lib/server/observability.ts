type ObserveLevel = "info" | "warn" | "error";

type ObserveEvent = {
  message: string;
  level?: ObserveLevel;
  requestId?: string;
  route?: string;
  data?: Record<string, unknown>;
};

async function postJson(url: string, payload: unknown, headers?: Record<string, string>): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Observability must never break request flow.
  }
}

async function sendDatadog(event: ObserveEvent): Promise<void> {
  const apiKey = process.env.DD_API_KEY;
  if (!apiKey) return;
  const site = process.env.DD_SITE || "datadoghq.com";
  const url = `https://http-intake.logs.${site}/api/v2/logs`;
  await postJson(url, {
    ddsource: "nextjs",
    service: process.env.OBS_SERVICE_NAME || "fe-config-dns",
    hostname: process.env.VERCEL_URL || "local",
    message: event.message,
    level: event.level || "info",
    requestId: event.requestId,
    route: event.route,
    data: event.data,
  }, {
    "DD-API-KEY": apiKey,
  });
}

async function sendLogtail(event: ObserveEvent): Promise<void> {
  const token = process.env.LOGTAIL_SOURCE_TOKEN;
  if (!token) return;
  await postJson("https://in.logtail.com/", {
    dt: new Date().toISOString(),
    level: event.level || "info",
    message: event.message,
    requestId: event.requestId,
    route: event.route,
    ...event.data,
  }, {
    Authorization: `Bearer ${token}`,
  });
}

async function sendSentry(event: ObserveEvent): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const parsed = new URL(dsn);
    const [, projectId] = parsed.pathname.split("/").filter(Boolean);
    const key = parsed.username;
    if (!projectId || !key) return;
    const base = `${parsed.protocol}//${parsed.host}`;
    const url = `${base}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`;
    await postJson(url, {
      message: event.message,
      level: event.level || "info",
      tags: {
        route: event.route || "unknown",
      },
      extra: {
        requestId: event.requestId,
        ...(event.data ?? {}),
      },
      platform: "javascript",
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch {
    // ignore
  }
}

export async function observe(event: ObserveEvent): Promise<void> {
  const level = event.level || "info";
  const prefix = `[obs:${level}]`;
  if (level === "error") {
    console.error(prefix, event.message, event);
  } else if (level === "warn") {
    console.warn(prefix, event.message, event);
  } else {
    console.info(prefix, event.message, event);
  }

  await Promise.all([
    sendDatadog(event),
    sendLogtail(event),
    sendSentry(event),
  ]);
}
