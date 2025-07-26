export interface LocationState {
  county: string | null;
  city: string | null;
  district: string | null;
  loading: boolean;
  error: string | null;
}