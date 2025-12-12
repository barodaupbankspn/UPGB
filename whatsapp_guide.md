# Free WhatsApp Service Guide for UPGB Recovery Portal

To send WhatsApp messages automatically from the Google Sheet/Script, you need a gateway. Here are free or low-cost options:

## 1. CallMeBot (Best for Personal/Small Scale - Free)
*   **Website**: [callmebot.com](https://www.callmebot.com/)
*   **Cost**: Free.
*   **Pros**: Very easy to set up.
*   **Cons**:
    *   It sends messages "from" a bot number, not your own number.
    *   Limit: ~20-50 messages per day (soft limit).
    *   **Setup**: You need to get an API Key by messaging the bot.

## 2. UltraMsg (Better for Business - Paid/Trial)
*   **Website**: [ultramsg.com](https://ultramsg.com/)
*   **Cost**: ~$10/month (Free trial available).
*   **Pros**: Uses **YOUR** WhatsApp number (scan QR code). Sends Files/Images easily.
*   **Cons**: Paid after trial.

## 3. "Click to Chat" (Completely Free, Manual)
*   Instead of automatic backend sending, the "Send" button in dashboard creates a link: `https://wa.me/917985XXXXXX?text=YourMessage`.
*   **Pros**: 100% Free, Safe, Uses your App.
*   **Cons**: You have to click "Send" for every person individually.

---

## Recommended Strategy: CallMeBot (for Testing/Free Automation)

If you want to use CallMeBot, update the `code.gs` with this specific function:

```javascript
function sendCallMeBot(phone, message) {
  // CallMeBot API Key is required
  const apk = '123456'; // Get this from the bot
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apk}`;
  UrlFetchApp.fetch(url);
}
```
