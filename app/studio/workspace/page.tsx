import { redirect } from "next/navigation"

/** Legacy prototype page (placeholder user and counts). The real Studios live at /studio/*. */
export default function WorkspacePage() {
  redirect("/studio")
}
