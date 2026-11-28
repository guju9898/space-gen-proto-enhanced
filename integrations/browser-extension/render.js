const API = "https://www.renderspace.ai/api/v1"
const $ = (id) => document.getElementById(id)

const params = new URLSearchParams(location.search)
const srcInput = $("src")
srcInput.value = params.get("src") || ""

function showBefore() {
  const v = srcInput.value.trim()
  $("before").hidden = !v
  if (v) $("before").src = v
}
srcInput.addEventListener("change", showBefore)
showBefore()

let apiKey = ""
chrome.storage.local.get("apiKey").then(({ apiKey: k }) => {
  apiKey = k || ""
  $("nokey").hidden = Boolean(apiKey)
})

$("go").addEventListener("click", async () => {
  $("error").hidden = true
  const image_url = srcInput.value.trim()
  const instruction = $("instruction").value.trim()
  if (!apiKey) return fail("Add your API key in settings first.")
  if (!/^https:\/\//.test(image_url)) return fail("The photo needs a public https:// address.")
  if (!instruction) return fail("Describe the design you want.")

  $("go").disabled = true
  $("status").textContent = "Rendering… this usually takes about 30 seconds."
  try {
    const res = await fetch(`${API}/renders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ space_type: $("type").value, image_url, instruction }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.image_url) {
      const msg = data?.error?.message || data?.message || `Render failed (${res.status}).`
      return fail(typeof msg === "string" ? msg : JSON.stringify(msg))
    }
    $("after").src = data.image_url
    $("after").hidden = false
    const link = Object.assign(document.createElement("a"), {
      href: data.image_url,
      target: "_blank",
      rel: "noopener",
      textContent: "open full size",
    })
    $("afterCap").replaceChildren("Concept · ", link)
    const left = res.headers.get("X-Credits-Remaining")
    $("status").textContent = left ? `Done. ${left} credits left.` : "Done."
  } catch (e) {
    fail("Couldn't reach Renderspace. Check your connection and try again.")
  } finally {
    $("go").disabled = false
  }
})

function fail(msg) {
  $("status").textContent = ""
  $("error").textContent = msg
  $("error").hidden = false
}
