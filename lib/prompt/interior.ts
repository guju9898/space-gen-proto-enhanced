export type InteriorSelections = {
  roomType?: string;
  designStyle?: string;
  colorPalette?: string | string[];
  lighting?: string;
  materials?: string | string[];
  geometry?: string;        // e.g., Reci, Square, etc.
  camera?: string;          // perspective/angle if present
  realism?: number;         // 0..1 or 0..100 if slider exists
  extras?: string[];        // any additional tags
  // Add more fields as they exist in your config.interior
};

export function buildInteriorPrompt(sel: InteriorSelections) {
  const parts: string[] = [];
  if (sel.roomType) parts.push(sel.roomType);
  if (sel.designStyle) parts.push(`${sel.designStyle} style`);
  if (sel.colorPalette) {
    const colors = Array.isArray(sel.colorPalette) ? sel.colorPalette.join(", ") : sel.colorPalette;
   parts.push(`color palette: ${colors}`);
  }
  if (sel.materials) {
    const mats = Array.isArray(sel.materials) ? sel.materials.join(", ") : sel.materials;
    parts.push(`materials: ${mats}`);
  }
  if (sel.lighting) parts.push(`${sel.lighting} lighting`);
  if (sel.geometry) parts.push(`room geometry: ${sel.geometry}`);
  if (sel.camera) parts.push(`camera: ${sel.camera}`);
  if (typeof sel.realism === "number") {
    // map realism to a phrase the model understands (soft guidance)
    parts.push(sel.realism >= 0.7 ? "highly realistic" : sel.realism >= 0.4 ? "balanced realism" : "more stylized");
  }
  if (sel.extras?.length) parts.push(sel.extras.join(", "));
  // Final, friendly instruction:
  parts.push("clean composition, cohesive design, professional interior rendering");
  return parts.filter(Boolean).join(", ");
}
