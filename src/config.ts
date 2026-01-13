/**
 * Global Configuration for StoLink Frontend
 */

// Community URL Configuration
const PROD_URL = "https://dev.storead.stolink.link/";
const LOCAL_DEFAULT_URL = "http://localhost:5174";

export const COMMUNITY_URL = import.meta.env.PROD
  ? PROD_URL
  : import.meta.env.VITE_COMMUNITY_URL || LOCAL_DEFAULT_URL;
