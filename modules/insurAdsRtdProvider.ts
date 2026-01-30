import { submodule } from '../src/hook.js';
import { logInfo } from '../src/utils.js'


/**
 * @typedef {import('../modules/rtdModule/index.js').RtdSubmodule} RtdSubmodule
 */

/** @type {RtdSubmodule} */
export const subModuleObj = {
  name: 'insuradsRtd',
  init: init,
  onAuctionInitEvent: onAuctionInit,
  onAuctionEndEvent: onAuctionEnd,
  onBidRequestEvent: onBidRequest,
  onBidResponseEvent: onBidResponse,
  getBidRequestData: getBidRequestData,
  getTargetingData: getTargetingData
};

const LOG_PREFIX = 'insurads Rtd: ';

function onAuctionInit(auctionDetails, config, userConsent) {
  // inspect/update auction details
  logInfo(LOG_PREFIX + 'submodule onAuctionInit', auctionDetails, config, userConsent);
}

function onAuctionEnd(auctionDetails, config, userConsent) {
  // take note of auction end
  logInfo(LOG_PREFIX + 'submodule onAuctionEnd', auctionDetails, config, userConsent);
}

function onBidRequest(bidRequest, config, userConsent) {
  // optionally update bidRequest
  logInfo(LOG_PREFIX + 'submodule onBidRequest', bidRequest, config, userConsent);
}

function onBidResponse(bidResponse, config, userConsent) {
  // optionally update bidResponse
  logInfo(LOG_PREFIX + 'submodule onBidResponse', bidResponse, config, userConsent);
}

function init(config, userConsent) {
  // // do init stuff
  // if (initfailed) return false;
  logInfo(LOG_PREFIX + 'submodule init', config, userConsent);
  return true;
}

function getBidRequestData(bidRequest, config, userConsent) {
  logInfo(LOG_PREFIX + 'submodule getBidRequestData', bidRequest, config, userConsent);
  return {};
}

function getTargetingData(bidResponses, config, userConsent) {
  logInfo(LOG_PREFIX + 'submodule getTargetingData', bidResponses, config, userConsent);
  return {};
}

function beforeInit() {
  // take actions to get data as soon as possible
  submodule('realTimeData', subModuleObj);
}

beforeInit();
