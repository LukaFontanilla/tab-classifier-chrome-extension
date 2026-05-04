# Tab Classifier - Chrome Extension

This extension automatically organizes your open tabs into logical groups using AI.

## Key Details

- **Local AI**: Uses Chrome's experimental Prompt API and the built-in **Gemini Nano** model. Inference happens entirely locally on your device.
- **Performance**: AI classification runs in a background **Service Worker**, keeping processing off the main thread and the UI smooth.

## Prompt API Support

Please check the [official Chrome docs](https://developer.chrome.com/docs/ai/built-in-apis#api_status) to determine if your extension install will support (availability) the Chrome Prompt API.
