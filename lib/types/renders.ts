export type RenderStatus = "queued" | "starting" | "processing" | "succeeded" | "failed" | "canceled" | "failed_timeout";

export interface RenderRow {
  id: string;
  user_id: string;
  render_type: string;
  image_url: string | null;
  result_image_url: string | null;
  source_image_url: string | null;
  prompt: string | null;
  status: RenderStatus;
  prediction_id: string | null;
  config: any;
  created_at: string; // ISO
  updated_at: string | null;
  type?: string | null; // NEW
}
