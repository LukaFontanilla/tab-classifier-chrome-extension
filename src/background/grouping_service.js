/**
 * Grouping Service
 * Handles interactions with chrome.tabs and chrome.tabGroups APIs.
 */

import { classifyTabs } from './ai_service.js';

/**
 * Classifies and groups tabs for a specific window.
 * @param {number} windowId - The ID of the window to process.
 * @returns {Promise<void>}
 */
export async function organizeTabsInWindow(windowId) {
  try {
    // Check if the window is a normal window
    const win = await chrome.windows.get(windowId);
    if (win.type !== 'normal') {
      console.log(`Skipping non-normal window ${windowId} (type: ${win.type}).`);
      return;
    }

    // Fetch tabs for the specific window
    const tabsInWindow = await chrome.tabs.query({ windowId: windowId });

    if (tabsInWindow.length === 0) {
      console.log(`No tabs found in window ${windowId}.`);
      return;
    }

    // Fetch existing groups in this window
    const existingGroups = await chrome.tabGroups.query({ windowId: windowId });
    const existingGroupMap = {};
    existingGroups.forEach(g => {
      if (g.title) existingGroupMap[g.title] = g.id;
    });

    const existingGroupTitles = Object.keys(existingGroupMap);

    // Filter out tabs that are already in a group
    const ungroupedTabs = tabsInWindow.filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);

    if (ungroupedTabs.length === 0) {
      console.log(`No ungrouped tabs in window ${windowId}.`);
      return;
    }

    console.log(`Classifying ${ungroupedTabs.length} ungrouped tabs for window ${windowId}...`);

    // Call AI Service
    const groups = await classifyTabs(ungroupedTabs, existingGroupTitles);
    console.log(`AI Response for window ${windowId}:`, groups);

    // Apply grouping
    for (const groupName in groups) {
      const tabIds = groups[groupName];
      if (Array.isArray(tabIds) && tabIds.length > 0) {
        // SAFETY CHECK: Only include tab IDs that actually belong to the ungrouped list in this window
        const validTabIds = tabIds.filter(id => ungroupedTabs.some(t => t.id === id));

        if (validTabIds.length === 0) {
          console.log(`Skipping group "${groupName}" because no valid tab IDs were returned or they are already grouped.`);
          continue;
        }

        let groupId;

        // Check if the group name matches an existing group
        if (existingGroupMap[groupName]) {
          groupId = existingGroupMap[groupName];
          console.log(`Adding tabs ${validTabIds} to existing group "${groupName}" (ID: ${groupId})`);
          await chrome.tabs.group({ tabIds: validTabIds, groupId: groupId });
        } else {
          console.log(`Creating new group "${groupName}" for tabs ${validTabIds} in window ${windowId}`);
          // Use createProperties to force creation in the target window
          // This bypasses behavior where when the active window changes mid request, the grouped tabs
          // inadvertently get moved to the new active window
          groupId = await chrome.tabs.group({
            tabIds: validTabIds,
            createProperties: { windowId: parseInt(windowId) }
          });
          await chrome.tabGroups.update(groupId, { title: groupName });
        }
      }
    }
  } catch (error) {
    console.error(`Error organizing tabs for window ${windowId}:`, error);
    throw error; // Propagate error to caller (e.g., message listener)
  }
}
