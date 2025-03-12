const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/pwa-action-sheet.entry-BofSAxHz.js","assets/mui-D6wVzbAx.js","assets/vendor-wKYVx9ke.js","assets/firebase-gdcPmaPm.js","assets/translations-B3J9M2BY.js","assets/pwa-camera-modal.entry-7apvrC6F.js","assets/pwa-toast.entry-C5PKGKRQ.js","assets/pwa-camera-modal-instance.entry-BciQ5Q7_.js","assets/pwa-camera.entry-BAakU_sx.js","assets/index-BtDTbazQ.js","assets/index-DOWgHDbM.js","assets/strings-DG86RkOV.js","assets/index-Cnr7Xi3M.css","assets/index-BDm6_tDG.js","assets/index-0XjfPz8-.css","assets/index-DFZdwnk6.css","assets/index-mGfjpset.js","assets/index-Cid0OPgL.js","assets/index-DGQFtoBH.js","assets/urls-bwAPA7IR.js","assets/index-Dv4riOOH.css","assets/index-KFk9mW72.js","assets/index-DWfPV1BA.js","assets/index-Cr_Nb543.js","assets/useActionList-BQHK77G0.js","assets/gameBoard-1BlDRL8L.js","assets/index-CignLajt.css","assets/index-rSLzeRrU.css"])))=>i.map(i=>d[i]);
import{_ as pa,u as _a,a as wr,j as H,c as ma,r as ga,T as ya,C as va}from"./mui-D6wVzbAx.js";import{e as wa,g as Qe,a as K,f as Ca,h as Ea,b as rn,u as Cr,B as Sa,i as xa,j as Bn,N as Ta}from"./vendor-wKYVx9ke.js";import{_ as ba,r as oi,g as Ia,a as Na,S as Ra,i as ka,b as Aa,c as Ft,s as Ma,d as En,e as Je,f as Da,u as Oa,h as $a,j as Er,k as Pa,q as ys,w as vs,l as Fa,m as Sr,n as La,o as xr,p as Tr,T as Ua}from"./firebase-gdcPmaPm.js";import{i as Wa,a as Ba}from"./translations-B3J9M2BY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const Ha="modulepreload",ja=function(n){return"/"+n},ai={},me=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),a=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));i=Promise.allSettled(t.map(l=>{if(l=ja(l),l in ai)return;ai[l]=!0;const c=l.endsWith(".css"),h=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${h}`))return;const u=document.createElement("link");if(u.rel=c?"stylesheet":Ha,c||(u.as="script"),u.crossOrigin="",u.href=l,a&&u.setAttribute("nonce",a),document.head.appendChild(u),c)return new Promise((d,p)=>{u.addEventListener("load",d),u.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${l}`)))})}))}function r(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return i.then(o=>{for(const a of o||[])a.status==="rejected"&&r(a.reason);return e().catch(r)})};var Ya=function(){var n=function(e,t){return n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(s,i){s.__proto__=i}||function(s,i){for(var r in i)Object.prototype.hasOwnProperty.call(i,r)&&(s[r]=i[r])},n(e,t)};return function(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");n(e,t);function s(){this.constructor=e}e.prototype=t===null?Object.create(t):(s.prototype=t.prototype,new s)}}(),br=function(n,e,t,s){function i(r){return r instanceof t?r:new t(function(o){o(r)})}return new(t||(t=Promise))(function(r,o){function a(h){try{c(s.next(h))}catch(u){o(u)}}function l(h){try{c(s.throw(h))}catch(u){o(u)}}function c(h){h.done?r(h.value):i(h.value).then(a,l)}c((s=s.apply(n,e||[])).next())})},Ir=function(n,e){var t={label:0,sent:function(){if(r[0]&1)throw r[1];return r[1]},trys:[],ops:[]},s,i,r,o;return o={next:a(0),throw:a(1),return:a(2)},typeof Symbol=="function"&&(o[Symbol.iterator]=function(){return this}),o;function a(c){return function(h){return l([c,h])}}function l(c){if(s)throw new TypeError("Generator is already executing.");for(;o&&(o=0,c[0]&&(t=0)),t;)try{if(s=1,i&&(r=c[0]&2?i.return:c[0]?i.throw||((r=i.return)&&r.call(i),0):i.next)&&!(r=r.call(i,c[1])).done)return r;switch(i=0,r&&(c=[c[0]&2,r.value]),c[0]){case 0:case 1:r=c;break;case 4:return t.label++,{value:c[1],done:!1};case 5:t.label++,i=c[1],c=[0];continue;case 7:c=t.ops.pop(),t.trys.pop();continue;default:if(r=t.trys,!(r=r.length>0&&r[r.length-1])&&(c[0]===6||c[0]===2)){t=0;continue}if(c[0]===3&&(!r||c[1]>r[0]&&c[1]<r[3])){t.label=c[1];break}if(c[0]===6&&t.label<r[1]){t.label=r[1],r=c;break}if(r&&t.label<r[2]){t.label=r[2],t.ops.push(c);break}r[2]&&t.ops.pop(),t.trys.pop();continue}c=e.call(n,t)}catch(h){c=[6,h],i=0}finally{s=r=0}if(c[0]&5)throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}},li=function(n,e,t){if(t||arguments.length===2)for(var s=0,i=e.length,r;s<i;s++)(r||!(s in e))&&(r||(r=Array.prototype.slice.call(e,0,s)),r[s]=e[s]);return n.concat(r||Array.prototype.slice.call(e))},Va="ionicpwaelements",Kt,Nr,pe=!1,Zn=!1,Re=function(n,e){return function(){}},za=function(n,e){return function(){}},qa="{visibility:hidden}.hydrated{visibility:inherit}",ci={},Ga="http://www.w3.org/2000/svg",Ka="http://www.w3.org/1999/xhtml",Qa=function(n){return n!=null},ws=function(n){return n=typeof n,n==="object"||n==="function"};function Rr(n){var e,t,s;return(s=(t=(e=n.head)===null||e===void 0?void 0:e.querySelector('meta[name="csp-nonce"]'))===null||t===void 0?void 0:t.getAttribute("content"))!==null&&s!==void 0?s:void 0}var Ja=function(n,e){for(var t=[],s=2;s<arguments.length;s++)t[s-2]=arguments[s];var i=null,r=!1,o=!1,a=[],l=function(u){for(var d=0;d<u.length;d++)i=u[d],Array.isArray(i)?l(i):i!=null&&typeof i!="boolean"&&((r=typeof n!="function"&&!ws(i))&&(i=String(i)),r&&o?a[a.length-1].$text$+=i:a.push(r?es(null,i):i),o=r)};if(l(t),e){var c=e.className||e.class;c&&(e.class=typeof c!="object"?c:Object.keys(c).filter(function(u){return c[u]}).join(" "))}var h=es(n,null);return h.$attrs$=e,a.length>0&&(h.$children$=a),h},es=function(n,e){var t={$flags$:0,$tag$:n,$text$:e,$elm$:null,$children$:null};return t.$attrs$=null,t},Xa={},Za=function(n){return n&&n.$tag$===Xa},el=function(n,e){return n!=null&&!ws(n)?e&4?n==="false"?!1:n===""||!!n:e&2?parseFloat(n):e&1?String(n):n:n},tl=function(n){return Ue(n).$hostElement$},Yf=function(n,e,t){var s=tl(n);return{emit:function(i){return kr(s,e,{bubbles:!0,composed:!0,cancelable:!0,detail:i})}}},kr=function(n,e,t){var s=oe.ce(e,t);return n.dispatchEvent(s),s},ui=new WeakMap,nl=function(n,e,t){var s=on.get(n);Tl&&t?(s=s||new CSSStyleSheet,typeof s=="string"?s=e:s.replaceSync(e)):s=e,on.set(n,s)},sl=function(n,e,t,s){var i,r=Ar(e),o=on.get(r);if(n=n.nodeType===11?n:we,o)if(typeof o=="string"){n=n.head||n;var a=ui.get(n),l=void 0;if(a||ui.set(n,a=new Set),!a.has(r)){{l=we.createElement("style"),l.innerHTML=o;var c=(i=oe.$nonce$)!==null&&i!==void 0?i:Rr(we);c!=null&&l.setAttribute("nonce",c),n.insertBefore(l,n.querySelector("link"))}a&&a.add(r)}}else n.adoptedStyleSheets.includes(o)||(n.adoptedStyleSheets=li(li([],n.adoptedStyleSheets,!0),[o],!1));return r},il=function(n){var e=n.$cmpMeta$,t=n.$hostElement$,s=e.$flags$,i=Re("attachStyles",e.$tagName$),r=sl(t.shadowRoot?t.shadowRoot:t.getRootNode(),e);s&10&&(t["s-sc"]=r,t.classList.add(r+"-h")),i()},Ar=function(n,e){return"sc-"+n.$tagName$},hi=function(n,e,t,s,i,r){if(t!==s){var o=fi(n,e),a=e.toLowerCase();if(e==="class"){var l=n.classList,c=di(t),h=di(s);l.remove.apply(l,c.filter(function(v){return v&&!h.includes(v)})),l.add.apply(l,h.filter(function(v){return v&&!c.includes(v)}))}else if(e==="style"){for(var u in t)(!s||s[u]==null)&&(u.includes("-")?n.style.removeProperty(u):n.style[u]="");for(var u in s)(!t||s[u]!==t[u])&&(u.includes("-")?n.style.setProperty(u,s[u]):n.style[u]=s[u])}else if(e==="ref")s&&s(n);else if(!o&&e[0]==="o"&&e[1]==="n")e[2]==="-"?e=e.slice(3):fi(xn,a)?e=a.slice(2):e=a[2]+e.slice(3),t&&oe.rel(n,e,t,!1),s&&oe.ael(n,e,s,!1);else{var d=ws(s);if((o||d&&s!==null)&&!i)try{if(n.tagName.includes("-"))n[e]=s;else{var p=s??"";e==="list"?o=!1:(t==null||n[e]!=p)&&(n[e]=p)}}catch{}s==null||s===!1?(s!==!1||n.getAttribute(e)==="")&&n.removeAttribute(e):(!o||r&4||i)&&!d&&(s=s===!0?"":s,n.setAttribute(e,s))}}},rl=/\s/,di=function(n){return n?n.split(rl):[]},Mr=function(n,e,t,s){var i=e.$elm$.nodeType===11&&e.$elm$.host?e.$elm$.host:e.$elm$,r=n&&n.$attrs$||ci,o=e.$attrs$||ci;for(s in r)s in o||hi(i,s,r[s],void 0,t,e.$flags$);for(s in o)hi(i,s,r[s],o[s],t,e.$flags$)},Cs=function(n,e,t,s){var i=e.$children$[t],r=0,o,a;if(i.$text$!==null)o=i.$elm$=we.createTextNode(i.$text$);else{if(pe||(pe=i.$tag$==="svg"),o=i.$elm$=we.createElementNS(pe?Ga:Ka,i.$tag$),pe&&i.$tag$==="foreignObject"&&(pe=!1),Mr(null,i,pe),Qa(Kt)&&o["s-si"]!==Kt&&o.classList.add(o["s-si"]=Kt),i.$children$)for(r=0;r<i.$children$.length;++r)a=Cs(n,i,r),a&&o.appendChild(a);i.$tag$==="svg"?pe=!1:o.tagName==="foreignObject"&&(pe=!0)}return o},Dr=function(n,e,t,s,i,r){var o=n,a;for(o.shadowRoot&&o.tagName===Nr&&(o=o.shadowRoot);i<=r;++i)s[i]&&(a=Cs(null,t,i),a&&(s[i].$elm$=a,o.insertBefore(a,e)))},Or=function(n,e,t){for(var s=e;s<=t;++s){var i=n[s];if(i){var r=i.$elm$;$r(i),r&&r.remove()}}},ol=function(n,e,t,s){for(var i=0,r=0,o=e.length-1,a=e[0],l=e[o],c=s.length-1,h=s[0],u=s[c],d;i<=o&&r<=c;)a==null?a=e[++i]:l==null?l=e[--o]:h==null?h=s[++r]:u==null?u=s[--c]:Vt(a,h)?(Et(a,h),a=e[++i],h=s[++r]):Vt(l,u)?(Et(l,u),l=e[--o],u=s[--c]):Vt(a,u)?(Et(a,u),n.insertBefore(a.$elm$,l.$elm$.nextSibling),a=e[++i],u=s[--c]):Vt(l,h)?(Et(l,h),n.insertBefore(l.$elm$,a.$elm$),l=e[--o],h=s[++r]):(d=Cs(e&&e[r],t,r),h=s[++r],d&&a.$elm$.parentNode.insertBefore(d,a.$elm$));i>o?Dr(n,s[c+1]==null?null:s[c+1].$elm$,t,s,r,c):r>c&&Or(e,i,o)},Vt=function(n,e){return n.$tag$===e.$tag$},Et=function(n,e){var t=e.$elm$=n.$elm$,s=n.$children$,i=e.$children$,r=e.$tag$,o=e.$text$;o===null?(pe=r==="svg"?!0:r==="foreignObject"?!1:pe,Mr(n,e,pe),s!==null&&i!==null?ol(t,s,e,i):i!==null?(n.$text$!==null&&(t.textContent=""),Dr(t,null,e,i,0,i.length-1)):s!==null&&Or(s,0,s.length-1),pe&&r==="svg"&&(pe=!1)):n.$text$!==o&&(t.data=o)},$r=function(n){n.$attrs$&&n.$attrs$.ref&&n.$attrs$.ref(null),n.$children$&&n.$children$.map($r)},al=function(n,e){var t=n.$hostElement$,s=n.$vnode$||es(null,null),i=Za(e)?e:Ja(null,null,e);Nr=t.tagName,i.$tag$=null,i.$flags$|=4,n.$vnode$=i,i.$elm$=s.$elm$=t.shadowRoot||t,Kt=t["s-sc"],Et(s,i)},Pr=function(n,e){e&&!n.$onRenderResolve$&&e["s-p"]&&e["s-p"].push(new Promise(function(t){return n.$onRenderResolve$=t}))},Sn=function(n,e){if(n.$flags$|=16,n.$flags$&4){n.$flags$|=512;return}Pr(n,n.$ancestorComponent$);var t=function(){return ll(n,e)};return Il(t)},ll=function(n,e){var t=Re("scheduleUpdate",n.$cmpMeta$.$tagName$),s=n.$lazyInstance$,i;return e&&(n.$flags$|=256,n.$queuedListeners$&&(n.$queuedListeners$.map(function(r){var o=r[0],a=r[1];return Es(s,o,a)}),n.$queuedListeners$=void 0)),t(),cl(i,function(){return hl(n,s,e)})},cl=function(n,e){return ul(n)?n.then(e):e()},ul=function(n){return n instanceof Promise||n&&n.then&&typeof n.then=="function"},hl=function(n,e,t){return br(void 0,void 0,void 0,function(){var s,i,r,o,a,l,c;return Ir(this,function(h){return i=n.$hostElement$,r=Re("update",n.$cmpMeta$.$tagName$),o=i["s-rc"],t&&il(n),a=Re("render",n.$cmpMeta$.$tagName$),dl(n,e),o&&(o.map(function(u){return u()}),i["s-rc"]=void 0),a(),r(),l=(s=i["s-p"])!==null&&s!==void 0?s:[],c=function(){return fl(n)},l.length===0?c():(Promise.all(l).then(c),n.$flags$|=4,l.length=0),[2]})})},dl=function(n,e,t){try{e=e.render(),n.$flags$&=-17,n.$flags$|=2,al(n,e)}catch(s){ye(s,n.$hostElement$)}return null},fl=function(n){n.$cmpMeta$.$tagName$;var e=n.$hostElement$,t=Re(),s=n.$lazyInstance$,i=n.$ancestorComponent$;n.$flags$&64?t():(n.$flags$|=64,Lr(e),Es(s,"componentDidLoad"),t(),n.$onReadyResolve$(e),i||Fr()),n.$onInstanceResolve$(e),n.$onRenderResolve$&&(n.$onRenderResolve$(),n.$onRenderResolve$=void 0),n.$flags$&512&&xs(function(){return Sn(n,!1)}),n.$flags$&=-517},Vf=function(n){{var e=Ue(n),t=e.$hostElement$.isConnected;return t&&(e.$flags$&18)===2&&Sn(e,!1),t}},Fr=function(n){Lr(we.documentElement),xs(function(){return kr(xn,"appload",{detail:{namespace:Va}})})},Es=function(n,e,t){if(n&&n[e])try{return n[e](t)}catch(s){ye(s)}},Lr=function(n){return n.classList.add("hydrated")},pl=function(n,e){return Ue(n).$instanceValues$.get(e)},_l=function(n,e,t,s){var i=Ue(n),r=i.$instanceValues$.get(e),o=i.$flags$,a=i.$lazyInstance$;t=el(t,s.$members$[e][0]);var l=Number.isNaN(r)&&Number.isNaN(t),c=t!==r&&!l;(!(o&8)||r===void 0)&&c&&(i.$instanceValues$.set(e,t),a&&(o&18)===2&&Sn(i,!1))},Ur=function(n,e,t){if(e.$members$){var s=Object.entries(e.$members$),i=n.prototype;if(s.map(function(o){var a=o[0],l=o[1][0];l&31||t&2&&l&32?Object.defineProperty(i,a,{get:function(){return pl(this,a)},set:function(c){_l(this,a,c,e)},configurable:!0,enumerable:!0}):t&1&&l&64&&Object.defineProperty(i,a,{value:function(){for(var c=[],h=0;h<arguments.length;h++)c[h]=arguments[h];var u=Ue(this);return u.$onInstancePromise$.then(function(){var d;return(d=u.$lazyInstance$)[a].apply(d,c)})}})}),t&1){var r=new Map;i.attributeChangedCallback=function(o,a,l){var c=this;oe.jmp(function(){var h=r.get(o);if(c.hasOwnProperty(h))l=c[h],delete c[h];else if(i.hasOwnProperty(h)&&typeof c[h]=="number"&&c[h]==l)return;c[h]=l===null&&typeof c[h]=="boolean"?!1:l})},n.observedAttributes=s.filter(function(o){o[0];var a=o[1];return a[0]&15}).map(function(o){var a=o[0],l=o[1],c=l[1]||a;return r.set(c,a),c})}}return n},ml=function(n,e,t,s,i){return br(void 0,void 0,void 0,function(){var r,o,a,l,c,h,u;return Ir(this,function(d){switch(d.label){case 0:return(e.$flags$&32)!==0?[3,3]:(e.$flags$|=32,i=xl(t),i.then?(r=za(),[4,i]):[3,2]);case 1:i=d.sent(),r(),d.label=2;case 2:i.isProxied||(Ur(i,t,2),i.isProxied=!0),o=Re("createInstance",t.$tagName$),e.$flags$|=8;try{new i(e)}catch(p){ye(p)}e.$flags$&=-9,o(),i.style&&(a=i.style,l=Ar(t),on.has(l)||(c=Re("registerStyles",t.$tagName$),nl(l,a,!!(t.$flags$&1)),c())),d.label=3;case 3:return h=e.$ancestorComponent$,u=function(){return Sn(e,!0)},h&&h["s-rc"]?h["s-rc"].push(u):u(),[2]}})})},gl=function(n){if((oe.$flags$&1)===0){var e=Ue(n),t=e.$cmpMeta$,s=Re("connectedCallback",t.$tagName$);if(e.$flags$&1)Wr(n,e,t.$listeners$);else{e.$flags$|=1;for(var i=n;i=i.parentNode||i.host;)if(i["s-p"]){Pr(e,e.$ancestorComponent$=i);break}t.$members$&&Object.entries(t.$members$).map(function(r){var o=r[0],a=r[1][0];if(a&31&&n.hasOwnProperty(o)){var l=n[o];delete n[o],n[o]=l}}),ml(n,e,t)}s()}},yl=function(n){if((oe.$flags$&1)===0){var e=Ue(n),t=e.$lazyInstance$;e.$rmListeners$&&(e.$rmListeners$.map(function(s){return s()}),e.$rmListeners$=void 0),Es(t,"disconnectedCallback")}},vl=function(n,e){e===void 0&&(e={});var t,s=Re(),i=[],r=e.exclude||[],o=xn.customElements,a=we.head,l=a.querySelector("meta[charset]"),c=we.createElement("style"),h=[],u,d=!0;Object.assign(oe,e),oe.$resourcesUrl$=new URL(e.resourcesUrl||"./",we.baseURI).href,n.map(function(v){v[1].map(function(A){var b={$flags$:A[0],$tagName$:A[1],$members$:A[2],$listeners$:A[3]};b.$members$=A[2],b.$listeners$=A[3];var O=b.$tagName$,W=function(M){Ya(J,M);function J(B){var f=M.call(this,B)||this;return B=f,Sl(B,b),b.$flags$&1&&B.attachShadow({mode:"open"}),f}return J.prototype.connectedCallback=function(){var B=this;u&&(clearTimeout(u),u=null),d?h.push(this):oe.jmp(function(){return gl(B)})},J.prototype.disconnectedCallback=function(){var B=this;oe.jmp(function(){return yl(B)})},J.prototype.componentOnReady=function(){return Ue(this).$onReadyPromise$},J}(HTMLElement);b.$lazyBundleId$=v[0],!r.includes(O)&&!o.get(O)&&(i.push(O),o.define(O,Ur(W,b,1)))})});{c.innerHTML=i+qa,c.setAttribute("data-styles","");var p=(t=oe.$nonce$)!==null&&t!==void 0?t:Rr(we);p!=null&&c.setAttribute("nonce",p),a.insertBefore(c,l?l.nextSibling:a.firstChild)}d=!1,h.length?h.map(function(v){return v.connectedCallback()}):oe.jmp(function(){return u=setTimeout(Fr,30)}),s()},Wr=function(n,e,t,s){t&&t.map(function(i){var r=i[0],o=i[1],a=i[2],l=Cl(n,r),c=wl(e,a),h=El(r);oe.ael(l,o,c,h),(e.$rmListeners$=e.$rmListeners$||[]).push(function(){return oe.rel(l,o,c,h)})})},wl=function(n,e){return function(t){try{n.$flags$&256?n.$lazyInstance$[e](t):(n.$queuedListeners$=n.$queuedListeners$||[]).push([e,t])}catch(s){ye(s)}}},Cl=function(n,e){return e&16?we.body:n},El=function(n){return(n&2)!==0},Ss=new WeakMap,Ue=function(n){return Ss.get(n)},zf=function(n,e){return Ss.set(e.$lazyInstance$=n,e)},Sl=function(n,e){var t={$flags$:0,$hostElement$:n,$cmpMeta$:e,$instanceValues$:new Map};return t.$onInstancePromise$=new Promise(function(s){return t.$onInstanceResolve$=s}),t.$onReadyPromise$=new Promise(function(s){return t.$onReadyResolve$=s}),n["s-p"]=[],n["s-rc"]=[],Wr(n,t,e.$listeners$),Ss.set(n,t)},fi=function(n,e){return e in n},ye=function(n,e){return(0,console.error)(n,e)},Hn=new Map,xl=function(n,e,t){var s=n.$tagName$.replace(/-/g,"_"),i=n.$lazyBundleId$,r=Hn.get(i);if(r)return r[s];{var o=function(a){return Hn.set(i,a),a[s]};switch(i){case"pwa-action-sheet":return me(()=>import("./pwa-action-sheet.entry-BofSAxHz.js"),__vite__mapDeps([0,1,2,3,4])).then(o,ye);case"pwa-camera-modal":return me(()=>import("./pwa-camera-modal.entry-7apvrC6F.js"),__vite__mapDeps([5,1,2,3,4])).then(o,ye);case"pwa-toast":return me(()=>import("./pwa-toast.entry-C5PKGKRQ.js"),__vite__mapDeps([6,1,2,3,4])).then(o,ye);case"pwa-camera-modal-instance":return me(()=>import("./pwa-camera-modal-instance.entry-BciQ5Q7_.js"),__vite__mapDeps([7,1,2,3,4])).then(o,ye);case"pwa-camera":return me(()=>import("./pwa-camera.entry-BAakU_sx.js"),__vite__mapDeps([8,1,2,3,4])).then(o,ye)}}return me(()=>import("./".concat(i,".entry.js").concat("")),[]).then(function(a){return Hn.set(i,a),a[s]},ye)},on=new Map,xn=typeof window<"u"?window:{},we=xn.document||{head:{}},oe={$flags$:0,$resourcesUrl$:"",jmp:function(n){return n()},raf:function(n){return requestAnimationFrame(n)},ael:function(n,e,t,s){return n.addEventListener(e,t,s)},rel:function(n,e,t,s){return n.removeEventListener(e,t,s)},ce:function(n,e){return new CustomEvent(n,e)}},Br=function(n){return Promise.resolve(n)},Tl=function(){try{return new CSSStyleSheet,typeof new CSSStyleSheet().replaceSync=="function"}catch{}return!1}(),pi=[],Hr=[],bl=function(n,e){return function(t){n.push(t),Zn||(Zn=!0,oe.$flags$&4?xs(ts):oe.raf(ts))}},_i=function(n){for(var e=0;e<n.length;e++)try{n[e](performance.now())}catch(t){ye(t)}n.length=0},ts=function(){_i(pi),_i(Hr),(Zn=pi.length>0)&&oe.raf(ts)},xs=function(n){return Br().then(n)},Il=bl(Hr),Nl=function(){return Br()},Rl=function(n,e){return typeof window>"u"?Promise.resolve():Nl().then(function(){return vl([["pwa-camera-modal",[[1,"pwa-camera-modal",{facingMode:[1,"facing-mode"],hidePicker:[4,"hide-picker"],present:[64],dismiss:[64]}]]],["pwa-action-sheet",[[1,"pwa-action-sheet",{header:[1],cancelable:[4],options:[16],open:[32]}]]],["pwa-toast",[[1,"pwa-toast",{message:[1],duration:[2],closing:[32]}]]],["pwa-camera",[[1,"pwa-camera",{facingMode:[1,"facing-mode"],handlePhoto:[16],hidePicker:[4,"hide-picker"],handleNoDeviceError:[16],noDevicesText:[1,"no-devices-text"],noDevicesButtonText:[1,"no-devices-button-text"],photo:[32],photoSrc:[32],showShutterOverlay:[32],flashIndex:[32],hasCamera:[32],rotation:[32],deviceError:[32]}]]],["pwa-camera-modal-instance",[[1,"pwa-camera-modal-instance",{facingMode:[1,"facing-mode"],hidePicker:[4,"hide-picker"],noDevicesText:[1,"no-devices-text"],noDevicesButtonText:[1,"no-devices-button-text"]},[[16,"keyup","handleBackdropKeyUp"]]]]]],e)})};(function(){if(typeof window<"u"&&window.Reflect!==void 0&&window.customElements!==void 0){var n=HTMLElement;window.HTMLElement=function(){return Reflect.construct(n,[],this.constructor)},HTMLElement.prototype=n.prototype,HTMLElement.prototype.constructor=HTMLElement,Object.setPrototypeOf(HTMLElement,n)}})();var zt={},mi;function kl(){if(mi)return zt;mi=1;var n=wa();return zt.createRoot=n.createRoot,zt.hydrateRoot=n.hydrateRoot,zt}var Al=kl();const Ml=Qe(Al),Dl=["localeText"],gi=K.createContext(null),Ol=function(e){const{localeText:t}=e,s=pa(e,Dl),{utils:i,localeText:r}=K.useContext(gi)??{utils:void 0,localeText:void 0},o=_a({props:s,name:"MuiLocalizationProvider"}),{children:a,dateAdapter:l,dateFormats:c,dateLibInstance:h,adapterLocale:u,localeText:d}=o,p=K.useMemo(()=>wr({},d,r,t),[d,r,t]),v=K.useMemo(()=>{if(!l)return i||null;const O=new l({locale:u,formats:c,instance:h});if(!O.isMUIAdapter)throw new Error(["MUI X: The date adapter should be imported from `@mui/x-date-pickers` or `@mui/x-date-pickers-pro`, not from `@date-io`","For example, `import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'` instead of `import AdapterDayjs from '@date-io/dayjs'`","More information on the installation documentation: https://mui.com/x/react-date-pickers/getting-started/#installation"].join(`
`));return O},[l,u,c,h,i]),A=K.useMemo(()=>v?{minDate:v.date("1900-01-01T00:00:00.000"),maxDate:v.date("2099-12-31T00:00:00.000")}:null,[v]),b=K.useMemo(()=>({utils:v,defaultDates:A,localeText:p}),[A,v,p]);return H.jsx(gi.Provider,{value:b,children:a})};var yi={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jr={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const E=function(n,e){if(!n)throw pt(e)},pt=function(n){return new Error("Firebase Database ("+jr.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yr=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},$l=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const i=n[t++];if(i<128)e[s++]=String.fromCharCode(i);else if(i>191&&i<224){const r=n[t++];e[s++]=String.fromCharCode((i&31)<<6|r&63)}else if(i>239&&i<365){const r=n[t++],o=n[t++],a=n[t++],l=((i&7)<<18|(r&63)<<12|(o&63)<<6|a&63)-65536;e[s++]=String.fromCharCode(55296+(l>>10)),e[s++]=String.fromCharCode(56320+(l&1023))}else{const r=n[t++],o=n[t++];e[s++]=String.fromCharCode((i&15)<<12|(r&63)<<6|o&63)}}return e.join("")},Ts={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let i=0;i<n.length;i+=3){const r=n[i],o=i+1<n.length,a=o?n[i+1]:0,l=i+2<n.length,c=l?n[i+2]:0,h=r>>2,u=(r&3)<<4|a>>4;let d=(a&15)<<2|c>>6,p=c&63;l||(p=64,o||(d=64)),s.push(t[h],t[u],t[d],t[p])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Yr(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):$l(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let i=0;i<n.length;){const r=t[n.charAt(i++)],a=i<n.length?t[n.charAt(i)]:0;++i;const c=i<n.length?t[n.charAt(i)]:64;++i;const u=i<n.length?t[n.charAt(i)]:64;if(++i,r==null||a==null||c==null||u==null)throw new Pl;const d=r<<2|a>>4;if(s.push(d),c!==64){const p=a<<4&240|c>>2;if(s.push(p),u!==64){const v=c<<6&192|u;s.push(v)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Pl extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Vr=function(n){const e=Yr(n);return Ts.encodeByteArray(e,!0)},vi=function(n){return Vr(n).replace(/\./g,"")},ns=function(n){try{return Ts.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fl(n){return zr(void 0,n)}function zr(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!Ll(t)||(n[t]=zr(n[t],e[t]));return n}function Ll(n){return n!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ul(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wl=()=>Ul().__FIREBASE_DEFAULTS__,Bl=()=>{if(typeof process>"u"||typeof yi>"u")return;const n=yi.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Hl=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&ns(n[1]);return e&&JSON.parse(e)},jl=()=>{try{return Wl()||Bl()||Hl()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Yl=n=>{var e,t;return(t=(e=jl())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},Vl=n=>{const e=Yl(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $e{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zl(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",i=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o=Object.assign({iss:`https://securetoken.google.com/${s}`,aud:s,iat:i,exp:i+3600,auth_time:i,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},n);return[vi(JSON.stringify(t)),vi(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ql(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function qr(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ql())}function Gl(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Kl(){return jr.NODE_ADMIN===!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nt(n){return JSON.parse(n)}function ae(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gr=function(n){let e={},t={},s={},i="";try{const r=n.split(".");e=Nt(ns(r[0])||""),t=Nt(ns(r[1])||""),i=r[2],s=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:s,signature:i}},Ql=function(n){const e=Gr(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Jl=function(n){const e=Gr(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xe(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function lt(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function ss(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function an(n,e,t){const s={};for(const i in n)Object.prototype.hasOwnProperty.call(n,i)&&(s[i]=e.call(t,n[i],i,n));return s}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xl(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zl{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const s=this.W_;if(typeof e=="string")for(let u=0;u<16;u++)s[u]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let u=0;u<16;u++)s[u]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let u=16;u<80;u++){const d=s[u-3]^s[u-8]^s[u-14]^s[u-16];s[u]=(d<<1|d>>>31)&4294967295}let i=this.chain_[0],r=this.chain_[1],o=this.chain_[2],a=this.chain_[3],l=this.chain_[4],c,h;for(let u=0;u<80;u++){u<40?u<20?(c=a^r&(o^a),h=1518500249):(c=r^o^a,h=1859775393):u<60?(c=r&o|a&(r|o),h=2400959708):(c=r^o^a,h=3395469782);const d=(i<<5|i>>>27)+c+l+h+s[u]&4294967295;l=a,a=o,o=(r<<30|r>>>2)&4294967295,r=i,i=d}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+l&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const s=t-this.blockSize;let i=0;const r=this.buf_;let o=this.inbuf_;for(;i<t;){if(o===0)for(;i<=s;)this.compress_(e,i),i+=this.blockSize;if(typeof e=="string"){for(;i<t;)if(r[o]=e.charCodeAt(i),++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}else for(;i<t;)if(r[o]=e[i],++o,++i,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let i=this.blockSize-1;i>=56;i--)this.buf_[i]=t&255,t/=256;this.compress_(this.buf_);let s=0;for(let i=0;i<5;i++)for(let r=24;r>=0;r-=8)e[s]=this.chain_[i]>>r&255,++s;return e}}function ct(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ec=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let i=n.charCodeAt(s);if(i>=55296&&i<=56319){const r=i-55296;s++,E(s<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(s)-56320;i=65536+(r<<10)+o}i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):i<65536?(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Tn=function(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);s<128?e++:s<2048?e+=2:s>=55296&&s<=56319?(e+=4,t++):e+=3}return e};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xe(n){return n&&n._delegate?n._delegate:n}class tc{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var G;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(G||(G={}));const nc={debug:G.DEBUG,verbose:G.VERBOSE,info:G.INFO,warn:G.WARN,error:G.ERROR,silent:G.SILENT},sc=G.INFO,ic={[G.DEBUG]:"log",[G.VERBOSE]:"log",[G.INFO]:"info",[G.WARN]:"warn",[G.ERROR]:"error"},rc=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),i=ic[e];if(i)console[i](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class oc{constructor(e){this.name=e,this._logLevel=sc,this._logHandler=rc,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in G))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?nc[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,G.DEBUG,...e),this._logHandler(this,G.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,G.VERBOSE,...e),this._logHandler(this,G.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,G.INFO,...e),this._logHandler(this,G.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,G.WARN,...e),this._logHandler(this,G.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,G.ERROR,...e),this._logHandler(this,G.ERROR,...e)}}var wi={};const Ci="@firebase/database",Ei="1.0.9";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Kr="";function ac(n){Kr=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lc{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),ae(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:Nt(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cc{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return xe(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qr=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new lc(e)}}catch{}return new cc},je=Qr("localStorage"),uc=Qr("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rt=new oc("@firebase/database"),hc=function(){let n=1;return function(){return n++}}(),Jr=function(n){const e=ec(n),t=new Zl;t.update(e);const s=t.digest();return Ts.encodeByteArray(s)},Lt=function(...n){let e="";for(let t=0;t<n.length;t++){const s=n[t];Array.isArray(s)||s&&typeof s=="object"&&typeof s.length=="number"?e+=Lt.apply(null,s):typeof s=="object"?e+=ae(s):e+=s,e+=" "}return e};let St=null,Si=!0;const dc=function(n,e){E(!0,"Can't turn on custom loggers persistently."),rt.logLevel=G.VERBOSE,St=rt.log.bind(rt)},ce=function(...n){if(Si===!0&&(Si=!1,St===null&&uc.get("logging_enabled")===!0&&dc()),St){const e=Lt.apply(null,n);St(e)}},Ut=function(n){return function(...e){ce(n,...e)}},is=function(...n){const e="FIREBASE INTERNAL ERROR: "+Lt(...n);rt.error(e)},ke=function(...n){const e=`FIREBASE FATAL ERROR: ${Lt(...n)}`;throw rt.error(e),new Error(e)},fe=function(...n){const e="FIREBASE WARNING: "+Lt(...n);rt.warn(e)},fc=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&fe("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},bn=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},pc=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},ut="[MIN_NAME]",ze="[MAX_NAME]",Ze=function(n,e){if(n===e)return 0;if(n===ut||e===ze)return-1;if(e===ut||n===ze)return 1;{const t=xi(n),s=xi(e);return t!==null?s!==null?t-s===0?n.length-e.length:t-s:-1:s!==null?1:n<e?-1:1}},_c=function(n,e){return n===e?0:n<e?-1:1},yt=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+ae(e))},bs=function(n){if(typeof n!="object"||n===null)return ae(n);const e=[];for(const s in n)e.push(s);e.sort();let t="{";for(let s=0;s<e.length;s++)s!==0&&(t+=","),t+=ae(e[s]),t+=":",t+=bs(n[e[s]]);return t+="}",t},Xr=function(n,e){const t=n.length;if(t<=e)return[n];const s=[];for(let i=0;i<t;i+=e)i+e>t?s.push(n.substring(i,t)):s.push(n.substring(i,i+e));return s};function ue(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Zr=function(n){E(!bn(n),"Invalid JSON number");const e=11,t=52,s=(1<<e-1)-1;let i,r,o,a,l;n===0?(r=0,o=0,i=1/n===-1/0?1:0):(i=n<0,n=Math.abs(n),n>=Math.pow(2,1-s)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),s),r=a+s,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-s-t))));const c=[];for(l=t;l;l-=1)c.push(o%2?1:0),o=Math.floor(o/2);for(l=e;l;l-=1)c.push(r%2?1:0),r=Math.floor(r/2);c.push(i?1:0),c.reverse();const h=c.join("");let u="";for(l=0;l<64;l+=8){let d=parseInt(h.substr(l,8),2).toString(16);d.length===1&&(d="0"+d),u=u+d}return u.toLowerCase()},mc=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},gc=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function yc(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const s=new Error(n+" at "+e._path.toString()+": "+t);return s.code=n.toUpperCase(),s}const vc=new RegExp("^-?(0*)\\d{1,10}$"),wc=-2147483648,Cc=2147483647,xi=function(n){if(vc.test(n)){const e=Number(n);if(e>=wc&&e<=Cc)return e}return null},_t=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw fe("Exception was thrown by user callback.",t),e},Math.floor(0))}},Ec=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},xt=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sc{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(s=>this.appCheck=s)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,s)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)===null||t===void 0||t.get().then(s=>s.addTokenListener(e))}notifyForInvalidToken(){fe(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xc{constructor(e,t,s){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=s,this.auth_=null,this.auth_=s.getImmediate({optional:!0}),this.auth_||s.onInit(i=>this.auth_=i)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(ce("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,s)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,s):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',fe(e)}}class Qt{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Qt.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Is="5",eo="v",to="s",no="r",so="f",io=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,ro="ls",oo="p",rs="ac",ao="websocket",lo="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class co{constructor(e,t,s,i,r=!1,o="",a=!1,l=!1){this.secure=t,this.namespace=s,this.webSocketOnly=i,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=l,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=je.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&je.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function Tc(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function uo(n,e,t){E(typeof e=="string","typeof type must == string"),E(typeof t=="object","typeof params must == object");let s;if(e===ao)s=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===lo)s=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);Tc(n)&&(t.ns=n.namespace);const i=[];return ue(t,(r,o)=>{i.push(r+"="+o)}),s+i.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bc{constructor(){this.counters_={}}incrementCounter(e,t=1){xe(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return Fl(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jn={},Yn={};function Ns(n){const e=n.toString();return jn[e]||(jn[e]=new bc),jn[e]}function Ic(n,e){const t=n.toString();return Yn[t]||(Yn[t]=e()),Yn[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nc{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const s=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let i=0;i<s.length;++i)s[i]&&_t(()=>{this.onMessage_(s[i])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ti="start",Rc="close",kc="pLPCommand",Ac="pRTLPCB",ho="id",fo="pw",po="ser",Mc="cb",Dc="seg",Oc="ts",$c="d",Pc="dframe",_o=1870,mo=30,Fc=_o-mo,Lc=25e3,Uc=3e4;class it{constructor(e,t,s,i,r,o,a){this.connId=e,this.repoInfo=t,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Ut(e),this.stats_=Ns(t),this.urlFn=l=>(this.appCheckToken&&(l[rs]=this.appCheckToken),uo(t,lo,l))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new Nc(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(Uc)),pc(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Rs((...r)=>{const[o,a,l,c,h]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Ti)this.id=a,this.password=l;else if(o===Rc)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,a]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const s={};s[Ti]="t",s[po]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(s[Mc]=this.scriptTagHolder.uniqueCallbackIdentifier),s[eo]=Is,this.transportSessionId&&(s[to]=this.transportSessionId),this.lastSessionId&&(s[ro]=this.lastSessionId),this.applicationId&&(s[oo]=this.applicationId),this.appCheckToken&&(s[rs]=this.appCheckToken),typeof location<"u"&&location.hostname&&io.test(location.hostname)&&(s[no]=so);const i=this.urlFn(s);this.log_("Connecting via long-poll to "+i),this.scriptTagHolder.addTag(i,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){it.forceAllow_=!0}static forceDisallow(){it.forceDisallow_=!0}static isAvailable(){return it.forceAllow_?!0:!it.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!mc()&&!gc()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=ae(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Vr(t),i=Xr(s,Fc);for(let r=0;r<i.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const s={};s[Pc]="t",s[ho]=e,s[fo]=t,this.myDisconnFrame.src=this.urlFn(s),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=ae(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Rs{constructor(e,t,s,i){this.onDisconnect=s,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=hc(),window[kc+this.uniqueCallbackIdentifier]=e,window[Ac+this.uniqueCallbackIdentifier]=t,this.myIFrame=Rs.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){ce("frame writing exception"),a.stack&&ce(a.stack),ce(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||ce("No IE domain setting required")}catch{const s=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+s+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[ho]=this.myID,e[fo]=this.myPW,e[po]=this.currentSerial;let t=this.urlFn(e),s="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+mo+s.length<=_o;){const o=this.pendingSegs.shift();s=s+"&"+Dc+i+"="+o.seg+"&"+Oc+i+"="+o.ts+"&"+$c+i+"="+o.d,i++}return t=t+s,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,s){this.pendingSegs.push({seg:e,ts:t,d:s}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const s=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(s,Math.floor(Lc)),r=()=>{clearTimeout(i),s()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const s=this.myIFrame.doc.createElement("script");s.type="text/javascript",s.async=!0,s.src=e,s.onload=s.onreadystatechange=function(){const i=s.readyState;(!i||i==="loaded"||i==="complete")&&(s.onload=s.onreadystatechange=null,s.parentNode&&s.parentNode.removeChild(s),t())},s.onerror=()=>{ce("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(s)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wc=16384,Bc=45e3;let ln=null;typeof MozWebSocket<"u"?ln=MozWebSocket:typeof WebSocket<"u"&&(ln=WebSocket);class ve{constructor(e,t,s,i,r,o,a){this.connId=e,this.applicationId=s,this.appCheckToken=i,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Ut(this.connId),this.stats_=Ns(t),this.connURL=ve.connectionURL_(t,o,a,i,s),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,s,i,r){const o={};return o[eo]=Is,typeof location<"u"&&location.hostname&&io.test(location.hostname)&&(o[no]=so),t&&(o[to]=t),s&&(o[ro]=s),i&&(o[rs]=i),r&&(o[oo]=r),uo(e,ao,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,je.set("previous_websocket_failure",!0);try{let s;Kl(),this.mySock=new ln(this.connURL,[],s)}catch(s){this.log_("Error instantiating WebSocket.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=s=>{this.handleIncomingFrame(s)},this.mySock.onerror=s=>{this.log_("WebSocket error.  Closing connection.");const i=s.message||s.data;i&&this.log_(i),this.onClosed_()}}start(){}static forceDisallow(){ve.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,s=navigator.userAgent.match(t);s&&s.length>1&&parseFloat(s[1])<4.4&&(e=!0)}return!e&&ln!==null&&!ve.forceDisallow_}static previouslyFailed(){return je.isInMemoryStorage||je.get("previous_websocket_failure")===!0}markConnectionHealthy(){je.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const s=Nt(t);this.onMessage(s)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(E(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const s=this.extractFrameCount_(t);s!==null&&this.appendFrame_(s)}}send(e){this.resetKeepAlive();const t=ae(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const s=Xr(t,Wc);s.length>1&&this.sendString_(String(s.length));for(let i=0;i<s.length;i++)this.sendString_(s[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Bc))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}ve.responsesRequiredToBeHealthy=2;ve.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[it,ve]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=ve&&ve.isAvailable();let s=t&&!ve.previouslyFailed();if(e.webSocketOnly&&(t||fe("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),s=!0),s)this.transports_=[ve];else{const i=this.transports_=[];for(const r of Rt.ALL_TRANSPORTS)r&&r.isAvailable()&&i.push(r);Rt.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}Rt.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hc=6e4,jc=5e3,Yc=10*1024,Vc=100*1024,Vn="t",bi="d",zc="s",Ii="r",qc="e",Ni="o",Ri="a",ki="n",Ai="p",Gc="h";class Kc{constructor(e,t,s,i,r,o,a,l,c,h){this.id=e,this.repoInfo_=t,this.applicationId_=s,this.appCheckToken_=i,this.authToken_=r,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=l,this.onKill_=c,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Ut("c:"+this.id+":"),this.transportManager_=new Rt(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),s=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,s)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=xt(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>Vc?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Yc?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Vn in e){const t=e[Vn];t===Ri?this.upgradeIfSecondaryHealthy_():t===Ii?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===Ni&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=yt("t",e),s=yt("d",e);if(t==="c")this.onSecondaryControl_(s);else if(t==="d")this.pendingDataMessages.push(s);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Ai,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Ri,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:ki,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=yt("t",e),s=yt("d",e);t==="c"?this.onControl_(s):t==="d"&&this.onDataMessage_(s)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=yt(Vn,e);if(bi in e){const s=e[bi];if(t===Gc){const i=Object.assign({},s);this.repoInfo_.isUsingEmulator&&(i.h=this.repoInfo_.host),this.onHandshake_(i)}else if(t===ki){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let i=0;i<this.pendingDataMessages.length;++i)this.onDataMessage_(this.pendingDataMessages[i]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===zc?this.onConnectionShutdown_(s):t===Ii?this.onReset_(s):t===qc?is("Server Error: "+s):t===Ni?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):is("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,s=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Is!==s&&fe("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),s=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,s),xt(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(Hc))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):xt(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(jc))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Ai,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(je.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class go{put(e,t,s,i){}merge(e,t,s,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,s){}onDisconnectMerge(e,t,s){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yo{constructor(e){this.allowedEvents_=e,this.listeners_={},E(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let i=0;i<s.length;i++)s[i].callback.apply(s[i].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const i=this.getInitialEvent(e);i&&t.apply(s,i)}off(e,t,s){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let r=0;r<i.length;r++)if(i[r].callback===t&&(!s||s===i[r].context)){i.splice(r,1);return}}validateEventType_(e){E(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cn extends yo{constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!qr()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new cn}getInitialEvent(e){return E(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mi=32,Di=768;class V{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let s=0;for(let i=0;i<this.pieces_.length;i++)this.pieces_[i].length>0&&(this.pieces_[s]=this.pieces_[i],s++);this.pieces_.length=s,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function Y(){return new V("")}function F(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function Fe(n){return n.pieces_.length-n.pieceNum_}function q(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new V(n.pieces_,e)}function ks(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function Qc(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function kt(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function vo(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new V(e,0)}function ee(n,e){const t=[];for(let s=n.pieceNum_;s<n.pieces_.length;s++)t.push(n.pieces_[s]);if(e instanceof V)for(let s=e.pieceNum_;s<e.pieces_.length;s++)t.push(e.pieces_[s]);else{const s=e.split("/");for(let i=0;i<s.length;i++)s[i].length>0&&t.push(s[i])}return new V(t,0)}function L(n){return n.pieceNum_>=n.pieces_.length}function he(n,e){const t=F(n),s=F(e);if(t===null)return e;if(t===s)return he(q(n),q(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function Jc(n,e){const t=kt(n,0),s=kt(e,0);for(let i=0;i<t.length&&i<s.length;i++){const r=Ze(t[i],s[i]);if(r!==0)return r}return t.length===s.length?0:t.length<s.length?-1:1}function As(n,e){if(Fe(n)!==Fe(e))return!1;for(let t=n.pieceNum_,s=e.pieceNum_;t<=n.pieces_.length;t++,s++)if(n.pieces_[t]!==e.pieces_[s])return!1;return!0}function ge(n,e){let t=n.pieceNum_,s=e.pieceNum_;if(Fe(n)>Fe(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[s])return!1;++t,++s}return!0}class Xc{constructor(e,t){this.errorPrefix_=t,this.parts_=kt(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let s=0;s<this.parts_.length;s++)this.byteLength_+=Tn(this.parts_[s]);wo(this)}}function Zc(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=Tn(e),wo(n)}function eu(n){const e=n.parts_.pop();n.byteLength_-=Tn(e),n.parts_.length>0&&(n.byteLength_-=1)}function wo(n){if(n.byteLength_>Di)throw new Error(n.errorPrefix_+"has a key path longer than "+Di+" bytes ("+n.byteLength_+").");if(n.parts_.length>Mi)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+Mi+") or object contains a cycle "+He(n))}function He(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ms extends yo{constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}static getInstance(){return new Ms}getInitialEvent(e){return E(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt=1e3,tu=60*5*1e3,Oi=30*1e3,nu=1.3,su=3e4,iu="server_kill",$i=3;class Ne extends go{constructor(e,t,s,i,r,o,a,l){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=s,this.onConnectStatus_=i,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=l,this.id=Ne.nextPersistentConnectionId_++,this.log_=Ut("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=vt,this.maxReconnectDelay_=tu,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,l)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Ms.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&cn.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,s){const i=++this.requestNumber_,r={r:i,a:e,b:t};this.log_(ae(r)),E(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),s&&(this.requestCBHash_[i]=s)}get(e){this.initConnection_();const t=new $e,i={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(i),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,s,i){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),E(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),E(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:i,hashFn:t,query:e,tag:s};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,s=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(s)})}sendListen_(e){const t=e.query,s=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+s+" for "+i);const r={p:s},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,a=>{const l=a.d,c=a.s;Ne.warnOnListenWarnings_(l,t),(this.listens.get(s)&&this.listens.get(s).get(i))===e&&(this.log_("listen response",a),c!=="ok"&&this.removeListen_(s,i),e.onComplete&&e.onComplete(c,l))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&xe(e,"w")){const s=lt(e,"w");if(Array.isArray(s)&&~s.indexOf("no_index")){const i='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();fe(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${i} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Jl(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=Oi)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=Ql(e)?"auth":"gauth",s={cred:e};this.authOverride_===null?s.noauth=!0:typeof this.authOverride_=="object"&&(s.authvar=this.authOverride_),this.sendRequest(t,s,i=>{const r=i.s,o=i.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,s=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,s)})}unlisten(e,t){const s=e._path.toString(),i=e._queryIdentifier;this.log_("Unlisten called for "+s+" "+i),E(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(s,i)&&this.connected_&&this.sendUnlisten_(s,i,e._queryObject,t)}sendUnlisten_(e,t,s,i){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";i&&(r.q=s,r.t=i),this.sendRequest(o,r)}onDisconnectPut(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:s})}onDisconnectMerge(e,t,s){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,s):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:s})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,s,i){const r={p:t,d:s};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{i&&setTimeout(()=>{i(o.s,o.d)},Math.floor(0))})}put(e,t,s,i){this.putInternal("p",e,t,s,i)}merge(e,t,s,i){this.putInternal("m",e,t,s,i)}putInternal(e,t,s,i,r){this.initConnection_();const o={p:t,d:s};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:i}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,s=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,s,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),i&&i(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,s=>{if(s.s!=="ok"){const r=s.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+ae(e));const t=e.r,s=this.requestCBHash_[t];s&&(delete this.requestCBHash_[t],s(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):is("Unrecognized action received from server: "+ae(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){E(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=vt,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=vt,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>su&&(this.reconnectDelay_=vt),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=new Date().getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*nu)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),i=this.id+":"+Ne.nextConnectionId_++,r=this.lastSessionId;let o=!1,a=null;const l=function(){a?a.close():(o=!0,s())},c=function(u){E(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(u)};this.realtime_={close:l,sendRequest:c};const h=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[u,d]=await Promise.all([this.authTokenProvider_.getToken(h),this.appCheckTokenProvider_.getToken(h)]);o?ce("getToken() completed but was canceled"):(ce("getToken() completed. Creating connection."),this.authToken_=u&&u.accessToken,this.appCheckToken_=d&&d.token,a=new Kc(i,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,s,p=>{fe(p+" ("+this.repoInfo_.toString()+")"),this.interrupt(iu)},r))}catch(u){this.log_("Failed to get token: "+u),o||(this.repoInfo_.nodeAdmin&&fe(u),l())}}}interrupt(e){ce("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){ce("Resuming connection for reason: "+e),delete this.interruptReasons_[e],ss(this.interruptReasons_)&&(this.reconnectDelay_=vt,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let s;t?s=t.map(r=>bs(r)).join("$"):s="default";const i=this.removeListen_(e,s);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const s=new V(e).toString();let i;if(this.listens.has(s)){const r=this.listens.get(s);i=r.get(t),r.delete(t),r.size===0&&this.listens.delete(s)}else i=void 0;return i}onAuthRevoked_(e,t){ce("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=$i&&(this.reconnectDelay_=Oi,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){ce("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=$i&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Kr.replace(/\./g,"-")]=1,qr()?e["framework.cordova"]=1:Gl()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=cn.getInstance().currentlyOnline();return ss(this.interruptReasons_)&&e}}Ne.nextPersistentConnectionId_=0;Ne.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new U(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class In{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const s=new U(ut,e),i=new U(ut,t);return this.compare(s,i)!==0}minPost(){return U.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qt;class Co extends In{static get __EMPTY_NODE(){return qt}static set __EMPTY_NODE(e){qt=e}compare(e,t){return Ze(e.name,t.name)}isDefinedOn(e){throw pt("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return U.MIN}maxPost(){return new U(ze,qt)}makePost(e,t){return E(typeof e=="string","KeyIndex indexValue must always be a string."),new U(e,qt)}toString(){return".key"}}const ot=new Co;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gt{constructor(e,t,s,i,r=null){this.isReverse_=i,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?s(e.key,t):1,i&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class re{constructor(e,t,s,i,r){this.key=e,this.value=t,this.color=s??re.RED,this.left=i??de.EMPTY_NODE,this.right=r??de.EMPTY_NODE}copy(e,t,s,i,r){return new re(e??this.key,t??this.value,s??this.color,i??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,s){let i=this;const r=s(e,i.key);return r<0?i=i.copy(null,null,null,i.left.insert(e,t,s),null):r===0?i=i.copy(null,t,null,null,null):i=i.copy(null,null,null,null,i.right.insert(e,t,s)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return de.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let s,i;if(s=this,t(e,s.key)<0)!s.left.isEmpty()&&!s.left.isRed_()&&!s.left.left.isRed_()&&(s=s.moveRedLeft_()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed_()&&(s=s.rotateRight_()),!s.right.isEmpty()&&!s.right.isRed_()&&!s.right.left.isRed_()&&(s=s.moveRedRight_()),t(e,s.key)===0){if(s.right.isEmpty())return de.EMPTY_NODE;i=s.right.min_(),s=s.copy(i.key,i.value,null,null,s.right.removeMin_())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,re.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,re.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}re.RED=!0;re.BLACK=!1;class ru{copy(e,t,s,i,r){return this}insert(e,t,s){return new re(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class de{constructor(e,t=de.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new de(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,re.BLACK,null,null))}remove(e){return new de(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,re.BLACK,null,null))}get(e){let t,s=this.root_;for(;!s.isEmpty();){if(t=this.comparator_(e,s.key),t===0)return s.value;t<0?s=s.left:t>0&&(s=s.right)}return null}getPredecessorKey(e){let t,s=this.root_,i=null;for(;!s.isEmpty();)if(t=this.comparator_(e,s.key),t===0){if(s.left.isEmpty())return i?i.key:null;for(s=s.left;!s.right.isEmpty();)s=s.right;return s.key}else t<0?s=s.left:t>0&&(i=s,s=s.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Gt(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Gt(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Gt(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Gt(this.root_,null,this.comparator_,!0,e)}}de.EMPTY_NODE=new ru;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ou(n,e){return Ze(n.name,e.name)}function Ds(n,e){return Ze(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let os;function au(n){os=n}const Eo=function(n){return typeof n=="number"?"number:"+Zr(n):"string:"+n},So=function(n){if(n.isLeafNode()){const e=n.val();E(typeof e=="string"||typeof e=="number"||typeof e=="object"&&xe(e,".sv"),"Priority must be a string or number.")}else E(n===os||n.isEmpty(),"priority of unexpected type.");E(n===os||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Pi;class ie{constructor(e,t=ie.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,E(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),So(this.priorityNode_)}static set __childrenNodeConstructor(e){Pi=e}static get __childrenNodeConstructor(){return Pi}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new ie(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:ie.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return L(e)?this:F(e)===".priority"?this.priorityNode_:ie.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:ie.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const s=F(e);return s===null?t:t.isEmpty()&&s!==".priority"?this:(E(s!==".priority"||Fe(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(s,ie.__childrenNodeConstructor.EMPTY_NODE.updateChild(q(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+Eo(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Zr(this.value_):e+=this.value_,this.lazyHash_=Jr(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===ie.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof ie.__childrenNodeConstructor?-1:(E(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,s=typeof this.value_,i=ie.VALUE_TYPE_ORDER.indexOf(t),r=ie.VALUE_TYPE_ORDER.indexOf(s);return E(i>=0,"Unknown leaf type: "+t),E(r>=0,"Unknown leaf type: "+s),i===r?s==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-i}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}ie.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xo,To;function lu(n){xo=n}function cu(n){To=n}class uu extends In{compare(e,t){const s=e.node.getPriority(),i=t.node.getPriority(),r=s.compareTo(i);return r===0?Ze(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return U.MIN}maxPost(){return new U(ze,new ie("[PRIORITY-POST]",To))}makePost(e,t){const s=xo(e);return new U(t,new ie("[PRIORITY-POST]",s))}toString(){return".priority"}}const X=new uu;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hu=Math.log(2);class du{constructor(e){const t=r=>parseInt(Math.log(r)/hu,10),s=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const i=s(this.count);this.bits_=e+1&i}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const un=function(n,e,t,s){n.sort(e);const i=function(l,c){const h=c-l;let u,d;if(h===0)return null;if(h===1)return u=n[l],d=t?t(u):u,new re(d,u.node,re.BLACK,null,null);{const p=parseInt(h/2,10)+l,v=i(l,p),A=i(p+1,c);return u=n[p],d=t?t(u):u,new re(d,u.node,re.BLACK,v,A)}},r=function(l){let c=null,h=null,u=n.length;const d=function(v,A){const b=u-v,O=u;u-=v;const W=i(b+1,O),M=n[b],J=t?t(M):M;p(new re(J,M.node,A,null,W))},p=function(v){c?(c.left=v,c=v):(h=v,c=v)};for(let v=0;v<l.count;++v){const A=l.nextBitIsOne(),b=Math.pow(2,l.count-(v+1));A?d(b,re.BLACK):(d(b,re.BLACK),d(b,re.RED))}return h},o=new du(n.length),a=r(o);return new de(s||e,a)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let zn;const tt={};class Ie{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return E(tt&&X,"ChildrenNode.ts has not been loaded"),zn=zn||new Ie({".priority":tt},{".priority":X}),zn}get(e){const t=lt(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof de?t:null}hasIndex(e){return xe(this.indexSet_,e.toString())}addIndex(e,t){E(e!==ot,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const s=[];let i=!1;const r=t.getIterator(U.Wrap);let o=r.getNext();for(;o;)i=i||e.isDefinedOn(o.node),s.push(o),o=r.getNext();let a;i?a=un(s,e.getCompare()):a=tt;const l=e.toString(),c=Object.assign({},this.indexSet_);c[l]=e;const h=Object.assign({},this.indexes_);return h[l]=a,new Ie(h,c)}addToIndexes(e,t){const s=an(this.indexes_,(i,r)=>{const o=lt(this.indexSet_,r);if(E(o,"Missing index implementation for "+r),i===tt)if(o.isDefinedOn(e.node)){const a=[],l=t.getIterator(U.Wrap);let c=l.getNext();for(;c;)c.name!==e.name&&a.push(c),c=l.getNext();return a.push(e),un(a,o.getCompare())}else return tt;else{const a=t.get(e.name);let l=i;return a&&(l=l.remove(new U(e.name,a))),l.insert(e,e.node)}});return new Ie(s,this.indexSet_)}removeFromIndexes(e,t){const s=an(this.indexes_,i=>{if(i===tt)return i;{const r=t.get(e.name);return r?i.remove(new U(e.name,r)):i}});return new Ie(s,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let wt;class P{constructor(e,t,s){this.children_=e,this.priorityNode_=t,this.indexMap_=s,this.lazyHash_=null,this.priorityNode_&&So(this.priorityNode_),this.children_.isEmpty()&&E(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return wt||(wt=new P(new de(Ds),null,Ie.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||wt}updatePriority(e){return this.children_.isEmpty()?this:new P(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?wt:t}}getChild(e){const t=F(e);return t===null?this:this.getImmediateChild(t).getChild(q(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(E(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const s=new U(e,t);let i,r;t.isEmpty()?(i=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(s,this.children_)):(i=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(s,this.children_));const o=i.isEmpty()?wt:this.priorityNode_;return new P(i,o,r)}}updateChild(e,t){const s=F(e);if(s===null)return t;{E(F(e)!==".priority"||Fe(e)===1,".priority must be the last token in a path");const i=this.getImmediateChild(s).updateChild(q(e),t);return this.updateImmediateChild(s,i)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let s=0,i=0,r=!0;if(this.forEachChild(X,(o,a)=>{t[o]=a.val(e),s++,r&&P.INTEGER_REGEXP_.test(o)?i=Math.max(i,Number(o)):r=!1}),!e&&r&&i<2*s){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+Eo(this.getPriority().val())+":"),this.forEachChild(X,(t,s)=>{const i=s.hash();i!==""&&(e+=":"+t+":"+i)}),this.lazyHash_=e===""?"":Jr(e)}return this.lazyHash_}getPredecessorChildName(e,t,s){const i=this.resolveIndex_(s);if(i){const r=i.getPredecessorKey(new U(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.minKey();return s&&s.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new U(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const s=t.maxKey();return s&&s.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new U(t,this.children_.get(t)):null}forEachChild(e,t){const s=this.resolveIndex_(e);return s?s.inorderTraversal(i=>t(i.name,i.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getIteratorFrom(e,i=>i);{const i=this.children_.getIteratorFrom(e.name,U.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)<0;)i.getNext(),r=i.peek();return i}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const s=this.resolveIndex_(t);if(s)return s.getReverseIteratorFrom(e,i=>i);{const i=this.children_.getReverseIteratorFrom(e.name,U.Wrap);let r=i.peek();for(;r!=null&&t.compare(r,e)>0;)i.getNext(),r=i.peek();return i}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Wt?-1:0}withIndex(e){if(e===ot||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new P(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===ot||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const s=this.getIterator(X),i=t.getIterator(X);let r=s.getNext(),o=i.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=s.getNext(),o=i.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===ot?null:this.indexMap_.get(e.toString())}}P.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class fu extends P{constructor(){super(new de(Ds),P.EMPTY_NODE,Ie.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return P.EMPTY_NODE}isEmpty(){return!1}}const Wt=new fu;Object.defineProperties(U,{MIN:{value:new U(ut,P.EMPTY_NODE)},MAX:{value:new U(ze,Wt)}});Co.__EMPTY_NODE=P.EMPTY_NODE;ie.__childrenNodeConstructor=P;au(Wt);cu(Wt);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pu=!0;function te(n,e=null){if(n===null)return P.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),E(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new ie(t,te(e))}if(!(n instanceof Array)&&pu){const t=[];let s=!1;if(ue(n,(o,a)=>{if(o.substring(0,1)!=="."){const l=te(a);l.isEmpty()||(s=s||!l.getPriority().isEmpty(),t.push(new U(o,l)))}}),t.length===0)return P.EMPTY_NODE;const r=un(t,ou,o=>o.name,Ds);if(s){const o=un(t,X.getCompare());return new P(r,te(e),new Ie({".priority":o},{".priority":X}))}else return new P(r,te(e),Ie.Default)}else{let t=P.EMPTY_NODE;return ue(n,(s,i)=>{if(xe(n,s)&&s.substring(0,1)!=="."){const r=te(i);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(s,r))}}),t.updatePriority(te(e))}}lu(te);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _u extends In{constructor(e){super(),this.indexPath_=e,E(!L(e)&&F(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const s=this.extractChild(e.node),i=this.extractChild(t.node),r=s.compareTo(i);return r===0?Ze(e.name,t.name):r}makePost(e,t){const s=te(e),i=P.EMPTY_NODE.updateChild(this.indexPath_,s);return new U(t,i)}maxPost(){const e=P.EMPTY_NODE.updateChild(this.indexPath_,Wt);return new U(ze,e)}toString(){return kt(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mu extends In{compare(e,t){const s=e.node.compareTo(t.node);return s===0?Ze(e.name,t.name):s}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return U.MIN}maxPost(){return U.MAX}makePost(e,t){const s=te(e);return new U(t,s)}toString(){return".value"}}const gu=new mu;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bo(n){return{type:"value",snapshotNode:n}}function ht(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function At(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function Mt(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function yu(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Os{constructor(e){this.index_=e}updateChild(e,t,s,i,r,o){E(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(i).equals(s.getChild(i))&&a.isEmpty()===s.isEmpty()||(o!=null&&(s.isEmpty()?e.hasChild(t)?o.trackChildChange(At(t,a)):E(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(ht(t,s)):o.trackChildChange(Mt(t,s,a))),e.isLeafNode()&&s.isEmpty())?e:e.updateImmediateChild(t,s).withIndex(this.index_)}updateFullNode(e,t,s){return s!=null&&(e.isLeafNode()||e.forEachChild(X,(i,r)=>{t.hasChild(i)||s.trackChildChange(At(i,r))}),t.isLeafNode()||t.forEachChild(X,(i,r)=>{if(e.hasChild(i)){const o=e.getImmediateChild(i);o.equals(r)||s.trackChildChange(Mt(i,r,o))}else s.trackChildChange(ht(i,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?P.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dt{constructor(e){this.indexedFilter_=new Os(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Dt.getStartPost_(e),this.endPost_=Dt.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,s=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&s}updateChild(e,t,s,i,r,o){return this.matches(new U(t,s))||(s=P.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,s,i,r,o)}updateFullNode(e,t,s){t.isLeafNode()&&(t=P.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(P.EMPTY_NODE);const r=this;return t.forEachChild(X,(o,a)=>{r.matches(new U(o,a))||(i=i.updateImmediateChild(o,P.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vu{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const s=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?s<=0:s<0},this.withinEndPost=t=>{const s=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?s<=0:s<0},this.rangedFilter_=new Dt(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,s,i,r,o){return this.rangedFilter_.matches(new U(t,s))||(s=P.EMPTY_NODE),e.getImmediateChild(t).equals(s)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,s,i,r,o):this.fullLimitUpdateChild_(e,t,s,r,o)}updateFullNode(e,t,s){let i;if(t.isLeafNode()||t.isEmpty())i=P.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){i=P.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const a=r.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))i=i.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{i=t.withIndex(this.index_),i=i.updatePriority(P.EMPTY_NODE);let r;this.reverse_?r=i.getReverseIterator(this.index_):r=i.getIterator(this.index_);let o=0;for(;r.hasNext();){const a=r.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:i=i.updateImmediateChild(a.name,P.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,s)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,s,i,r){let o;if(this.reverse_){const u=this.index_.getCompare();o=(d,p)=>u(p,d)}else o=this.index_.getCompare();const a=e;E(a.numChildren()===this.limit_,"");const l=new U(t,s),c=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),h=this.rangedFilter_.matches(l);if(a.hasChild(t)){const u=a.getImmediateChild(t);let d=i.getChildAfterChild(this.index_,c,this.reverse_);for(;d!=null&&(d.name===t||a.hasChild(d.name));)d=i.getChildAfterChild(this.index_,d,this.reverse_);const p=d==null?1:o(d,l);if(h&&!s.isEmpty()&&p>=0)return r!=null&&r.trackChildChange(Mt(t,s,u)),a.updateImmediateChild(t,s);{r!=null&&r.trackChildChange(At(t,u));const A=a.updateImmediateChild(t,P.EMPTY_NODE);return d!=null&&this.rangedFilter_.matches(d)?(r!=null&&r.trackChildChange(ht(d.name,d.node)),A.updateImmediateChild(d.name,d.node)):A}}else return s.isEmpty()?e:h&&o(c,l)>=0?(r!=null&&(r.trackChildChange(At(c.name,c.node)),r.trackChildChange(ht(t,s))),a.updateImmediateChild(t,s).updateImmediateChild(c.name,P.EMPTY_NODE)):e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $s{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=X}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return E(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return E(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:ut}hasEnd(){return this.endSet_}getIndexEndValue(){return E(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return E(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:ze}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return E(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===X}copy(){const e=new $s;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function wu(n){return n.loadsAllData()?new Os(n.getIndex()):n.hasLimit()?new vu(n):new Dt(n)}function Fi(n){const e={};if(n.isDefault())return e;let t;if(n.index_===X?t="$priority":n.index_===gu?t="$value":n.index_===ot?t="$key":(E(n.index_ instanceof _u,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=ae(t),n.startSet_){const s=n.startAfterSet_?"startAfter":"startAt";e[s]=ae(n.indexStartValue_),n.startNameSet_&&(e[s]+=","+ae(n.indexStartName_))}if(n.endSet_){const s=n.endBeforeSet_?"endBefore":"endAt";e[s]=ae(n.indexEndValue_),n.endNameSet_&&(e[s]+=","+ae(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function Li(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==X&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hn extends go{constructor(e,t,s,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=s,this.appCheckTokenProvider_=i,this.log_=Ut("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(E(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,s,i){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=hn.getListenId_(e,s),a={};this.listens_[o]=a;const l=Fi(e._queryParams);this.restRequest_(r+".json",l,(c,h)=>{let u=h;if(c===404&&(u=null,c=null),c===null&&this.onDataUpdate_(r,u,!1,s),lt(this.listens_,o)===a){let d;c?c===401?d="permission_denied":d="rest_error:"+c:d="ok",i(d,null)}})}unlisten(e,t){const s=hn.getListenId_(e,t);delete this.listens_[s]}get(e){const t=Fi(e._queryParams),s=e._path.toString(),i=new $e;return this.restRequest_(s+".json",t,(r,o)=>{let a=o;r===404&&(a=null,r=null),r===null?(this.onDataUpdate_(s,a,!1,null),i.resolve(a)):i.reject(new Error(a))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},s){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,r])=>{i&&i.accessToken&&(t.auth=i.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+Xl(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(s&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let l=null;if(a.status>=200&&a.status<300){try{l=Nt(a.responseText)}catch{fe("Failed to parse JSON response for "+o+": "+a.responseText)}s(null,l)}else a.status!==401&&a.status!==404&&fe("Got unsuccessful REST response for "+o+" Status: "+a.status),s(a.status);s=null}},a.open("GET",o,!0),a.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cu{constructor(){this.rootNode_=P.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dn(){return{value:null,children:new Map}}function mt(n,e,t){if(L(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const s=F(e);n.children.has(s)||n.children.set(s,dn());const i=n.children.get(s);e=q(e),mt(i,e,t)}}function as(n,e){if(L(e))return n.value=null,n.children.clear(),!0;if(n.value!==null){if(n.value.isLeafNode())return!1;{const t=n.value;return n.value=null,t.forEachChild(X,(s,i)=>{mt(n,new V(s),i)}),as(n,e)}}else if(n.children.size>0){const t=F(e);return e=q(e),n.children.has(t)&&as(n.children.get(t),e)&&n.children.delete(t),n.children.size===0}else return!0}function ls(n,e,t){n.value!==null?t(e,n.value):Eu(n,(s,i)=>{const r=new V(e.toString()+"/"+s);ls(i,r,t)})}function Eu(n,e){n.children.forEach((t,s)=>{e(s,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Su{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&ue(this.last_,(s,i)=>{t[s]=t[s]-i}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui=10*1e3,xu=30*1e3,Tu=5*60*1e3;class bu{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new Su(e);const s=Ui+(xu-Ui)*Math.random();xt(this.reportStats_.bind(this),Math.floor(s))}reportStats_(){const e=this.statsListener_.get(),t={};let s=!1;ue(e,(i,r)=>{r>0&&xe(this.statsToReport_,i)&&(t[i]=r,s=!0)}),s&&this.server_.reportStats(t),xt(this.reportStats_.bind(this),Math.floor(Math.random()*2*Tu))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Ce;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(Ce||(Ce={}));function Io(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Ps(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Fs(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fn{constructor(e,t,s){this.path=e,this.affectedTree=t,this.revert=s,this.type=Ce.ACK_USER_WRITE,this.source=Io()}operationForChild(e){if(L(this.path)){if(this.affectedTree.value!=null)return E(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new V(e));return new fn(Y(),t,this.revert)}}else return E(F(this.path)===e,"operationForChild called for unrelated child."),new fn(q(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(e,t){this.source=e,this.path=t,this.type=Ce.LISTEN_COMPLETE}operationForChild(e){return L(this.path)?new Ot(this.source,Y()):new Ot(this.source,q(this.path))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qe{constructor(e,t,s){this.source=e,this.path=t,this.snap=s,this.type=Ce.OVERWRITE}operationForChild(e){return L(this.path)?new qe(this.source,Y(),this.snap.getImmediateChild(e)):new qe(this.source,q(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $t{constructor(e,t,s){this.source=e,this.path=t,this.children=s,this.type=Ce.MERGE}operationForChild(e){if(L(this.path)){const t=this.children.subtree(new V(e));return t.isEmpty()?null:t.value?new qe(this.source,Y(),t.value):new $t(this.source,Y(),t)}else return E(F(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new $t(this.source,q(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge{constructor(e,t,s){this.node_=e,this.fullyInitialized_=t,this.filtered_=s}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(L(e))return this.isFullyInitialized()&&!this.filtered_;const t=F(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Iu{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function Nu(n,e,t,s){const i=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(yu(o.childName,o.snapshotNode))}),Ct(n,i,"child_removed",e,s,t),Ct(n,i,"child_added",e,s,t),Ct(n,i,"child_moved",r,s,t),Ct(n,i,"child_changed",e,s,t),Ct(n,i,"value",e,s,t),i}function Ct(n,e,t,s,i,r){const o=s.filter(a=>a.type===t);o.sort((a,l)=>ku(n,a,l)),o.forEach(a=>{const l=Ru(n,a,r);i.forEach(c=>{c.respondsTo(a.type)&&e.push(c.createEvent(l,n.query_))})})}function Ru(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function ku(n,e,t){if(e.childName==null||t.childName==null)throw pt("Should only compare child_ events.");const s=new U(e.childName,e.snapshotNode),i=new U(t.childName,t.snapshotNode);return n.index_.compare(s,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nn(n,e){return{eventCache:n,serverCache:e}}function Tt(n,e,t,s){return Nn(new Ge(e,t,s),n.serverCache)}function No(n,e,t,s){return Nn(n.eventCache,new Ge(e,t,s))}function cs(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Ke(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qn;const Au=()=>(qn||(qn=new de(_c)),qn);class Q{constructor(e,t=Au()){this.value=e,this.children=t}static fromObject(e){let t=new Q(null);return ue(e,(s,i)=>{t=t.set(new V(s),i)}),t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:Y(),value:this.value};if(L(e))return null;{const s=F(e),i=this.children.get(s);if(i!==null){const r=i.findRootMostMatchingPathAndValue(q(e),t);return r!=null?{path:ee(new V(s),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(L(e))return this;{const t=F(e),s=this.children.get(t);return s!==null?s.subtree(q(e)):new Q(null)}}set(e,t){if(L(e))return new Q(t,this.children);{const s=F(e),r=(this.children.get(s)||new Q(null)).set(q(e),t),o=this.children.insert(s,r);return new Q(this.value,o)}}remove(e){if(L(e))return this.children.isEmpty()?new Q(null):new Q(null,this.children);{const t=F(e),s=this.children.get(t);if(s){const i=s.remove(q(e));let r;return i.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,i),this.value===null&&r.isEmpty()?new Q(null):new Q(this.value,r)}else return this}}get(e){if(L(e))return this.value;{const t=F(e),s=this.children.get(t);return s?s.get(q(e)):null}}setTree(e,t){if(L(e))return t;{const s=F(e),r=(this.children.get(s)||new Q(null)).setTree(q(e),t);let o;return r.isEmpty()?o=this.children.remove(s):o=this.children.insert(s,r),new Q(this.value,o)}}fold(e){return this.fold_(Y(),e)}fold_(e,t){const s={};return this.children.inorderTraversal((i,r)=>{s[i]=r.fold_(ee(e,i),t)}),t(e,this.value,s)}findOnPath(e,t){return this.findOnPath_(e,Y(),t)}findOnPath_(e,t,s){const i=this.value?s(t,this.value):!1;if(i)return i;if(L(e))return null;{const r=F(e),o=this.children.get(r);return o?o.findOnPath_(q(e),ee(t,r),s):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,Y(),t)}foreachOnPath_(e,t,s){if(L(e))return this;{this.value&&s(t,this.value);const i=F(e),r=this.children.get(i);return r?r.foreachOnPath_(q(e),ee(t,i),s):new Q(null)}}foreach(e){this.foreach_(Y(),e)}foreach_(e,t){this.children.inorderTraversal((s,i)=>{i.foreach_(ee(e,s),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,s)=>{s.value&&e(t,s.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(e){this.writeTree_=e}static empty(){return new Ee(new Q(null))}}function bt(n,e,t){if(L(e))return new Ee(new Q(t));{const s=n.writeTree_.findRootMostValueAndPath(e);if(s!=null){const i=s.path;let r=s.value;const o=he(i,e);return r=r.updateChild(o,t),new Ee(n.writeTree_.set(i,r))}else{const i=new Q(t),r=n.writeTree_.setTree(e,i);return new Ee(r)}}}function Wi(n,e,t){let s=n;return ue(t,(i,r)=>{s=bt(s,ee(e,i),r)}),s}function Bi(n,e){if(L(e))return Ee.empty();{const t=n.writeTree_.setTree(e,new Q(null));return new Ee(t)}}function us(n,e){return et(n,e)!=null}function et(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(he(t.path,e)):null}function Hi(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(X,(s,i)=>{e.push(new U(s,i))}):n.writeTree_.children.inorderTraversal((s,i)=>{i.value!=null&&e.push(new U(s,i.value))}),e}function Pe(n,e){if(L(e))return n;{const t=et(n,e);return t!=null?new Ee(new Q(t)):new Ee(n.writeTree_.subtree(e))}}function hs(n){return n.writeTree_.isEmpty()}function dt(n,e){return Ro(Y(),n.writeTree_,e)}function Ro(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let s=null;return e.children.inorderTraversal((i,r)=>{i===".priority"?(E(r.value!==null,"Priority writes must always be leaf nodes"),s=r.value):t=Ro(ee(n,i),r,t)}),!t.getChild(n).isEmpty()&&s!==null&&(t=t.updateChild(ee(n,".priority"),s)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ls(n,e){return Do(e,n)}function Mu(n,e,t,s,i){E(s>n.lastWriteId,"Stacking an older write on top of newer ones"),i===void 0&&(i=!0),n.allWrites.push({path:e,snap:t,writeId:s,visible:i}),i&&(n.visibleWrites=bt(n.visibleWrites,e,t)),n.lastWriteId=s}function Du(n,e){for(let t=0;t<n.allWrites.length;t++){const s=n.allWrites[t];if(s.writeId===e)return s}return null}function Ou(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);E(t>=0,"removeWrite called with nonexistent writeId.");const s=n.allWrites[t];n.allWrites.splice(t,1);let i=s.visible,r=!1,o=n.allWrites.length-1;for(;i&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&$u(a,s.path)?i=!1:ge(s.path,a.path)&&(r=!0)),o--}if(i){if(r)return Pu(n),!0;if(s.snap)n.visibleWrites=Bi(n.visibleWrites,s.path);else{const a=s.children;ue(a,l=>{n.visibleWrites=Bi(n.visibleWrites,ee(s.path,l))})}return!0}else return!1}function $u(n,e){if(n.snap)return ge(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&ge(ee(n.path,t),e))return!0;return!1}function Pu(n){n.visibleWrites=ko(n.allWrites,Fu,Y()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function Fu(n){return n.visible}function ko(n,e,t){let s=Ee.empty();for(let i=0;i<n.length;++i){const r=n[i];if(e(r)){const o=r.path;let a;if(r.snap)ge(t,o)?(a=he(t,o),s=bt(s,a,r.snap)):ge(o,t)&&(a=he(o,t),s=bt(s,Y(),r.snap.getChild(a)));else if(r.children){if(ge(t,o))a=he(t,o),s=Wi(s,a,r.children);else if(ge(o,t))if(a=he(o,t),L(a))s=Wi(s,Y(),r.children);else{const l=lt(r.children,F(a));if(l){const c=l.getChild(q(a));s=bt(s,Y(),c)}}}else throw pt("WriteRecord should have .snap or .children")}}return s}function Ao(n,e,t,s,i){if(!s&&!i){const r=et(n.visibleWrites,e);if(r!=null)return r;{const o=Pe(n.visibleWrites,e);if(hs(o))return t;if(t==null&&!us(o,Y()))return null;{const a=t||P.EMPTY_NODE;return dt(o,a)}}}else{const r=Pe(n.visibleWrites,e);if(!i&&hs(r))return t;if(!i&&t==null&&!us(r,Y()))return null;{const o=function(c){return(c.visible||i)&&(!s||!~s.indexOf(c.writeId))&&(ge(c.path,e)||ge(e,c.path))},a=ko(n.allWrites,o,e),l=t||P.EMPTY_NODE;return dt(a,l)}}}function Lu(n,e,t){let s=P.EMPTY_NODE;const i=et(n.visibleWrites,e);if(i)return i.isLeafNode()||i.forEachChild(X,(r,o)=>{s=s.updateImmediateChild(r,o)}),s;if(t){const r=Pe(n.visibleWrites,e);return t.forEachChild(X,(o,a)=>{const l=dt(Pe(r,new V(o)),a);s=s.updateImmediateChild(o,l)}),Hi(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}else{const r=Pe(n.visibleWrites,e);return Hi(r).forEach(o=>{s=s.updateImmediateChild(o.name,o.node)}),s}}function Uu(n,e,t,s,i){E(s||i,"Either existingEventSnap or existingServerSnap must exist");const r=ee(e,t);if(us(n.visibleWrites,r))return null;{const o=Pe(n.visibleWrites,r);return hs(o)?i.getChild(t):dt(o,i.getChild(t))}}function Wu(n,e,t,s){const i=ee(e,t),r=et(n.visibleWrites,i);if(r!=null)return r;if(s.isCompleteForChild(t)){const o=Pe(n.visibleWrites,i);return dt(o,s.getNode().getImmediateChild(t))}else return null}function Bu(n,e){return et(n.visibleWrites,e)}function Hu(n,e,t,s,i,r,o){let a;const l=Pe(n.visibleWrites,e),c=et(l,Y());if(c!=null)a=c;else if(t!=null)a=dt(l,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const h=[],u=o.getCompare(),d=r?a.getReverseIteratorFrom(s,o):a.getIteratorFrom(s,o);let p=d.getNext();for(;p&&h.length<i;)u(p,s)!==0&&h.push(p),p=d.getNext();return h}else return[]}function ju(){return{visibleWrites:Ee.empty(),allWrites:[],lastWriteId:-1}}function pn(n,e,t,s){return Ao(n.writeTree,n.treePath,e,t,s)}function Us(n,e){return Lu(n.writeTree,n.treePath,e)}function ji(n,e,t,s){return Uu(n.writeTree,n.treePath,e,t,s)}function _n(n,e){return Bu(n.writeTree,ee(n.treePath,e))}function Yu(n,e,t,s,i,r){return Hu(n.writeTree,n.treePath,e,t,s,i,r)}function Ws(n,e,t){return Wu(n.writeTree,n.treePath,e,t)}function Mo(n,e){return Do(ee(n.treePath,e),n.writeTree)}function Do(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vu{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,s=e.childName;E(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),E(s!==".priority","Only non-priority child changes can be tracked.");const i=this.changeMap.get(s);if(i){const r=i.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(s,Mt(s,e.snapshotNode,i.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(s);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(s,At(s,i.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(s,ht(s,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(s,Mt(s,e.snapshotNode,i.oldSnap));else throw pt("Illegal combination of changes: "+e+" occurred after "+i)}else this.changeMap.set(s,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zu{getCompleteChild(e){return null}getChildAfterChild(e,t,s){return null}}const Oo=new zu;class Bs{constructor(e,t,s=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=s}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const s=this.optCompleteServerCache_!=null?new Ge(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Ws(this.writes_,e,s)}}getChildAfterChild(e,t,s){const i=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Ke(this.viewCache_),r=Yu(this.writes_,i,t,1,s,e);return r.length===0?null:r[0]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qu(n){return{filter:n}}function Gu(n,e){E(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),E(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function Ku(n,e,t,s,i){const r=new Vu;let o,a;if(t.type===Ce.OVERWRITE){const c=t;c.source.fromUser?o=ds(n,e,c.path,c.snap,s,i,r):(E(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered()&&!L(c.path),o=mn(n,e,c.path,c.snap,s,i,a,r))}else if(t.type===Ce.MERGE){const c=t;c.source.fromUser?o=Ju(n,e,c.path,c.children,s,i,r):(E(c.source.fromServer,"Unknown source."),a=c.source.tagged||e.serverCache.isFiltered(),o=fs(n,e,c.path,c.children,s,i,a,r))}else if(t.type===Ce.ACK_USER_WRITE){const c=t;c.revert?o=eh(n,e,c.path,s,i,r):o=Xu(n,e,c.path,c.affectedTree,s,i,r)}else if(t.type===Ce.LISTEN_COMPLETE)o=Zu(n,e,t.path,s,r);else throw pt("Unknown operation type: "+t.type);const l=r.getChanges();return Qu(e,o,l),{viewCache:o,changes:l}}function Qu(n,e,t){const s=e.eventCache;if(s.isFullyInitialized()){const i=s.getNode().isLeafNode()||s.getNode().isEmpty(),r=cs(n);(t.length>0||!n.eventCache.isFullyInitialized()||i&&!s.getNode().equals(r)||!s.getNode().getPriority().equals(r.getPriority()))&&t.push(bo(cs(e)))}}function $o(n,e,t,s,i,r){const o=e.eventCache;if(_n(s,t)!=null)return e;{let a,l;if(L(t))if(E(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const c=Ke(e),h=c instanceof P?c:P.EMPTY_NODE,u=Us(s,h);a=n.filter.updateFullNode(e.eventCache.getNode(),u,r)}else{const c=pn(s,Ke(e));a=n.filter.updateFullNode(e.eventCache.getNode(),c,r)}else{const c=F(t);if(c===".priority"){E(Fe(t)===1,"Can't have a priority with additional path components");const h=o.getNode();l=e.serverCache.getNode();const u=ji(s,t,h,l);u!=null?a=n.filter.updatePriority(h,u):a=o.getNode()}else{const h=q(t);let u;if(o.isCompleteForChild(c)){l=e.serverCache.getNode();const d=ji(s,t,o.getNode(),l);d!=null?u=o.getNode().getImmediateChild(c).updateChild(h,d):u=o.getNode().getImmediateChild(c)}else u=Ws(s,c,e.serverCache);u!=null?a=n.filter.updateChild(o.getNode(),c,u,h,i,r):a=o.getNode()}}return Tt(e,a,o.isFullyInitialized()||L(t),n.filter.filtersNodes())}}function mn(n,e,t,s,i,r,o,a){const l=e.serverCache;let c;const h=o?n.filter:n.filter.getIndexedFilter();if(L(t))c=h.updateFullNode(l.getNode(),s,null);else if(h.filtersNodes()&&!l.isFiltered()){const p=l.getNode().updateChild(t,s);c=h.updateFullNode(l.getNode(),p,null)}else{const p=F(t);if(!l.isCompleteForPath(t)&&Fe(t)>1)return e;const v=q(t),b=l.getNode().getImmediateChild(p).updateChild(v,s);p===".priority"?c=h.updatePriority(l.getNode(),b):c=h.updateChild(l.getNode(),p,b,v,Oo,null)}const u=No(e,c,l.isFullyInitialized()||L(t),h.filtersNodes()),d=new Bs(i,u,r);return $o(n,u,t,i,d,a)}function ds(n,e,t,s,i,r,o){const a=e.eventCache;let l,c;const h=new Bs(i,e,r);if(L(t))c=n.filter.updateFullNode(e.eventCache.getNode(),s,o),l=Tt(e,c,!0,n.filter.filtersNodes());else{const u=F(t);if(u===".priority")c=n.filter.updatePriority(e.eventCache.getNode(),s),l=Tt(e,c,a.isFullyInitialized(),a.isFiltered());else{const d=q(t),p=a.getNode().getImmediateChild(u);let v;if(L(d))v=s;else{const A=h.getCompleteChild(u);A!=null?ks(d)===".priority"&&A.getChild(vo(d)).isEmpty()?v=A:v=A.updateChild(d,s):v=P.EMPTY_NODE}if(p.equals(v))l=e;else{const A=n.filter.updateChild(a.getNode(),u,v,d,h,o);l=Tt(e,A,a.isFullyInitialized(),n.filter.filtersNodes())}}}return l}function Yi(n,e){return n.eventCache.isCompleteForChild(e)}function Ju(n,e,t,s,i,r,o){let a=e;return s.foreach((l,c)=>{const h=ee(t,l);Yi(e,F(h))&&(a=ds(n,a,h,c,i,r,o))}),s.foreach((l,c)=>{const h=ee(t,l);Yi(e,F(h))||(a=ds(n,a,h,c,i,r,o))}),a}function Vi(n,e,t){return t.foreach((s,i)=>{e=e.updateChild(s,i)}),e}function fs(n,e,t,s,i,r,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let l=e,c;L(t)?c=s:c=new Q(null).setTree(t,s);const h=e.serverCache.getNode();return c.children.inorderTraversal((u,d)=>{if(h.hasChild(u)){const p=e.serverCache.getNode().getImmediateChild(u),v=Vi(n,p,d);l=mn(n,l,new V(u),v,i,r,o,a)}}),c.children.inorderTraversal((u,d)=>{const p=!e.serverCache.isCompleteForChild(u)&&d.value===null;if(!h.hasChild(u)&&!p){const v=e.serverCache.getNode().getImmediateChild(u),A=Vi(n,v,d);l=mn(n,l,new V(u),A,i,r,o,a)}}),l}function Xu(n,e,t,s,i,r,o){if(_n(i,t)!=null)return e;const a=e.serverCache.isFiltered(),l=e.serverCache;if(s.value!=null){if(L(t)&&l.isFullyInitialized()||l.isCompleteForPath(t))return mn(n,e,t,l.getNode().getChild(t),i,r,a,o);if(L(t)){let c=new Q(null);return l.getNode().forEachChild(ot,(h,u)=>{c=c.set(new V(h),u)}),fs(n,e,t,c,i,r,a,o)}else return e}else{let c=new Q(null);return s.foreach((h,u)=>{const d=ee(t,h);l.isCompleteForPath(d)&&(c=c.set(h,l.getNode().getChild(d)))}),fs(n,e,t,c,i,r,a,o)}}function Zu(n,e,t,s,i){const r=e.serverCache,o=No(e,r.getNode(),r.isFullyInitialized()||L(t),r.isFiltered());return $o(n,o,t,s,Oo,i)}function eh(n,e,t,s,i,r){let o;if(_n(s,t)!=null)return e;{const a=new Bs(s,e,i),l=e.eventCache.getNode();let c;if(L(t)||F(t)===".priority"){let h;if(e.serverCache.isFullyInitialized())h=pn(s,Ke(e));else{const u=e.serverCache.getNode();E(u instanceof P,"serverChildren would be complete if leaf node"),h=Us(s,u)}h=h,c=n.filter.updateFullNode(l,h,r)}else{const h=F(t);let u=Ws(s,h,e.serverCache);u==null&&e.serverCache.isCompleteForChild(h)&&(u=l.getImmediateChild(h)),u!=null?c=n.filter.updateChild(l,h,u,q(t),a,r):e.eventCache.getNode().hasChild(h)?c=n.filter.updateChild(l,h,P.EMPTY_NODE,q(t),a,r):c=l,c.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=pn(s,Ke(e)),o.isLeafNode()&&(c=n.filter.updateFullNode(c,o,r)))}return o=e.serverCache.isFullyInitialized()||_n(s,Y())!=null,Tt(e,c,o,n.filter.filtersNodes())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class th{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const s=this.query_._queryParams,i=new Os(s.getIndex()),r=wu(s);this.processor_=qu(r);const o=t.serverCache,a=t.eventCache,l=i.updateFullNode(P.EMPTY_NODE,o.getNode(),null),c=r.updateFullNode(P.EMPTY_NODE,a.getNode(),null),h=new Ge(l,o.isFullyInitialized(),i.filtersNodes()),u=new Ge(c,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=Nn(u,h),this.eventGenerator_=new Iu(this.query_)}get query(){return this.query_}}function nh(n){return n.viewCache_.serverCache.getNode()}function sh(n,e){const t=Ke(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!L(e)&&!t.getImmediateChild(F(e)).isEmpty())?t.getChild(e):null}function zi(n){return n.eventRegistrations_.length===0}function ih(n,e){n.eventRegistrations_.push(e)}function qi(n,e,t){const s=[];if(t){E(e==null,"A cancel should cancel all event registrations.");const i=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,i);o&&s.push(o)})}if(e){let i=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))i.push(o);else if(e.hasAnyCallback()){i=i.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=i}else n.eventRegistrations_=[];return s}function Gi(n,e,t,s){e.type===Ce.MERGE&&e.source.queryId!==null&&(E(Ke(n.viewCache_),"We should always have a full cache before handling merges"),E(cs(n.viewCache_),"Missing event cache, even though we have a server cache"));const i=n.viewCache_,r=Ku(n.processor_,i,e,t,s);return Gu(n.processor_,r.viewCache),E(r.viewCache.serverCache.isFullyInitialized()||!i.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,Po(n,r.changes,r.viewCache.eventCache.getNode(),null)}function rh(n,e){const t=n.viewCache_.eventCache,s=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(X,(r,o)=>{s.push(ht(r,o))}),t.isFullyInitialized()&&s.push(bo(t.getNode())),Po(n,s,t.getNode(),e)}function Po(n,e,t,s){const i=s?[s]:n.eventRegistrations_;return Nu(n.eventGenerator_,e,t,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let gn;class oh{constructor(){this.views=new Map}}function ah(n){E(!gn,"__referenceConstructor has already been defined"),gn=n}function lh(){return E(gn,"Reference.ts has not been loaded"),gn}function ch(n){return n.views.size===0}function Hs(n,e,t,s){const i=e.source.queryId;if(i!==null){const r=n.views.get(i);return E(r!=null,"SyncTree gave us an op for an invalid query."),Gi(r,e,t,s)}else{let r=[];for(const o of n.views.values())r=r.concat(Gi(o,e,t,s));return r}}function uh(n,e,t,s,i){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let a=pn(t,i?s:null),l=!1;a?l=!0:s instanceof P?(a=Us(t,s),l=!1):(a=P.EMPTY_NODE,l=!1);const c=Nn(new Ge(a,l,!1),new Ge(s,i,!1));return new th(e,c)}return o}function hh(n,e,t,s,i,r){const o=uh(n,e,s,i,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),ih(o,t),rh(o,t)}function dh(n,e,t,s){const i=e._queryIdentifier,r=[];let o=[];const a=Le(n);if(i==="default")for(const[l,c]of n.views.entries())o=o.concat(qi(c,t,s)),zi(c)&&(n.views.delete(l),c.query._queryParams.loadsAllData()||r.push(c.query));else{const l=n.views.get(i);l&&(o=o.concat(qi(l,t,s)),zi(l)&&(n.views.delete(i),l.query._queryParams.loadsAllData()||r.push(l.query)))}return a&&!Le(n)&&r.push(new(lh())(e._repo,e._path)),{removed:r,events:o}}function Fo(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function at(n,e){let t=null;for(const s of n.views.values())t=t||sh(s,e);return t}function Lo(n,e){if(e._queryParams.loadsAllData())return Rn(n);{const s=e._queryIdentifier;return n.views.get(s)}}function Uo(n,e){return Lo(n,e)!=null}function Le(n){return Rn(n)!=null}function Rn(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let yn;function fh(n){E(!yn,"__referenceConstructor has already been defined"),yn=n}function ph(){return E(yn,"Reference.ts has not been loaded"),yn}let _h=1;class Ki{constructor(e){this.listenProvider_=e,this.syncPointTree_=new Q(null),this.pendingWriteTree_=ju(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Wo(n,e,t,s,i){return Mu(n.pendingWriteTree_,e,t,s,i),i?Bt(n,new qe(Io(),e,t)):[]}function Ye(n,e,t=!1){const s=Du(n.pendingWriteTree_,e);if(Ou(n.pendingWriteTree_,e)){let r=new Q(null);return s.snap!=null?r=r.set(Y(),!0):ue(s.children,o=>{r=r.set(new V(o),!0)}),Bt(n,new fn(s.path,r,t))}else return[]}function kn(n,e,t){return Bt(n,new qe(Ps(),e,t))}function mh(n,e,t){const s=Q.fromObject(t);return Bt(n,new $t(Ps(),e,s))}function gh(n,e){return Bt(n,new Ot(Ps(),e))}function yh(n,e,t){const s=Ys(n,t);if(s){const i=Vs(s),r=i.path,o=i.queryId,a=he(r,e),l=new Ot(Fs(o),a);return zs(n,r,l)}else return[]}function ps(n,e,t,s,i=!1){const r=e._path,o=n.syncPointTree_.get(r);let a=[];if(o&&(e._queryIdentifier==="default"||Uo(o,e))){const l=dh(o,e,t,s);ch(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const c=l.removed;if(a=l.events,!i){const h=c.findIndex(d=>d._queryParams.loadsAllData())!==-1,u=n.syncPointTree_.findOnPath(r,(d,p)=>Le(p));if(h&&!u){const d=n.syncPointTree_.subtree(r);if(!d.isEmpty()){const p=Ch(d);for(let v=0;v<p.length;++v){const A=p[v],b=A.query,O=jo(n,A);n.listenProvider_.startListening(It(b),vn(n,b),O.hashFn,O.onComplete)}}}!u&&c.length>0&&!s&&(h?n.listenProvider_.stopListening(It(e),null):c.forEach(d=>{const p=n.queryToTagMap.get(An(d));n.listenProvider_.stopListening(It(d),p)}))}Eh(n,c)}return a}function vh(n,e,t,s){const i=Ys(n,s);if(i!=null){const r=Vs(i),o=r.path,a=r.queryId,l=he(o,e),c=new qe(Fs(a),l,t);return zs(n,o,c)}else return[]}function wh(n,e,t,s){const i=Ys(n,s);if(i){const r=Vs(i),o=r.path,a=r.queryId,l=he(o,e),c=Q.fromObject(t),h=new $t(Fs(a),l,c);return zs(n,o,h)}else return[]}function Qi(n,e,t,s=!1){const i=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(i,(d,p)=>{const v=he(d,i);r=r||at(p,v),o=o||Le(p)});let a=n.syncPointTree_.get(i);a?(o=o||Le(a),r=r||at(a,Y())):(a=new oh,n.syncPointTree_=n.syncPointTree_.set(i,a));let l;r!=null?l=!0:(l=!1,r=P.EMPTY_NODE,n.syncPointTree_.subtree(i).foreachChild((p,v)=>{const A=at(v,Y());A&&(r=r.updateImmediateChild(p,A))}));const c=Uo(a,e);if(!c&&!e._queryParams.loadsAllData()){const d=An(e);E(!n.queryToTagMap.has(d),"View does not exist, but we have a tag");const p=Sh();n.queryToTagMap.set(d,p),n.tagToQueryMap.set(p,d)}const h=Ls(n.pendingWriteTree_,i);let u=hh(a,e,t,h,r,l);if(!c&&!o&&!s){const d=Lo(a,e);u=u.concat(xh(n,e,d))}return u}function js(n,e,t){const i=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,a)=>{const l=he(o,e),c=at(a,l);if(c)return c});return Ao(i,e,r,t,!0)}function Bt(n,e){return Bo(e,n.syncPointTree_,null,Ls(n.pendingWriteTree_,Y()))}function Bo(n,e,t,s){if(L(n.path))return Ho(n,e,t,s);{const i=e.get(Y());t==null&&i!=null&&(t=at(i,Y()));let r=[];const o=F(n.path),a=n.operationForChild(o),l=e.children.get(o);if(l&&a){const c=t?t.getImmediateChild(o):null,h=Mo(s,o);r=r.concat(Bo(a,l,c,h))}return i&&(r=r.concat(Hs(i,n,s,t))),r}}function Ho(n,e,t,s){const i=e.get(Y());t==null&&i!=null&&(t=at(i,Y()));let r=[];return e.children.inorderTraversal((o,a)=>{const l=t?t.getImmediateChild(o):null,c=Mo(s,o),h=n.operationForChild(o);h&&(r=r.concat(Ho(h,a,l,c)))}),i&&(r=r.concat(Hs(i,n,s,t))),r}function jo(n,e){const t=e.query,s=vn(n,t);return{hashFn:()=>(nh(e)||P.EMPTY_NODE).hash(),onComplete:i=>{if(i==="ok")return s?yh(n,t._path,s):gh(n,t._path);{const r=yc(i,t);return ps(n,t,null,r)}}}}function vn(n,e){const t=An(e);return n.queryToTagMap.get(t)}function An(n){return n._path.toString()+"$"+n._queryIdentifier}function Ys(n,e){return n.tagToQueryMap.get(e)}function Vs(n){const e=n.indexOf("$");return E(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new V(n.substr(0,e))}}function zs(n,e,t){const s=n.syncPointTree_.get(e);E(s,"Missing sync point for query tag that we're tracking");const i=Ls(n.pendingWriteTree_,e);return Hs(s,t,i,null)}function Ch(n){return n.fold((e,t,s)=>{if(t&&Le(t))return[Rn(t)];{let i=[];return t&&(i=Fo(t)),ue(s,(r,o)=>{i=i.concat(o)}),i}})}function It(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(ph())(n._repo,n._path):n}function Eh(n,e){for(let t=0;t<e.length;++t){const s=e[t];if(!s._queryParams.loadsAllData()){const i=An(s),r=n.queryToTagMap.get(i);n.queryToTagMap.delete(i),n.tagToQueryMap.delete(r)}}}function Sh(){return _h++}function xh(n,e,t){const s=e._path,i=vn(n,e),r=jo(n,t),o=n.listenProvider_.startListening(It(e),i,r.hashFn,r.onComplete),a=n.syncPointTree_.subtree(s);if(i)E(!Le(a.value),"If we're adding a query, it shouldn't be shadowed");else{const l=a.fold((c,h,u)=>{if(!L(c)&&h&&Le(h))return[Rn(h).query];{let d=[];return h&&(d=d.concat(Fo(h).map(p=>p.query))),ue(u,(p,v)=>{d=d.concat(v)}),d}});for(let c=0;c<l.length;++c){const h=l[c];n.listenProvider_.stopListening(It(h),vn(n,h))}}return o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qs{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new qs(t)}node(){return this.node_}}class Gs{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=ee(this.path_,e);return new Gs(this.syncTree_,t)}node(){return js(this.syncTree_,this.path_)}}const Th=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},Ji=function(n,e,t){if(!n||typeof n!="object")return n;if(E(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return bh(n[".sv"],e,t);if(typeof n[".sv"]=="object")return Ih(n[".sv"],e);E(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},bh=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:E(!1,"Unexpected server value: "+n)}},Ih=function(n,e,t){n.hasOwnProperty("increment")||E(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const s=n.increment;typeof s!="number"&&E(!1,"Unexpected increment value: "+s);const i=e.node();if(E(i!==null&&typeof i<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!i.isLeafNode())return s;const o=i.getValue();return typeof o!="number"?s:o+s},Nh=function(n,e,t,s){return Ks(e,new Gs(t,n),s)},Yo=function(n,e,t){return Ks(n,new qs(e),t)};function Ks(n,e,t){const s=n.getPriority().val(),i=Ji(s,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,a=Ji(o.getValue(),e,t);return a!==o.getValue()||i!==o.getPriority().val()?new ie(a,te(i)):n}else{const o=n;return r=o,i!==o.getPriority().val()&&(r=r.updatePriority(new ie(i))),o.forEachChild(X,(a,l)=>{const c=Ks(l,e.getImmediateChild(a),t);c!==l&&(r=r.updateImmediateChild(a,c))}),r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qs{constructor(e="",t=null,s={children:{},childCount:0}){this.name=e,this.parent=t,this.node=s}}function Js(n,e){let t=e instanceof V?e:new V(e),s=n,i=F(t);for(;i!==null;){const r=lt(s.node.children,i)||{children:{},childCount:0};s=new Qs(i,s,r),t=q(t),i=F(t)}return s}function gt(n){return n.node.value}function Vo(n,e){n.node.value=e,_s(n)}function zo(n){return n.node.childCount>0}function Rh(n){return gt(n)===void 0&&!zo(n)}function Mn(n,e){ue(n.node.children,(t,s)=>{e(new Qs(t,n,s))})}function qo(n,e,t,s){t&&e(n),Mn(n,i=>{qo(i,e,!0)})}function kh(n,e,t){let s=n.parent;for(;s!==null;){if(e(s))return!0;s=s.parent}return!1}function Ht(n){return new V(n.parent===null?n.name:Ht(n.parent)+"/"+n.name)}function _s(n){n.parent!==null&&Ah(n.parent,n.name,n)}function Ah(n,e,t){const s=Rh(t),i=xe(n.node.children,e);s&&i?(delete n.node.children[e],n.node.childCount--,_s(n)):!s&&!i&&(n.node.children[e]=t.node,n.node.childCount++,_s(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mh=/[\[\].#$\/\u0000-\u001F\u007F]/,Dh=/[\[\].#$\u0000-\u001F\u007F]/,Gn=10*1024*1024,Xs=function(n){return typeof n=="string"&&n.length!==0&&!Mh.test(n)},Go=function(n){return typeof n=="string"&&n.length!==0&&!Dh.test(n)},Oh=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Go(n)},Ko=function(n){return n===null||typeof n=="string"||typeof n=="number"&&!bn(n)||n&&typeof n=="object"&&xe(n,".sv")},wn=function(n,e,t,s){s&&e===void 0||Dn(ct(n,"value"),e,t)},Dn=function(n,e,t){const s=t instanceof V?new Xc(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+He(s));if(typeof e=="function")throw new Error(n+"contains a function "+He(s)+" with contents = "+e.toString());if(bn(e))throw new Error(n+"contains "+e.toString()+" "+He(s));if(typeof e=="string"&&e.length>Gn/3&&Tn(e)>Gn)throw new Error(n+"contains a string greater than "+Gn+" utf8 bytes "+He(s)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let i=!1,r=!1;if(ue(e,(o,a)=>{if(o===".value")i=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!Xs(o)))throw new Error(n+" contains an invalid key ("+o+") "+He(s)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);Zc(s,o),Dn(n,a,s),eu(s)}),i&&r)throw new Error(n+' contains ".value" child '+He(s)+" in addition to actual children.")}},$h=function(n,e){let t,s;for(t=0;t<e.length;t++){s=e[t];const r=kt(s);for(let o=0;o<r.length;o++)if(!(r[o]===".priority"&&o===r.length-1)){if(!Xs(r[o]))throw new Error(n+"contains an invalid key ("+r[o]+") in path "+s.toString()+`. Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`)}}e.sort(Jc);let i=null;for(t=0;t<e.length;t++){if(s=e[t],i!==null&&ge(i,s))throw new Error(n+"contains a path "+i.toString()+" that is ancestor of another path "+s.toString());i=s}},Ph=function(n,e,t,s){const i=ct(n,"values");if(!(e&&typeof e=="object")||Array.isArray(e))throw new Error(i+" must be an object containing the children to replace.");const r=[];ue(e,(o,a)=>{const l=new V(o);if(Dn(i,a,ee(t,l)),ks(l)===".priority"&&!Ko(a))throw new Error(i+"contains an invalid value for '"+l.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");r.push(l)}),$h(i,r)},Fh=function(n,e,t){if(bn(e))throw new Error(ct(n,"priority")+"is "+e.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!Ko(e))throw new Error(ct(n,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")},Qo=function(n,e,t,s){if(!Go(t))throw new Error(ct(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},Lh=function(n,e,t,s){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),Qo(n,e,t)},Ve=function(n,e){if(F(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},Uh=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!Xs(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!Oh(t))throw new Error(ct(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wh{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Zs(n,e){let t=null;for(let s=0;s<e.length;s++){const i=e[s],r=i.getPath();t!==null&&!As(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(i)}t&&n.eventLists_.push(t)}function Jo(n,e,t){Zs(n,t),Xo(n,s=>As(s,e))}function Ae(n,e,t){Zs(n,t),Xo(n,s=>ge(s,e)||ge(e,s))}function Xo(n,e){n.recursionDepth_++;let t=!0;for(let s=0;s<n.eventLists_.length;s++){const i=n.eventLists_[s];if(i){const r=i.path;e(r)?(Bh(n.eventLists_[s]),n.eventLists_[s]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function Bh(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const s=t.getEventRunner();St&&ce("event: "+t.toString()),_t(s)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hh="repo_interrupt",jh=25;class Yh{constructor(e,t,s,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=s,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Wh,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=dn(),this.transactionQueueTree_=new Qs,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Vh(n,e,t){if(n.stats_=Ns(n.repoInfo_),n.forceRestClient_||Ec())n.server_=new hn(n.repoInfo_,(s,i,r,o)=>{Xi(n,s,i,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Zi(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{ae(t)}catch(s){throw new Error("Invalid authOverride provided: "+s)}}n.persistentConnection_=new Ne(n.repoInfo_,e,(s,i,r,o)=>{Xi(n,s,i,r,o)},s=>{Zi(n,s)},s=>{zh(n,s)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(s=>{n.server_.refreshAuthToken(s)}),n.appCheckProvider_.addTokenChangeListener(s=>{n.server_.refreshAppCheckToken(s.token)}),n.statsReporter_=Ic(n.repoInfo_,()=>new bu(n.stats_,n.server_)),n.infoData_=new Cu,n.infoSyncTree_=new Ki({startListening:(s,i,r,o)=>{let a=[];const l=n.infoData_.getNode(s._path);return l.isEmpty()||(a=kn(n.infoSyncTree_,s._path,l),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),ti(n,"connected",!1),n.serverSyncTree_=new Ki({startListening:(s,i,r,o)=>(n.server_.listen(s,r,i,(a,l)=>{const c=o(a,l);Ae(n.eventQueue_,s._path,c)}),[]),stopListening:(s,i)=>{n.server_.unlisten(s,i)}})}function Zo(n){const t=n.infoData_.getNode(new V(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function ei(n){return Th({timestamp:Zo(n)})}function Xi(n,e,t,s,i){n.dataUpdateCount++;const r=new V(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(i)if(s){const l=an(t,c=>te(c));o=wh(n.serverSyncTree_,r,l,i)}else{const l=te(t);o=vh(n.serverSyncTree_,r,l,i)}else if(s){const l=an(t,c=>te(c));o=mh(n.serverSyncTree_,r,l)}else{const l=te(t);o=kn(n.serverSyncTree_,r,l)}let a=r;o.length>0&&(a=On(n,r)),Ae(n.eventQueue_,a,o)}function Zi(n,e){ti(n,"connected",e),e===!1&&Gh(n)}function zh(n,e){ue(e,(t,s)=>{ti(n,t,s)})}function ti(n,e,t){const s=new V("/.info/"+e),i=te(t);n.infoData_.updateSnapshot(s,i);const r=kn(n.infoSyncTree_,s,i);Ae(n.eventQueue_,s,r)}function ea(n){return n.nextWriteId_++}function qh(n,e,t,s,i){ni(n,"set",{path:e.toString(),value:t,priority:s});const r=ei(n),o=te(t,s),a=js(n.serverSyncTree_,e),l=Yo(o,a,r),c=ea(n),h=Wo(n.serverSyncTree_,e,l,c,!0);Zs(n.eventQueue_,h),n.server_.put(e.toString(),o.val(!0),(d,p)=>{const v=d==="ok";v||fe("set at "+e+" failed: "+d);const A=Ye(n.serverSyncTree_,c,!v);Ae(n.eventQueue_,e,A),ft(n,i,d,p)});const u=ra(n,e);On(n,u),Ae(n.eventQueue_,u,[])}function Gh(n){ni(n,"onDisconnectEvents");const e=ei(n),t=dn();ls(n.onDisconnect_,Y(),(i,r)=>{const o=Nh(i,r,n.serverSyncTree_,e);mt(t,i,o)});let s=[];ls(t,Y(),(i,r)=>{s=s.concat(kn(n.serverSyncTree_,i,r));const o=ra(n,i);On(n,o)}),n.onDisconnect_=dn(),Ae(n.eventQueue_,Y(),s)}function Kh(n,e,t){n.server_.onDisconnectCancel(e.toString(),(s,i)=>{s==="ok"&&as(n.onDisconnect_,e),ft(n,t,s,i)})}function er(n,e,t,s){const i=te(t);n.server_.onDisconnectPut(e.toString(),i.val(!0),(r,o)=>{r==="ok"&&mt(n.onDisconnect_,e,i),ft(n,s,r,o)})}function Qh(n,e,t,s,i){const r=te(t,s);n.server_.onDisconnectPut(e.toString(),r.val(!0),(o,a)=>{o==="ok"&&mt(n.onDisconnect_,e,r),ft(n,i,o,a)})}function Jh(n,e,t,s){if(ss(t)){ce("onDisconnect().update() called with empty data.  Don't do anything."),ft(n,s,"ok",void 0);return}n.server_.onDisconnectMerge(e.toString(),t,(i,r)=>{i==="ok"&&ue(t,(o,a)=>{const l=te(a);mt(n.onDisconnect_,ee(e,o),l)}),ft(n,s,i,r)})}function Xh(n,e,t){let s;F(e._path)===".info"?s=Qi(n.infoSyncTree_,e,t):s=Qi(n.serverSyncTree_,e,t),Jo(n.eventQueue_,e._path,s)}function Zh(n,e,t){let s;F(e._path)===".info"?s=ps(n.infoSyncTree_,e,t):s=ps(n.serverSyncTree_,e,t),Jo(n.eventQueue_,e._path,s)}function ed(n){n.persistentConnection_&&n.persistentConnection_.interrupt(Hh)}function ni(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),ce(t,...e)}function ft(n,e,t,s){e&&_t(()=>{if(t==="ok")e(null);else{const i=(t||"error").toUpperCase();let r=i;s&&(r+=": "+s);const o=new Error(r);o.code=i,e(o)}})}function ta(n,e,t){return js(n.serverSyncTree_,e,t)||P.EMPTY_NODE}function si(n,e=n.transactionQueueTree_){if(e||$n(n,e),gt(e)){const t=sa(n,e);E(t.length>0,"Sending zero length transaction queue"),t.every(i=>i.status===0)&&td(n,Ht(e),t)}else zo(e)&&Mn(e,t=>{si(n,t)})}function td(n,e,t){const s=t.map(c=>c.currentWriteId),i=ta(n,e,s);let r=i;const o=i.hash();for(let c=0;c<t.length;c++){const h=t[c];E(h.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),h.status=1,h.retryCount++;const u=he(e,h.path);r=r.updateChild(u,h.currentOutputSnapshotRaw)}const a=r.val(!0),l=e;n.server_.put(l.toString(),a,c=>{ni(n,"transaction put response",{path:l.toString(),status:c});let h=[];if(c==="ok"){const u=[];for(let d=0;d<t.length;d++)t[d].status=2,h=h.concat(Ye(n.serverSyncTree_,t[d].currentWriteId)),t[d].onComplete&&u.push(()=>t[d].onComplete(null,!0,t[d].currentOutputSnapshotResolved)),t[d].unwatcher();$n(n,Js(n.transactionQueueTree_,e)),si(n,n.transactionQueueTree_),Ae(n.eventQueue_,e,h);for(let d=0;d<u.length;d++)_t(u[d])}else{if(c==="datastale")for(let u=0;u<t.length;u++)t[u].status===3?t[u].status=4:t[u].status=0;else{fe("transaction at "+l.toString()+" failed: "+c);for(let u=0;u<t.length;u++)t[u].status=4,t[u].abortReason=c}On(n,e)}},o)}function On(n,e){const t=na(n,e),s=Ht(t),i=sa(n,t);return nd(n,i,s),s}function nd(n,e,t){if(e.length===0)return;const s=[];let i=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const l=e[a],c=he(t,l.path);let h=!1,u;if(E(c!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),l.status===4)h=!0,u=l.abortReason,i=i.concat(Ye(n.serverSyncTree_,l.currentWriteId,!0));else if(l.status===0)if(l.retryCount>=jh)h=!0,u="maxretry",i=i.concat(Ye(n.serverSyncTree_,l.currentWriteId,!0));else{const d=ta(n,l.path,o);l.currentInputSnapshot=d;const p=e[a].update(d.val());if(p!==void 0){Dn("transaction failed: Data returned ",p,l.path);let v=te(p);typeof p=="object"&&p!=null&&xe(p,".priority")||(v=v.updatePriority(d.getPriority()));const b=l.currentWriteId,O=ei(n),W=Yo(v,d,O);l.currentOutputSnapshotRaw=v,l.currentOutputSnapshotResolved=W,l.currentWriteId=ea(n),o.splice(o.indexOf(b),1),i=i.concat(Wo(n.serverSyncTree_,l.path,W,l.currentWriteId,l.applyLocally)),i=i.concat(Ye(n.serverSyncTree_,b,!0))}else h=!0,u="nodata",i=i.concat(Ye(n.serverSyncTree_,l.currentWriteId,!0))}Ae(n.eventQueue_,t,i),i=[],h&&(e[a].status=2,function(d){setTimeout(d,Math.floor(0))}(e[a].unwatcher),e[a].onComplete&&(u==="nodata"?s.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):s.push(()=>e[a].onComplete(new Error(u),!1,null))))}$n(n,n.transactionQueueTree_);for(let a=0;a<s.length;a++)_t(s[a]);si(n,n.transactionQueueTree_)}function na(n,e){let t,s=n.transactionQueueTree_;for(t=F(e);t!==null&&gt(s)===void 0;)s=Js(s,t),e=q(e),t=F(e);return s}function sa(n,e){const t=[];return ia(n,e,t),t.sort((s,i)=>s.order-i.order),t}function ia(n,e,t){const s=gt(e);if(s)for(let i=0;i<s.length;i++)t.push(s[i]);Mn(e,i=>{ia(n,i,t)})}function $n(n,e){const t=gt(e);if(t){let s=0;for(let i=0;i<t.length;i++)t[i].status!==2&&(t[s]=t[i],s++);t.length=s,Vo(e,t.length>0?t:void 0)}Mn(e,s=>{$n(n,s)})}function ra(n,e){const t=Ht(na(n,e)),s=Js(n.transactionQueueTree_,e);return kh(s,i=>{Kn(n,i)}),Kn(n,s),qo(s,i=>{Kn(n,i)}),t}function Kn(n,e){const t=gt(e);if(t){const s=[];let i=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(E(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(E(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),i=i.concat(Ye(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&s.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?Vo(e,void 0):t.length=r+1,Ae(n.eventQueue_,Ht(e),i);for(let o=0;o<s.length;o++)_t(s[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sd(n){let e="";const t=n.split("/");for(let s=0;s<t.length;s++)if(t[s].length>0){let i=t[s];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch{}e+="/"+i}return e}function id(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const s=t.split("=");s.length===2?e[decodeURIComponent(s[0])]=decodeURIComponent(s[1]):fe(`Invalid query segment '${t}' in query '${n}'`)}return e}const tr=function(n,e){const t=rd(n),s=t.namespace;t.domain==="firebase.com"&&ke(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!s||s==="undefined")&&t.domain!=="localhost"&&ke("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||fc();const i=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new co(t.host,t.secure,s,i,e,"",s!==t.subdomain),path:new V(t.pathString)}},rd=function(n){let e="",t="",s="",i="",r="",o=!0,a="https",l=443;if(typeof n=="string"){let c=n.indexOf("//");c>=0&&(a=n.substring(0,c-1),n=n.substring(c+2));let h=n.indexOf("/");h===-1&&(h=n.length);let u=n.indexOf("?");u===-1&&(u=n.length),e=n.substring(0,Math.min(h,u)),h<u&&(i=sd(n.substring(h,u)));const d=id(n.substring(Math.min(n.length,u)));c=e.indexOf(":"),c>=0?(o=a==="https"||a==="wss",l=parseInt(e.substring(c+1),10)):c=e.length;const p=e.slice(0,c);if(p.toLowerCase()==="localhost")t="localhost";else if(p.split(".").length<=2)t=p;else{const v=e.indexOf(".");s=e.substring(0,v).toLowerCase(),t=e.substring(v+1),r=s}"ns"in d&&(r=d.ns)}return{host:e,port:l,domain:t,subdomain:s,secure:o,scheme:a,pathString:i,namespace:r}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nr="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",od=function(){let n=0;const e=[];return function(t){const s=t===n;n=t;let i;const r=new Array(8);for(i=7;i>=0;i--)r[i]=nr.charAt(t%64),t=Math.floor(t/64);E(t===0,"Cannot push at time == 0");let o=r.join("");if(s){for(i=11;i>=0&&e[i]===63;i--)e[i]=0;e[i]++}else for(i=0;i<12;i++)e[i]=Math.floor(Math.random()*64);for(i=0;i<12;i++)o+=nr.charAt(e[i]);return E(o.length===20,"nextPushId: Length should be 20."),o}}();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ad{constructor(e,t,s,i){this.eventType=e,this.eventRegistration=t,this.snapshot=s,this.prevName=i}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+ae(this.snapshot.exportVal())}}class ld{constructor(e,t,s){this.eventRegistration=e,this.error=t,this.path=s}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cd{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return E(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ud{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new $e;return Kh(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){Ve("OnDisconnect.remove",this._path);const e=new $e;return er(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){Ve("OnDisconnect.set",this._path),wn("OnDisconnect.set",e,this._path,!1);const t=new $e;return er(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){Ve("OnDisconnect.setWithPriority",this._path),wn("OnDisconnect.setWithPriority",e,this._path,!1),Fh("OnDisconnect.setWithPriority",t);const s=new $e;return Qh(this._repo,this._path,e,t,s.wrapCallback(()=>{})),s.promise}update(e){Ve("OnDisconnect.update",this._path),Ph("OnDisconnect.update",e,this._path);const t=new $e;return Jh(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ii{constructor(e,t,s,i){this._repo=e,this._path=t,this._queryParams=s,this._orderByCalled=i}get key(){return L(this._path)?null:ks(this._path)}get ref(){return new We(this._repo,this._path)}get _queryIdentifier(){const e=Li(this._queryParams),t=bs(e);return t==="{}"?"default":t}get _queryObject(){return Li(this._queryParams)}isEqual(e){if(e=Xe(e),!(e instanceof ii))return!1;const t=this._repo===e._repo,s=As(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&s&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+Qc(this._path)}}class We extends ii{constructor(e,t){super(e,t,new $s,!1)}get parent(){const e=vo(this._path);return e===null?null:new We(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class Cn{constructor(e,t,s){this._node=e,this.ref=t,this._index=s}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new V(e),s=Pt(this.ref,e);return new Cn(this._node.getChild(t),s,X)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(s,i)=>e(new Cn(i,Pt(this.ref,s),X)))}hasChild(e){const t=new V(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function Jt(n,e){return n=Xe(n),n._checkNotDeleted("ref"),e!==void 0?Pt(n._root,e):n._root}function Pt(n,e){return n=Xe(n),F(n._path)===null?Lh("child","path",e):Qo("child","path",e),new We(n._repo,ee(n._path,e))}function sr(n){return n=Xe(n),new ud(n._repo,n._path)}function ir(n,e){n=Xe(n),Ve("push",n._path),wn("push",e,n._path,!0);const t=Zo(n._repo),s=od(t),i=Pt(n,s),r=Pt(n,s);let o;return o=Promise.resolve(r),i.then=o.then.bind(o),i.catch=o.then.bind(o,void 0),i}function Qn(n){return Ve("remove",n._path),oa(n,null)}function oa(n,e){n=Xe(n),Ve("set",n._path),wn("set",e,n._path,!1);const t=new $e;return qh(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}class ri{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const s=t._queryParams.getIndex();return new ad("value",this,new Cn(e.snapshotNode,new We(t._repo,t._path),s))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new ld(this,e,t):null}matches(e){return e instanceof ri?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}function hd(n,e,t,s,i){const r=new cd(t,void 0),o=new ri(r);return Xh(n._repo,n,o),()=>Zh(n._repo,n,o)}function aa(n,e,t,s){return hd(n,"value",e)}ah(We);fh(We);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dd="FIREBASE_DATABASE_EMULATOR_HOST",ms={};let fd=!1;function pd(n,e,t,s){n.repoInfo_=new co(`${e}:${t}`,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0),s&&(n.authTokenProvider_=s)}function _d(n,e,t,s,i){let r=s||n.options.databaseURL;r===void 0&&(n.options.projectId||ke("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),ce("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=tr(r,i),a=o.repoInfo,l;typeof process<"u"&&wi&&(l=wi[dd]),l?(r=`http://${l}?ns=${a.namespace}`,o=tr(r,i),a=o.repoInfo):o.repoInfo.secure;const c=new xc(n.name,n.options,e);Uh("Invalid Firebase Database URL",o),L(o.path)||ke("Database URL must point to the root of a Firebase Database (not including a child path).");const h=gd(a,n,c,new Sc(n.name,t));return new yd(h,n)}function md(n,e){const t=ms[e];(!t||t[n.key]!==n)&&ke(`Database ${e}(${n.repoInfo_}) has already been deleted.`),ed(n),delete t[n.key]}function gd(n,e,t,s){let i=ms[e.name];i||(i={},ms[e.name]=i);let r=i[n.toURLString()];return r&&ke("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Yh(n,fd,t,s),i[n.toURLString()]=r,r}class yd{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Vh(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new We(this._repo,Y())),this._rootInternal}_delete(){return this._rootInternal!==null&&(md(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&ke("Cannot call "+e+" on a deleted database.")}}function la(n=Ia(),e){const t=Na(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const s=Vl("database");s&&vd(t,...s)}return t}function vd(n,e,t,s={}){n=Xe(n),n._checkNotDeleted("useEmulator"),n._instanceStarted&&ke("Cannot call useEmulator() after instance has already been initialized.");const i=n._repoInternal;let r;if(i.repoInfo_.nodeAdmin)s.mockUserToken&&ke('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),r=new Qt(Qt.OWNER);else if(s.mockUserToken){const o=typeof s.mockUserToken=="string"?s.mockUserToken:zl(s.mockUserToken,n.app.options.projectId);r=new Qt(o)}pd(i,e,t,r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wd(n){ac(Ra),ba(new tc("database",(e,{instanceIdentifier:t})=>{const s=e.getProvider("app").getImmediate(),i=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return _d(s,i,r,t)},"PUBLIC").setMultipleInstances(!0)),oi(Ci,Ei,n),oi(Ci,Ei,"esm2017")}Ne.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};Ne.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};wd();var Jn={exports:{}};const Cd={},Ed=Object.freeze(Object.defineProperty({__proto__:null,default:Cd},Symbol.toStringTag,{value:"Module"})),rr=Ca(Ed);/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 */var or;function Sd(){return or||(or=1,function(n){(function(){var e="input is invalid type",t=typeof window=="object",s=t?window:{};s.JS_SHA256_NO_WINDOW&&(t=!1);var i=!t&&typeof self=="object",r=!s.JS_SHA256_NO_NODE_JS&&typeof process=="object"&&process.versions&&process.versions.node;r?s=Ea:i&&(s=self);var o=!s.JS_SHA256_NO_COMMON_JS&&!0&&n.exports,a=!s.JS_SHA256_NO_ARRAY_BUFFER&&typeof ArrayBuffer<"u",l="0123456789abcdef".split(""),c=[-2147483648,8388608,32768,128],h=[24,16,8,0],u=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],d=["hex","array","digest","arrayBuffer"],p=[];(s.JS_SHA256_NO_NODE_JS||!Array.isArray)&&(Array.isArray=function(f){return Object.prototype.toString.call(f)==="[object Array]"}),a&&(s.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW||!ArrayBuffer.isView)&&(ArrayBuffer.isView=function(f){return typeof f=="object"&&f.buffer&&f.buffer.constructor===ArrayBuffer});var v=function(f,x){return function(R){return new M(x,!0).update(R)[f]()}},A=function(f){var x=v("hex",f);r&&(x=b(x,f)),x.create=function(){return new M(f)},x.update=function(I){return x.create().update(I)};for(var R=0;R<d.length;++R){var C=d[R];x[C]=v(C,f)}return x},b=function(f,x){var R=rr,C=rr.Buffer,I=x?"sha224":"sha256",_;C.from&&!s.JS_SHA256_NO_BUFFER_FROM?_=C.from:_=function(m){return new C(m)};var D=function(m){if(typeof m=="string")return R.createHash(I).update(m,"utf8").digest("hex");if(m==null)throw new Error(e);return m.constructor===ArrayBuffer&&(m=new Uint8Array(m)),Array.isArray(m)||ArrayBuffer.isView(m)||m.constructor===C?R.createHash(I).update(_(m)).digest("hex"):f(m)};return D},O=function(f,x){return function(R,C){return new J(R,x,!0).update(C)[f]()}},W=function(f){var x=O("hex",f);x.create=function(I){return new J(I,f)},x.update=function(I,_){return x.create(I).update(_)};for(var R=0;R<d.length;++R){var C=d[R];x[C]=O(C,f)}return x};function M(f,x){x?(p[0]=p[16]=p[1]=p[2]=p[3]=p[4]=p[5]=p[6]=p[7]=p[8]=p[9]=p[10]=p[11]=p[12]=p[13]=p[14]=p[15]=0,this.blocks=p):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],f?(this.h0=3238371032,this.h1=914150663,this.h2=812702999,this.h3=4144912697,this.h4=4290775857,this.h5=1750603025,this.h6=1694076839,this.h7=3204075428):(this.h0=1779033703,this.h1=3144134277,this.h2=1013904242,this.h3=2773480762,this.h4=1359893119,this.h5=2600822924,this.h6=528734635,this.h7=1541459225),this.block=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0,this.is224=f}M.prototype.update=function(f){if(!this.finalized){var x,R=typeof f;if(R!=="string"){if(R==="object"){if(f===null)throw new Error(e);if(a&&f.constructor===ArrayBuffer)f=new Uint8Array(f);else if(!Array.isArray(f)&&(!a||!ArrayBuffer.isView(f)))throw new Error(e)}else throw new Error(e);x=!0}for(var C,I=0,_,D=f.length,m=this.blocks;I<D;){if(this.hashed&&(this.hashed=!1,m[0]=this.block,this.block=m[16]=m[1]=m[2]=m[3]=m[4]=m[5]=m[6]=m[7]=m[8]=m[9]=m[10]=m[11]=m[12]=m[13]=m[14]=m[15]=0),x)for(_=this.start;I<D&&_<64;++I)m[_>>>2]|=f[I]<<h[_++&3];else for(_=this.start;I<D&&_<64;++I)C=f.charCodeAt(I),C<128?m[_>>>2]|=C<<h[_++&3]:C<2048?(m[_>>>2]|=(192|C>>>6)<<h[_++&3],m[_>>>2]|=(128|C&63)<<h[_++&3]):C<55296||C>=57344?(m[_>>>2]|=(224|C>>>12)<<h[_++&3],m[_>>>2]|=(128|C>>>6&63)<<h[_++&3],m[_>>>2]|=(128|C&63)<<h[_++&3]):(C=65536+((C&1023)<<10|f.charCodeAt(++I)&1023),m[_>>>2]|=(240|C>>>18)<<h[_++&3],m[_>>>2]|=(128|C>>>12&63)<<h[_++&3],m[_>>>2]|=(128|C>>>6&63)<<h[_++&3],m[_>>>2]|=(128|C&63)<<h[_++&3]);this.lastByteIndex=_,this.bytes+=_-this.start,_>=64?(this.block=m[16],this.start=_-64,this.hash(),this.hashed=!0):this.start=_}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},M.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var f=this.blocks,x=this.lastByteIndex;f[16]=this.block,f[x>>>2]|=c[x&3],this.block=f[16],x>=56&&(this.hashed||this.hash(),f[0]=this.block,f[16]=f[1]=f[2]=f[3]=f[4]=f[5]=f[6]=f[7]=f[8]=f[9]=f[10]=f[11]=f[12]=f[13]=f[14]=f[15]=0),f[14]=this.hBytes<<3|this.bytes>>>29,f[15]=this.bytes<<3,this.hash()}},M.prototype.hash=function(){var f=this.h0,x=this.h1,R=this.h2,C=this.h3,I=this.h4,_=this.h5,D=this.h6,m=this.h7,w=this.blocks,g,y,N,S,T,k,$,j,z,Z,ne;for(g=16;g<64;++g)T=w[g-15],y=(T>>>7|T<<25)^(T>>>18|T<<14)^T>>>3,T=w[g-2],N=(T>>>17|T<<15)^(T>>>19|T<<13)^T>>>10,w[g]=w[g-16]+y+w[g-7]+N<<0;for(ne=x&R,g=0;g<64;g+=4)this.first?(this.is224?(j=300032,T=w[0]-1413257819,m=T-150054599<<0,C=T+24177077<<0):(j=704751109,T=w[0]-210244248,m=T-1521486534<<0,C=T+143694565<<0),this.first=!1):(y=(f>>>2|f<<30)^(f>>>13|f<<19)^(f>>>22|f<<10),N=(I>>>6|I<<26)^(I>>>11|I<<21)^(I>>>25|I<<7),j=f&x,S=j^f&R^ne,$=I&_^~I&D,T=m+N+$+u[g]+w[g],k=y+S,m=C+T<<0,C=T+k<<0),y=(C>>>2|C<<30)^(C>>>13|C<<19)^(C>>>22|C<<10),N=(m>>>6|m<<26)^(m>>>11|m<<21)^(m>>>25|m<<7),z=C&f,S=z^C&x^j,$=m&I^~m&_,T=D+N+$+u[g+1]+w[g+1],k=y+S,D=R+T<<0,R=T+k<<0,y=(R>>>2|R<<30)^(R>>>13|R<<19)^(R>>>22|R<<10),N=(D>>>6|D<<26)^(D>>>11|D<<21)^(D>>>25|D<<7),Z=R&C,S=Z^R&f^z,$=D&m^~D&I,T=_+N+$+u[g+2]+w[g+2],k=y+S,_=x+T<<0,x=T+k<<0,y=(x>>>2|x<<30)^(x>>>13|x<<19)^(x>>>22|x<<10),N=(_>>>6|_<<26)^(_>>>11|_<<21)^(_>>>25|_<<7),ne=x&R,S=ne^x&C^Z,$=_&D^~_&m,T=I+N+$+u[g+3]+w[g+3],k=y+S,I=f+T<<0,f=T+k<<0,this.chromeBugWorkAround=!0;this.h0=this.h0+f<<0,this.h1=this.h1+x<<0,this.h2=this.h2+R<<0,this.h3=this.h3+C<<0,this.h4=this.h4+I<<0,this.h5=this.h5+_<<0,this.h6=this.h6+D<<0,this.h7=this.h7+m<<0},M.prototype.hex=function(){this.finalize();var f=this.h0,x=this.h1,R=this.h2,C=this.h3,I=this.h4,_=this.h5,D=this.h6,m=this.h7,w=l[f>>>28&15]+l[f>>>24&15]+l[f>>>20&15]+l[f>>>16&15]+l[f>>>12&15]+l[f>>>8&15]+l[f>>>4&15]+l[f&15]+l[x>>>28&15]+l[x>>>24&15]+l[x>>>20&15]+l[x>>>16&15]+l[x>>>12&15]+l[x>>>8&15]+l[x>>>4&15]+l[x&15]+l[R>>>28&15]+l[R>>>24&15]+l[R>>>20&15]+l[R>>>16&15]+l[R>>>12&15]+l[R>>>8&15]+l[R>>>4&15]+l[R&15]+l[C>>>28&15]+l[C>>>24&15]+l[C>>>20&15]+l[C>>>16&15]+l[C>>>12&15]+l[C>>>8&15]+l[C>>>4&15]+l[C&15]+l[I>>>28&15]+l[I>>>24&15]+l[I>>>20&15]+l[I>>>16&15]+l[I>>>12&15]+l[I>>>8&15]+l[I>>>4&15]+l[I&15]+l[_>>>28&15]+l[_>>>24&15]+l[_>>>20&15]+l[_>>>16&15]+l[_>>>12&15]+l[_>>>8&15]+l[_>>>4&15]+l[_&15]+l[D>>>28&15]+l[D>>>24&15]+l[D>>>20&15]+l[D>>>16&15]+l[D>>>12&15]+l[D>>>8&15]+l[D>>>4&15]+l[D&15];return this.is224||(w+=l[m>>>28&15]+l[m>>>24&15]+l[m>>>20&15]+l[m>>>16&15]+l[m>>>12&15]+l[m>>>8&15]+l[m>>>4&15]+l[m&15]),w},M.prototype.toString=M.prototype.hex,M.prototype.digest=function(){this.finalize();var f=this.h0,x=this.h1,R=this.h2,C=this.h3,I=this.h4,_=this.h5,D=this.h6,m=this.h7,w=[f>>>24&255,f>>>16&255,f>>>8&255,f&255,x>>>24&255,x>>>16&255,x>>>8&255,x&255,R>>>24&255,R>>>16&255,R>>>8&255,R&255,C>>>24&255,C>>>16&255,C>>>8&255,C&255,I>>>24&255,I>>>16&255,I>>>8&255,I&255,_>>>24&255,_>>>16&255,_>>>8&255,_&255,D>>>24&255,D>>>16&255,D>>>8&255,D&255];return this.is224||w.push(m>>>24&255,m>>>16&255,m>>>8&255,m&255),w},M.prototype.array=M.prototype.digest,M.prototype.arrayBuffer=function(){this.finalize();var f=new ArrayBuffer(this.is224?28:32),x=new DataView(f);return x.setUint32(0,this.h0),x.setUint32(4,this.h1),x.setUint32(8,this.h2),x.setUint32(12,this.h3),x.setUint32(16,this.h4),x.setUint32(20,this.h5),x.setUint32(24,this.h6),this.is224||x.setUint32(28,this.h7),f};function J(f,x,R){var C,I=typeof f;if(I==="string"){var _=[],D=f.length,m=0,w;for(C=0;C<D;++C)w=f.charCodeAt(C),w<128?_[m++]=w:w<2048?(_[m++]=192|w>>>6,_[m++]=128|w&63):w<55296||w>=57344?(_[m++]=224|w>>>12,_[m++]=128|w>>>6&63,_[m++]=128|w&63):(w=65536+((w&1023)<<10|f.charCodeAt(++C)&1023),_[m++]=240|w>>>18,_[m++]=128|w>>>12&63,_[m++]=128|w>>>6&63,_[m++]=128|w&63);f=_}else if(I==="object"){if(f===null)throw new Error(e);if(a&&f.constructor===ArrayBuffer)f=new Uint8Array(f);else if(!Array.isArray(f)&&(!a||!ArrayBuffer.isView(f)))throw new Error(e)}else throw new Error(e);f.length>64&&(f=new M(x,!0).update(f).array());var g=[],y=[];for(C=0;C<64;++C){var N=f[C]||0;g[C]=92^N,y[C]=54^N}M.call(this,x,R),this.update(y),this.oKeyPad=g,this.inner=!0,this.sharedMemory=R}J.prototype=new M,J.prototype.finalize=function(){if(M.prototype.finalize.call(this),this.inner){this.inner=!1;var f=this.array();M.call(this,this.is224,this.sharedMemory),this.update(this.oKeyPad),this.update(f),M.prototype.finalize.call(this)}};var B=A();B.sha256=B,B.sha224=A(!0),B.sha256.hmac=W(),B.sha224.hmac=W(!0),o?n.exports=B:(s.sha256=B.sha256,s.sha224=B.sha224)})()}(Jn)),Jn.exports}var xd=Sd();const Td={apiKey:"AIzaSyCKS7tWQRYRWHsawNfN42uAmISdUbJHJJw",authDomain:"blitzout-49b39.firebaseapp.com",projectId:"blitzout-49b39",storageBucket:"blitzout-49b39.appspot.com",messagingSenderId:"852428606926",appId:"1:852428606926:web:17444e6f8dbc2f95f0ef9f",measurementId:"G-93YN1YMTQ7"},bd=ka(Td),Me=Aa(bd);async function Id(n=""){try{const e=Ft();return await La(e),await Sr(e.currentUser,{displayName:n}),e.currentUser}catch(e){return console.error(e),null}}async function qf(){try{const n=Ft();await Ma(n)}catch(n){console.error(n)}}function Gf({newRoom:n,oldRoom:e,newDisplayName:t,oldDisplayName:s,removeOnDisconnect:i=!0}){var A;const r=la(),a=(A=Ft().currentUser)==null?void 0:A.uid,l=n==null?void 0:n.toUpperCase(),c=e==null?void 0:e.toUpperCase(),h=Jt(r,`rooms/${l}/uids/${a}`),u=Jt(r,`rooms/${c}/uids/${a}`),d=Jt(r,".info/connected");let p,v;aa(d,b=>{b.val()===!0&&(p=ir(h),v=ir(u),(c!==l||s!==t)&&Qn(u),i&&(sr(v).remove(),sr(p).remove()),oa(p,{displayName:t,lastActive:Date.now()}))}),document.addEventListener("beforeunload",()=>{v&&Qn(v),p&&Qn(p)})}function Nd(n,e,t={}){const s=la(),i=Jt(s,`rooms/${n==null?void 0:n.toUpperCase()}/uids`);aa(i,r=>{const o=r.val();if(!o)return;const a=Object.keys(o).sort().join(","),l=t?Object.keys(t).sort().join(","):"";a!==l&&e(o)})}async function Rd(n=""){try{const e=Ft();return await Sr(e.currentUser,{displayName:n}),e.currentUser}catch(e){return console.error(e),null}}async function Kf(n,e){try{await En(Je(Me,"custom-actions"),{grouping:n,customAction:e,ttl:new Date(Date.now()+4*24*60*60*1e3)})}catch(t){console.error(t)}}async function kd(n){const e=ys(Je(Me,"game-boards"),vs("checksum","==",n)),t=await Fa(e);return t.size?t.docs[0]:null}async function Qf({title:n,gameBoard:e,settings:t}){if(n)try{const s=xd.sha256(e),i=await kd(s);return i?(Oa(i.ref,{ttl:new Date(Date.now()+30*24*60*60*1e3)}),i):await Ad({title:n,gameBoard:e,settings:t,checksum:s})}catch(s){console.error(s)}}async function Ad({title:n,gameBoard:e,settings:t,checksum:s}){try{return await En(Je(Me,"game-boards"),{title:n,gameBoard:e,settings:t,checksum:s,ttl:new Date(Date.now()+30*24*60*60*1e3)})}catch(i){console.error(i)}}async function Jf(n){try{const e=Er(Me,"game-boards",n),t=await Pa(e);if(t.exists())return t.data()}catch(e){console.error(e)}}let ar={};async function Xf({room:n,user:e,text:t="",type:s="chat",...i}){const r=["chat","actions","settings","room","media"];if(!r.includes(s)){let l="Invalid message type. Was expecting ";return l+=r.join(", "),l+=` but got ${s}`,console.error(l)}const o={room:n,user:e.uid,text:t,type:s,...i};if(JSON.stringify(o)===JSON.stringify(ar))return;ar=o;const a=Date.now();try{return await En(Je(Me,"chat-rooms",n==null?void 0:n.toUpperCase(),"messages"),{uid:e.uid,displayName:e.displayName,text:t.trim(),timestamp:Da(),ttl:new Date(a+24*60*60*1e3),type:s,...i})}catch(l){return console.error(l)}}async function Zf(n,e){return $a(Er(Me,`/chat-rooms/${n.toUpperCase()}/messages/${e}`))}function Md(n,e){if(!n)return;const t=new Date;return t.setHours(t.getHours()-2),xr(ys(Je(Me,"chat-rooms",n==null?void 0:n.toUpperCase(),"messages"),vs("timestamp",">",t),Tr("timestamp","asc")),s=>{const i=s.docs.map(r=>({id:r.id,...r.data()}));e(i)})}function Dd(n){return xr(ys(Je(Me,"schedule"),vs("dateTime",">",new Date),Tr("dateTime","asc")),e=>{const t=e.docs.map(s=>({id:s.id,...s.data()}));n(t)})}async function Od(n,e,t="PUBLIC"){try{return await En(Je(Me,"schedule"),{dateTime:Ua.fromDate(n),url:e,room:t})}catch(s){return console.error(s)}}const ca=rn.createContext();function ua(n){const[e,t]=rn.useState(null);async function s(o=""){const a=await Id(o);return t(a),a}async function i(o=""){const a=await Rd(o);return t(a),a}K.useEffect(()=>{Ft().onAuthStateChanged(async o=>t(o||null))},[]);const r=K.useMemo(()=>({user:e,login:s,updateUser:i}),[e]);return H.jsx(ca.Provider,{value:r,...n})}function $d(){const n=K.useContext(ca);if(n===void 0)throw new Error("useAuth must be used within an AuthProvider");return n}var Xt={exports:{}},Pd=Xt.exports,lr;function Fd(){return lr||(lr=1,function(n,e){(function(t,s){n.exports=s()})(Pd,function(){var t=1e3,s=6e4,i=36e5,r="millisecond",o="second",a="minute",l="hour",c="day",h="week",u="month",d="quarter",p="year",v="date",A="Invalid Date",b=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,O=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,W={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(w){var g=["th","st","nd","rd"],y=w%100;return"["+w+(g[(y-20)%10]||g[y]||g[0])+"]"}},M=function(w,g,y){var N=String(w);return!N||N.length>=g?w:""+Array(g+1-N.length).join(y)+w},J={s:M,z:function(w){var g=-w.utcOffset(),y=Math.abs(g),N=Math.floor(y/60),S=y%60;return(g<=0?"+":"-")+M(N,2,"0")+":"+M(S,2,"0")},m:function w(g,y){if(g.date()<y.date())return-w(y,g);var N=12*(y.year()-g.year())+(y.month()-g.month()),S=g.clone().add(N,u),T=y-S<0,k=g.clone().add(N+(T?-1:1),u);return+(-(N+(y-S)/(T?S-k:k-S))||0)},a:function(w){return w<0?Math.ceil(w)||0:Math.floor(w)},p:function(w){return{M:u,y:p,w:h,d:c,D:v,h:l,m:a,s:o,ms:r,Q:d}[w]||String(w||"").toLowerCase().replace(/s$/,"")},u:function(w){return w===void 0}},B="en",f={};f[B]=W;var x="$isDayjsObject",R=function(w){return w instanceof D||!(!w||!w[x])},C=function w(g,y,N){var S;if(!g)return B;if(typeof g=="string"){var T=g.toLowerCase();f[T]&&(S=T),y&&(f[T]=y,S=T);var k=g.split("-");if(!S&&k.length>1)return w(k[0])}else{var $=g.name;f[$]=g,S=$}return!N&&S&&(B=S),S||!N&&B},I=function(w,g){if(R(w))return w.clone();var y=typeof g=="object"?g:{};return y.date=w,y.args=arguments,new D(y)},_=J;_.l=C,_.i=R,_.w=function(w,g){return I(w,{locale:g.$L,utc:g.$u,x:g.$x,$offset:g.$offset})};var D=function(){function w(y){this.$L=C(y.locale,null,!0),this.parse(y),this.$x=this.$x||y.x||{},this[x]=!0}var g=w.prototype;return g.parse=function(y){this.$d=function(N){var S=N.date,T=N.utc;if(S===null)return new Date(NaN);if(_.u(S))return new Date;if(S instanceof Date)return new Date(S);if(typeof S=="string"&&!/Z$/i.test(S)){var k=S.match(b);if(k){var $=k[2]-1||0,j=(k[7]||"0").substring(0,3);return T?new Date(Date.UTC(k[1],$,k[3]||1,k[4]||0,k[5]||0,k[6]||0,j)):new Date(k[1],$,k[3]||1,k[4]||0,k[5]||0,k[6]||0,j)}}return new Date(S)}(y),this.init()},g.init=function(){var y=this.$d;this.$y=y.getFullYear(),this.$M=y.getMonth(),this.$D=y.getDate(),this.$W=y.getDay(),this.$H=y.getHours(),this.$m=y.getMinutes(),this.$s=y.getSeconds(),this.$ms=y.getMilliseconds()},g.$utils=function(){return _},g.isValid=function(){return this.$d.toString()!==A},g.isSame=function(y,N){var S=I(y);return this.startOf(N)<=S&&S<=this.endOf(N)},g.isAfter=function(y,N){return I(y)<this.startOf(N)},g.isBefore=function(y,N){return this.endOf(N)<I(y)},g.$g=function(y,N,S){return _.u(y)?this[N]:this.set(S,y)},g.unix=function(){return Math.floor(this.valueOf()/1e3)},g.valueOf=function(){return this.$d.getTime()},g.startOf=function(y,N){var S=this,T=!!_.u(N)||N,k=_.p(y),$=function(Se,le){var _e=_.w(S.$u?Date.UTC(S.$y,le,Se):new Date(S.$y,le,Se),S);return T?_e:_e.endOf(c)},j=function(Se,le){return _.w(S.toDate()[Se].apply(S.toDate("s"),(T?[0,0,0,0]:[23,59,59,999]).slice(le)),S)},z=this.$W,Z=this.$M,ne=this.$D,De="set"+(this.$u?"UTC":"");switch(k){case p:return T?$(1,0):$(31,11);case u:return T?$(1,Z):$(0,Z+1);case h:var Te=this.$locale().weekStart||0,Be=(z<Te?z+7:z)-Te;return $(T?ne-Be:ne+(6-Be),Z);case c:case v:return j(De+"Hours",0);case l:return j(De+"Minutes",1);case a:return j(De+"Seconds",2);case o:return j(De+"Milliseconds",3);default:return this.clone()}},g.endOf=function(y){return this.startOf(y,!1)},g.$set=function(y,N){var S,T=_.p(y),k="set"+(this.$u?"UTC":""),$=(S={},S[c]=k+"Date",S[v]=k+"Date",S[u]=k+"Month",S[p]=k+"FullYear",S[l]=k+"Hours",S[a]=k+"Minutes",S[o]=k+"Seconds",S[r]=k+"Milliseconds",S)[T],j=T===c?this.$D+(N-this.$W):N;if(T===u||T===p){var z=this.clone().set(v,1);z.$d[$](j),z.init(),this.$d=z.set(v,Math.min(this.$D,z.daysInMonth())).$d}else $&&this.$d[$](j);return this.init(),this},g.set=function(y,N){return this.clone().$set(y,N)},g.get=function(y){return this[_.p(y)]()},g.add=function(y,N){var S,T=this;y=Number(y);var k=_.p(N),$=function(Z){var ne=I(T);return _.w(ne.date(ne.date()+Math.round(Z*y)),T)};if(k===u)return this.set(u,this.$M+y);if(k===p)return this.set(p,this.$y+y);if(k===c)return $(1);if(k===h)return $(7);var j=(S={},S[a]=s,S[l]=i,S[o]=t,S)[k]||1,z=this.$d.getTime()+y*j;return _.w(z,this)},g.subtract=function(y,N){return this.add(-1*y,N)},g.format=function(y){var N=this,S=this.$locale();if(!this.isValid())return S.invalidDate||A;var T=y||"YYYY-MM-DDTHH:mm:ssZ",k=_.z(this),$=this.$H,j=this.$m,z=this.$M,Z=S.weekdays,ne=S.months,De=S.meridiem,Te=function(le,_e,be,Oe){return le&&(le[_e]||le(N,T))||be[_e].slice(0,Oe)},Be=function(le){return _.s($%12||12,le,"0")},Se=De||function(le,_e,be){var Oe=le<12?"AM":"PM";return be?Oe.toLowerCase():Oe};return T.replace(O,function(le,_e){return _e||function(be){switch(be){case"YY":return String(N.$y).slice(-2);case"YYYY":return _.s(N.$y,4,"0");case"M":return z+1;case"MM":return _.s(z+1,2,"0");case"MMM":return Te(S.monthsShort,z,ne,3);case"MMMM":return Te(ne,z);case"D":return N.$D;case"DD":return _.s(N.$D,2,"0");case"d":return String(N.$W);case"dd":return Te(S.weekdaysMin,N.$W,Z,2);case"ddd":return Te(S.weekdaysShort,N.$W,Z,3);case"dddd":return Z[N.$W];case"H":return String($);case"HH":return _.s($,2,"0");case"h":return Be(1);case"hh":return Be(2);case"a":return Se($,j,!0);case"A":return Se($,j,!1);case"m":return String(j);case"mm":return _.s(j,2,"0");case"s":return String(N.$s);case"ss":return _.s(N.$s,2,"0");case"SSS":return _.s(N.$ms,3,"0");case"Z":return k}return null}(le)||k.replace(":","")})},g.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},g.diff=function(y,N,S){var T,k=this,$=_.p(N),j=I(y),z=(j.utcOffset()-this.utcOffset())*s,Z=this-j,ne=function(){return _.m(k,j)};switch($){case p:T=ne()/12;break;case u:T=ne();break;case d:T=ne()/3;break;case h:T=(Z-z)/6048e5;break;case c:T=(Z-z)/864e5;break;case l:T=Z/i;break;case a:T=Z/s;break;case o:T=Z/t;break;default:T=Z}return S?T:_.a(T)},g.daysInMonth=function(){return this.endOf(u).$D},g.$locale=function(){return f[this.$L]},g.locale=function(y,N){if(!y)return this.$L;var S=this.clone(),T=C(y,N,!0);return T&&(S.$L=T),S},g.clone=function(){return _.w(this.$d,this)},g.toDate=function(){return new Date(this.valueOf())},g.toJSON=function(){return this.isValid()?this.toISOString():null},g.toISOString=function(){return this.$d.toISOString()},g.toString=function(){return this.$d.toUTCString()},w}(),m=D.prototype;return I.prototype=m,[["$ms",r],["$s",o],["$m",a],["$H",l],["$W",c],["$M",u],["$y",p],["$D",v]].forEach(function(w){m[w[1]]=function(g){return this.$g(g,w[0],w[1])}}),I.extend=function(w,g){return w.$i||(w(g,D,I),w.$i=!0),I},I.locale=C,I.isDayjs=R,I.unix=function(w){return I(1e3*w)},I.en=f[B],I.Ls=f,I.p={},I})}(Xt)),Xt.exports}var Ld=Fd();const se=Qe(Ld);var Zt={exports:{}},Ud=Zt.exports,cr;function Wd(){return cr||(cr=1,function(n,e){(function(t,s){n.exports=s()})(Ud,function(){var t="week",s="year";return function(i,r,o){var a=r.prototype;a.week=function(l){if(l===void 0&&(l=null),l!==null)return this.add(7*(l-this.week()),"day");var c=this.$locale().yearStart||1;if(this.month()===11&&this.date()>25){var h=o(this).startOf(s).add(1,s).date(c),u=o(this).endOf(t);if(h.isBefore(u))return 1}var d=o(this).startOf(s).date(c).startOf(t).subtract(1,"millisecond"),p=this.diff(d,t,!0);return p<0?o(this).startOf("week").week():Math.ceil(p)},a.weeks=function(l){return l===void 0&&(l=null),this.week(l)}}})}(Zt)),Zt.exports}var Bd=Wd();const Hd=Qe(Bd);var en={exports:{}},jd=en.exports,ur;function Yd(){return ur||(ur=1,function(n,e){(function(t,s){n.exports=s()})(jd,function(){var t={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},s=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,i=/\d/,r=/\d\d/,o=/\d\d?/,a=/\d*[^-_:/,()\s\d]+/,l={},c=function(b){return(b=+b)+(b>68?1900:2e3)},h=function(b){return function(O){this[b]=+O}},u=[/[+-]\d\d:?(\d\d)?|Z/,function(b){(this.zone||(this.zone={})).offset=function(O){if(!O||O==="Z")return 0;var W=O.match(/([+-]|\d\d)/g),M=60*W[1]+(+W[2]||0);return M===0?0:W[0]==="+"?-M:M}(b)}],d=function(b){var O=l[b];return O&&(O.indexOf?O:O.s.concat(O.f))},p=function(b,O){var W,M=l.meridiem;if(M){for(var J=1;J<=24;J+=1)if(b.indexOf(M(J,0,O))>-1){W=J>12;break}}else W=b===(O?"pm":"PM");return W},v={A:[a,function(b){this.afternoon=p(b,!1)}],a:[a,function(b){this.afternoon=p(b,!0)}],Q:[i,function(b){this.month=3*(b-1)+1}],S:[i,function(b){this.milliseconds=100*+b}],SS:[r,function(b){this.milliseconds=10*+b}],SSS:[/\d{3}/,function(b){this.milliseconds=+b}],s:[o,h("seconds")],ss:[o,h("seconds")],m:[o,h("minutes")],mm:[o,h("minutes")],H:[o,h("hours")],h:[o,h("hours")],HH:[o,h("hours")],hh:[o,h("hours")],D:[o,h("day")],DD:[r,h("day")],Do:[a,function(b){var O=l.ordinal,W=b.match(/\d+/);if(this.day=W[0],O)for(var M=1;M<=31;M+=1)O(M).replace(/\[|\]/g,"")===b&&(this.day=M)}],w:[o,h("week")],ww:[r,h("week")],M:[o,h("month")],MM:[r,h("month")],MMM:[a,function(b){var O=d("months"),W=(d("monthsShort")||O.map(function(M){return M.slice(0,3)})).indexOf(b)+1;if(W<1)throw new Error;this.month=W%12||W}],MMMM:[a,function(b){var O=d("months").indexOf(b)+1;if(O<1)throw new Error;this.month=O%12||O}],Y:[/[+-]?\d+/,h("year")],YY:[r,function(b){this.year=c(b)}],YYYY:[/\d{4}/,h("year")],Z:u,ZZ:u};function A(b){var O,W;O=b,W=l&&l.formats;for(var M=(b=O.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(I,_,D){var m=D&&D.toUpperCase();return _||W[D]||t[D]||W[m].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(w,g,y){return g||y.slice(1)})})).match(s),J=M.length,B=0;B<J;B+=1){var f=M[B],x=v[f],R=x&&x[0],C=x&&x[1];M[B]=C?{regex:R,parser:C}:f.replace(/^\[|\]$/g,"")}return function(I){for(var _={},D=0,m=0;D<J;D+=1){var w=M[D];if(typeof w=="string")m+=w.length;else{var g=w.regex,y=w.parser,N=I.slice(m),S=g.exec(N)[0];y.call(_,S),I=I.replace(S,"")}}return function(T){var k=T.afternoon;if(k!==void 0){var $=T.hours;k?$<12&&(T.hours+=12):$===12&&(T.hours=0),delete T.afternoon}}(_),_}}return function(b,O,W){W.p.customParseFormat=!0,b&&b.parseTwoDigitYear&&(c=b.parseTwoDigitYear);var M=O.prototype,J=M.parse;M.parse=function(B){var f=B.date,x=B.utc,R=B.args;this.$u=x;var C=R[1];if(typeof C=="string"){var I=R[2]===!0,_=R[3]===!0,D=I||_,m=R[2];_&&(m=R[2]),l=this.$locale(),!I&&m&&(l=W.Ls[m]),this.$d=function(N,S,T,k){try{if(["x","X"].indexOf(S)>-1)return new Date((S==="X"?1e3:1)*N);var $=A(S)(N),j=$.year,z=$.month,Z=$.day,ne=$.hours,De=$.minutes,Te=$.seconds,Be=$.milliseconds,Se=$.zone,le=$.week,_e=new Date,be=Z||(j||z?1:_e.getDate()),Oe=j||_e.getFullYear(),jt=0;j&&!z||(jt=z>0?z-1:_e.getMonth());var Yt,Fn=ne||0,Ln=De||0,Un=Te||0,Wn=Be||0;return Se?new Date(Date.UTC(Oe,jt,be,Fn,Ln,Un,Wn+60*Se.offset*1e3)):T?new Date(Date.UTC(Oe,jt,be,Fn,Ln,Un,Wn)):(Yt=new Date(Oe,jt,be,Fn,Ln,Un,Wn),le&&(Yt=k(Yt).week(le).toDate()),Yt)}catch{return new Date("")}}(f,C,x,W),this.init(),m&&m!==!0&&(this.$L=this.locale(m).$L),D&&f!=this.format(C)&&(this.$d=new Date("")),l={}}else if(C instanceof Array)for(var w=C.length,g=1;g<=w;g+=1){R[1]=C[g-1];var y=W.apply(this,R);if(y.isValid()){this.$d=y.$d,this.$L=y.$L,this.init();break}g===w&&(this.$d=new Date(""))}else J.call(this,B)}}})}(en)),en.exports}var Vd=Yd();const zd=Qe(Vd);var tn={exports:{}},qd=tn.exports,hr;function Gd(){return hr||(hr=1,function(n,e){(function(t,s){n.exports=s()})(qd,function(){var t={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"};return function(s,i,r){var o=i.prototype,a=o.format;r.en.formats=t,o.format=function(l){l===void 0&&(l="YYYY-MM-DDTHH:mm:ssZ");var c=this.$locale().formats,h=function(u,d){return u.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(p,v,A){var b=A&&A.toUpperCase();return v||d[A]||t[A]||d[b].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(O,W,M){return W||M.slice(1)})})}(l,c===void 0?{}:c);return a.call(this,h)}}})}(tn)),tn.exports}var Kd=Gd();const Qd=Qe(Kd);var nn={exports:{}},Jd=nn.exports,dr;function Xd(){return dr||(dr=1,function(n,e){(function(t,s){n.exports=s()})(Jd,function(){return function(t,s,i){s.prototype.isBetween=function(r,o,a,l){var c=i(r),h=i(o),u=(l=l||"()")[0]==="(",d=l[1]===")";return(u?this.isAfter(c,a):!this.isBefore(c,a))&&(d?this.isBefore(h,a):!this.isAfter(h,a))||(u?this.isBefore(c,a):!this.isAfter(c,a))&&(d?this.isAfter(h,a):!this.isBefore(h,a))}}})}(nn)),nn.exports}var Zd=Xd();const ef=Qe(Zd);var sn={exports:{}},tf=sn.exports,fr;function nf(){return fr||(fr=1,function(n,e){(function(t,s){n.exports=s()})(tf,function(){return function(t,s){var i=s.prototype,r=i.format;i.format=function(o){var a=this,l=this.$locale();if(!this.isValid())return r.bind(this)(o);var c=this.$utils(),h=(o||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(u){switch(u){case"Q":return Math.ceil((a.$M+1)/3);case"Do":return l.ordinal(a.$D);case"gggg":return a.weekYear();case"GGGG":return a.isoWeekYear();case"wo":return l.ordinal(a.week(),"W");case"w":case"ww":return c.s(a.week(),u==="w"?1:2,"0");case"W":case"WW":return c.s(a.isoWeek(),u==="W"?1:2,"0");case"k":case"kk":return c.s(String(a.$H===0?24:a.$H),u==="k"?1:2,"0");case"X":return Math.floor(a.$d.getTime()/1e3);case"x":return a.$d.getTime();case"z":return"["+a.offsetName()+"]";case"zzz":return"["+a.offsetName("long")+"]";default:return u}});return r.bind(this)(h)}}})}(sn)),sn.exports}var sf=nf();const rf=Qe(sf);se.extend(Qd);se.extend(Hd);se.extend(ef);se.extend(rf);const of={YY:"year",YYYY:{sectionType:"year",contentType:"digit",maxLength:4},M:{sectionType:"month",contentType:"digit",maxLength:2},MM:"month",MMM:{sectionType:"month",contentType:"letter"},MMMM:{sectionType:"month",contentType:"letter"},D:{sectionType:"day",contentType:"digit",maxLength:2},DD:"day",Do:{sectionType:"day",contentType:"digit-with-letter"},d:{sectionType:"weekDay",contentType:"digit",maxLength:2},dd:{sectionType:"weekDay",contentType:"letter"},ddd:{sectionType:"weekDay",contentType:"letter"},dddd:{sectionType:"weekDay",contentType:"letter"},A:"meridiem",a:"meridiem",H:{sectionType:"hours",contentType:"digit",maxLength:2},HH:"hours",h:{sectionType:"hours",contentType:"digit",maxLength:2},hh:"hours",m:{sectionType:"minutes",contentType:"digit",maxLength:2},mm:"minutes",s:{sectionType:"seconds",contentType:"digit",maxLength:2},ss:"seconds"},af={year:"YYYY",month:"MMMM",monthShort:"MMM",dayOfMonth:"D",dayOfMonthFull:"Do",weekday:"dddd",weekdayShort:"dd",hours24h:"HH",hours12h:"hh",meridiem:"A",minutes:"mm",seconds:"ss",fullDate:"ll",keyboardDate:"L",shortDate:"MMM D",normalDate:"D MMMM",normalDateWithWeekday:"ddd, MMM D",fullTime:"LT",fullTime12h:"hh:mm A",fullTime24h:"HH:mm",keyboardDateTime:"L LT",keyboardDateTime12h:"L hh:mm A",keyboardDateTime24h:"L HH:mm"},Xn=["Missing UTC plugin","To be able to use UTC or timezones, you have to enable the `utc` plugin","Find more information on https://mui.com/x/react-date-pickers/timezone/#day-js-and-utc"].join(`
`),pr=["Missing timezone plugin","To be able to use timezones, you have to enable both the `utc` and the `timezone` plugin","Find more information on https://mui.com/x/react-date-pickers/timezone/#day-js-and-timezone"].join(`
`),lf=(n,e)=>e?(...t)=>n(...t).locale(e):n;class cf{constructor({locale:e,formats:t}={}){this.isMUIAdapter=!0,this.isTimezoneCompatible=!0,this.lib="dayjs",this.dayjs=void 0,this.locale=void 0,this.formats=void 0,this.escapedCharacters={start:"[",end:"]"},this.formatTokenMap=of,this.setLocaleToValue=s=>{const i=this.getCurrentLocaleCode();return i===s.locale()?s:s.locale(i)},this.hasUTCPlugin=()=>typeof se.utc<"u",this.hasTimezonePlugin=()=>typeof se.tz<"u",this.isSame=(s,i,r)=>{const o=this.setTimezone(i,this.getTimezone(s));return s.format(r)===o.format(r)},this.cleanTimezone=s=>{switch(s){case"default":return;case"system":return se.tz.guess();default:return s}},this.createSystemDate=s=>{if(this.hasUTCPlugin()&&this.hasTimezonePlugin()){const i=se.tz.guess();return i!=="UTC"?se.tz(s,i):se(s)}return se(s)},this.createUTCDate=s=>{if(!this.hasUTCPlugin())throw new Error(Xn);return se.utc(s)},this.createTZDate=(s,i)=>{if(!this.hasUTCPlugin())throw new Error(Xn);if(!this.hasTimezonePlugin())throw new Error(pr);const r=s!==void 0&&!s.endsWith("Z");return se(s).tz(this.cleanTimezone(i),r)},this.getLocaleFormats=()=>{const s=se.Ls,i=this.locale||"en";let r=s[i];return r===void 0&&(r=s.en),r.formats},this.adjustOffset=s=>{if(!this.hasTimezonePlugin())return s;const i=this.getTimezone(s);if(i!=="UTC"){const r=s.tz(this.cleanTimezone(i),!0);if(r.$offset===(s.$offset??0))return s;s.$offset=r.$offset}return s},this.date=(s,i="default")=>{if(s===null)return null;let r;return i==="UTC"?r=this.createUTCDate(s):i==="system"||i==="default"&&!this.hasTimezonePlugin()?r=this.createSystemDate(s):r=this.createTZDate(s,i),this.locale===void 0?r:r.locale(this.locale)},this.getInvalidDate=()=>se(new Date("Invalid date")),this.getTimezone=s=>{var i;if(this.hasTimezonePlugin()){const r=(i=s.$x)==null?void 0:i.$timezone;if(r)return r}return this.hasUTCPlugin()&&s.isUTC()?"UTC":"system"},this.setTimezone=(s,i)=>{if(this.getTimezone(s)===i)return s;if(i==="UTC"){if(!this.hasUTCPlugin())throw new Error(Xn);return s.utc()}if(i==="system")return s.local();if(!this.hasTimezonePlugin()){if(i==="default")return s;throw new Error(pr)}return se.tz(s,this.cleanTimezone(i))},this.toJsDate=s=>s.toDate(),this.parse=(s,i)=>s===""?null:this.dayjs(s,i,this.locale,!0),this.getCurrentLocaleCode=()=>this.locale||"en",this.is12HourCycleInCurrentLocale=()=>/A|a/.test(this.getLocaleFormats().LT||""),this.expandFormat=s=>{const i=this.getLocaleFormats(),r=o=>o.replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(a,l,c)=>l||c.slice(1));return s.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(o,a,l)=>{const c=l&&l.toUpperCase();return a||i[l]||r(i[c])})},this.isValid=s=>s==null?!1:s.isValid(),this.format=(s,i)=>this.formatByString(s,this.formats[i]),this.formatByString=(s,i)=>this.dayjs(s).format(i),this.formatNumber=s=>s,this.isEqual=(s,i)=>s===null&&i===null?!0:s===null||i===null?!1:s.toDate().getTime()===i.toDate().getTime(),this.isSameYear=(s,i)=>this.isSame(s,i,"YYYY"),this.isSameMonth=(s,i)=>this.isSame(s,i,"YYYY-MM"),this.isSameDay=(s,i)=>this.isSame(s,i,"YYYY-MM-DD"),this.isSameHour=(s,i)=>s.isSame(i,"hour"),this.isAfter=(s,i)=>s>i,this.isAfterYear=(s,i)=>this.hasUTCPlugin()?!this.isSameYear(s,i)&&s.utc()>i.utc():s.isAfter(i,"year"),this.isAfterDay=(s,i)=>this.hasUTCPlugin()?!this.isSameDay(s,i)&&s.utc()>i.utc():s.isAfter(i,"day"),this.isBefore=(s,i)=>s<i,this.isBeforeYear=(s,i)=>this.hasUTCPlugin()?!this.isSameYear(s,i)&&s.utc()<i.utc():s.isBefore(i,"year"),this.isBeforeDay=(s,i)=>this.hasUTCPlugin()?!this.isSameDay(s,i)&&s.utc()<i.utc():s.isBefore(i,"day"),this.isWithinRange=(s,[i,r])=>s>=i&&s<=r,this.startOfYear=s=>this.adjustOffset(s.startOf("year")),this.startOfMonth=s=>this.adjustOffset(s.startOf("month")),this.startOfWeek=s=>this.adjustOffset(this.setLocaleToValue(s).startOf("week")),this.startOfDay=s=>this.adjustOffset(s.startOf("day")),this.endOfYear=s=>this.adjustOffset(s.endOf("year")),this.endOfMonth=s=>this.adjustOffset(s.endOf("month")),this.endOfWeek=s=>this.adjustOffset(this.setLocaleToValue(s).endOf("week")),this.endOfDay=s=>this.adjustOffset(s.endOf("day")),this.addYears=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"year"):s.add(i,"year")),this.addMonths=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"month"):s.add(i,"month")),this.addWeeks=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"week"):s.add(i,"week")),this.addDays=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"day"):s.add(i,"day")),this.addHours=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"hour"):s.add(i,"hour")),this.addMinutes=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"minute"):s.add(i,"minute")),this.addSeconds=(s,i)=>this.adjustOffset(i<0?s.subtract(Math.abs(i),"second"):s.add(i,"second")),this.getYear=s=>s.year(),this.getMonth=s=>s.month(),this.getDate=s=>s.date(),this.getHours=s=>s.hour(),this.getMinutes=s=>s.minute(),this.getSeconds=s=>s.second(),this.getMilliseconds=s=>s.millisecond(),this.setYear=(s,i)=>this.adjustOffset(s.set("year",i)),this.setMonth=(s,i)=>this.adjustOffset(s.set("month",i)),this.setDate=(s,i)=>this.adjustOffset(s.set("date",i)),this.setHours=(s,i)=>this.adjustOffset(s.set("hour",i)),this.setMinutes=(s,i)=>this.adjustOffset(s.set("minute",i)),this.setSeconds=(s,i)=>this.adjustOffset(s.set("second",i)),this.setMilliseconds=(s,i)=>this.adjustOffset(s.set("millisecond",i)),this.getDaysInMonth=s=>s.daysInMonth(),this.getWeekArray=s=>{const i=this.startOfWeek(this.startOfMonth(s)),r=this.endOfWeek(this.endOfMonth(s));let o=0,a=i;const l=[];for(;a<r;){const c=Math.floor(o/7);l[c]=l[c]||[],l[c].push(a),a=this.addDays(a,1),o+=1}return l},this.getWeekNumber=s=>s.week(),this.getYearRange=([s,i])=>{const r=this.startOfYear(s),o=this.endOfYear(i),a=[];let l=r;for(;this.isBefore(l,o);)a.push(l),l=this.addYears(l,1);return a},this.dayjs=lf(se,e),this.locale=e,this.formats=wr({},af,t),se.extend(zd)}getDayOfWeek(e){return e.day()+1}}function uf(n){return n.sort((e,t)=>e.timestamp.toDate()-t.timestamp.toDate())}function Pn(n){return JSON.parse(JSON.stringify(n)).reverse()}function ep(n,e){return Pn(n).find(t=>t.type===e)}function tp(n,e,t="ASC"){let s=Pn(n);return t==="DESC"&&(s=s.reverse()),s.filter(i=>i.type===e)}function np(n,e){return Pn(n).find(e)}function sp(n){return Pn(n)[0]}const hf=K.createContext();function df(n){const[e,t]=K.useState([]),[s,i]=K.useState(!0),{id:r}=Cr();K.useEffect(()=>(i(!0),Md(r,l=>{const c=uf(l);t(c),i(!1)})),[r]);const o={messages:e,isLoading:s};return H.jsx(hf.Provider,{value:o,...n})}const ff=K.createContext();function pf(n){const{id:e}=Cr(),[t,s]=K.useState({});K.useEffect(()=>{Nd(e,r=>s(r),t)},[e]);const i=K.useMemo(()=>({onlineUsers:t}),[t]);return H.jsx(ff.Provider,{value:i,...n})}const _f=K.createContext();function mf(n){const[e,t]=K.useState({});K.useEffect(()=>{Dd(i=>t(i))},[]);const s=K.useMemo(()=>({schedule:e,addToSchedule:Od}),[e]);return H.jsx(_f.Provider,{value:s,...n})}let gs=ma({palette:{mode:"dark"}});gs=ga(gs);const gf=gs,yf=K.lazy(()=>me(()=>import("./index-BtDTbazQ.js"),__vite__mapDeps([9,1,2,10,4,11,12,13,3,14,15]))),vf=K.lazy(()=>me(()=>import("./index-mGfjpset.js"),__vite__mapDeps([16,1,2,17,4,11,18,19,3,20]))),wf=K.lazy(()=>me(()=>import("./index-KFk9mW72.js"),__vite__mapDeps([21,1,2,17,4,11,22,10,12,23,24,25,19,26,18,3,27])));function _r({children:n}){return H.jsx(ua,{children:H.jsx(pf,{children:H.jsx(mf,{children:H.jsx(df,{children:n})})})})}function Cf(){const{user:n}=$d(),e=n?H.jsx(wf,{}):H.jsx(yf,{});return H.jsxs(xa,{future:{v7_startTransition:!0},children:[H.jsx(Bn,{path:"/",element:H.jsx(Ta,{replace:!0,to:"/public"})}),H.jsx(Bn,{path:"/:id/cast",element:H.jsx(_r,{children:H.jsx(K.Suspense,{fallback:H.jsx("div",{children:"Loading..."}),children:H.jsx(vf,{})})})}),H.jsx(Bn,{path:"/:id",element:H.jsx(_r,{children:H.jsx(K.Suspense,{fallback:H.jsx("div",{children:"Loading..."}),children:e})})})]})}function Ef(){return H.jsxs(ya,{theme:gf,children:[H.jsx(va,{}),H.jsx(Ol,{dateAdapter:cf,children:H.jsx(Sa,{children:H.jsx(Cf,{})})})]})}const Sf=(n,e,t)=>{const s=n[e];return s?typeof s=="function"?s():Promise.resolve(s):new Promise((i,r)=>{(typeof queueMicrotask=="function"?queueMicrotask:setTimeout)(r.bind(null,new Error("Unknown variable dynamic import: "+e+(e.split("/").length!==t?". Note that variables only represent file names one level deep.":""))))})};var xf=function(e){return{type:"backend",init:function(s,i,r){},read:function(s,i,r){if(typeof e=="function"){if(e.length<3){try{var o=e(s,i);o&&typeof o.then=="function"?o.then(function(a){return r(null,a&&a.default||a)}).catch(r):r(null,o)}catch(a){r(a)}return}e(s,i,r);return}r(null,e&&e[s]&&e[s][i])}}};const{slice:Tf,forEach:bf}=[];function If(n){return bf.call(Tf.call(arguments,1),e=>{if(e)for(const t in e)n[t]===void 0&&(n[t]=e[t])}),n}const mr=/^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,Nf=function(n,e){const s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{path:"/"},i=encodeURIComponent(e);let r=`${n}=${i}`;if(s.maxAge>0){const o=s.maxAge-0;if(Number.isNaN(o))throw new Error("maxAge should be a Number");r+=`; Max-Age=${Math.floor(o)}`}if(s.domain){if(!mr.test(s.domain))throw new TypeError("option domain is invalid");r+=`; Domain=${s.domain}`}if(s.path){if(!mr.test(s.path))throw new TypeError("option path is invalid");r+=`; Path=${s.path}`}if(s.expires){if(typeof s.expires.toUTCString!="function")throw new TypeError("option expires is invalid");r+=`; Expires=${s.expires.toUTCString()}`}if(s.httpOnly&&(r+="; HttpOnly"),s.secure&&(r+="; Secure"),s.sameSite)switch(typeof s.sameSite=="string"?s.sameSite.toLowerCase():s.sameSite){case!0:r+="; SameSite=Strict";break;case"lax":r+="; SameSite=Lax";break;case"strict":r+="; SameSite=Strict";break;case"none":r+="; SameSite=None";break;default:throw new TypeError("option sameSite is invalid")}return r},gr={create(n,e,t,s){let i=arguments.length>4&&arguments[4]!==void 0?arguments[4]:{path:"/",sameSite:"strict"};t&&(i.expires=new Date,i.expires.setTime(i.expires.getTime()+t*60*1e3)),s&&(i.domain=s),document.cookie=Nf(n,encodeURIComponent(e),i)},read(n){const e=`${n}=`,t=document.cookie.split(";");for(let s=0;s<t.length;s++){let i=t[s];for(;i.charAt(0)===" ";)i=i.substring(1,i.length);if(i.indexOf(e)===0)return i.substring(e.length,i.length)}return null},remove(n){this.create(n,"",-1)}};var Rf={name:"cookie",lookup(n){let{lookupCookie:e}=n;if(e&&typeof document<"u")return gr.read(e)||void 0},cacheUserLanguage(n,e){let{lookupCookie:t,cookieMinutes:s,cookieDomain:i,cookieOptions:r}=e;t&&typeof document<"u"&&gr.create(t,n,s,i,r)}},kf={name:"querystring",lookup(n){var s;let{lookupQuerystring:e}=n,t;if(typeof window<"u"){let{search:i}=window.location;!window.location.search&&((s=window.location.hash)==null?void 0:s.indexOf("?"))>-1&&(i=window.location.hash.substring(window.location.hash.indexOf("?")));const o=i.substring(1).split("&");for(let a=0;a<o.length;a++){const l=o[a].indexOf("=");l>0&&o[a].substring(0,l)===e&&(t=o[a].substring(l+1))}}return t}};let nt=null;const yr=()=>{if(nt!==null)return nt;try{if(nt=typeof window<"u"&&window.localStorage!==null,!nt)return!1;const n="i18next.translate.boo";window.localStorage.setItem(n,"foo"),window.localStorage.removeItem(n)}catch{nt=!1}return nt};var Af={name:"localStorage",lookup(n){let{lookupLocalStorage:e}=n;if(e&&yr())return window.localStorage.getItem(e)||void 0},cacheUserLanguage(n,e){let{lookupLocalStorage:t}=e;t&&yr()&&window.localStorage.setItem(t,n)}};let st=null;const vr=()=>{if(st!==null)return st;try{if(st=typeof window<"u"&&window.sessionStorage!==null,!st)return!1;const n="i18next.translate.boo";window.sessionStorage.setItem(n,"foo"),window.sessionStorage.removeItem(n)}catch{st=!1}return st};var Mf={name:"sessionStorage",lookup(n){let{lookupSessionStorage:e}=n;if(e&&vr())return window.sessionStorage.getItem(e)||void 0},cacheUserLanguage(n,e){let{lookupSessionStorage:t}=e;t&&vr()&&window.sessionStorage.setItem(t,n)}},Df={name:"navigator",lookup(n){const e=[];if(typeof navigator<"u"){const{languages:t,userLanguage:s,language:i}=navigator;if(t)for(let r=0;r<t.length;r++)e.push(t[r]);s&&e.push(s),i&&e.push(i)}return e.length>0?e:void 0}},Of={name:"htmlTag",lookup(n){let{htmlTag:e}=n,t;const s=e||(typeof document<"u"?document.documentElement:null);return s&&typeof s.getAttribute=="function"&&(t=s.getAttribute("lang")),t}},$f={name:"path",lookup(n){var i;let{lookupFromPathIndex:e}=n;if(typeof window>"u")return;const t=window.location.pathname.match(/\/([a-zA-Z-]*)/g);return Array.isArray(t)?(i=t[typeof e=="number"?e:0])==null?void 0:i.replace("/",""):void 0}},Pf={name:"subdomain",lookup(n){var i,r;let{lookupFromSubdomainIndex:e}=n;const t=typeof e=="number"?e+1:1,s=typeof window<"u"&&((r=(i=window.location)==null?void 0:i.hostname)==null?void 0:r.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i));if(s)return s[t]}};let ha=!1;try{document.cookie,ha=!0}catch{}const da=["querystring","cookie","localStorage","sessionStorage","navigator","htmlTag"];ha||da.splice(1,1);const Ff=()=>({order:da,lookupQuerystring:"lng",lookupCookie:"i18next",lookupLocalStorage:"i18nextLng",lookupSessionStorage:"i18nextLng",caches:["localStorage"],excludeCacheFor:["cimode"],convertDetectedLanguage:n=>n});class fa{constructor(e){let t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};this.type="languageDetector",this.detectors={},this.init(e,t)}init(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{languageUtils:{}},t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},s=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{};this.services=e,this.options=If(t,this.options||{},Ff()),typeof this.options.convertDetectedLanguage=="string"&&this.options.convertDetectedLanguage.indexOf("15897")>-1&&(this.options.convertDetectedLanguage=i=>i.replace("-","_")),this.options.lookupFromUrlIndex&&(this.options.lookupFromPathIndex=this.options.lookupFromUrlIndex),this.i18nOptions=s,this.addDetector(Rf),this.addDetector(kf),this.addDetector(Af),this.addDetector(Mf),this.addDetector(Df),this.addDetector(Of),this.addDetector($f),this.addDetector(Pf)}addDetector(e){return this.detectors[e.name]=e,this}detect(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:this.options.order,t=[];return e.forEach(s=>{if(this.detectors[s]){let i=this.detectors[s].lookup(this.options);i&&typeof i=="string"&&(i=[i]),i&&(t=t.concat(i))}}),t=t.map(s=>this.options.convertDetectedLanguage(s)),this.services&&this.services.languageUtils&&this.services.languageUtils.getBestMatchFromCodes?t:t.length>0?t[0]:null}cacheUserLanguage(e){let t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:this.options.caches;t&&(this.options.excludeCacheFor&&this.options.excludeCacheFor.indexOf(e)>-1||t.forEach(s=>{this.detectors[s]&&this.detectors[s].cacheUserLanguage(e,this.options)}))}}fa.type="languageDetector";Wa.use(Ba).use(fa).use(xf((n,e)=>Sf(Object.assign({"./locales/en/translation.json":()=>me(()=>import("./translation-DmoOA0DP.js"),[]),"./locales/es/translation.json":()=>me(()=>import("./translation-CUREdkBQ.js"),[]),"./locales/fr/translation.json":()=>me(()=>import("./translation-BJmtK5SE.js"),[])}),`./locales/${n}/${e}.json`,4))).init({fallbackLng:"en",supportedLngs:["en","es","fr"],ns:["translation","errors"],defaultNS:"translation",interpolation:{escapeValue:!1},react:{useSuspense:!0},detection:{order:["querystring","cookie","localStorage","navigator","htmlTag"],caches:["localStorage","cookie"]}});const Lf=Ml.createRoot(document.getElementById("root"));Lf.render(H.jsx(rn.StrictMode,{children:H.jsx(ua,{children:H.jsx(rn.Suspense,{fallback:"loading",children:H.jsx(Ef,{})})})}));Rl();export{Xa as H,Ol as L,hf as M,_f as S,ff as U,me as _,np as a,sp as b,Gf as c,Zf as d,qf as e,tl as f,Jf as g,Ja as h,Yf as i,Vf as j,gi as k,ep as l,se as m,Qf as n,tp as o,Kf as p,zf as r,Xf as s,$d as u};
