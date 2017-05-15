'use strict';

import validateDigitalData from './lib/validateDigitalData';
import parseDigitalData from './lib/parseDigitalData';

let state;
const port = chrome.runtime.connect({
  name: 'content'
});

port.postMessage({ type: 'reset' });

window.addEventListener('message', function(message) {
  // We only accept messages from ourselves
  if (message.source != window)
    return;

  const messageType = message.data.type;
  if (messageType) {
    switch (messageType) {
      case 'ready':
        port.postMessage({ type: 'ready' });
        break;
      case 'event':
        const event = message.data.event;
        const digitalData = parseDigitalData(message.data.digitalDataJSON);
        validateDigitalData(event, digitalData, state.settings);
        break;
    }
  }
}, false);

function getState() {
  return
}

// Page scripts
function main (enabled) {
  const intervalId = setInterval(() => {
    if (window.ddManager) {
      // subscribe to events
      if (enabled) {
        window.ddListener.push(['on', 'event', function(event) {
          window.postMessage({
            type: 'event',
            event: event,
            digitalDataJSON: JSON.stringify(window.digitalData),
          }, '*');
        }]);
      }

      // set ready status to extentsion
      ddManager.on('ready', () => {
        window.postMessage({
          type: 'ready',
        }, '*');
      });
      clearInterval(intervalId);
    };
  }, 100);
}

function run() {
  var script = document.createElement('script');
  script.appendChild(document.createTextNode('('+ main +')(' + state.enabled + ');'));
  (document.body || document.head || document.documentElement).appendChild(script);
}

chrome.runtime.sendMessage({ type: 'getState' }, function(response) {
  if (response.state) {
    state = response.state;
    run();
  }
});
