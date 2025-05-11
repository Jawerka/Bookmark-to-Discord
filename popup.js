document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send');
  const toggleSettingsButton = document.getElementById('toggle-settings');
  const settingsDiv = document.getElementById('settings');
  const webhookInput = document.getElementById('webhook-url');
  const saveWebhookButton = document.getElementById('save-webhook');
  const noteTextarea = document.getElementById('note');

  noteTextarea.focus();

    // Ctrl+Enter для отправки
  noteTextarea.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      sendButton.click();
    }
  });

  // Загрузка сохранённого webhook при запуске
  chrome.storage.local.get(['webhookUrl'], (result) => {
    if (result.webhookUrl) {
      webhookInput.value = result.webhookUrl;
    }
  });

  // Сохранение webhook
  saveWebhookButton.addEventListener('click', () => {
    const url = webhookInput.value.trim();
    if (url) {
      chrome.storage.local.set({ webhookUrl: url }, () => {
        alert('Webhook сохранён.');
      });
    }
  });

  // Отправка заметки
  sendButton.addEventListener('click', () => {
    const note = noteTextarea.value.trim();
    if (!note) return;

    chrome.storage.local.get(['webhookUrl'], (result) => {
      if (!result.webhookUrl) {
        alert('Сначала настройте Webhook.');
        return;
      }

      fetch(result.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: note
        })
      }).then(() => {
        noteTextarea.value = '';
      }).catch(err => {
        console.error('Ошибка при отправке:', err);
        alert('Ошибка при отправке.');
      });
    });
  });

  // Переключение настроек
  toggleSettingsButton.addEventListener('click', () => {
    settingsDiv.style.display = settingsDiv.style.display === 'none' ? 'block' : 'none';
  });
});
