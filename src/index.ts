import { Hono } from "hono";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { Env } from "../bindings";

const app = new Hono<{ Bindings: Env }>();

function createRESTClient(env: Env) {
  return new REST({ version: "9" }).setToken(env.DISCORD_BOT_TOKEN);
}

async function sendDiscordMessage(env: Env, message: string) {
  const rest = createRESTClient(env);
  try {
    await rest.post(Routes.channelMessages(env.DISCORD_CHANNEL_ID), {
      body: { content: message },
    });
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function scheduledMessage(env: Env) {
 
  const message = `<@${env.TARGET_USER_ID}> VIXY IT TIME TO EAT`;
  await sendDiscordMessage(env, message);
}

app.get("/send-message", async (c) => {
  await scheduledMessage(c.env);
  return c.text("Scheduled message sent!");
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

