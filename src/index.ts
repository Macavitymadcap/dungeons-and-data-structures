import { createApp } from "./app.tsx";

const app = createApp();

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000),
};

