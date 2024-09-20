import { Hono } from "hono";
import { REST } from "@discordjs/rest";
import {
  type RESTPostAPICurrentUserCreateDMChannelResult,
  Routes,
} from "discord-api-types/v9";
import type { Env } from "../bindings";

const app = new Hono<{ Bindings: Env }>();

function createRESTClient(env: Env) {
  return new REST({ version: "9" }).setToken(env.DISCORD_BOT_TOKEN);
}

async function sendDiscordDirectMessage(
  env: Env,
  userId: string,
  message: string
): Promise<void> {
  const rest = createRESTClient(env);
  try {
    // Create a DM channel
    const dmChannel = (await rest.post(Routes.userChannels(), {
      body: { recipient_id: userId },
    })) as RESTPostAPICurrentUserCreateDMChannelResult;

    // Send the message to the DM channel
    await rest.post(Routes.channelMessages(dmChannel.id), {
      body: { content: message },
    });
    console.log("Direct message sent successfully");
  } catch (error) {
    console.error("Error sending direct message:", error);
    throw error;
  }
}

async function scheduledMessage(env: Env) {
  const message = "VIXY IT TIME TO EAT";
  await sendDiscordDirectMessage(env, env.TARGET_USER_ID, message);
}

app.get("/send-message", async (c) => {
  const apiKey = c.req.header("API-Key");

  if (c.env.NODE_ENV === "production" && apiKey !== c.env.API_KEY) {
    return c.text("FORBIDDEN", 403);
  }

  try {
    await scheduledMessage(c.env);
    return c.text("Scheduled message sent successfully!");
  } catch (error) {
    console.error("Error in scheduled message:", error);
    return c.text("Failed to send scheduled message", 500);
  }
});

export default {
  fetch: app.fetch,
  scheduled: async (
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ) => {
    ctx.waitUntil(scheduledMessage(env));
  },
};

