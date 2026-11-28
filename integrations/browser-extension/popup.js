document.getElementById("open").addEventListener("click", () => {
  const v = document.getElementById("url").value.trim()
  const url = chrome.runtime.getURL(`render.html${v ? `?src=${encodeURIComponent(v)}` : ""}`)
  chrome.tabs.create({ url })
  window.close()
})
