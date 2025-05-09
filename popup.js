document.addEventListener('DOMContentLoaded', () => {
  // Загрузка webhook из хранилища
  chrome.storage.local.get(["webhookUrl"], result => {
    if (result.webhookUrl) {
      document.getElementById("webhook").value = result.webhookUrl;
    }
  });

  // Сохраняем webhook
  document.getElementById("save").addEventListener("click", async () => {
    const url = document.getElementById("webhook").value.trim();
    if (!url) {
      alert("Введите webhook URL");
      return;
    }
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      alert("Некорректный webhook URL. Должен начинаться с https://discord.com/api/webhooks/");
      return;
    }
    
    try {
      await chrome.storage.local.set({ webhookUrl: url });
      alert("Webhook сохранён!");
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      alert("Ошибка при сохранении webhook");
    }
  });

  // Отправка текущей страницы с заметкой
  document.getElementById("send").addEventListener("click", async () => {
    try {
      const { webhookUrl } = await chrome.storage.local.get(["webhookUrl"]);
      if (!webhookUrl) {
        alert("Сначала укажите webhook и сохраните его");
        return;
      }

      const note = document.getElementById("note").value.trim();
      
      chrome.runtime.sendMessage({ 
        action: "sendCurrentPage",
        note: note 
      }, (response) => {
        if (response?.success) {
          document.getElementById("note").value = ""; // Очищаем поле заметки
        } else {
          alert(`Ошибка при отправке: ${response?.error || "Неизвестная ошибка"}`);
        }
      });
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert(`Ошибка при отправке: ${err.message}`);
    }
  });
});
