export type RenderRow = {
  id: string;
  prediction_id: string;
  user_id?: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled" | "queued" | "failed_timeout";
  image_url: string | null;
  prompt: any;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string | null;
  type?: string | null;
};
