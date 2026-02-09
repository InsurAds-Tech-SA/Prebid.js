import { submodule } from '../src/hook.js';
import { logInfo, mergeDeep } from '../src/utils.js'
import { fetch } from '../src/ajax.js';

/**
 * @typedef {import('../modules/rtdModule/index.js').RtdSubmodule} RtdSubmodule
 */

declare global {
  interface Window {
    __tgconf: any;
  }
}

// const SERVER_IP = 'http://192.168.2.38:5101';
const SERVER_IP = 'http://0.0.0.0:5101';
const MODULE_NAME = 'insuradsRtd';
const ENDPOINT = `${SERVER_IP}/bid/rtd`;
const LOG_PREFIX = 'insurads Rtd: ';
const GVLID = 596;
window.__tgconf = window.__tgconf || {};

/** @type {RtdSubmodule} */
export const subModuleObj = {
  name: MODULE_NAME,
  gvlid: GVLID,
  init: init,
  onAuctionInitEvent: onAuctionInit,
  onAuctionEndEvent: onAuctionEnd,
  onBidRequestEvent: onBidRequest,
  onBidResponseEvent: onBidResponse,
  getBidRequestData: getBidRequestData,
  getTargetingData: getTargetingData
};

function init(config, userConsent) {
  // needs:
  // User Agent Possible?
  // URL
  // PublicId

  // wants:
  // ApplicationId
  // targeting (Curation) Key-Value Map

  const payload = JSON.stringify({
    publicId: '3X1D44S1',
    url: location.href,
    userAgent: navigator.userAgent
  });

  fetch(`${ENDPOINT}/init`, {
    body: payload,
    keepalive: true,
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    // handle success if needed
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Add the contents of the response to the global config object for later use
    return response.json();
  }).then((data) => {
    // Assuming the response contains a config object, merge it with the existing global config
    mergeDeep(window.__tgconf, data);
    logInfo(LOG_PREFIX + 'Received config from endpoint', data);
  }).catch((_e) => {
    // ignore errors for now
  });


  // // do init stuff
  // if (initfailed) return false;
  logInfo(LOG_PREFIX + 'submodule init', config, userConsent);
  return true;
}

function onAuctionInit(auctionDetails, config, userConsent) {
  // inspect/update auction details
  logInfo(LOG_PREFIX + 'submodule onAuctionInit', auctionDetails, config, userConsent);

  // Send auction init data to endpoint
  // reportEvents('auctionInit', {
  //   auctionDetails,
  //   config,
  //   userConsent
  // });
}

function onAuctionEnd(auctionDetails, config, userConsent) {
  // Contains auction end details including every bid response
  // take note of auction end
  logInfo(LOG_PREFIX + 'submodule onAuctionEnd', auctionDetails, config, userConsent);

  // Send auction end data to endpoint
  // reportEvents('auctionEnd', {
  //   auctionDetails,
  //   config,
  //   userConsent,
  // });
}

function onBidRequest(bidRequest, config, userConsent) {
  // TRIGGER ON EVERY BID REQUEST
  // optionally update bidRequest
  logInfo(LOG_PREFIX + 'submodule onBidRequest', bidRequest, config, userConsent);

  // Send bid request data to endpoint
  // reportEvents('bidRequest', {
  //   bidRequest,
  //   config,
  //   userConsent
  // });
}

function onBidResponse(bidResponse, config, userConsent) {
  // TRIGGER ON EVERY BID RESPONSE
  // optionally update bidResponse
  logInfo(LOG_PREFIX + 'submodule onBidResponse', bidResponse, config, userConsent);

  // Send bid response data to endpoint
  // reportEvents('bidResponse', {
  //   bidResponse,
  //   config,
  //   userConsent
  // });
}

function getBidRequestData(reqBidsConfigObj, callback, config, userConsent) {
  logInfo(LOG_PREFIX + 'submodule getBidRequestData', reqBidsConfigObj, config, userConsent);

  const myCustomData = {
    myCustomKey: 'myCustomValue'
  };

  // 3 ways to set custom data in the bid request
  // put data in adUnits' ortb2Imp:
  reqBidsConfigObj.adUnits.forEach((adUnit) => mergeDeep(adUnit, 'ortb2Imp.ext', myCustomData));
  // or in global first party data:
  mergeDeep(reqBidsConfigObj.ortb2Fragments.global, myCustomData);
  // or in bidder-specific first party data:
  config.bidders.forEach((bidderCode) => mergeDeep(reqBidsConfigObj.ortb2Fragments.bidder, { [bidderCode]: myCustomData }));

  // reportEvents('bidRequestDataPrepared', {
  //   reqBidsConfigObj,
  //   config,
  //   userConsent
  // });

  callback();
}

function getTargetingData(adUnitCodes, config, userConsent, auctionDetails) {
  logInfo(LOG_PREFIX + 'submodule getTargetingData', adUnitCodes, config, userConsent);
  const targetingData = {};

  adUnitCodes.forEach(code => {
    targetingData[code] = {
      'insurads_key': '12242342345'
    };
  });

  // Add your targeting data logic here
  // Example: targetingData['adUnit1'] = { key1: 'value1' };
  return targetingData;
}

function beforeInit() {
  // take actions to get data as soon as possible
  submodule('realTimeData', subModuleObj);
}

function reportEvents(eventType, eventData) {
  const payload = JSON.stringify({
    domain: location.hostname,
    prebidVersion: '$prebid.version$',
    eventType: eventType,
    eventPayload: eventData
  });

  fetch(`${ENDPOINT}`, {
    body: payload,
    keepalive: true,
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch((_e) => {
    // ignore errors for now
  });
}

beforeInit();
