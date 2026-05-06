# Tab Classifier - Chrome Extension

This extension automatically organizes your open tabs into logical groups using AI.

## Key Details

- **Local AI**: Uses Chrome's experimental Prompt API and the built-in **Gemini Nano** model. Inference happens entirely locally on your device.
- **Performance**: AI classification runs in a background **Service Worker**, keeping processing off the main thread and the UI smooth.

## Prompt API Support

Please check the [official Chrome docs](https://developer.chrome.com/docs/ai/built-in-apis#api_status) to determine if your extension install will support (availability) the Chrome Prompt API.

## Local Use

1. Download this source repo
2. Navigate to `chrome://extensions` in your browser
3. [Load unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) and select this directory
4. Select *Tab Classifier* from your Chrome Extensions bar
5. Click *Organize Tabs*
