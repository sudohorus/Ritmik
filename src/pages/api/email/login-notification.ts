import type { NextApiRequest, NextApiResponse } from "next";
import { EmailService } from "@/services/email-service";

function parseDeviceInfo(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  const browser =
    ua.includes("chrome") ? "Chrome" :
    ua.includes("safari") ? "Safari" :
    ua.includes("firefox") ? "Firefox" :
    ua.includes("edge") ? "Edge" :
    "Unknown Browser";

  const os =
    ua.includes("windows") ? "Windows" :
    ua.includes("mac os") || ua.includes("macintosh") ? "macOS" :
    ua.includes("iphone") || ua.includes("ios") ? "iPhone" :
    ua.includes("ipad") ? "iPad" :
    ua.includes("android") ? "Android" :
    ua.includes("linux") ? "Linux" :
    "Unknown OS";

  return `${browser} on ${os}`;
}

async function getLocationByIP(ip: string) {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();

    if (data.success) {
      return `${data.city}, ${data.region} - ${data.country}`;
    }

    return "Unknown location";
  } catch {
    return "Unknown location";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "0.0.0.0";

    const userAgent = req.headers["user-agent"] || "";
    const device = parseDeviceInfo(userAgent);

    const location = await getLocationByIP(ip);

    await EmailService.sendLoginNotificationEmail(
      email,
      `${location} (${ip})`,
      device
    );

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
