import axios from 'axios';
import { TrackResponse } from '@/types/track';

const API_BASE = '/api/youtube';

export class TrackService {
  static async getTrending(): Promise<TrackResponse> {
    const response = await axios.get<TrackResponse>(`${API_BASE}/trending`);
    return response.data;
  }

  static async search(query: string, nextPageData?: string | null): Promise<TrackResponse> {
    const response = await axios.get<TrackResponse>(`${API_BASE}/search`, {
      params: { query, nextPageData }
    });
    return response.data;
  }
}

