import axios from "axios";
import type { NetworkNode, NetworkLink } from "@/types/network";

// Default to localhost:8080 if not specified in env
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export interface GraphData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export const graphApi = {
  /**
   * Fetches graph data from the backend.
   * Expects the backend to return JSON: { nodes: [], links: [] }
   */
  getGraphData: async (): Promise<GraphData> => {
    try {
      const response = await client.get<GraphData>("/api/graph");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
      throw error;
    }
  },

  /**
   * Fetches full character details (for World Page).
   */
  getCharacters: async (): Promise<unknown[]> => {
    try {
      // Expecting Endpoint: GET /api/characters
      // API returns: { status, message, data: [...], code }
      const response = await client.get<{ data: unknown[] }>("/api/characters");
      return response.data.data; // Unwrap from API response wrapper
    } catch (error) {
      console.warn("Failed to fetch characters, using demo data as fallback.");
      throw error;
    }
  },
};
