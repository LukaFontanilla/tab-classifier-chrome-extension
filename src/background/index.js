/**
 * Service Worker Entry Point
 * Handles installation and message passing.
 */

import { organizeTabsInWindow } from './grouping_service.js';

console.log('Tab Grouper Service worker is running.');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed.');
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  if (message.action === 'groupTabs') {
    organizeTabsInWindow(message.windowId)
      .then(() => {
        sendResponse({ status: 'success' });
      })
      .catch(error => {
        sendResponse({ status: 'error', message: error.message });
      });
    return true; // Keeps the message channel open for async response
  }
});
