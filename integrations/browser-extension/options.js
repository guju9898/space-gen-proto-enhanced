const keyInput = document.getElementById("key")
const status = document.getElementById("status")

chrome.storage.local.get("apiKey").then(({ apiKey }) => {
  if (apiKey) keyInput.placeholder = "Saved. Paste a new key to replace it."
})

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = keyInput.value.trim()
  if (!apiKey) {
    status.textContent = "Paste your key first."
    return
  }
  await chrome.storage.local.set({ apiKey })
  keyInput.value = ""
  keyInput.placeholder = "Saved. Paste a new key to replace it."
  status.textContent = "Saved. Right-click any photo to render it."
})
