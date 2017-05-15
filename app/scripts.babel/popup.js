'use strict';

let state = {
  ddManagerReady: false,
  enabled: true,
};

const port = chrome.runtime.connect({
  name: 'popup'
});

function onReady() {
  jQuery('#not-found').hide();
  jQuery('#settings').show();

  const form = jQuery('#settings-form');
  populateForm(form, state.settings);
}

function reset() {
  jQuery('#settings').hide();
  jQuery('#not-found').show();
}

function checkReadyStatus() {
  chrome.runtime.getBackgroundPage((backgroundPage) => {
    const parentState = backgroundPage.window.state;
    if (parentState.ddManagerReady) {
      state = parentState;
      onReady();
    } else {
      setTimeout(checkReadyStatus, 100);
    }
  });
}

function objectifyForm(form) {
  const formArray = form.serializeArray();
  const returnArray = {};
  for (let i = 0; i < formArray.length; i++){
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}

function populateForm(form, data) {
  $.each(data, function(key, value) {
    var ctrl = $('[name='+key+']', form);
    switch(ctrl.prop('type')) {
      case 'radio':
      case 'checkbox':
        ctrl.each(function() {
          if($(this).attr('value') == value) $(this).attr('checked', value);
        });
        break;
      default:
        ctrl.val(value);
        break;
    }
  });
}



document.addEventListener('DOMContentLoaded', function () {
  reset();
  checkReadyStatus();

  chrome.tabs.getSelected(null, function(tab) {
    const url = new URL(tab.url);
    jQuery('#domain').text(url.hostname);
    if (!state.enabled) {
      jQuery('#enable').val('Enable DDManager Checker');
    } else {
      jQuery('#enable').val('Disable DDManager Checker');
    }
  });

  jQuery('#enable').click(() => {
    port.postMessage({
      type: 'enabledUpdate',
      enabled: !state.enabled
    });
    window.close();
  });

  jQuery('#update-settings-btn').click(() => {
    const form = jQuery('#settings-form');
    port.postMessage({
      type: 'settingsUpdate',
      settings: objectifyForm(form)
    });
    window.close();
  });
});
