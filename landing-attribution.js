/* Source and approved campaign labels within this tab only. No requests or cookies. */
(function () {
  'use strict';
  const business = document.currentScript?.getAttribute('data-acquisition-business');
  const sources = new Set(['google','bing','yelp','x','facebook','instagram','nextdoor','zillow','trulia','realtor','homes','homelight','ratemyagent','onekey']);
  const aliases = {twitter:'x',fb:'facebook',ig:'instagram','realtor.com':'realtor','homes.com':'homes'};
  const campaigns = {
    averbrook: new Set(['av-seller-fee-2026q4','av-buyer-fee-2026q4','av-commercial-route9-2026q4','av-organic-profiles-2026q4','av-property-social-2026q4']),
    'crown-hudson': new Set(['ch-residential-closing-2026q4','ch-commercial-lease-2026q4','ch-organic-profiles-2026q4'])
  };
  const domains = {'google.com':'google','googleadservices.com':'google','bing.com':'bing','yelp.com':'yelp','x.com':'x','twitter.com':'x','t.co':'x','facebook.com':'facebook','instagram.com':'instagram','nextdoor.com':'nextdoor','zillow.com':'zillow','trulia.com':'trulia','realtor.com':'realtor','homes.com':'homes','homelight.com':'homelight','ratemyagent.com':'ratemyagent','onekeymls.com':'onekey'};
  const sourceLabel = value => {
    if (typeof value !== 'string' || value.length > 40) return '';
    const lowered=value.trim().toLowerCase(),label=aliases[lowered]||lowered;
    return sources.has(label)?label:'';
  };
  const campaignLabel = value => {
    if (typeof value !== 'string' || value.length > 48) return '';
    const lowered=value.trim().toLowerCase();
    return campaigns[business]?.has(lowered)?lowered:'';
  };
  const key = business+'-landing-attribution-v1';
  let value={source:'',campaign:''};
  const privateMode=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
  if(campaigns[business]&&!privateMode) {
    let stored=null;
    try {
      const raw=sessionStorage.getItem(key);
      if(raw&&raw.length<=160) {
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).every(k=>k==='source'||k==='campaign')) {
          const clean={source:sourceLabel(parsed.source),campaign:campaignLabel(parsed.campaign)};
          if(clean.source&&(clean.source===parsed.source)&&(clean.campaign===parsed.campaign))stored=clean;
        }
      }
    }catch(_){}
    if(stored)value=stored;
    else {
      const query=new URLSearchParams(location.search),explicit=sourceLabel(query.get('utm_source'));
      let legacy='',legacyFresh=false;
      if(business==='averbrook') {try{legacy=sourceLabel(window.AverbrookAcquisition?.source());legacyFresh=window.AverbrookAcquisition?.capturedThisPage?.()===true;}catch(_){}}
      value.source=legacy||explicit;
      if(!value.source) {
        try {
          const referring=new URL(document.referrer),host=referring.hostname.toLowerCase();
          if(['https:','http:'].includes(referring.protocol))for(const [domain,label]of Object.entries(domains))if(host===domain||host.endsWith('.'+domain)){value.source=label;break;}
        }catch(_){}
      }
      // Do not attach a later tagged campaign to an earlier different source.
      if(explicit&&explicit===value.source&&(!legacy||legacyFresh))value.campaign=campaignLabel(query.get('utm_campaign'));
    }
    if(value.source){try{sessionStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  } else if(privateMode) {
    try{sessionStorage.removeItem(key);}catch(_){}
  }
  window.LandingAttribution=Object.freeze({source:()=>value.source,campaign:()=>value.campaign,snapshot:()=>({source:value.source,campaign:value.campaign})});
})();
