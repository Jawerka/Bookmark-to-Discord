chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "send-to-discord",
      title: "Отправить в Discord",
      contexts: ["link", "image", "video", "page"]
    });
  } catch (err) {
    console.error("Ошибка создания контекстного меню:", err);
  }
});

async function sendToDiscord(url, title, faviconUrl, note = "") {
  try {
    const { webhookUrl } = await chrome.storage.local.get(["webhookUrl"]);
    if (!webhookUrl) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Webhook не задан",
        message: "Откройте popup и сохраните Webhook URL."
      });
      return false;
    }

    const payload = {
      embeds: [
        {
          title: title.substring(0, 256),
          url: url,
          description: note ? note.substring(0, 2000) : undefined,
          thumbnail: faviconUrl ? { url: faviconUrl } : undefined,
          color: 0x3498db,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    return true;
  } catch (err) {
    console.error("Ошибка при отправке:", err);
    throw err;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendCurrentPage") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url) {
        try {
          const tab = tabs[0];
          let faviconUrl;
          try {
            const domain = new URL(tab.url).origin;
            faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          } catch (e) {
            console.log("Не удалось получить favicon", e);
          }

          const success = await sendToDiscord(
            tab.url, 
            tab.title || "Страница", 
            faviconUrl,
            request.note
          );
          sendResponse({ success });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      } else {
        sendResponse({ success: false, error: "Не удалось получить URL вкладки" });
      }
    });
    return true;
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let urlToSend;
  let title;
  let faviconUrl;

  try {
    if (info.linkUrl) {
      urlToSend = info.linkUrl;
      title = info.linkText || "Ссылка";
    } else if (info.srcUrl) {
      urlToSend = info.srcUrl;
      title = "Медиа";
    } else {
      urlToSend = tab.url;
      title = tab.title || "Страница";
    }

    try {
      const domain = new URL(urlToSend).origin;
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      console.log("Не удалось получить favicon", e);
    }

    await sendToDiscord(urlToSend, title, faviconUrl);
  } catch (err) {
    console.error("Ошибка при отправке:", err);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Ошибка",
      message: "Не удалось отправить в Discord."
    });
  }
});
