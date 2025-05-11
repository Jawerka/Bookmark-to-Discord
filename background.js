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

async function sendToDiscord(url) {
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
      content: url.substring(0, 2000)
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
          const success = await sendToDiscord(tabs[0].url);
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

  try {
    if (info.linkUrl) {
      urlToSend = info.linkUrl;
    } else if (info.srcUrl) {
      urlToSend = info.srcUrl;
    } else {
      urlToSend = tab.url;
    }

    await sendToDiscord(urlToSend);
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