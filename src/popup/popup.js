/**
 * Popup Script
 * Manages the UI and sends commands to the background service worker.
 */

/**
 * Fetches data for the current active window.
 * @returns {Promise<{tabsCount: number, groups: Array, windowId: number}>}
 */
async function fetchCurrentWindowData() {
  const currentWindow = await chrome.windows.getCurrent({ populate: true });
  const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
  
  return {
    tabsCount: currentWindow.tabs.length,
    groups: groups,
    windowId: currentWindow.id
  };
}

/**
 * Updates the DOM with the window data.
 * @param {number} tabsCount - Number of tabs in the window.
 * @param {Array} groups - List of tab groups.
 */
function updateUI(tabsCount, groups) {
  const tabCountEl = document.getElementById('tab-count');
  const groupsListEl = document.getElementById('groups-list');
  
  tabCountEl.textContent = `${tabsCount} tabs`;
  groupsListEl.innerHTML = '';

  if (groups.length > 0) {
    groups.forEach(group => {
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      groupItem.textContent = group.title || '(Untitled Group)';
      groupsListEl.appendChild(groupItem);
    });
  } else {
    const noGroups = document.createElement('div');
    noGroups.className = 'group-item';
    noGroups.style.borderLeft = 'none';
    noGroups.style.fontStyle = 'italic';
    noGroups.textContent = 'No existing groups';
    groupsListEl.appendChild(noGroups);
  }
}

/**
 * Initializes the popup.
 */
async function init() {
  try {
    const data = await fetchCurrentWindowData();
    updateUI(data.tabsCount, data.groups);

    const organizeBtn = document.getElementById('organize-btn');
    
    organizeBtn.onclick = async () => {
      organizeBtn.disabled = true;
      organizeBtn.textContent = 'Processing...';
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'groupTabs',
          windowId: data.windowId
        });

        if (response && response.status === 'success') {
          organizeBtn.textContent = 'Success!';
          // Refresh data and UI after a short delay
          setTimeout(async () => {
            const newData = await fetchCurrentWindowData();
            updateUI(newData.tabsCount, newData.groups);
            organizeBtn.disabled = false;
            organizeBtn.textContent = 'Organize Tabs';
          }, 1500);
        } else {
          showError(organizeBtn, response ? response.message : 'Unknown error');
        }
      } catch (error) {
        showError(organizeBtn, 'Message error: ' + error.message);
      }
    };
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

/**
 * Helper to show error on the button.
 * @param {HTMLElement} btn - The button element.
 * @param {string} message - The error message.
 */
function showError(btn, message) {
  btn.textContent = 'Error';
  console.error('Popup Error:', message);
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = 'Organize Tabs';
  }, 2000);
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
