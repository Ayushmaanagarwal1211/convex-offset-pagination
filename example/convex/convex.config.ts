import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(aggregate);
app.use(aggregate, { name: "aggregateByAlbum" });

export default app;
