import { hc } from "hono/client";
import { AppRoutes } from "../../../conversations-backend/src/routes/router";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
export const client = hc<AppRoutes>(baseUrl);
