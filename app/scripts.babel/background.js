'use strict';

window.state = {
  ddManagerReady: false,
  enabled: !!(window.localStorage.getItem('enabled') === 'true'),
  settings: JSON.parse(window.localStorage.getItem('settings')) || {}
};

function toggleIcon(tabId) {
  if (window.state.enabled) {
    chrome.pageAction.setIcon({
      tabId,
      path: {
        '19': 'images/icons/on19.png',
        '38': 'images/icons/on38.png'
      }
    });
  } else {
    chrome.pageAction.setIcon({
      tabId,
      path: {
        '19': 'images/icons/off19.png',
        '38': 'images/icons/off38.png'
      }
    });
  }
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  chrome.pageAction.show(tabId);
});

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === 'content') {
    port.onMessage.addListener(function(msg) {
      switch (msg.type) {
        case 'ready':
          state.ddManagerReady = true;
          break;
        case 'reset':
          state.ddManagerReady = false;
          break;
      }
    });
  } else if (port.name === 'popup') {
    port.onMessage.addListener(function(msg) {
      switch (msg.type) {
        case 'settingsUpdate':
          state.settings = msg.settings;
          window.localStorage.setItem('settings', JSON.stringify(msg.settings));
          chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.reload(tabs[0].id);
          });
          break;
        case 'enabledUpdate':
          window.state.enabled = msg.enabled;
          window.localStorage.setItem('enabled', window.state.enabled);
          chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.reload(tabs[0].id);
          });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getState') {
    toggleIcon(sender.tab.id);
    sendResponse({ state: window.state });
  }
});
