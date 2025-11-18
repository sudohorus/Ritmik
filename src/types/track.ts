export interface Track {
  id: string;
  title: string;
  artist: string;
  channel: string;
  duration: number;
  viewCount: number;
  thumbnail: string;
  videoId: string;
}

export interface TrackResponse {
  data: Track[];
  hasMore?: boolean;
  nextPageData?: string | null;
}

