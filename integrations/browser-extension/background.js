const MENU_ID = "renderspace-render-image"

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Render this photo with Renderspace",
    contexts: ["image"],
  })
  if (details.reason === "install") chrome.runtime.openOptionsPage()
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.srcUrl) return
  const url = chrome.runtime.getURL(`render.html?src=${encodeURIComponent(info.srcUrl)}`)
  chrome.tabs.create({ url })
})
