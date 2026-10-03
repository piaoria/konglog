import {useEffect,useRef,useState} from 'react';

export function PwaStatus() {
 const [online,setOnline]=useState(navigator.onLine);
 const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
 const [message,setMessage]=useState('');
 const reloadArmed=useRef(false);
 useEffect(()=>{
  let active=true;
  const connected=()=>{setOnline(true);setMessage('');};
  const disconnected=()=>setOnline(false);
  window.addEventListener('online',connected);window.addEventListener('offline',disconnected);
  const changed=()=>{if(reloadArmed.current)window.location.reload();};
  if('serviceWorker' in navigator&&import.meta.env.PROD){
   navigator.serviceWorker.addEventListener('controllerchange',changed);
   navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(registration=>{
    if(!active)return;
    if(registration.waiting)setWaiting(registration.waiting);
    registration.addEventListener('updatefound',()=>{
     const worker=registration.installing;
     worker?.addEventListener('statechange',()=>{if(active&&worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(registration.waiting);});
    });
   }).catch(()=>{ /* The online page remains usable if installation fails. */ });
  }
  return()=>{active=false;window.removeEventListener('online',connected);window.removeEventListener('offline',disconnected);navigator.serviceWorker?.removeEventListener('controllerchange',changed);};
 },[]);
 function update(){
  const dirty=[...document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('textarea,input[type="password"],input[type="number"]')].some(input=>Boolean(input.value.trim()))||Boolean(document.querySelector('.doing-confirm'));
  if(dirty){setMessage('작성 중인 내용을 저장하거나 비운 뒤 새로고침해주세요.');return;}
  if(!online){setMessage('연결되면 새 버전을 열 수 있어요.');return;}
  reloadArmed.current=true;waiting?.postMessage('ACTIVATE_UPDATE');
 }
 return <>{!online&&<p className="pwa-notice" role="status">오프라인이에요. 입력한 내용은 유지되며, 연결 후 직접 저장해주세요.</p>}{waiting&&<div className="pwa-update" role="status"><span>새 버전이 있어요.</span><button type="button" onClick={update}>새로고침</button>{message&&<p>{message}</p>}</div>}</>;
}
