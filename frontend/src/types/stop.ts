export interface Stop {
  stop_id: string;
  stop_code: string | null;
  stop_name: string;
  stop_desc: string | null;
  stop_lat: number;
  stop_lon: number;
  stop_url: string | null;
  location_type: number;
  parent_station: string | null;
}