(() => {
  const form=document.querySelector('#matter-inquiry');if(!form)return;
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const base=local?location.origin:form.dataset.apiBase;
  const steps=[...form.querySelectorAll('.form-step')],progress=[...document.querySelectorAll('[data-step-label]')];
  const errors=document.querySelector('#inquiry-errors');
  let step=0,token='',widget=null,ready=false,busy=false;
  const requestId=crypto.randomUUID();
  form.noValidate=true;
  form.dataset.enhanced='true';
  form.querySelectorAll('[data-error-for]').forEach(el=>{el.id='error-'+el.dataset.errorFor;const input=form.elements.namedItem(el.dataset.errorFor);if(input?.setAttribute)input.setAttribute('aria-describedby',el.id);});
  if(local)document.querySelector('.preview-notice').hidden=false;
  const params=new URLSearchParams(location.search);
  if([...form.elements.service.options].some(o=>o.value===params.get('service')))form.elements.service.value=params.get('service');
  function clearErrors(){errors.hidden=true;errors.textContent='';form.querySelectorAll('[data-error-for]').forEach(el=>el.textContent='');form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}
  function showError(message,fields={}) {
    errors.textContent=message;errors.hidden=false;
    for(const [name,text] of Object.entries(fields)){const hint=form.querySelector(`[data-error-for="${name}"]`);if(hint)hint.textContent=text;const input=form.elements.namedItem(name);if(input?.setAttribute)input.setAttribute('aria-invalid','true');}
    errors.focus();
  }
  function go(next){step=next;steps.forEach((el,i)=>el.hidden=i!==step);progress.forEach((el,i)=>{el.classList.toggle('current',i===step);el.setAttribute('aria-current',i===step?'step':'false');});const legend=steps[step].querySelector('legend');legend.tabIndex=-1;legend.focus();}
  function validCurrent(){const invalid=[...steps[step].querySelectorAll('input,select,textarea')].find(el=>!el.checkValidity());if(invalid){invalid.reportValidity();invalid.focus();return false;}return true;}
  form.querySelector('.form-next').addEventListener('click',()=>{clearErrors();if(validCurrent())go(1);});
  form.querySelector('.back-link').addEventListener('click',()=>{clearErrors();go(0);});
  form.addEventListener('keydown',event=>{if(event.key==='Enter'&&step===0&&event.target.tagName!=='TEXTAREA'){event.preventDefault();form.querySelector('.form-next').click();}});
  async function setup(){
    if(local){token='local-preview';ready=true;return;}
    try{
      const response=await fetch(base+'/v1/config',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error();const config=await response.json();if(!config.siteKey)throw new Error();
      window.crownInquiryReady=()=>{widget=window.turnstile.render('#inquiry-security',{sitekey:config.siteKey,action:'matter-inquiry',theme:'light',callback:value=>{token=value;ready=true;},'expired-callback':()=>{token='';ready=false;},'error-callback':()=>{token='';ready=false;}});};
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=crownInquiryReady&render=explicit';script.async=true;script.defer=true;script.onerror=()=>{ready=false;};document.head.append(script);
    }catch{ready=false;}
  }
  setup();
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;clearErrors();
    if(step===0){if(validCurrent())go(1);return;}
    if(!validCurrent())return;
    if(!ready||!token){showError('The security check is not ready. Please try again shortly, or email nick.harris@crownhudsonlaw.com.',{security:'Please complete the security check.'});return;}
    const values=new FormData(form),payload={request_id:requestId};
    for(const name of ['contact_name','email','service','property_county','property_type','other_parties','broker','deadline','website'])payload[name]=String(values.get(name)||'').trim();
    Object.assign(payload,{consent:values.has('consent'),deadline_unknown:!payload.deadline,source:window.LandingAttribution?.source()||'website',campaign:window.LandingAttribution?.campaign()||'',landing_path:location.pathname,synthetic:local,turnstile_token:token});
    const submit=form.querySelector('.form-submit');busy=true;submit.disabled=true;submit.firstChild.textContent='Sending… ';form.setAttribute('aria-busy','true');
    try{
      const response=await fetch(base+'/v1/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(20000)});
      const result=await response.json();
      if(!response.ok){showError(result.error||'Your inquiry was not confirmed. Please try again.',result.fields||{});if(widget!==null){window.turnstile.reset(widget);token='';ready=false;}return;}
      if(!result.reference||result.status!=='awaiting_review')throw new Error();
      form.hidden=true;document.querySelector('.form-progress').hidden=true;const receipt=document.querySelector('#inquiry-receipt');document.querySelector('#receipt-reference').textContent=result.reference;receipt.hidden=false;receipt.focus();
    }catch{showError('Your inquiry was not confirmed. Your entries are still here. Try again, or email nick.harris@crownhudsonlaw.com.');}
    finally{busy=false;submit.disabled=false;submit.firstChild.textContent='Send my inquiry ';form.removeAttribute('aria-busy');}
  });
})();
