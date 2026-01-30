// import * as utils from 'src/utils';
// import {config} from 'src/config';
import { ortbConverter } from '../libraries/ortbConverter/converter.js';
import { registerBidder, BidderSpec } from '../src/adapters/bidderFactory.js';
import { BANNER } from '../src/mediaTypes.ts';

import { isArray, getWindowTop, logInfo, logError } from '../src/utils.js';
// import { percentInView } from '../libraries/percentInView/percentInView.js';
import { getMinSize } from '../libraries/sizeUtils/sizeUtils.js';
import { isViewabilityMeasurable, getViewability } from '../libraries/percentInView/percentInView.js';
import { ORTB_MTYPES } from '../libraries/ortbConverter/processors/mediaType.js';

/**
 * @typedef {import('../src/adapters/bidderFactory.js').Bid} Bid
 * @typedef {import('../src/adapters/bidderFactory.js').BidRequest} BidRequest
 * @typedef {import('../src/adapters/bidderFactory.js').ServerRequest} ServerRequest
 * @typedef {import('../src/adapters/bidderFactory.js').ServerResponse} ServerResponse
 * @typedef {import('../src/auction.js').BidderRequest} BidderRequest
 * @typedef {import('../src/adapters/bidderFactory.js').SyncOptions} SyncOptions
 * @typedef {import('../src/adapters/bidderFactory.js').UserSync} UserSync
 */

const converter = ortbConverter({
  context: {
    // `netRevenue` and `ttl` are required properties of bid responses - provide a default for them
    netRevenue: true,
    ttl: 30
  },
  // Inject viewability data into each `imp` produced by the converter.
  imp(buildImp, bidRequest, context) {
    const imp = buildImp(bidRequest, context);
    try {
      let bidSizes = (bidRequest.mediaTypes && bidRequest.mediaTypes.banner && bidRequest.mediaTypes.banner.sizes) || [];
      bidSizes = bidSizes.filter(size => isArray(size));
      const processedSizes = bidSizes.map(size => ({ w: parseInt(size[0], 10), h: parseInt(size[1], 10) }));
      const minSize = getMinSize(processedSizes);
      const element = (typeof document !== 'undefined') ? document.getElementById(bidRequest.adUnitCode) : null;
      const viewabilityAmount = element && isViewabilityMeasurable(element)
        ? getViewability(element, getWindowTop(), minSize)
        : 'na';
      imp.ext = imp.ext || {};
      imp.ext.viewability = {
        amount: isNaN(viewabilityAmount as number) ? viewabilityAmount : Math.round(viewabilityAmount as number)
      } as any;
    } catch (e) {
      logInfo(LOG_PREFIX + 'imp processor failed to compute viewability: ', e);
    }
    return imp;
  },
  request(buildRequest, imps, bidderRequest, context) {
    logInfo(LOG_PREFIX + 'request called with imps: ', imps, ' bidderRequest: ', bidderRequest, ' context: ', context);
    return buildRequest(imps, bidderRequest, context);
  },
  response(buildResponse, bidResponses, ortbResponse, context) {
    logInfo(LOG_PREFIX + 'response called with bidResponses: ', bidResponses, ' ortbResponse: ', ortbResponse, ' context: ', context);

    return buildResponse(bidResponses, ortbResponse, context);
  },
  bidResponse: function (buildBidResponse, bid, context) {
    logInfo(LOG_PREFIX + 'bidResponse called with bid: ', bid, ' context: ', context);

    if (!context.mediaType && context.bidRequest.mediaTypes) {
      const [type] = Object.keys(context.bidRequest.mediaTypes);
      if (Object.values(ORTB_MTYPES).includes(type)) {
        context.mediaType = type as any;
      }
    }

    return buildBidResponse(bid, context);
  },
});

const BIDDER_CODE = 'insurads';
const LOG_PREFIX = 'insurads: ';
const GVLID = 596;
// const ENDPOINT_URL = 'https://bid.insurads.com/hb';
// const ENDPOINT_URL = 'http://demo5011061.mockable.io/hb';
const ENDPOINT_URL = 'http://192.168.2.38:5101/bid/request';
const ENDPOINT_EVENT = 'http://192.168.2.38:5101/event';
const ENDPOINT_SYNC = 'http://192.168.2.38:5101/sync';
export const spec: BidderSpec<typeof BIDDER_CODE> = {
  code: BIDDER_CODE,
  gvlid: GVLID,
  supportedMediaTypes: [BANNER],
  alwaysHasCapacity: true,
  aliases: [{ code: "iat", gvlid: 596 }],

  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param {BidRequest} bid The bid params to validate.
   * @return {boolean} True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function (bid) {
    return !!(bid.params.placementId || (bid.params.member && bid.params.invCode));
  },

  /**
   * Make a server request from the list of BidRequests.
   *
   * @param {BidRequest[]} bidRequests - an array of bids
   * @param {BidderRequest} bidderRequest - bidder request object
   * @return {ServerRequest} Info describing the request to the server.
   */
  buildRequests: function (bidRequests, bidderRequest) {
    const data = converter.toORTB({ bidRequests, bidderRequest })
    logInfo(LOG_PREFIX + 'buildRequests converter non-ORTB bidderRequest: ', bidderRequest);
    logInfo(LOG_PREFIX + 'buildRequests converted non-ORTB data: ', bidRequests);
    logInfo(LOG_PREFIX + 'buildRequests converted ORTB data: ', data);

    return {
      method: 'POST',
      url: ENDPOINT_URL,
      data: data,
      options: {
        withCredentials: false,
        contentType: 'application/json'
      },
      // Add explicit header as an additional hint for some servers
      headers: {
        'Content-Type': 'application/json'
      }
    };
  },

  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param {ServerResponse} serverResponse A successful response from the server.
   * @param {BidRequest} bidRequest
   * @return {Bid[]} An array of bids which were nested inside the server.
   */
  interpretResponse: function (serverResponse, bidRequest) {
    // Keep for local testing with mock server
    // const resp = serverResponse.body;
    // const bids = bidRequest.data.imp;
    // resp.seatbid[0].bid.forEach((bid, index) => {
    //     bid.impid = bids[index].id;
    //     bid.adm = `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" crossorigin="anonymous"></script>
    //                                     <div id="gpt-passback">
    //                                     <script>
    //                                         window.googletag = window.googletag || {cmd: []};
    //                                         googletag.cmd.push(function() {
    //                                         googletag.defineSlot('/134642692/AMPTestsV3', [300, 250], 'gpt-passback').addService(googletag.pubads());
    //                                         googletag.enableServices();
    //                                         googletag.display('gpt-passback');
    //                                         });
    //                                     </script>
    //                                     </div>`;
    // });

    const ortbBids = converter.fromORTB({
      response: serverResponse.body,
      request: bidRequest.data,
    });

    return ortbBids;
  },

  /**
   * Register the user sync pixels which should be dropped after the auction.
   *
   * @param {SyncOptions} syncOptions Which user syncs are allowed?
   * @param {ServerResponse[]} serverResponses List of server's responses.
   * @param {Object} gdprConsent GDPR consent data.
   * @param {Object} uspConsent - CCPA consent details.
   * @return {UserSync[]} The user syncs which should be dropped.
   */
  getUserSyncs: function (syncOptions, serverResponses, gdprConsent, uspConsent) {
    logInfo(LOG_PREFIX + 'getUserSyncs called with syncOptions: ', syncOptions, ' serverResponses: ', serverResponses, ' gdprConsent: ', gdprConsent, ' uspConsent: ', uspConsent);
    // const url = new URL(ENDPOINT_SYNC);
    const syncUrl = ENDPOINT_SYNC || serverResponses?.[0]?.body?.ext?.syncUrl;
    const type = syncOptions.iframeEnabled ? 'iframe' : 'image';
    let url = syncUrl + `/${type}?pbjs=1`;

    if (gdprConsent && gdprConsent.consentString) {
      if (typeof gdprConsent.gdprApplies === 'boolean') {
        url += `&gdpr=${Number(gdprConsent.gdprApplies)}&gdpr_consent=${gdprConsent.consentString}`;
      } else {
        url += `&gdpr=0&gdpr_consent=${gdprConsent.consentString}`;
      }
    }

    if (uspConsent && (uspConsent as any).consentString) {
      url += `&ccpa_consent=${(uspConsent as any).consentString}`;
    }

    return [{
      type,
      url
    }];
  },

  /**
   * Register bidder specific code, which will execute if bidder timed out after an auction
   * @param {Object} data Containing timeout specific data
   */
  onTimeout: function (data) {
    // Bidder specifc code
    logInfo(LOG_PREFIX + 'onTimeout called with data: ', data);
    reportEvents('timeout', data);
  },

  /**
   * Register bidder specific code, which will execute if a bid from this bidder won the auction
   * @param {Bid} bid The bid that won the auction
   */
  onBidWon: function (bid) {
    logInfo(LOG_PREFIX + 'onBidWon called for bid: ', bid);
    reportEvents('bidWon', bid);
  },

  /**
   * Register bidder specific code, which will execute when the adserver targeting has been set for a bid from this bidder
   * @param {Bid} bid The bid of which the targeting has been set
   */
  onSetTargeting: function (bid) {
    logInfo(LOG_PREFIX + 'onSetTargeting called for bid: ', bid);
    reportEvents('setTargeting', bid);
  },

  /**
   * Register bidder specific code, which will execute if the bidder responded with an error
   * @param {Object} params - Error parameters
   * @param {Object} params.error - Error object
   * @param {Object} params.bidderRequest - Original bidder request
   */
  onBidderError: function ({ error, bidderRequest }) {
    logError(LOG_PREFIX + 'onBidderError called with error: ', error, ' for bidderRequest: ', bidderRequest);
    reportEvents('bidderError', { error, bidderRequest });
  },

  /**
   * Register bidder specific code, which will execute if the ad
   * has been rendered successfully
   * @param {Bid} bid Bid request object
   */
  onAdRenderSucceeded: function (bid) {
    logInfo(LOG_PREFIX + 'onAdRenderSucceeded called for bid: ', bid);
    reportEvents('adRenderSucceeded', bid);
  }
}

function reportEvents(eventType, eventData) {
  const payload = JSON.stringify({
    domain: location.hostname,
    prebidVersion: '$prebid.version$',
    eventType: eventType,
    eventPayload: eventData
  });

  fetch(`${ENDPOINT_EVENT}`, {
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

registerBidder(spec);
