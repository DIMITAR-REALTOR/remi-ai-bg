import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchListings from "./tools/search-listings";
import getListing from "./tools/get-listing";
import listMyListings from "./tools/list-my-listings";
import listMyFavorites from "./tools/list-my-favorites";
import listMyClients from "./tools/list-my-clients";
import createClient from "./tools/create-client";
import listMyTasks from "./tools/list-my-tasks";
import createTask from "./tools/create-task";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "remi-ai",
  title: "REMI AI",
  version: "0.1.0",
  instructions:
    "Tools for REMI AI, a Bulgarian real estate platform. Search and read active property listings, and — for the signed-in user — read favorites, own listings, CRM clients and tasks, and create new clients and tasks. Data and free text are in Bulgarian.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchListings,
    getListing,
    listMyListings,
    listMyFavorites,
    listMyClients,
    createClient,
    listMyTasks,
    createTask,
  ],
});
