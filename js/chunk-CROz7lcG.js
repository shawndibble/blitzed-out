!function(){try{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{}).SENTRY_RELEASE={id:"a48ab94c6b6c320c73284074982913f4a814f302"}}catch(e){}}();try{(t=(new(e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{}).Error).stack)&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="5070da95-a4a0-4230-9b79-a991c707aab7",e._sentryDebugIdIdentifier="sentry-dbid-5070da95-a4a0-4230-9b79-a991c707aab7")}catch(e){}var e,t,n={};
/**
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
 */
const i=function(e,t){if(!e)throw s(t)},s=function(e){return new Error("Firebase Database (${JSCORE_VERSION}) INTERNAL ASSERT FAILED: "+e)},r=function(e){const t=[];let n=0;for(let i=0;i<e.length;i++){let s=e.charCodeAt(i);s<128?t[n++]=s:s<2048?(t[n++]=s>>6|192,t[n++]=63&s|128):55296==(64512&s)&&i+1<e.length&&56320==(64512&e.charCodeAt(i+1))?(s=65536+((1023&s)<<10)+(1023&e.charCodeAt(++i)),t[n++]=s>>18|240,t[n++]=s>>12&63|128,t[n++]=s>>6&63|128,t[n++]=63&s|128):(t[n++]=s>>12|224,t[n++]=s>>6&63|128,t[n++]=63&s|128)}return t},o={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let s=0;s<e.length;s+=3){const t=e[s],r=s+1<e.length,o=r?e[s+1]:0,a=s+2<e.length,c=a?e[s+2]:0,h=t>>2,l=(3&t)<<4|o>>4;let u=(15&o)<<2|c>>6,d=63&c;a||(d=64,r||(u=64)),i.push(n[h],n[l],n[u],n[d])}return i.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(r(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):function(e){const t=[];let n=0,i=0;for(;n<e.length;){const s=e[n++];if(s<128)t[i++]=String.fromCharCode(s);else if(s>191&&s<224){const r=e[n++];t[i++]=String.fromCharCode((31&s)<<6|63&r)}else if(s>239&&s<365){const r=((7&s)<<18|(63&e[n++])<<12|(63&e[n++])<<6|63&e[n++])-65536;t[i++]=String.fromCharCode(55296+(r>>10)),t[i++]=String.fromCharCode(56320+(1023&r))}else{const r=e[n++],o=e[n++];t[i++]=String.fromCharCode((15&s)<<12|(63&r)<<6|63&o)}}return t.join("")}(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let s=0;s<e.length;){const t=n[e.charAt(s++)],r=s<e.length?n[e.charAt(s)]:0;++s;const o=s<e.length?n[e.charAt(s)]:64;++s;const c=s<e.length?n[e.charAt(s)]:64;if(++s,null==t||null==r||null==o||null==c)throw new a;const h=t<<2|r>>4;if(i.push(h),64!==o){const e=r<<4&240|o>>2;if(i.push(e),64!==c){const e=o<<6&192|c;i.push(e)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};
/**
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
 */class a extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const c=function(e){const t=r(e);return o.encodeByteArray(t,!0)},h=function(e){return c(e).replace(/\./g,"")},l=function(t){try{return o.decodeString(t,!0)}catch(e){}return null};
/**
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
 */
function u(e){return d(void 0,e)}function d(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:return new Date(t.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const n in t)t.hasOwnProperty(n)&&f(n)&&(e[n]=d(e[n],t[n]));return e}function f(e){return"__proto__"!==e}
/**
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
 */
/**
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
 */
const p=()=>{try{return function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}().__FIREBASE_DEFAULTS__||(()=>{if("undefined"==typeof process)return;const e=n.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0})()||(()=>{if("undefined"==typeof document)return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}const n=t&&l(t[1]);return n&&JSON.parse(n)})()}catch(e){return}},g=e=>{var t,n;return null==(n=null==(t=p())?void 0:t.emulatorHosts)?void 0:n[e]},m=e=>{const t=g(e);if(!t)return;const n=t.lastIndexOf(":");if(n<=0||n+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const i=parseInt(t.substring(n+1),10);return"["===t[0]?[t.substring(1,n-1),i]:[t.substring(0,n),i]},_=()=>{var e;return null==(e=p())?void 0:e.config},y=e=>{var t;return null==(t=p())?void 0:t[`_${e}`]};
/**
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
 */
class v{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),"function"==typeof e&&(this.promise.catch(()=>{}),1===e.length?e(t):e(t,n))}}}
/**
 * @license
 * Copyright 2025 Google LLC
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
 */function w(t){try{return(t.startsWith("http://")||t.startsWith("https://")?new URL(t).hostname:t).endsWith(".cloudworkstations.dev")}catch(e){return!1}}async function T(e){return(await fetch(e,{credentials:"include"})).ok}
/**
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
 */function I(e,t){if(e.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n=t||"demo-project",i=e.iat||0,s=e.sub||e.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const r={iss:`https://securetoken.google.com/${n}`,aud:n,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}},...e};return[h(JSON.stringify({alg:"none",type:"JWT"})),h(JSON.stringify(r)),""].join(".")}const E={};let b=!1;function C(e,t){if("undefined"==typeof window||"undefined"==typeof document||!w(window.location.host)||E[e]===t||E[e]||b)return;function n(e){return`__firebase__banner__${e}`}E[e]=t;const i="__firebase__banner",s=function(){const e={prod:[],emulator:[]};for(const t of Object.keys(E))E[t]?e.emulator.push(t):e.prod.push(t);return e}().prod.length>0;function r(){const e=function(e){let t=document.getElementById(e),n=!1;return t||(t=document.createElement("div"),t.setAttribute("id",e),n=!0),{created:n,element:t}}(i),t=n("text"),r=document.getElementById(t)||document.createElement("span"),o=n("learnmore"),a=document.getElementById(o)||document.createElement("a"),c=n("preprendIcon"),h=document.getElementById(c)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(e.created){const t=e.element;!function(e){e.style.display="flex",e.style.background="#7faaf0",e.style.position="fixed",e.style.bottom="5px",e.style.left="5px",e.style.padding=".5em",e.style.borderRadius="5px",e.style.alignItems="center"}(t),function(e,t){e.setAttribute("id",t),e.innerText="Learn more",e.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",e.setAttribute("target","__blank"),e.style.paddingLeft="5px",e.style.textDecoration="underline"}(a,o);const n=function(){const e=document.createElement("span");return e.style.cursor="pointer",e.style.marginLeft="16px",e.style.fontSize="24px",e.innerHTML=" &times;",e.onclick=()=>{b=!0,function(){const e=document.getElementById(i);e&&e.remove()}()},e}();!function(e,t){e.setAttribute("width","24"),e.setAttribute("id",t),e.setAttribute("height","24"),e.setAttribute("viewBox","0 0 24 24"),e.setAttribute("fill","none"),e.style.marginLeft="-6px"}(h,c),t.append(h,r,a,n),document.body.appendChild(t)}s?(r.innerText="Preview backend disconnected.",h.innerHTML='<g clip-path="url(#clip0_6013_33858)">\n<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>\n</g>\n<defs>\n<clipPath id="clip0_6013_33858">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>'):(h.innerHTML='<g clip-path="url(#clip0_6083_34804)">\n<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>\n</g>\n<defs>\n<clipPath id="clip0_6083_34804">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',r.innerText="Preview backend running in this workspace."),r.setAttribute("id",t)}"loading"===document.readyState?window.addEventListener("DOMContentLoaded",r):r()}
/**
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
 */function S(){return"undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""}function k(){return"undefined"!=typeof window&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(S())}function N(){return"object"==typeof navigator&&"ReactNative"===navigator.product}class A extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,A.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,R.prototype.create)}}class R{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},i=`${this.service}/${e}`,s=this.errors[e],r=s?function(e,t){return e.replace(P,(e,n)=>{const i=t[n];return null!=i?String(i):`<${n}?>`})}(s,n):"Error",o=`${this.serviceName}: ${r} (${i}).`;return new A(i,o,n)}}const P=/\{\$([^}]+)}/g;
/**
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
 */function D(e){return JSON.parse(e)}function O(e){return JSON.stringify(e)}
/**
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
 */const x=function(t){let n={},i={},s={},r="";try{const e=t.split(".");n=D(l(e[0])||""),i=D(l(e[1])||""),r=e[2],s=i.d||{},delete i.d}catch(e){}return{header:n,claims:i,data:s,signature:r}};
/**
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
 */
function L(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function M(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:void 0}function U(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function F(e,t,n){const i={};for(const s in e)Object.prototype.hasOwnProperty.call(e,s)&&(i[s]=t.call(n,e[s],s,e));return i}function V(e,t){if(e===t)return!0;const n=Object.keys(e),i=Object.keys(t);for(const s of n){if(!i.includes(s))return!1;const n=e[s],r=t[s];if(q(n)&&q(r)){if(!V(n,r))return!1}else if(n!==r)return!1}for(const s of i)if(!n.includes(s))return!1;return!0}function q(e){return null!==e&&"object"==typeof e}
/**
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
 */function j(e){const t=[];for(const[n,i]of Object.entries(e))Array.isArray(i)?i.forEach(e=>{t.push(encodeURIComponent(n)+"="+encodeURIComponent(e))}):t.push(encodeURIComponent(n)+"="+encodeURIComponent(i));return t.length?"&"+t.join("&"):""}function B(e){const t={};return e.replace(/^\?/,"").split("&").forEach(e=>{if(e){const[n,i]=e.split("=");t[decodeURIComponent(n)]=decodeURIComponent(i)}}),t}function z(e){const t=e.indexOf("?");if(!t)return"";const n=e.indexOf("#",t);return e.substring(t,n>0?n:void 0)}
/**
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
 */class ${constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const n=this.W_;if("string"==typeof e)for(let l=0;l<16;l++)n[l]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let l=0;l<16;l++)n[l]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let l=16;l<80;l++){const e=n[l-3]^n[l-8]^n[l-14]^n[l-16];n[l]=4294967295&(e<<1|e>>>31)}let i,s,r=this.chain_[0],o=this.chain_[1],a=this.chain_[2],c=this.chain_[3],h=this.chain_[4];for(let l=0;l<80;l++){l<40?l<20?(i=c^o&(a^c),s=1518500249):(i=o^a^c,s=1859775393):l<60?(i=o&a|c&(o|a),s=2400959708):(i=o^a^c,s=3395469782);const e=(r<<5|r>>>27)+i+h+s+n[l]&4294967295;h=c,c=a,a=4294967295&(o<<30|o>>>2),o=r,r=e}this.chain_[0]=this.chain_[0]+r&4294967295,this.chain_[1]=this.chain_[1]+o&4294967295,this.chain_[2]=this.chain_[2]+a&4294967295,this.chain_[3]=this.chain_[3]+c&4294967295,this.chain_[4]=this.chain_[4]+h&4294967295}update(e,t){if(null==e)return;void 0===t&&(t=e.length);const n=t-this.blockSize;let i=0;const s=this.buf_;let r=this.inbuf_;for(;i<t;){if(0===r)for(;i<=n;)this.compress_(e,i),i+=this.blockSize;if("string"==typeof e){for(;i<t;)if(s[r]=e.charCodeAt(i),++r,++i,r===this.blockSize){this.compress_(s),r=0;break}}else for(;i<t;)if(s[r]=e[i],++r,++i,r===this.blockSize){this.compress_(s),r=0;break}}this.inbuf_=r,this.total_+=t}digest(){const e=[];let t=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let i=this.blockSize-1;i>=56;i--)this.buf_[i]=255&t,t/=256;this.compress_(this.buf_);let n=0;for(let i=0;i<5;i++)for(let t=24;t>=0;t-=8)e[n]=this.chain_[i]>>t&255,++n;return e}}class H{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(e=>{this.error(e)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(t,n,i){let s;if(void 0===t&&void 0===n&&void 0===i)throw new Error("Missing Observer.");s=function(e){if("object"!=typeof e||null===e)return!1;for(const t of["next","error","complete"])if(t in e&&"function"==typeof e[t])return!0;return!1}(t)?t:{next:t,error:n,complete:i},void 0===s.next&&(s.next=W),void 0===s.error&&(s.error=W),void 0===s.complete&&(s.complete=W);const r=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch(e){}}),this.observers.push(s),r}unsubscribeOne(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(t,n){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[t])try{n(this.observers[t])}catch(e){"undefined"!=typeof console&&console.error}})}close(e){this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function W(){}function K(e,t){return`${e} failed: ${t} argument `}
/**
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
 */const G=function(e){let t=0;for(let n=0;n<e.length;n++){const i=e.charCodeAt(n);i<128?t++:i<2048?t+=2:i>=55296&&i<=56319?(t+=4,n++):t+=3}return t};
/**
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
 */
function Q(e){return e&&e._delegate?e._delegate:e}class Y{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}
/**
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
 */const X="[DEFAULT]";
/**
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
 */class J{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const t=new v;if(this.instancesDeferred.set(n,t),this.isInitialized(n)||this.shouldAutoInitialize())try{const e=this.getOrInitializeService({instanceIdentifier:n});e&&t.resolve(e)}catch(e){}}return this.instancesDeferred.get(n).promise}getImmediate(t){var n;const i=this.normalizeInstanceIdentifier(null==t?void 0:t.identifier),s=null!=(n=null==t?void 0:t.optional)&&n;if(!this.isInitialized(i)&&!this.shouldAutoInitialize()){if(s)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:i})}catch(e){if(s)return null;throw e}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,this.shouldAutoInitialize()){if(function(e){return"EAGER"===e.instantiationMode}
/**
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
 */(t))try{this.getOrInitializeService({instanceIdentifier:X})}catch(e){}for(const[t,n]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const e=this.getOrInitializeService({instanceIdentifier:i});n.resolve(e)}catch(e){}}}}clearInstance(e=X){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...e.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return null!=this.component}isInitialized(e=X){return this.instances.has(e)}getOptions(e=X){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[s,r]of this.instancesDeferred.entries())n===this.normalizeInstanceIdentifier(s)&&r.resolve(i);return i}onInit(e,t){var n;const i=this.normalizeInstanceIdentifier(t),s=null!=(n=this.onInitCallbacks.get(i))?n:new Set;s.add(e),this.onInitCallbacks.set(i,s);const r=this.instances.get(i);return r&&e(r,i),()=>{s.delete(e)}}invokeOnInitCallbacks(t,n){const i=this.onInitCallbacks.get(n);if(i)for(const s of i)try{s(t,n)}catch(e){}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let i=this.instances.get(t);if(!i&&this.component&&(i=this.component.instanceFactory(this.container,{instanceIdentifier:(s=t,s===X?void 0:s),options:n}),this.instances.set(t,i),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(i,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,i)}catch(e){}var s;return i||null}normalizeInstanceIdentifier(e=X){return this.component?this.component.multipleInstances?e:X:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}class Z{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new J(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}
/**
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
 */var ee,te;(te=ee||(ee={}))[te.DEBUG=0]="DEBUG",te[te.VERBOSE=1]="VERBOSE",te[te.INFO=2]="INFO",te[te.WARN=3]="WARN",te[te.ERROR=4]="ERROR",te[te.SILENT=5]="SILENT";const ne={debug:ee.DEBUG,verbose:ee.VERBOSE,info:ee.INFO,warn:ee.WARN,error:ee.ERROR,silent:ee.SILENT},ie=ee.INFO,se={[ee.DEBUG]:"log",[ee.VERBOSE]:"log",[ee.INFO]:"info",[ee.WARN]:"warn",[ee.ERROR]:"error"},re=(e,t,...n)=>{if(!(t<e.logLevel||((new Date).toISOString(),se[t])))throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class oe{constructor(e){this.name=e,this._logLevel=ie,this._logHandler=re,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in ee))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?ne[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,ee.DEBUG,...e),this._logHandler(this,ee.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,ee.VERBOSE,...e),this._logHandler(this,ee.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,ee.INFO,...e),this._logHandler(this,ee.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,ee.WARN,...e),this._logHandler(this,ee.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,ee.ERROR,...e),this._logHandler(this,ee.ERROR,...e)}}let ae,ce;const he=new WeakMap,le=new WeakMap,ue=new WeakMap,de=new WeakMap,fe=new WeakMap;let pe={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return le.get(e);if("objectStoreNames"===t)return e.objectStoreNames||ue.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return me(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function ge(e){return"function"==typeof e?(t=e)!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(ce||(ce=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(t)?function(...e){return t.apply(_e(this),e),me(he.get(this))}:function(...e){return me(t.apply(_e(this),e))}:function(e,...n){const i=t.call(_e(this),e,...n);return ue.set(i,e.sort?e.sort():[e]),me(i)}:(e instanceof IDBTransaction&&function(e){if(le.has(e))return;const t=new Promise((t,n)=>{const i=()=>{e.removeEventListener("complete",s),e.removeEventListener("error",r),e.removeEventListener("abort",r)},s=()=>{t(),i()},r=()=>{n(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",s),e.addEventListener("error",r),e.addEventListener("abort",r)});le.set(e,t)}(e),n=e,(ae||(ae=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some(e=>n instanceof e)?new Proxy(e,pe):e);var t,n}function me(e){if(e instanceof IDBRequest)return function(e){const t=new Promise((t,n)=>{const i=()=>{e.removeEventListener("success",s),e.removeEventListener("error",r)},s=()=>{t(me(e.result)),i()},r=()=>{n(e.error),i()};e.addEventListener("success",s),e.addEventListener("error",r)});return t.then(t=>{t instanceof IDBCursor&&he.set(t,e)}).catch(()=>{}),fe.set(t,e),t}(e);if(de.has(e))return de.get(e);const t=ge(e);return t!==e&&(de.set(e,t),fe.set(t,e)),t}const _e=e=>fe.get(e),ye=["get","getKey","getAll","getAllKeys","count"],ve=["put","add","delete","clear"],we=new Map;function Te(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(we.get(t))return we.get(t);const n=t.replace(/FromIndex$/,""),i=t!==n,s=ve.includes(n);if(!(n in(i?IDBIndex:IDBObjectStore).prototype)||!s&&!ye.includes(n))return;const r=async function(e,...t){const r=this.transaction(e,s?"readwrite":"readonly");let o=r.store;return i&&(o=o.index(t.shift())),(await Promise.all([o[n](...t),s&&r.done]))[0]};return we.set(t,r),r}var Ie;Ie=pe,pe={...Ie,get:(e,t,n)=>Te(e,t)||Ie.get(e,t,n),has:(e,t)=>!!Te(e,t)||Ie.has(e,t)};
/**
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
 */
class Ee{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(function(e){const t=e.getComponent();return"VERSION"===(null==t?void 0:t.type)}(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null}).filter(e=>e).join(" ")}}const be="@firebase/app",Ce="0.14.2",Se=new oe("@firebase/app"),ke="@firebase/app-compat",Ne="@firebase/analytics-compat",Ae="@firebase/analytics",Re="@firebase/app-check-compat",Pe="@firebase/app-check",De="@firebase/auth",Oe="@firebase/auth-compat",xe="@firebase/database",Le="@firebase/data-connect",Me="@firebase/database-compat",Ue="@firebase/functions",Fe="@firebase/functions-compat",Ve="@firebase/installations",qe="@firebase/installations-compat",je="@firebase/messaging",Be="@firebase/messaging-compat",ze="@firebase/performance",$e="@firebase/performance-compat",He="@firebase/remote-config",We="@firebase/remote-config-compat",Ke="@firebase/storage",Ge="@firebase/storage-compat",Qe="@firebase/firestore",Ye="@firebase/ai",Xe="@firebase/firestore-compat",Je="firebase",Ze="[DEFAULT]",et={[be]:"fire-core",[ke]:"fire-core-compat",[Ae]:"fire-analytics",[Ne]:"fire-analytics-compat",[Pe]:"fire-app-check",[Re]:"fire-app-check-compat",[De]:"fire-auth",[Oe]:"fire-auth-compat",[xe]:"fire-rtdb",[Le]:"fire-data-connect",[Me]:"fire-rtdb-compat",[Ue]:"fire-fn",[Fe]:"fire-fn-compat",[Ve]:"fire-iid",[qe]:"fire-iid-compat",[je]:"fire-fcm",[Be]:"fire-fcm-compat",[ze]:"fire-perf",[$e]:"fire-perf-compat",[He]:"fire-rc",[We]:"fire-rc-compat",[Ke]:"fire-gcs",[Ge]:"fire-gcs-compat",[Qe]:"fire-fst",[Xe]:"fire-fst-compat",[Ye]:"fire-vertex","fire-js":"fire-js",[Je]:"fire-js-all"},tt=new Map,nt=new Map,it=new Map;function st(t,n){try{t.container.addComponent(n)}catch(e){Se.debug(`Component ${n.name} failed to register with FirebaseApp ${t.name}`,e)}}function rt(e){const t=e.name;if(it.has(t))return Se.debug(`There were multiple attempts to register component ${t}.`),!1;it.set(t,e);for(const n of tt.values())st(n,e);for(const n of nt.values())st(n,e);return!0}function ot(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}function at(e){return null!=e&&void 0!==e.settings}
/**
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
 */const ct=new R("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."});
/**
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
 */
class ht{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Y("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw ct.create("app-deleted",{appName:this._name})}}
/**
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
 */const lt="12.2.0";function ut(e,t={}){let n=e;"object"!=typeof t&&(t={name:t});const i={name:Ze,automaticDataCollectionEnabled:!0,...t},s=i.name;if("string"!=typeof s||!s)throw ct.create("bad-app-name",{appName:String(s)});if(n||(n=_()),!n)throw ct.create("no-options");const r=tt.get(s);if(r){if(V(n,r.options)&&V(i,r.config))return r;throw ct.create("duplicate-app",{appName:s})}const o=new Z(s);for(const c of it.values())o.addComponent(c);const a=new ht(n,i,o);return tt.set(s,a),a}function dt(e=Ze){const t=tt.get(e);if(!t&&e===Ze&&_())return ut();if(!t)throw ct.create("no-app",{appName:e});return t}function ft(e,t,n){var i;let s=null!=(i=et[e])?i:e;n&&(s+=`-${n}`);const r=s.match(/\s|\//),o=t.match(/\s|\//);if(r||o){const e=[`Unable to register library "${s}" with version "${t}":`];return r&&e.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&o&&e.push("and"),o&&e.push(`version name "${t}" contains illegal characters (whitespace or "/")`),void Se.warn(e.join(" "))}rt(new Y(`${s}-version`,()=>({library:s,version:t}),"VERSION"))}
/**
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
 */const pt="firebase-heartbeat-store";let gt=null;function mt(){return gt||(gt=function(e,t,{blocked:n,upgrade:i,blocking:s,terminated:r}={}){const o=indexedDB.open(e,t),a=me(o);return i&&o.addEventListener("upgradeneeded",e=>{i(me(o.result),e.oldVersion,e.newVersion,me(o.transaction),e)}),n&&o.addEventListener("blocked",e=>n(e.oldVersion,e.newVersion,e)),a.then(e=>{r&&e.addEventListener("close",()=>r()),s&&e.addEventListener("versionchange",e=>s(e.oldVersion,e.newVersion,e))}).catch(()=>{}),a}("firebase-heartbeat-database",1,{upgrade:(t,n)=>{if(0===n)try{t.createObjectStore(pt)}catch(e){}}}).catch(e=>{throw ct.create("idb-open",{originalErrorMessage:e.message})})),gt}async function _t(t,n){try{const e=(await mt()).transaction(pt,"readwrite"),i=e.objectStore(pt);await i.put(n,yt(t)),await e.done}catch(e){if(e instanceof A)Se.warn(e.message);else{const n=ct.create("idb-set",{originalErrorMessage:null==e?void 0:e.message});Se.warn(n.message)}}}function yt(e){return`${e.name}!${e.options.appId}`}
/**
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
 */class vt{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new Tt(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){var t,n;try{const e=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=wt();if(null==(null==(t=this._heartbeatsCache)?void 0:t.heartbeats)&&(this._heartbeatsCache=await this._heartbeatsCachePromise,null==(null==(n=this._heartbeatsCache)?void 0:n.heartbeats)))return;if(this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(e=>e.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:e}),this._heartbeatsCache.heartbeats.length>30){const e=function(e){if(0===e.length)return-1;let t=0,n=e[0].date;for(let i=1;i<e.length;i++)e[i].date<n&&(n=e[i].date,t=i);return t}
/**
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
 */(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(e,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){Se.warn(e)}}async getHeartbeatsHeader(){var t;try{if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null==(null==(t=this._heartbeatsCache)?void 0:t.heartbeats)||0===this._heartbeatsCache.heartbeats.length)return"";const e=wt(),{heartbeatsToSend:n,unsentEntries:i}=function(e,t=1024){const n=[];let i=e.slice();for(const s of e){const e=n.find(e=>e.agent===s.agent);if(e){if(e.dates.push(s.date),It(n)>t){e.dates.pop();break}}else if(n.push({agent:s.agent,dates:[s.date]}),It(n)>t){n.pop();break}i=i.slice(1)}return{heartbeatsToSend:n,unsentEntries:i}}(this._heartbeatsCache.heartbeats),s=h(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=e,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(e){return Se.warn(e),""}}}function wt(){return(new Date).toISOString().substring(0,10)}class Tt{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!function(){try{return"object"==typeof indexedDB}catch(e){return!1}}()&&new Promise((e,t)=>{try{let n=!0;const i="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(i);s.onsuccess=()=>{s.result.close(),n||self.indexedDB.deleteDatabase(i),e(!0)},s.onupgradeneeded=()=>{n=!1},s.onerror=()=>{var e;t((null==(e=s.error)?void 0:e.message)||"")}}catch(n){t(n)}}).then(()=>!0).catch(()=>!1)}async read(){if(await this._canUseIndexedDBPromise){const t=await async function(t){try{const e=(await mt()).transaction(pt),n=await e.objectStore(pt).get(yt(t));return await e.done,n}catch(e){if(e instanceof A)Se.warn(e.message);else{const n=ct.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});Se.warn(n.message)}}}(this.app);return(null==t?void 0:t.heartbeats)?t:{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return _t(this.app,{lastSentHeartbeatDate:null!=(t=e.lastSentHeartbeatDate)?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return _t(this.app,{lastSentHeartbeatDate:null!=(t=e.lastSentHeartbeatDate)?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function It(e){return h(JSON.stringify({version:2,heartbeats:e})).length}rt(new Y("platform-logger",e=>new Ee(e),"PRIVATE")),rt(new Y("heartbeat",e=>new vt(e),"PRIVATE")),ft(be,Ce,""),ft(be,Ce,"esm2020"),ft("fire-js","");var Et={};const bt="@firebase/database",Ct="1.1.0";
/**
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
 */
let St="";
/**
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
 */
class kt{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){null==t?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),O(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return null==t?null:D(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}
/**
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
 */class Nt{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){null==t?delete this.cache_[e]:this.cache_[e]=t}get(e){return L(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}
/**
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
 */const At=function(t){try{if("undefined"!=typeof window&&void 0!==window[t]){const e=window[t];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new kt(e)}}catch(e){}return new Nt},Rt=At("localStorage"),Pt=At("sessionStorage"),Dt=new oe("@firebase/database"),Ot=function(){let e=1;return function(){return e++}}(),xt=function(e){const t=function(e){const t=[];let n=0;for(let s=0;s<e.length;s++){let r=e.charCodeAt(s);if(r>=55296&&r<=56319){const t=r-55296;s++,i(s<e.length,"Surrogate pair missing trail surrogate."),r=65536+(t<<10)+(e.charCodeAt(s)-56320)}r<128?t[n++]=r:r<2048?(t[n++]=r>>6|192,t[n++]=63&r|128):r<65536?(t[n++]=r>>12|224,t[n++]=r>>6&63|128,t[n++]=63&r|128):(t[n++]=r>>18|240,t[n++]=r>>12&63|128,t[n++]=r>>6&63|128,t[n++]=63&r|128)}return t}(e),n=new $;n.update(t);const s=n.digest();return o.encodeByteArray(s)},Lt=function(...e){let t="";for(let n=0;n<e.length;n++){const i=e[n];Array.isArray(i)||i&&"object"==typeof i&&"number"==typeof i.length?t+=Lt.apply(null,i):t+="object"==typeof i?O(i):i,t+=" "}return t};let Mt=null,Ut=!0;const Ft=function(...e){if(!0===Ut&&(Ut=!1,null===Mt&&!0===Pt.get("logging_enabled")&&(i(!0,"Can't turn on custom loggers persistently."),Dt.logLevel=ee.VERBOSE,Mt=Dt.log.bind(Dt))),Mt){const t=Lt.apply(null,e);Mt(t)}},Vt=function(e){return function(...t){Ft(e,...t)}},qt=function(...e){const t="FIREBASE INTERNAL ERROR: "+Lt(...e);Dt.error(t)},jt=function(...e){const t=`FIREBASE FATAL ERROR: ${Lt(...e)}`;throw Dt.error(t),new Error(t)},Bt=function(...e){const t="FIREBASE WARNING: "+Lt(...e);Dt.warn(t)},zt=function(e){return"number"==typeof e&&(e!=e||e===Number.POSITIVE_INFINITY||e===Number.NEGATIVE_INFINITY)},$t="[MIN_NAME]",Ht="[MAX_NAME]",Wt=function(e,t){if(e===t)return 0;if(e===$t||t===Ht)return-1;if(t===$t||e===Ht)return 1;{const n=en(e),i=en(t);return null!==n?null!==i?n-i===0?e.length-t.length:n-i:-1:null!==i?1:e<t?-1:1}},Kt=function(e,t){return e===t?0:e<t?-1:1},Gt=function(e,t){if(t&&e in t)return t[e];throw new Error("Missing required key ("+e+") in object: "+O(t))},Qt=function(e){if("object"!=typeof e||null===e)return O(e);const t=[];for(const i in e)t.push(i);t.sort();let n="{";for(let i=0;i<t.length;i++)0!==i&&(n+=","),n+=O(t[i]),n+=":",n+=Qt(e[t[i]]);return n+="}",n},Yt=function(e,t){const n=e.length;if(n<=t)return[e];const i=[];for(let s=0;s<n;s+=t)s+t>n?i.push(e.substring(s,n)):i.push(e.substring(s,s+t));return i};function Xt(e,t){for(const n in e)e.hasOwnProperty(n)&&t(n,e[n])}const Jt=function(e){i(!zt(e),"Invalid JSON number");let t,n,s,r,o;0===e?(n=0,s=0,t=1/e==-1/0?1:0):(t=e<0,(e=Math.abs(e))>=Math.pow(2,-1022)?(r=Math.min(Math.floor(Math.log(e)/Math.LN2),1023),n=r+1023,s=Math.round(e*Math.pow(2,52-r)-Math.pow(2,52))):(n=0,s=Math.round(e/Math.pow(2,-1074))));const a=[];for(o=52;o;o-=1)a.push(s%2?1:0),s=Math.floor(s/2);for(o=11;o;o-=1)a.push(n%2?1:0),n=Math.floor(n/2);a.push(t?1:0),a.reverse();const c=a.join("");let h="";for(o=0;o<64;o+=8){let e=parseInt(c.substr(o,8),2).toString(16);1===e.length&&(e="0"+e),h+=e}return h.toLowerCase()},Zt=new RegExp("^-?(0*)\\d{1,10}$"),en=function(e){if(Zt.test(e)){const t=Number(e);if(t>=-2147483648&&t<=2147483647)return t}return null},tn=function(t){try{t()}catch(e){setTimeout(()=>{const n=e.stack||"";throw Bt("Exception was thrown by user callback.",n),e},Math.floor(0))}},nn=function(e,t){const n=setTimeout(e,t);return"number"==typeof n&&"undefined"!=typeof Deno&&Deno.unrefTimer?Deno.unrefTimer(n):"object"==typeof n&&n.unref&&n.unref(),n};
/**
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
 */
class sn{constructor(e,t){this.appCheckProvider=t,this.appName=e.name,at(e)&&e.settings.appCheckToken&&(this.serverAppAppCheckToken=e.settings.appCheckToken),this.appCheck=null==t?void 0:t.getImmediate({optional:!0}),this.appCheck||null==t||t.get().then(e=>this.appCheck=e)}getToken(e){if(this.serverAppAppCheckToken){if(e)throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");return Promise.resolve({token:this.serverAppAppCheckToken})}return this.appCheck?this.appCheck.getToken(e):new Promise((t,n)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){var t;null==(t=this.appCheckProvider)||t.get().then(t=>t.addTokenListener(e))}notifyForInvalidToken(){Bt(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`)}}
/**
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
 */class rn{constructor(e,t,n){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=n,this.auth_=null,this.auth_=n.getImmediate({optional:!0}),this.auth_||n.onInit(e=>this.auth_=e)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(e=>e&&"auth/token-not-initialized"===e.code?(Ft("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(e)):new Promise((t,n)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',Bt(e)}}class on{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}on.OWNER="owner";
/**
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
 */
const an=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,cn="ac",hn="websocket",ln="long_polling";
/**
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
 */
class un{constructor(e,t,n,i,s=!1,r="",o=!1,a=!1,c=null){this.secure=t,this.namespace=n,this.webSocketOnly=i,this.nodeAdmin=s,this.persistenceKey=r,this.includeNamespaceInQueryParams=o,this.isUsingEmulator=a,this.emulatorOptions=c,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=Rt.get("host:"+e)||this._host}isCacheableHost(){return"s-"===this.internalHost.substr(0,2)}isCustomHost(){return"firebaseio.com"!==this._domain&&"firebaseio-demo.com"!==this._domain}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&Rt.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function dn(e,t,n){let s;if(i("string"==typeof t,"typeof type must == string"),i("object"==typeof n,"typeof params must == object"),t===hn)s=(e.secure?"wss://":"ws://")+e.internalHost+"/.ws?";else{if(t!==ln)throw new Error("Unknown connection type: "+t);s=(e.secure?"https://":"http://")+e.internalHost+"/.lp?"}(function(e){return e.host!==e.internalHost||e.isCustomHost()||e.includeNamespaceInQueryParams})(e)&&(n.ns=e.namespace);const r=[];return Xt(n,(e,t)=>{r.push(e+"="+t)}),s+r.join("&")}
/**
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
 */class fn{constructor(){this.counters_={}}incrementCounter(e,t=1){L(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return u(this.counters_)}}
/**
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
 */const pn={},gn={};function mn(e){const t=e.toString();return pn[t]||(pn[t]=new fn),pn[t]}
/**
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
 */
class _n{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const e=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let t=0;t<e.length;++t)e[t]&&tn(()=>{this.onMessage_(e[t])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}
/**
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
 */const yn="start";class vn{constructor(e,t,n,i,s,r,o){this.connId=e,this.repoInfo=t,this.applicationId=n,this.appCheckToken=i,this.authToken=s,this.transportSessionId=r,this.lastSessionId=o,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=Vt(e),this.stats_=mn(t),this.urlFn=e=>(this.appCheckToken&&(e[cn]=this.appCheckToken),dn(t,ln,e))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new _n(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(3e4)),function(e){if("complete"===document.readyState)e();else{let t=!1;const n=function(){document.body?t||(t=!0,e()):setTimeout(n,Math.floor(10))};document.addEventListener?(document.addEventListener("DOMContentLoaded",n,!1),window.addEventListener("load",n,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{"complete"===document.readyState&&n()}),window.attachEvent("onload",n))}}(()=>{if(this.isClosed_)return;this.scriptTagHolder=new wn((...e)=>{const[t,n,i,s,r]=e;if(this.incrementIncomingBytes_(e),this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,t===yn)this.id=n,this.password=i;else{if("close"!==t)throw new Error("Unrecognized command received: "+t);n?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(n,()=>{this.onClosed_()})):this.onClosed_()}},(...e)=>{const[t,n]=e;this.incrementIncomingBytes_(e),this.myPacketOrderer.handleResponse(t,n)},()=>{this.onClosed_()},this.urlFn);const e={};e[yn]="t",e.ser=Math.floor(1e8*Math.random()),this.scriptTagHolder.uniqueCallbackIdentifier&&(e.cb=this.scriptTagHolder.uniqueCallbackIdentifier),e.v="5",this.transportSessionId&&(e.s=this.transportSessionId),this.lastSessionId&&(e.ls=this.lastSessionId),this.applicationId&&(e.p=this.applicationId),this.appCheckToken&&(e[cn]=this.appCheckToken),"undefined"!=typeof location&&location.hostname&&an.test(location.hostname)&&(e.r="f");const t=this.urlFn(e);this.log_("Connecting via long-poll to "+t),this.scriptTagHolder.addTag(t,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){vn.forceAllow_=!0}static forceDisallow(){vn.forceDisallow_=!0}static isAvailable(){return!!vn.forceAllow_||!(vn.forceDisallow_||"undefined"==typeof document||null==document.createElement||"object"==typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href)||"object"==typeof Windows&&"object"==typeof Windows.UI)}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=O(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=c(t),i=Yt(n,1840);for(let s=0;s<i.length;s++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[s]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const n={dframe:"t"};n.id=e,n.pw=t,this.myDisconnFrame.src=this.urlFn(n),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=O(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class wn{constructor(t,n,i,s){this.onDisconnect=i,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=Ot(),window["pLPCommand"+this.uniqueCallbackIdentifier]=t,window["pRTLPCB"+this.uniqueCallbackIdentifier]=n,this.myIFrame=wn.createIFrame_();let i="";this.myIFrame.src&&"javascript:"===this.myIFrame.src.substr(0,11)&&(i='<script>document.domain="'+document.domain+'";<\/script>');const s="<html><body>"+i+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(s),this.myIFrame.doc.close()}catch(e){Ft("frame writing exception"),e.stack&&Ft(e.stack),Ft(e)}}}static createIFrame_(){const t=document.createElement("iframe");if(t.style.display="none",!document.body)throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";document.body.appendChild(t);try{t.contentWindow.document||Ft("No IE domain setting required")}catch(e){const i=document.domain;t.src="javascript:void((function(){document.open();document.domain='"+i+"';document.close();})())"}return t.contentDocument?t.doc=t.contentDocument:t.contentWindow?t.doc=t.contentWindow.document:t.document&&(t.doc=t.document),t}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{null!==this.myIFrame&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e.id=this.myID,e.pw=this.myPW,e.ser=this.currentSerial;let t=this.urlFn(e),n="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+30+n.length<=1870;){const e=this.pendingSegs.shift();n=n+"&seg"+i+"="+e.seg+"&ts"+i+"="+e.ts+"&d"+i+"="+e.d,i++}return t+=n,this.addLongPollTag_(t,this.currentSerial),!0}return!1}enqueueSegment(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const n=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(n,Math.floor(25e3));this.addTag(e,()=>{clearTimeout(i),n()})}addTag(t,n){setTimeout(()=>{try{if(!this.sendNewPolls)return;const e=this.myIFrame.doc.createElement("script");e.type="text/javascript",e.async=!0,e.src=t,e.onload=e.onreadystatechange=function(){const t=e.readyState;t&&"loaded"!==t&&"complete"!==t||(e.onload=e.onreadystatechange=null,e.parentNode&&e.parentNode.removeChild(e),n())},e.onerror=()=>{Ft("Long-poll script failed to load: "+t),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(e)}catch(e){}},Math.floor(1))}}
/**
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
 */let Tn=null;"undefined"!=typeof MozWebSocket?Tn=MozWebSocket:"undefined"!=typeof WebSocket&&(Tn=WebSocket);class In{constructor(e,t,n,i,s,r,o){this.connId=e,this.applicationId=n,this.appCheckToken=i,this.authToken=s,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=Vt(this.connId),this.stats_=mn(t),this.connURL=In.connectionURL_(t,r,o,i,n),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,n,i,s){const r={v:"5"};return"undefined"!=typeof location&&location.hostname&&an.test(location.hostname)&&(r.r="f"),t&&(r.s=t),n&&(r.ls=n),i&&(r[cn]=i),s&&(r.p=s),dn(e,hn,r)}open(t,n){this.onDisconnect=n,this.onMessage=t,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,Rt.set("previous_websocket_failure",!0);try{let e;this.mySock=new Tn(this.connURL,[],e)}catch(e){this.log_("Error instantiating WebSocket.");const n=e.message||e.data;return n&&this.log_(n),void this.onClosed_()}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=e=>{this.handleIncomingFrame(e)},this.mySock.onerror=e=>{this.log_("WebSocket error.  Closing connection.");const t=e.message||e.data;t&&this.log_(t),this.onClosed_()}}start(){}static forceDisallow(){In.forceDisallow_=!0}static isAvailable(){let e=!1;if("undefined"!=typeof navigator&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,n=navigator.userAgent.match(t);n&&n.length>1&&parseFloat(n[1])<4.4&&(e=!0)}return!e&&null!==Tn&&!In.forceDisallow_}static previouslyFailed(){return Rt.isInMemoryStorage||!0===Rt.get("previous_websocket_failure")}markConnectionHealthy(){Rt.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const e=this.frames.join("");this.frames=null;const t=D(e);this.onMessage(t)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(i(null===this.frames,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(null===this.mySock)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),null!==this.frames)this.appendFrame_(t);else{const e=this.extractFrameCount_(t);null!==e&&this.appendFrame_(e)}}send(e){this.resetKeepAlive();const t=O(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=Yt(t,16384);n.length>1&&this.sendString_(String(n.length));for(let i=0;i<n.length;i++)this.sendString_(n[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(45e3))}sendString_(t){try{this.mySock.send(t)}catch(e){this.log_("Exception thrown from WebSocket.send():",e.message||e.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}In.responsesRequiredToBeHealthy=2,In.healthyTimeout=3e4;
/**
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
 */
class En{static get ALL_TRANSPORTS(){return[vn,In]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}constructor(e){this.initTransports_(e)}initTransports_(e){const t=In&&In.isAvailable();let n=t&&!In.previouslyFailed();if(e.webSocketOnly&&(t||Bt("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),n=!0),n)this.transports_=[In];else{const e=this.transports_=[];for(const t of En.ALL_TRANSPORTS)t&&t.isAvailable()&&e.push(t);En.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}En.globalTransportInitialized_=!1;class bn{constructor(e,t,n,i,s,r,o,a,c,h){this.id=e,this.repoInfo_=t,this.applicationId_=n,this.appCheckToken_=i,this.authToken_=s,this.onMessage_=r,this.onReady_=o,this.onDisconnect_=a,this.onKill_=c,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=Vt("c:"+this.id+":"),this.transportManager_=new En(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),n=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,n)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=nn(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>102400?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>10240?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{2!==this.state_&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if("t"in e){const t=e.t;"a"===t?this.upgradeIfSecondaryHealthy_():"r"===t?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),this.tx_!==this.secondaryConn_&&this.rx_!==this.secondaryConn_||this.close()):"o"===t&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Gt("t",e),n=Gt("d",e);if("c"===t)this.onSecondaryControl_(n);else{if("d"!==t)throw new Error("Unknown protocol layer: "+t);this.pendingDataMessages.push(n)}}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:"p",d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:"a",d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:"n",d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Gt("t",e),n=Gt("d",e);"c"===t?this.onControl_(n):"d"===t&&this.onDataMessage_(n)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Gt("t",e);if("d"in e){const n=e.d;if("h"===t){const e={...n};this.repoInfo_.isUsingEmulator&&(e.h=this.repoInfo_.host),this.onHandshake_(e)}else if("n"===t){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let e=0;e<this.pendingDataMessages.length;++e)this.onDataMessage_(this.pendingDataMessages[e]);this.pendingDataMessages=[],this.tryCleanupConnection()}else"s"===t?this.onConnectionShutdown_(n):"r"===t?this.onReset_(n):"e"===t?qt("Server Error: "+n):"o"===t?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):qt("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,n=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,0===this.state_&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),"5"!==n&&Bt("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),n=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,n),nn(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(6e4))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,1===this.state_?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),0===this.primaryResponsesRequired_?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):nn(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(5e3))}sendPingOnPrimaryIfNecessary_(){this.isHealthy_||1!==this.state_||(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:"p",d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,this.tx_!==e&&this.rx_!==e||this.close()}onConnectionLost_(e){this.conn_=null,e||0!==this.state_?1===this.state_&&this.log_("Realtime connection lost."):(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(Rt.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(1!==this.state_)throw"Connection is not connected";this.tx_.send(e)}close(){2!==this.state_&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}
/**
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
 */class Cn{put(e,t,n,i){}merge(e,t,n,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,n){}onDisconnectMerge(e,t,n){}onDisconnectCancel(e,t){}reportStats(e){}}
/**
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
 */class Sn{constructor(e){this.allowedEvents_=e,this.listeners_={},i(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const n=[...this.listeners_[e]];for(let e=0;e<n.length;e++)n[e].callback.apply(n[e].context,t)}}on(e,t,n){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:n});const i=this.getInitialEvent(e);i&&t.apply(n,i)}off(e,t,n){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let s=0;s<i.length;s++)if(i[s].callback===t&&(!n||n===i[s].context))return void i.splice(s,1)}validateEventType_(e){i(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}
/**
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
 */class kn extends Sn{static getInstance(){return new kn}constructor(){super(["online"]),this.online_=!0,"undefined"==typeof window||void 0===window.addEventListener||k()||(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}getInitialEvent(e){return i("online"===e,"Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}
/**
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
 */class Nn{constructor(e,t){if(void 0===t){this.pieces_=e.split("/");let t=0;for(let e=0;e<this.pieces_.length;e++)this.pieces_[e].length>0&&(this.pieces_[t]=this.pieces_[e],t++);this.pieces_.length=t,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)""!==this.pieces_[t]&&(e+="/"+this.pieces_[t]);return e||"/"}}function An(){return new Nn("")}function Rn(e){return e.pieceNum_>=e.pieces_.length?null:e.pieces_[e.pieceNum_]}function Pn(e){return e.pieces_.length-e.pieceNum_}function Dn(e){let t=e.pieceNum_;return t<e.pieces_.length&&t++,new Nn(e.pieces_,t)}function On(e){return e.pieceNum_<e.pieces_.length?e.pieces_[e.pieces_.length-1]:null}function xn(e,t=0){return e.pieces_.slice(e.pieceNum_+t)}function Ln(e){if(e.pieceNum_>=e.pieces_.length)return null;const t=[];for(let n=e.pieceNum_;n<e.pieces_.length-1;n++)t.push(e.pieces_[n]);return new Nn(t,0)}function Mn(e,t){const n=[];for(let i=e.pieceNum_;i<e.pieces_.length;i++)n.push(e.pieces_[i]);if(t instanceof Nn)for(let i=t.pieceNum_;i<t.pieces_.length;i++)n.push(t.pieces_[i]);else{const e=t.split("/");for(let t=0;t<e.length;t++)e[t].length>0&&n.push(e[t])}return new Nn(n,0)}function Un(e){return e.pieceNum_>=e.pieces_.length}function Fn(e,t){const n=Rn(e),i=Rn(t);if(null===n)return t;if(n===i)return Fn(Dn(e),Dn(t));throw new Error("INTERNAL ERROR: innerPath ("+t+") is not within outerPath ("+e+")")}function Vn(e,t){const n=xn(e,0),i=xn(t,0);for(let s=0;s<n.length&&s<i.length;s++){const e=Wt(n[s],i[s]);if(0!==e)return e}return n.length===i.length?0:n.length<i.length?-1:1}function qn(e,t){if(Pn(e)!==Pn(t))return!1;for(let n=e.pieceNum_,i=t.pieceNum_;n<=e.pieces_.length;n++,i++)if(e.pieces_[n]!==t.pieces_[i])return!1;return!0}function jn(e,t){let n=e.pieceNum_,i=t.pieceNum_;if(Pn(e)>Pn(t))return!1;for(;n<e.pieces_.length;){if(e.pieces_[n]!==t.pieces_[i])return!1;++n,++i}return!0}class Bn{constructor(e,t){this.errorPrefix_=t,this.parts_=xn(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let n=0;n<this.parts_.length;n++)this.byteLength_+=G(this.parts_[n]);zn(this)}}function zn(e){if(e.byteLength_>768)throw new Error(e.errorPrefix_+"has a key path longer than 768 bytes ("+e.byteLength_+").");if(e.parts_.length>32)throw new Error(e.errorPrefix_+"path specified exceeds the maximum depth that can be written (32) or object contains a cycle "+$n(e))}function $n(e){return 0===e.parts_.length?"":"in property '"+e.parts_.join(".")+"'"}
/**
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
 */class Hn extends Sn{static getInstance(){return new Hn}constructor(){let e,t;super(["visible"]),"undefined"!=typeof document&&void 0!==document.addEventListener&&(void 0!==document.hidden?(t="visibilitychange",e="hidden"):void 0!==document.mozHidden?(t="mozvisibilitychange",e="mozHidden"):void 0!==document.msHidden?(t="msvisibilitychange",e="msHidden"):void 0!==document.webkitHidden&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const t=!document[e];t!==this.visible_&&(this.visible_=t,this.trigger("visible",t))},!1)}getInitialEvent(e){return i("visible"===e,"Unknown event type: "+e),[this.visible_]}}
/**
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
 */const Wn=1e3;class Kn extends Cn{constructor(e,t,n,i,s,r,o,a){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=n,this.onConnectStatus_=i,this.onServerInfoUpdate_=s,this.authTokenProvider_=r,this.appCheckTokenProvider_=o,this.authOverride_=a,this.id=Kn.nextPersistentConnectionId_++,this.log_=Vt("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Wn,this.maxReconnectDelay_=3e5,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,a)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Hn.getInstance().on("visible",this.onVisible_,this),-1===e.host.indexOf("fblocal")&&kn.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,n){const s=++this.requestNumber_,r={r:s,a:e,b:t};this.log_(O(r)),i(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),n&&(this.requestCBHash_[s]=n)}get(e){this.initConnection_();const t=new v,n={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:e=>{const n=e.d;"ok"===e.s?t.resolve(n):t.reject(n)}};this.outstandingGets_.push(n),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,n,s){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),i(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),i(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:t,query:e,tag:n};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,n=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,0===this.outstandingGetCount_&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(n)})}sendListen_(e){const t=e.query,n=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+n+" for "+i);const s={p:n};e.tag&&(s.q=t._queryObject,s.t=e.tag),s.h=e.hashFn(),this.sendRequest("q",s,s=>{const r=s.d,o=s.s;Kn.warnOnListenWarnings_(r,t),(this.listens.get(n)&&this.listens.get(n).get(i))===e&&(this.log_("listen response",s),"ok"!==o&&this.removeListen_(n,i),e.onComplete&&e.onComplete(o,r))})}static warnOnListenWarnings_(e,t){if(e&&"object"==typeof e&&L(e,"w")){const n=M(e,"w");if(Array.isArray(n)&&~n.indexOf("no_index")){const e='".indexOn": "'+t._queryParams.getIndex().toString()+'"',n=t._path.toString();Bt(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${e} at ${n} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&40===e.length||function(e){const t=x(e).claims;return"object"==typeof t&&!0===t.admin}(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=3e4)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=function(e){const t=x(e).claims;return!!t&&"object"==typeof t&&t.hasOwnProperty("iat")}(e)?"auth":"gauth",n={cred:e};null===this.authOverride_?n.noauth=!0:"object"==typeof this.authOverride_&&(n.authvar=this.authOverride_),this.sendRequest(t,n,t=>{const n=t.s,i=t.d||"error";this.authToken_===e&&("ok"===n?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(n,i))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,n=e.d||"error";"ok"===t?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,n)})}unlisten(e,t){const n=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+n+" "+s),i(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(n,s)&&this.connected_&&this.sendUnlisten_(n,s,e._queryObject,t)}sendUnlisten_(e,t,n,i){this.log_("Unlisten on "+e+" for "+t);const s={p:e};i&&(s.q=n,s.t=i),this.sendRequest("n",s)}onDisconnectPut(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:n})}onDisconnectMerge(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:n})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,n,i){const s={p:t,d:n};this.log_("onDisconnect "+e,s),this.sendRequest(e,s,e=>{i&&setTimeout(()=>{i(e.s,e.d)},Math.floor(0))})}put(e,t,n,i){this.putInternal("p",e,t,n,i)}merge(e,t,n,i){this.putInternal("m",e,t,n,i)}putInternal(e,t,n,i,s){this.initConnection_();const r={p:t,d:n};void 0!==s&&(r.h=s),this.outstandingPuts_.push({action:e,request:r,onComplete:i}),this.outstandingPutCount_++;const o=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(o):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,n=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,n,n=>{this.log_(t+" response",n),delete this.outstandingPuts_[e],this.outstandingPutCount_--,0===this.outstandingPutCount_&&(this.outstandingPuts_=[]),i&&i(n.s,n.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,e=>{if("ok"!==e.s){const t=e.d;this.log_("reportStats","Error sending stats: "+t)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+O(e));const t=e.r,n=this.requestCBHash_[t];n&&(delete this.requestCBHash_[t],n(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),"d"===e?this.onDataUpdate_(t.p,t.d,!1,t.t):"m"===e?this.onDataUpdate_(t.p,t.d,!0,t.t):"c"===e?this.onListenRevoked_(t.p,t.q):"ac"===e?this.onAuthRevoked_(t.s,t.d):"apc"===e?this.onAppCheckRevoked_(t.s,t.d):"sd"===e?this.onSecurityDebugPacket_(t):qt("Unrecognized action received from server: "+O(e)+"\nAre you using the latest client?")}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=(new Date).getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){i(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Wn,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Wn,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&((new Date).getTime()-this.lastConnectionEstablishedTime_>3e4&&(this.reconnectDelay_=Wn),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=(new Date).getTime());const e=Math.max(0,(new Date).getTime()-this.lastConnectionAttemptTime_);let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,1.3*this.reconnectDelay_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=(new Date).getTime(),this.lastConnectionEstablishedTime_=null;const t=this.onDataMessage_.bind(this),n=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),r=this.id+":"+Kn.nextConnectionId_++,o=this.lastSessionId;let a=!1,c=null;const h=function(){c?c.close():(a=!0,s())},l=function(e){i(c,"sendRequest call when we're not connected not allowed."),c.sendRequest(e)};this.realtime_={close:h,sendRequest:l};const u=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[e,i]=await Promise.all([this.authTokenProvider_.getToken(u),this.appCheckTokenProvider_.getToken(u)]);a?Ft("getToken() completed but was canceled"):(Ft("getToken() completed. Creating connection."),this.authToken_=e&&e.accessToken,this.appCheckToken_=i&&i.token,c=new bn(r,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,t,n,s,e=>{Bt(e+" ("+this.repoInfo_.toString()+")"),this.interrupt("server_kill")},o))}catch(e){this.log_("Failed to get token: "+e),a||(this.repoInfo_.nodeAdmin&&Bt(e),h())}}}interrupt(e){Ft("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Ft("Resuming connection for reason: "+e),delete this.interruptReasons_[e],U(this.interruptReasons_)&&(this.reconnectDelay_=Wn,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-(new Date).getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}0===this.outstandingPutCount_&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let n;n=t?t.map(e=>Qt(e)).join("$"):"default";const i=this.removeListen_(e,n);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const n=new Nn(e).toString();let i;if(this.listens.has(n)){const e=this.listens.get(n);i=e.get(t),e.delete(t),0===e.size&&this.listens.delete(n)}else i=void 0;return i}onAuthRevoked_(e,t){Ft("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=3&&(this.reconnectDelay_=3e4,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Ft("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=3&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_&&this.securityDebugCallback_(e)}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};e["sdk.js."+St.replace(/\./g,"-")]=1,k()?e["framework.cordova"]=1:N()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=kn.getInstance().currentlyOnline();return U(this.interruptReasons_)&&e}}Kn.nextPersistentConnectionId_=0,Kn.nextConnectionId_=0;
/**
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
 */
class Gn{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Gn(e,t)}}
/**
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
 */class Qn{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const n=new Gn($t,e),i=new Gn($t,t);return 0!==this.compare(n,i)}minPost(){return Gn.MIN}}
/**
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
 */let Yn;class Xn extends Qn{static get __EMPTY_NODE(){return Yn}static set __EMPTY_NODE(e){Yn=e}compare(e,t){return Wt(e.name,t.name)}isDefinedOn(e){throw s("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return Gn.MIN}maxPost(){return new Gn(Ht,Yn)}makePost(e,t){return i("string"==typeof e,"KeyIndex indexValue must always be a string."),new Gn(e,Yn)}toString(){return".key"}}const Jn=new Xn;
/**
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
 */let Zn=class{constructor(e,t,n,i,s=null){this.isReverse_=i,this.resultGenerator_=s,this.nodeStack_=[];let r=1;for(;!e.isEmpty();)if(r=t?n(e.key,t):1,i&&(r*=-1),r<0)e=this.isReverse_?e.left:e.right;else{if(0===r){this.nodeStack_.push(e);break}this.nodeStack_.push(e),e=this.isReverse_?e.right:e.left}}getNext(){if(0===this.nodeStack_.length)return null;let e,t=this.nodeStack_.pop();if(e=this.resultGenerator_?this.resultGenerator_(t.key,t.value):{key:t.key,value:t.value},this.isReverse_)for(t=t.left;!t.isEmpty();)this.nodeStack_.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack_.push(t),t=t.left;return e}hasNext(){return this.nodeStack_.length>0}peek(){if(0===this.nodeStack_.length)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}},ei=class e{constructor(t,n,i,s,r){this.key=t,this.value=n,this.color=null!=i?i:e.RED,this.left=null!=s?s:ni.EMPTY_NODE,this.right=null!=r?r:ni.EMPTY_NODE}copy(t,n,i,s,r){return new e(null!=t?t:this.key,null!=n?n:this.value,null!=i?i:this.color,null!=s?s:this.left,null!=r?r:this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let i=this;const s=n(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,n),null):0===s?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return ni.EMPTY_NODE;let e=this;return e.left.isRed_()||e.left.left.isRed_()||(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let n,i;if(n=this,t(e,n.key)<0)n.left.isEmpty()||n.left.isRed_()||n.left.left.isRed_()||(n=n.moveRedLeft_()),n=n.copy(null,null,null,n.left.remove(e,t),null);else{if(n.left.isRed_()&&(n=n.rotateRight_()),n.right.isEmpty()||n.right.isRed_()||n.right.left.isRed_()||(n=n.moveRedRight_()),0===t(e,n.key)){if(n.right.isEmpty())return ni.EMPTY_NODE;i=n.right.min_(),n=n.copy(i.key,i.value,null,null,n.right.removeMin_())}n=n.copy(null,null,null,null,n.right.remove(e,t))}return n.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const t=this.copy(null,null,e.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight_(){const t=this.copy(null,null,e.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}};ei.RED=!0,ei.BLACK=!1;let ti,ni=class e{constructor(t,n=e.EMPTY_NODE){this.comparator_=t,this.root_=n}insert(t,n){return new e(this.comparator_,this.root_.insert(t,n,this.comparator_).copy(null,null,ei.BLACK,null,null))}remove(t){return new e(this.comparator_,this.root_.remove(t,this.comparator_).copy(null,null,ei.BLACK,null,null))}get(e){let t,n=this.root_;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t)return n.value;t<0?n=n.left:t>0&&(n=n.right)}return null}getPredecessorKey(e){let t,n=this.root_,i=null;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t){if(n.left.isEmpty())return i?i.key:null;for(n=n.left;!n.right.isEmpty();)n=n.right;return n.key}t<0?n=n.left:t>0&&(i=n,n=n.right)}throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Zn(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Zn(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Zn(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Zn(this.root_,null,this.comparator_,!0,e)}};
/**
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
 */
function ii(e,t){return Wt(e.name,t.name)}function si(e,t){return Wt(e,t)}
/**
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
 */ni.EMPTY_NODE=new class{copy(e,t,n,i,s){return this}insert(e,t,n){return new ei(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}};const ri=function(e){return"number"==typeof e?"number:"+Jt(e):"string:"+e},oi=function(e){if(e.isLeafNode()){const t=e.val();i("string"==typeof t||"number"==typeof t||"object"==typeof t&&L(t,".sv"),"Priority must be a string or number.")}else i(e===ti||e.isEmpty(),"priority of unexpected type.");i(e===ti||e.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};
/**
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
 */
let ai,ci,hi;class li{static set __childrenNodeConstructor(e){ai=e}static get __childrenNodeConstructor(){return ai}constructor(e,t=li.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,i(void 0!==this.value_&&null!==this.value_,"LeafNode shouldn't be created with null/undefined value."),oi(this.priorityNode_)}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new li(this.value_,e)}getImmediateChild(e){return".priority"===e?this.priorityNode_:li.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return Un(e)?this:".priority"===Rn(e)?this.priorityNode_:li.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return".priority"===e?this.updatePriority(t):t.isEmpty()&&".priority"!==e?this:li.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const n=Rn(e);return null===n?t:t.isEmpty()&&".priority"!==n?this:(i(".priority"!==n||1===Pn(e),".priority must be the last token in a path"),this.updateImmediateChild(n,li.__childrenNodeConstructor.EMPTY_NODE.updateChild(Dn(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(null===this.lazyHash_){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+ri(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",e+="number"===t?Jt(this.value_):this.value_,this.lazyHash_=xt(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===li.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof li.__childrenNodeConstructor?-1:(i(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,n=typeof this.value_,s=li.VALUE_TYPE_ORDER.indexOf(t),r=li.VALUE_TYPE_ORDER.indexOf(n);return i(s>=0,"Unknown leaf type: "+t),i(r>=0,"Unknown leaf type: "+n),s===r?"object"===n?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}return!1}}li.VALUE_TYPE_ORDER=["object","boolean","number","string"];const ui=new class extends Qn{compare(e,t){const n=e.node.getPriority(),i=t.node.getPriority(),s=n.compareTo(i);return 0===s?Wt(e.name,t.name):s}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Gn.MIN}maxPost(){return new Gn(Ht,new li("[PRIORITY-POST]",hi))}makePost(e,t){const n=ci(e);return new Gn(t,new li("[PRIORITY-POST]",n))}toString(){return".priority"}},di=Math.log(2);
/**
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
 */class fi{constructor(e){var t;this.count=(t=e+1,parseInt(Math.log(t)/di,10)),this.current_=this.count-1;const n=(i=this.count,parseInt(Array(i+1).join("1"),2));var i;this.bits_=e+1&n}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const pi=function(e,t,n,i){e.sort(t);const s=function(t,i){const r=i-t;let o,a;if(0===r)return null;if(1===r)return o=e[t],a=n?n(o):o,new ei(a,o.node,ei.BLACK,null,null);{const c=parseInt(r/2,10)+t,h=s(t,c),l=s(c+1,i);return o=e[c],a=n?n(o):o,new ei(a,o.node,ei.BLACK,h,l)}},r=function(t){let i=null,r=null,o=e.length;const a=function(t,i){const r=o-t,a=o;o-=t;const h=s(r+1,a),l=e[r],u=n?n(l):l;c(new ei(u,l.node,i,null,h))},c=function(e){i?(i.left=e,i=e):(r=e,i=e)};for(let e=0;e<t.count;++e){const n=t.nextBitIsOne(),i=Math.pow(2,t.count-(e+1));n?a(i,ei.BLACK):(a(i,ei.BLACK),a(i,ei.RED))}return r}(new fi(e.length));return new ni(i||t,r)};
/**
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
 */let gi;const mi={};class _i{static get Default(){return i(mi&&ui,"ChildrenNode.ts has not been loaded"),gi=gi||new _i({".priority":mi},{".priority":ui}),gi}constructor(e,t){this.indexes_=e,this.indexSet_=t}get(e){const t=M(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof ni?t:null}hasIndex(e){return L(this.indexSet_,e.toString())}addIndex(e,t){i(e!==Jn,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const n=[];let s=!1;const r=t.getIterator(Gn.Wrap);let o,a=r.getNext();for(;a;)s=s||e.isDefinedOn(a.node),n.push(a),a=r.getNext();o=s?pi(n,e.getCompare()):mi;const c=e.toString(),h={...this.indexSet_};h[c]=e;const l={...this.indexes_};return l[c]=o,new _i(l,h)}addToIndexes(e,t){const n=F(this.indexes_,(n,s)=>{const r=M(this.indexSet_,s);if(i(r,"Missing index implementation for "+s),n===mi){if(r.isDefinedOn(e.node)){const n=[],i=t.getIterator(Gn.Wrap);let s=i.getNext();for(;s;)s.name!==e.name&&n.push(s),s=i.getNext();return n.push(e),pi(n,r.getCompare())}return mi}{const i=t.get(e.name);let s=n;return i&&(s=s.remove(new Gn(e.name,i))),s.insert(e,e.node)}});return new _i(n,this.indexSet_)}removeFromIndexes(e,t){const n=F(this.indexes_,n=>{if(n===mi)return n;{const i=t.get(e.name);return i?n.remove(new Gn(e.name,i)):n}});return new _i(n,this.indexSet_)}}
/**
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
 */let yi;class vi{static get EMPTY_NODE(){return yi||(yi=new vi(new ni(si),null,_i.Default))}constructor(e,t,n){this.children_=e,this.priorityNode_=t,this.indexMap_=n,this.lazyHash_=null,this.priorityNode_&&oi(this.priorityNode_),this.children_.isEmpty()&&i(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}isLeafNode(){return!1}getPriority(){return this.priorityNode_||yi}updatePriority(e){return this.children_.isEmpty()?this:new vi(this.children_,e,this.indexMap_)}getImmediateChild(e){if(".priority"===e)return this.getPriority();{const t=this.children_.get(e);return null===t?yi:t}}getChild(e){const t=Rn(e);return null===t?this:this.getImmediateChild(t).getChild(Dn(e))}hasChild(e){return null!==this.children_.get(e)}updateImmediateChild(e,t){if(i(t,"We should always be passing snapshot nodes"),".priority"===e)return this.updatePriority(t);{const n=new Gn(e,t);let i,s;t.isEmpty()?(i=this.children_.remove(e),s=this.indexMap_.removeFromIndexes(n,this.children_)):(i=this.children_.insert(e,t),s=this.indexMap_.addToIndexes(n,this.children_));const r=i.isEmpty()?yi:this.priorityNode_;return new vi(i,r,s)}}updateChild(e,t){const n=Rn(e);if(null===n)return t;{i(".priority"!==Rn(e)||1===Pn(e),".priority must be the last token in a path");const s=this.getImmediateChild(n).updateChild(Dn(e),t);return this.updateImmediateChild(n,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let n=0,i=0,s=!0;if(this.forEachChild(ui,(r,o)=>{t[r]=o.val(e),n++,s&&vi.INTEGER_REGEXP_.test(r)?i=Math.max(i,Number(r)):s=!1}),!e&&s&&i<2*n){const e=[];for(const n in t)e[n]=t[n];return e}return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(null===this.lazyHash_){let e="";this.getPriority().isEmpty()||(e+="priority:"+ri(this.getPriority().val())+":"),this.forEachChild(ui,(t,n)=>{const i=n.hash();""!==i&&(e+=":"+t+":"+i)}),this.lazyHash_=""===e?"":xt(e)}return this.lazyHash_}getPredecessorChildName(e,t,n){const i=this.resolveIndex_(n);if(i){const n=i.getPredecessorKey(new Gn(e,t));return n?n.name:null}return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.minKey();return e&&e.name}return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Gn(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.maxKey();return e&&e.name}return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Gn(t,this.children_.get(t)):null}forEachChild(e,t){const n=this.resolveIndex_(e);return n?n.inorderTraversal(e=>t(e.name,e.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getIteratorFrom(e,e=>e);{const n=this.children_.getIteratorFrom(e.name,Gn.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)<0;)n.getNext(),i=n.peek();return n}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getReverseIteratorFrom(e,e=>e);{const n=this.children_.getReverseIteratorFrom(e.name,Gn.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)>0;)n.getNext(),i=n.peek();return n}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===wi?-1:0}withIndex(e){if(e===Jn||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new vi(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Jn||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority())){if(this.children_.count()===t.children_.count()){const e=this.getIterator(ui),n=t.getIterator(ui);let i=e.getNext(),s=n.getNext();for(;i&&s;){if(i.name!==s.name||!i.node.equals(s.node))return!1;i=e.getNext(),s=n.getNext()}return null===i&&null===s}return!1}return!1}}resolveIndex_(e){return e===Jn?null:this.indexMap_.get(e.toString())}}vi.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;const wi=new class extends vi{constructor(){super(new ni(si),vi.EMPTY_NODE,_i.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return vi.EMPTY_NODE}isEmpty(){return!1}};function Ti(e,t=null){if(null===e)return vi.EMPTY_NODE;if("object"==typeof e&&".priority"in e&&(t=e[".priority"]),i(null===t||"string"==typeof t||"number"==typeof t||"object"==typeof t&&".sv"in t,"Invalid priority type found: "+typeof t),"object"==typeof e&&".value"in e&&null!==e[".value"]&&(e=e[".value"]),"object"!=typeof e||".sv"in e)return new li(e,Ti(t));if(e instanceof Array){let n=vi.EMPTY_NODE;return Xt(e,(t,i)=>{if(L(e,t)&&"."!==t.substring(0,1)){const e=Ti(i);!e.isLeafNode()&&e.isEmpty()||(n=n.updateImmediateChild(t,e))}}),n.updatePriority(Ti(t))}{const n=[];let i=!1;if(Xt(e,(e,t)=>{if("."!==e.substring(0,1)){const s=Ti(t);s.isEmpty()||(i=i||!s.getPriority().isEmpty(),n.push(new Gn(e,s)))}}),0===n.length)return vi.EMPTY_NODE;const s=pi(n,ii,e=>e.name,si);if(i){const e=pi(n,ui.getCompare());return new vi(s,Ti(t),new _i({".priority":e},{".priority":ui}))}return new vi(s,Ti(t),_i.Default)}}Object.defineProperties(Gn,{MIN:{value:new Gn($t,vi.EMPTY_NODE)},MAX:{value:new Gn(Ht,wi)}}),Xn.__EMPTY_NODE=vi.EMPTY_NODE,li.__childrenNodeConstructor=vi,ti=wi,hi=wi,ci=Ti;
/**
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
 */
class Ii extends Qn{constructor(e){super(),this.indexPath_=e,i(!Un(e)&&".priority"!==Rn(e),"Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const n=this.extractChild(e.node),i=this.extractChild(t.node),s=n.compareTo(i);return 0===s?Wt(e.name,t.name):s}makePost(e,t){const n=Ti(e),i=vi.EMPTY_NODE.updateChild(this.indexPath_,n);return new Gn(t,i)}maxPost(){const e=vi.EMPTY_NODE.updateChild(this.indexPath_,wi);return new Gn(Ht,e)}toString(){return xn(this.indexPath_,0).join("/")}}
/**
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
 */const Ei=new class extends Qn{compare(e,t){const n=e.node.compareTo(t.node);return 0===n?Wt(e.name,t.name):n}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Gn.MIN}maxPost(){return Gn.MAX}makePost(e,t){const n=Ti(e);return new Gn(t,n)}toString(){return".value"}};
/**
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
 */function bi(e){return{type:"value",snapshotNode:e}}function Ci(e,t){return{type:"child_added",snapshotNode:t,childName:e}}function Si(e,t){return{type:"child_removed",snapshotNode:t,childName:e}}function ki(e,t,n){return{type:"child_changed",snapshotNode:t,childName:e,oldSnap:n}}
/**
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
 */
class Ni{constructor(e){this.index_=e}updateChild(e,t,n,s,r,o){i(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(s).equals(n.getChild(s))&&a.isEmpty()===n.isEmpty()?e:(null!=o&&(n.isEmpty()?e.hasChild(t)?o.trackChildChange(Si(t,a)):i(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(Ci(t,n)):o.trackChildChange(ki(t,n,a))),e.isLeafNode()&&n.isEmpty()?e:e.updateImmediateChild(t,n).withIndex(this.index_))}updateFullNode(e,t,n){return null!=n&&(e.isLeafNode()||e.forEachChild(ui,(e,i)=>{t.hasChild(e)||n.trackChildChange(Si(e,i))}),t.isLeafNode()||t.forEachChild(ui,(t,i)=>{if(e.hasChild(t)){const s=e.getImmediateChild(t);s.equals(i)||n.trackChildChange(ki(t,i,s))}else n.trackChildChange(Ci(t,i))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?vi.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}
/**
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
 */class Ai{constructor(e){this.indexedFilter_=new Ni(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Ai.getStartPost_(e),this.endPost_=Ai.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,n=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&n}updateChild(e,t,n,i,s,r){return this.matches(new Gn(t,n))||(n=vi.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,n,i,s,r)}updateFullNode(e,t,n){t.isLeafNode()&&(t=vi.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(vi.EMPTY_NODE);const s=this;return t.forEachChild(ui,(e,t)=>{s.matches(new Gn(e,t))||(i=i.updateImmediateChild(e,vi.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}return e.getIndex().maxPost()}}
/**
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
 */class Ri{constructor(e){this.withinDirectionalStart=e=>this.reverse_?this.withinEndPost(e):this.withinStartPost(e),this.withinDirectionalEnd=e=>this.reverse_?this.withinStartPost(e):this.withinEndPost(e),this.withinStartPost=e=>{const t=this.index_.compare(this.rangedFilter_.getStartPost(),e);return this.startIsInclusive_?t<=0:t<0},this.withinEndPost=e=>{const t=this.index_.compare(e,this.rangedFilter_.getEndPost());return this.endIsInclusive_?t<=0:t<0},this.rangedFilter_=new Ai(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,n,i,s,r){return this.rangedFilter_.matches(new Gn(t,n))||(n=vi.EMPTY_NODE),e.getImmediateChild(t).equals(n)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,n,i,s,r):this.fullLimitUpdateChild_(e,t,n,s,r)}updateFullNode(e,t,n){let i;if(t.isLeafNode()||t.isEmpty())i=vi.EMPTY_NODE.withIndex(this.index_);else if(2*this.limit_<t.numChildren()&&t.isIndexed(this.index_)){let e;i=vi.EMPTY_NODE.withIndex(this.index_),e=this.reverse_?t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let n=0;for(;e.hasNext()&&n<this.limit_;){const t=e.getNext();if(this.withinDirectionalStart(t)){if(!this.withinDirectionalEnd(t))break;i=i.updateImmediateChild(t.name,t.node),n++}}}else{let e;i=t.withIndex(this.index_),i=i.updatePriority(vi.EMPTY_NODE),e=this.reverse_?i.getReverseIterator(this.index_):i.getIterator(this.index_);let n=0;for(;e.hasNext();){const t=e.getNext();n<this.limit_&&this.withinDirectionalStart(t)&&this.withinDirectionalEnd(t)?n++:i=i.updateImmediateChild(t.name,vi.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,n,s,r){let o;if(this.reverse_){const e=this.index_.getCompare();o=(t,n)=>e(n,t)}else o=this.index_.getCompare();const a=e;i(a.numChildren()===this.limit_,"");const c=new Gn(t,n),h=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),l=this.rangedFilter_.matches(c);if(a.hasChild(t)){const e=a.getImmediateChild(t);let i=s.getChildAfterChild(this.index_,h,this.reverse_);for(;null!=i&&(i.name===t||a.hasChild(i.name));)i=s.getChildAfterChild(this.index_,i,this.reverse_);const u=null==i?1:o(i,c);if(l&&!n.isEmpty()&&u>=0)return null!=r&&r.trackChildChange(ki(t,n,e)),a.updateImmediateChild(t,n);{null!=r&&r.trackChildChange(Si(t,e));const n=a.updateImmediateChild(t,vi.EMPTY_NODE);return null!=i&&this.rangedFilter_.matches(i)?(null!=r&&r.trackChildChange(Ci(i.name,i.node)),n.updateImmediateChild(i.name,i.node)):n}}return n.isEmpty()?e:l&&o(h,c)>=0?(null!=r&&(r.trackChildChange(Si(h.name,h.node)),r.trackChildChange(Ci(t,n))),a.updateImmediateChild(t,n).updateImmediateChild(h.name,vi.EMPTY_NODE)):e}}
/**
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
 */class Pi{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=ui}hasStart(){return this.startSet_}isViewFromLeft(){return""===this.viewFrom_?this.startSet_:"l"===this.viewFrom_}getIndexStartValue(){return i(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return i(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:$t}hasEnd(){return this.endSet_}getIndexEndValue(){return i(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return i(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Ht}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&""!==this.viewFrom_}getLimit(){return i(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===ui}copy(){const e=new Pi;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Di(e){const t={};if(e.isDefault())return t;let n;if(e.index_===ui?n="$priority":e.index_===Ei?n="$value":e.index_===Jn?n="$key":(i(e.index_ instanceof Ii,"Unrecognized index type!"),n=e.index_.toString()),t.orderBy=O(n),e.startSet_){const n=e.startAfterSet_?"startAfter":"startAt";t[n]=O(e.indexStartValue_),e.startNameSet_&&(t[n]+=","+O(e.indexStartName_))}if(e.endSet_){const n=e.endBeforeSet_?"endBefore":"endAt";t[n]=O(e.indexEndValue_),e.endNameSet_&&(t[n]+=","+O(e.indexEndName_))}return e.limitSet_&&(e.isViewFromLeft()?t.limitToFirst=e.limit_:t.limitToLast=e.limit_),t}function Oi(e){const t={};if(e.startSet_&&(t.sp=e.indexStartValue_,e.startNameSet_&&(t.sn=e.indexStartName_),t.sin=!e.startAfterSet_),e.endSet_&&(t.ep=e.indexEndValue_,e.endNameSet_&&(t.en=e.indexEndName_),t.ein=!e.endBeforeSet_),e.limitSet_){t.l=e.limit_;let n=e.viewFrom_;""===n&&(n=e.isViewFromLeft()?"l":"r"),t.vf=n}return e.index_!==ui&&(t.i=e.index_.toString()),t}
/**
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
 */class xi extends Cn{reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return void 0!==t?"tag$"+t:(i(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}constructor(e,t,n,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=n,this.appCheckTokenProvider_=i,this.log_=Vt("p:rest:"),this.listens_={}}listen(e,t,n,i){const s=e._path.toString();this.log_("Listen called for "+s+" "+e._queryIdentifier);const r=xi.getListenId_(e,n),o={};this.listens_[r]=o;const a=Di(e._queryParams);this.restRequest_(s+".json",a,(e,t)=>{let a=t;if(404===e&&(a=null,e=null),null===e&&this.onDataUpdate_(s,a,!1,n),M(this.listens_,r)===o){let t;t=e?401===e?"permission_denied":"rest_error:"+e:"ok",i(t,null)}})}unlisten(e,t){const n=xi.getListenId_(e,t);delete this.listens_[n]}get(e){const t=Di(e._queryParams),n=e._path.toString(),i=new v;return this.restRequest_(n+".json",t,(e,t)=>{let s=t;404===e&&(s=null,e=null),null===e?(this.onDataUpdate_(n,s,!1,null),i.resolve(s)):i.reject(new Error(s))}),i.promise}refreshAuthToken(e){}restRequest_(t,n={},i){return n.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,r])=>{s&&s.accessToken&&(n.auth=s.accessToken),r&&r.token&&(n.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+t+"?ns="+this.repoInfo_.namespace+j(n);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(i&&4===a.readyState){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let t=null;if(a.status>=200&&a.status<300){try{t=D(a.responseText)}catch(e){Bt("Failed to parse JSON response for "+o+": "+a.responseText)}i(null,t)}else 401!==a.status&&404!==a.status&&Bt("Got unsuccessful REST response for "+o+" Status: "+a.status),i(a.status);i=null}},a.open("GET",o,!0),a.send()})}}
/**
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
 */class Li{constructor(){this.rootNode_=vi.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}
/**
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
 */function Mi(){return{value:null,children:new Map}}function Ui(e,t,n){if(Un(t))e.value=n,e.children.clear();else if(null!==e.value)e.value=e.value.updateChild(t,n);else{const i=Rn(t);e.children.has(i)||e.children.set(i,Mi()),Ui(e.children.get(i),t=Dn(t),n)}}function Fi(e,t){if(Un(t))return e.value=null,e.children.clear(),!0;if(null!==e.value){if(e.value.isLeafNode())return!1;{const n=e.value;return e.value=null,n.forEachChild(ui,(t,n)=>{Ui(e,new Nn(t),n)}),Fi(e,t)}}if(e.children.size>0){const n=Rn(t);return t=Dn(t),e.children.has(n)&&Fi(e.children.get(n),t)&&e.children.delete(n),0===e.children.size}return!0}function Vi(e,t,n){null!==e.value?n(t,e.value):function(e,t){e.children.forEach((e,n)=>{t(n,e)})}
/**
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
 */(e,(e,i)=>{Vi(i,new Nn(t.toString()+"/"+e),n)})}class qi{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t={...e};return this.last_&&Xt(this.last_,(e,n)=>{t[e]=t[e]-n}),this.last_=e,t}}
/**
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
 */class ji{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new qi(e);const n=1e4+2e4*Math.random();nn(this.reportStats_.bind(this),Math.floor(n))}reportStats_(){const e=this.statsListener_.get(),t={};let n=!1;Xt(e,(e,i)=>{i>0&&L(this.statsToReport_,e)&&(t[e]=i,n=!0)}),n&&this.server_.reportStats(t),nn(this.reportStats_.bind(this),Math.floor(2*Math.random()*3e5))}}
/**
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
 */var Bi,zi;function $i(e){return{fromUser:!1,fromServer:!0,queryId:e,tagged:!0}}
/**
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
 */(zi=Bi||(Bi={}))[zi.OVERWRITE=0]="OVERWRITE",zi[zi.MERGE=1]="MERGE",zi[zi.ACK_USER_WRITE=2]="ACK_USER_WRITE",zi[zi.LISTEN_COMPLETE=3]="LISTEN_COMPLETE";class Hi{constructor(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=Bi.ACK_USER_WRITE,this.source={fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}operationForChild(e){if(Un(this.path)){if(null!=this.affectedTree.value)return i(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new Nn(e));return new Hi(An(),t,this.revert)}}return i(Rn(this.path)===e,"operationForChild called for unrelated child."),new Hi(Dn(this.path),this.affectedTree,this.revert)}}
/**
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
 */class Wi{constructor(e,t){this.source=e,this.path=t,this.type=Bi.LISTEN_COMPLETE}operationForChild(e){return Un(this.path)?new Wi(this.source,An()):new Wi(this.source,Dn(this.path))}}
/**
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
 */class Ki{constructor(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=Bi.OVERWRITE}operationForChild(e){return Un(this.path)?new Ki(this.source,An(),this.snap.getImmediateChild(e)):new Ki(this.source,Dn(this.path),this.snap)}}
/**
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
 */class Gi{constructor(e,t,n){this.source=e,this.path=t,this.children=n,this.type=Bi.MERGE}operationForChild(e){if(Un(this.path)){const t=this.children.subtree(new Nn(e));return t.isEmpty()?null:t.value?new Ki(this.source,An(),t.value):new Gi(this.source,An(),t)}return i(Rn(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Gi(this.source,Dn(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}
/**
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
 */class Qi{constructor(e,t,n){this.node_=e,this.fullyInitialized_=t,this.filtered_=n}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(Un(e))return this.isFullyInitialized()&&!this.filtered_;const t=Rn(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}
/**
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
 */class Yi{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function Xi(e,t,n,i,r,o){const a=i.filter(e=>e.type===n);a.sort((t,n)=>function(e,t,n){if(null==t.childName||null==n.childName)throw s("Should only compare child_ events.");const i=new Gn(t.childName,t.snapshotNode),r=new Gn(n.childName,n.snapshotNode);return e.index_.compare(i,r)}
/**
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
 */(e,t,n)),a.forEach(n=>{const i=function(e,t,n){return"value"===t.type||"child_removed"===t.type||(t.prevName=n.getPredecessorChildName(t.childName,t.snapshotNode,e.index_)),t}(e,n,o);r.forEach(s=>{s.respondsTo(n.type)&&t.push(s.createEvent(i,e.query_))})})}function Ji(e,t){return{eventCache:e,serverCache:t}}function Zi(e,t,n,i){return Ji(new Qi(t,n,i),e.serverCache)}function es(e,t,n,i){return Ji(e.eventCache,new Qi(t,n,i))}function ts(e){return e.eventCache.isFullyInitialized()?e.eventCache.getNode():null}function ns(e){return e.serverCache.isFullyInitialized()?e.serverCache.getNode():null}
/**
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
 */let is;class ss{static fromObject(e){let t=new ss(null);return Xt(e,(e,n)=>{t=t.set(new Nn(e),n)}),t}constructor(e,t=(()=>(is||(is=new ni(Kt)),is))()){this.value=e,this.children=t}isEmpty(){return null===this.value&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(null!=this.value&&t(this.value))return{path:An(),value:this.value};if(Un(e))return null;{const n=Rn(e),i=this.children.get(n);if(null!==i){const s=i.findRootMostMatchingPathAndValue(Dn(e),t);return null!=s?{path:Mn(new Nn(n),s.path),value:s.value}:null}return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(Un(e))return this;{const t=Rn(e),n=this.children.get(t);return null!==n?n.subtree(Dn(e)):new ss(null)}}set(e,t){if(Un(e))return new ss(t,this.children);{const n=Rn(e),i=(this.children.get(n)||new ss(null)).set(Dn(e),t),s=this.children.insert(n,i);return new ss(this.value,s)}}remove(e){if(Un(e))return this.children.isEmpty()?new ss(null):new ss(null,this.children);{const t=Rn(e),n=this.children.get(t);if(n){const i=n.remove(Dn(e));let s;return s=i.isEmpty()?this.children.remove(t):this.children.insert(t,i),null===this.value&&s.isEmpty()?new ss(null):new ss(this.value,s)}return this}}get(e){if(Un(e))return this.value;{const t=Rn(e),n=this.children.get(t);return n?n.get(Dn(e)):null}}setTree(e,t){if(Un(e))return t;{const n=Rn(e),i=(this.children.get(n)||new ss(null)).setTree(Dn(e),t);let s;return s=i.isEmpty()?this.children.remove(n):this.children.insert(n,i),new ss(this.value,s)}}fold(e){return this.fold_(An(),e)}fold_(e,t){const n={};return this.children.inorderTraversal((i,s)=>{n[i]=s.fold_(Mn(e,i),t)}),t(e,this.value,n)}findOnPath(e,t){return this.findOnPath_(e,An(),t)}findOnPath_(e,t,n){const i=!!this.value&&n(t,this.value);if(i)return i;if(Un(e))return null;{const i=Rn(e),s=this.children.get(i);return s?s.findOnPath_(Dn(e),Mn(t,i),n):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,An(),t)}foreachOnPath_(e,t,n){if(Un(e))return this;{this.value&&n(t,this.value);const i=Rn(e),s=this.children.get(i);return s?s.foreachOnPath_(Dn(e),Mn(t,i),n):new ss(null)}}foreach(e){this.foreach_(An(),e)}foreach_(e,t){this.children.inorderTraversal((n,i)=>{i.foreach_(Mn(e,n),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,n)=>{n.value&&e(t,n.value)})}}
/**
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
 */class rs{constructor(e){this.writeTree_=e}static empty(){return new rs(new ss(null))}}function os(e,t,n){if(Un(t))return new rs(new ss(n));{const i=e.writeTree_.findRootMostValueAndPath(t);if(null!=i){const s=i.path;let r=i.value;const o=Fn(s,t);return r=r.updateChild(o,n),new rs(e.writeTree_.set(s,r))}{const i=new ss(n),s=e.writeTree_.setTree(t,i);return new rs(s)}}}function as(e,t,n){let i=e;return Xt(n,(e,n)=>{i=os(i,Mn(t,e),n)}),i}function cs(e,t){if(Un(t))return rs.empty();{const n=e.writeTree_.setTree(t,new ss(null));return new rs(n)}}function hs(e,t){return null!=ls(e,t)}function ls(e,t){const n=e.writeTree_.findRootMostValueAndPath(t);return null!=n?e.writeTree_.get(n.path).getChild(Fn(n.path,t)):null}function us(e){const t=[],n=e.writeTree_.value;return null!=n?n.isLeafNode()||n.forEachChild(ui,(e,n)=>{t.push(new Gn(e,n))}):e.writeTree_.children.inorderTraversal((e,n)=>{null!=n.value&&t.push(new Gn(e,n.value))}),t}function ds(e,t){if(Un(t))return e;{const n=ls(e,t);return new rs(null!=n?new ss(n):e.writeTree_.subtree(t))}}function fs(e){return e.writeTree_.isEmpty()}function ps(e,t){return gs(An(),e.writeTree_,t)}function gs(e,t,n){if(null!=t.value)return n.updateChild(e,t.value);{let s=null;return t.children.inorderTraversal((t,r)=>{".priority"===t?(i(null!==r.value,"Priority writes must always be leaf nodes"),s=r.value):n=gs(Mn(e,t),r,n)}),n.getChild(e).isEmpty()||null===s||(n=n.updateChild(Mn(e,".priority"),s)),n}}
/**
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
 */function ms(e,t){return ks(t,e)}function _s(e,t){if(e.snap)return jn(e.path,t);for(const n in e.children)if(e.children.hasOwnProperty(n)&&jn(Mn(e.path,n),t))return!0;return!1}function ys(e){return e.visible}function vs(e,t,n){let i=rs.empty();for(let r=0;r<e.length;++r){const o=e[r];if(t(o)){const e=o.path;let t;if(o.snap)jn(n,e)?(t=Fn(n,e),i=os(i,t,o.snap)):jn(e,n)&&(t=Fn(e,n),i=os(i,An(),o.snap.getChild(t)));else{if(!o.children)throw s("WriteRecord should have .snap or .children");if(jn(n,e))t=Fn(n,e),i=as(i,t,o.children);else if(jn(e,n))if(t=Fn(e,n),Un(t))i=as(i,An(),o.children);else{const e=M(o.children,Rn(t));if(e){const n=e.getChild(Dn(t));i=os(i,An(),n)}}}}}return i}function ws(e,t,n,i,s){if(i||s){const r=ds(e.visibleWrites,t);if(!s&&fs(r))return n;if(s||null!=n||hs(r,An())){const r=function(e){return(e.visible||s)&&(!i||!~i.indexOf(e.writeId))&&(jn(e.path,t)||jn(t,e.path))};return ps(vs(e.allWrites,r,t),n||vi.EMPTY_NODE)}return null}{const i=ls(e.visibleWrites,t);if(null!=i)return i;{const i=ds(e.visibleWrites,t);return fs(i)?n:null!=n||hs(i,An())?ps(i,n||vi.EMPTY_NODE):null}}}function Ts(e,t,n,i){return ws(e.writeTree,e.treePath,t,n,i)}function Is(e,t){return function(e,t,n){let i=vi.EMPTY_NODE;const s=ls(e.visibleWrites,t);if(s)return s.isLeafNode()||s.forEachChild(ui,(e,t)=>{i=i.updateImmediateChild(e,t)}),i;if(n){const s=ds(e.visibleWrites,t);return n.forEachChild(ui,(e,t)=>{const n=ps(ds(s,new Nn(e)),t);i=i.updateImmediateChild(e,n)}),us(s).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}return us(ds(e.visibleWrites,t)).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}(e.writeTree,e.treePath,t)}function Es(e,t,n,s){return function(e,t,n,s,r){i(s||r,"Either existingEventSnap or existingServerSnap must exist");const o=Mn(t,n);if(hs(e.visibleWrites,o))return null;{const t=ds(e.visibleWrites,o);return fs(t)?r.getChild(n):ps(t,r.getChild(n))}}(e.writeTree,e.treePath,t,n,s)}function bs(e,t){return function(e,t){return ls(e.visibleWrites,t)}(e.writeTree,Mn(e.treePath,t))}function Cs(e,t,n){return function(e,t,n,i){const s=Mn(t,n),r=ls(e.visibleWrites,s);return null!=r?r:i.isCompleteForChild(n)?ps(ds(e.visibleWrites,s),i.getNode().getImmediateChild(n)):null}(e.writeTree,e.treePath,t,n)}function Ss(e,t){return ks(Mn(e.treePath,t),e.writeTree)}function ks(e,t){return{treePath:e,writeTree:t}}
/**
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
 */class Ns{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,n=e.childName;i("child_added"===t||"child_changed"===t||"child_removed"===t,"Only child changes supported for tracking"),i(".priority"!==n,"Only non-priority child changes can be tracked.");const r=this.changeMap.get(n);if(r){const i=r.type;if("child_added"===t&&"child_removed"===i)this.changeMap.set(n,ki(n,e.snapshotNode,r.snapshotNode));else if("child_removed"===t&&"child_added"===i)this.changeMap.delete(n);else if("child_removed"===t&&"child_changed"===i)this.changeMap.set(n,Si(n,r.oldSnap));else if("child_changed"===t&&"child_added"===i)this.changeMap.set(n,Ci(n,e.snapshotNode));else{if("child_changed"!==t||"child_changed"!==i)throw s("Illegal combination of changes: "+e+" occurred after "+r);this.changeMap.set(n,ki(n,e.snapshotNode,r.oldSnap))}}else this.changeMap.set(n,e)}getChanges(){return Array.from(this.changeMap.values())}}
/**
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
 */const As=new class{getCompleteChild(e){return null}getChildAfterChild(e,t,n){return null}};class Rs{constructor(e,t,n=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=n}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const t=null!=this.optCompleteServerCache_?new Qi(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Cs(this.writes_,e,t)}}getChildAfterChild(e,t,n){const i=null!=this.optCompleteServerCache_?this.optCompleteServerCache_:ns(this.viewCache_),s=function(e,t,n,i,s,r){return function(e,t,n,i,s,r,o){let a;const c=ds(e.visibleWrites,t),h=ls(c,An());if(null!=h)a=h;else{if(null==n)return[];a=ps(c,n)}if(a=a.withIndex(o),a.isEmpty()||a.isLeafNode())return[];{const e=[],t=o.getCompare(),n=r?a.getReverseIteratorFrom(i,o):a.getIteratorFrom(i,o);let c=n.getNext();for(;c&&e.length<s;)0!==t(c,i)&&e.push(c),c=n.getNext();return e}}(e.writeTree,e.treePath,t,n,i,s,r)}(this.writes_,i,t,1,n,e);return 0===s.length?null:s[0]}}
/**
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
 */function Ps(e,t,n,s,r,o){const a=t.eventCache;if(null!=bs(s,n))return t;{let c,h;if(Un(n))if(i(t.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),t.serverCache.isFiltered()){const n=ns(t),i=Is(s,n instanceof vi?n:vi.EMPTY_NODE);c=e.filter.updateFullNode(t.eventCache.getNode(),i,o)}else{const n=Ts(s,ns(t));c=e.filter.updateFullNode(t.eventCache.getNode(),n,o)}else{const l=Rn(n);if(".priority"===l){i(1===Pn(n),"Can't have a priority with additional path components");const r=a.getNode();h=t.serverCache.getNode();const o=Es(s,n,r,h);c=null!=o?e.filter.updatePriority(r,o):a.getNode()}else{const i=Dn(n);let u;if(a.isCompleteForChild(l)){h=t.serverCache.getNode();const e=Es(s,n,a.getNode(),h);u=null!=e?a.getNode().getImmediateChild(l).updateChild(i,e):a.getNode().getImmediateChild(l)}else u=Cs(s,l,t.serverCache);c=null!=u?e.filter.updateChild(a.getNode(),l,u,i,r,o):a.getNode()}}return Zi(t,c,a.isFullyInitialized()||Un(n),e.filter.filtersNodes())}}function Ds(e,t,n,i,s,r,o,a){const c=t.serverCache;let h;const l=o?e.filter:e.filter.getIndexedFilter();if(Un(n))h=l.updateFullNode(c.getNode(),i,null);else if(l.filtersNodes()&&!c.isFiltered()){const e=c.getNode().updateChild(n,i);h=l.updateFullNode(c.getNode(),e,null)}else{const e=Rn(n);if(!c.isCompleteForPath(n)&&Pn(n)>1)return t;const s=Dn(n),r=c.getNode().getImmediateChild(e).updateChild(s,i);h=".priority"===e?l.updatePriority(c.getNode(),r):l.updateChild(c.getNode(),e,r,s,As,null)}const u=es(t,h,c.isFullyInitialized()||Un(n),l.filtersNodes());return Ps(e,u,n,s,new Rs(s,u,r),a)}function Os(e,t,n,i,s,r,o){const a=t.eventCache;let c,h;const l=new Rs(s,t,r);if(Un(n))h=e.filter.updateFullNode(t.eventCache.getNode(),i,o),c=Zi(t,h,!0,e.filter.filtersNodes());else{const s=Rn(n);if(".priority"===s)h=e.filter.updatePriority(t.eventCache.getNode(),i),c=Zi(t,h,a.isFullyInitialized(),a.isFiltered());else{const r=Dn(n),h=a.getNode().getImmediateChild(s);let u;if(Un(r))u=i;else{const e=l.getCompleteChild(s);u=null!=e?".priority"===On(r)&&e.getChild(Ln(r)).isEmpty()?e:e.updateChild(r,i):vi.EMPTY_NODE}c=h.equals(u)?t:Zi(t,e.filter.updateChild(a.getNode(),s,u,r,l,o),a.isFullyInitialized(),e.filter.filtersNodes())}}return c}function xs(e,t){return e.eventCache.isCompleteForChild(t)}function Ls(e,t,n){return n.foreach((e,n)=>{t=t.updateChild(e,n)}),t}function Ms(e,t,n,i,s,r,o,a){if(t.serverCache.getNode().isEmpty()&&!t.serverCache.isFullyInitialized())return t;let c,h=t;c=Un(n)?i:new ss(null).setTree(n,i);const l=t.serverCache.getNode();return c.children.inorderTraversal((n,i)=>{if(l.hasChild(n)){const c=Ls(0,t.serverCache.getNode().getImmediateChild(n),i);h=Ds(e,h,new Nn(n),c,s,r,o,a)}}),c.children.inorderTraversal((n,i)=>{const c=!t.serverCache.isCompleteForChild(n)&&null===i.value;if(!l.hasChild(n)&&!c){const c=Ls(0,t.serverCache.getNode().getImmediateChild(n),i);h=Ds(e,h,new Nn(n),c,s,r,o,a)}}),h}
/**
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
 */
class Us{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const n=this.query_._queryParams,i=new Ni(n.getIndex()),s=(r=n).loadsAllData()?new Ni(r.getIndex()):r.hasLimit()?new Ri(r):new Ai(r);var r;this.processor_=function(e){return{filter:e}}(s);const o=t.serverCache,a=t.eventCache,c=i.updateFullNode(vi.EMPTY_NODE,o.getNode(),null),h=s.updateFullNode(vi.EMPTY_NODE,a.getNode(),null),l=new Qi(c,o.isFullyInitialized(),i.filtersNodes()),u=new Qi(h,a.isFullyInitialized(),s.filtersNodes());this.viewCache_=Ji(u,l),this.eventGenerator_=new Yi(this.query_)}get query(){return this.query_}}function Fs(e,t){const n=ns(e.viewCache_);return n&&(e.query._queryParams.loadsAllData()||!Un(t)&&!n.getImmediateChild(Rn(t)).isEmpty())?n.getChild(t):null}function Vs(e){return 0===e.eventRegistrations_.length}function qs(e,t,n){const s=[];if(n){i(null==t,"A cancel should cancel all event registrations.");const r=e.query._path;e.eventRegistrations_.forEach(e=>{const t=e.createCancelEvent(n,r);t&&s.push(t)})}if(t){let n=[];for(let i=0;i<e.eventRegistrations_.length;++i){const s=e.eventRegistrations_[i];if(s.matches(t)){if(t.hasAnyCallback()){n=n.concat(e.eventRegistrations_.slice(i+1));break}}else n.push(s)}e.eventRegistrations_=n}else e.eventRegistrations_=[];return s}function js(e,t,n,r){t.type===Bi.MERGE&&null!==t.source.queryId&&(i(ns(e.viewCache_),"We should always have a full cache before handling merges"),i(ts(e.viewCache_),"Missing event cache, even though we have a server cache"));const o=e.viewCache_,a=function(e,t,n,r,o){const a=new Ns;let c,h;if(n.type===Bi.OVERWRITE){const s=n;s.source.fromUser?c=Os(e,t,s.path,s.snap,r,o,a):(i(s.source.fromServer,"Unknown source."),h=s.source.tagged||t.serverCache.isFiltered()&&!Un(s.path),c=Ds(e,t,s.path,s.snap,r,o,h,a))}else if(n.type===Bi.MERGE){const s=n;s.source.fromUser?c=function(e,t,n,i,s,r,o){let a=t;return i.foreach((i,c)=>{const h=Mn(n,i);xs(t,Rn(h))&&(a=Os(e,a,h,c,s,r,o))}),i.foreach((i,c)=>{const h=Mn(n,i);xs(t,Rn(h))||(a=Os(e,a,h,c,s,r,o))}),a}(e,t,s.path,s.children,r,o,a):(i(s.source.fromServer,"Unknown source."),h=s.source.tagged||t.serverCache.isFiltered(),c=Ms(e,t,s.path,s.children,r,o,h,a))}else if(n.type===Bi.ACK_USER_WRITE){const s=n;c=s.revert?function(e,t,n,s,r,o){let a;if(null!=bs(s,n))return t;{const c=new Rs(s,t,r),h=t.eventCache.getNode();let l;if(Un(n)||".priority"===Rn(n)){let n;if(t.serverCache.isFullyInitialized())n=Ts(s,ns(t));else{const e=t.serverCache.getNode();i(e instanceof vi,"serverChildren would be complete if leaf node"),n=Is(s,e)}l=e.filter.updateFullNode(h,n,o)}else{const i=Rn(n);let r=Cs(s,i,t.serverCache);null==r&&t.serverCache.isCompleteForChild(i)&&(r=h.getImmediateChild(i)),l=null!=r?e.filter.updateChild(h,i,r,Dn(n),c,o):t.eventCache.getNode().hasChild(i)?e.filter.updateChild(h,i,vi.EMPTY_NODE,Dn(n),c,o):h,l.isEmpty()&&t.serverCache.isFullyInitialized()&&(a=Ts(s,ns(t)),a.isLeafNode()&&(l=e.filter.updateFullNode(l,a,o)))}return a=t.serverCache.isFullyInitialized()||null!=bs(s,An()),Zi(t,l,a,e.filter.filtersNodes())}}(e,t,s.path,r,o,a):function(e,t,n,i,s,r,o){if(null!=bs(s,n))return t;const a=t.serverCache.isFiltered(),c=t.serverCache;if(null!=i.value){if(Un(n)&&c.isFullyInitialized()||c.isCompleteForPath(n))return Ds(e,t,n,c.getNode().getChild(n),s,r,a,o);if(Un(n)){let i=new ss(null);return c.getNode().forEachChild(Jn,(e,t)=>{i=i.set(new Nn(e),t)}),Ms(e,t,n,i,s,r,a,o)}return t}{let h=new ss(null);return i.foreach((e,t)=>{const i=Mn(n,e);c.isCompleteForPath(i)&&(h=h.set(e,c.getNode().getChild(i)))}),Ms(e,t,n,h,s,r,a,o)}}(e,t,s.path,s.affectedTree,r,o,a)}else{if(n.type!==Bi.LISTEN_COMPLETE)throw s("Unknown operation type: "+n.type);c=function(e,t,n,i,s){const r=t.serverCache;return Ps(e,es(t,r.getNode(),r.isFullyInitialized()||Un(n),r.isFiltered()),n,i,As,s)}(e,t,n.path,r,a)}const l=a.getChanges();return function(e,t,n){const i=t.eventCache;if(i.isFullyInitialized()){const s=i.getNode().isLeafNode()||i.getNode().isEmpty(),r=ts(e);(n.length>0||!e.eventCache.isFullyInitialized()||s&&!i.getNode().equals(r)||!i.getNode().getPriority().equals(r.getPriority()))&&n.push(bi(ts(t)))}}(t,c,l),{viewCache:c,changes:l}}(e.processor_,o,t,n,r);var c,h;return c=e.processor_,h=a.viewCache,i(h.eventCache.getNode().isIndexed(c.filter.getIndex()),"Event snap not indexed"),i(h.serverCache.getNode().isIndexed(c.filter.getIndex()),"Server snap not indexed"),i(a.viewCache.serverCache.isFullyInitialized()||!o.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),e.viewCache_=a.viewCache,Bs(e,a.changes,a.viewCache.eventCache.getNode(),null)}function Bs(e,t,n,i){const s=i?[i]:e.eventRegistrations_;return function(e,t,n,i){const s=[],r=[];return t.forEach(t=>{var n;"child_changed"===t.type&&e.index_.indexedValueChanged(t.oldSnap,t.snapshotNode)&&r.push((n=t.childName,{type:"child_moved",snapshotNode:t.snapshotNode,childName:n}))}),Xi(e,s,"child_removed",t,i,n),Xi(e,s,"child_added",t,i,n),Xi(e,s,"child_moved",r,i,n),Xi(e,s,"child_changed",t,i,n),Xi(e,s,"value",t,i,n),s}(e.eventGenerator_,t,n,s)}
/**
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
 */let zs,$s;class Hs{constructor(){this.views=new Map}}function Ws(e,t,n,s){const r=t.source.queryId;if(null!==r){const o=e.views.get(r);return i(null!=o,"SyncTree gave us an op for an invalid query."),js(o,t,n,s)}{let i=[];for(const r of e.views.values())i=i.concat(js(r,t,n,s));return i}}function Ks(e,t,n,i,s){const r=t._queryIdentifier,o=e.views.get(r);if(!o){let e=Ts(n,s?i:null),r=!1;e?r=!0:i instanceof vi?(e=Is(n,i),r=!1):(e=vi.EMPTY_NODE,r=!1);const o=Ji(new Qi(e,r,!1),new Qi(i,s,!1));return new Us(t,o)}return o}function Gs(e){const t=[];for(const n of e.views.values())n.query._queryParams.loadsAllData()||t.push(n);return t}function Qs(e,t){let n=null;for(const i of e.views.values())n=n||Fs(i,t);return n}function Ys(e,t){if(t._queryParams.loadsAllData())return Zs(e);{const n=t._queryIdentifier;return e.views.get(n)}}function Xs(e,t){return null!=Ys(e,t)}function Js(e){return null!=Zs(e)}function Zs(e){for(const t of e.views.values())if(t.query._queryParams.loadsAllData())return t;return null}
/**
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
 */let er=1;class tr{constructor(e){this.listenProvider_=e,this.syncPointTree_=new ss(null),this.pendingWriteTree_={visibleWrites:rs.empty(),allWrites:[],lastWriteId:-1},this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function nr(e,t,n,s,r){return function(e,t,n,s,r){i(s>e.lastWriteId,"Stacking an older write on top of newer ones"),void 0===r&&(r=!0),e.allWrites.push({path:t,snap:n,writeId:s,visible:r}),r&&(e.visibleWrites=os(e.visibleWrites,t,n)),e.lastWriteId=s}(e.pendingWriteTree_,t,n,s,r),r?hr(e,new Ki({fromUser:!0,fromServer:!1,queryId:null,tagged:!1},t,n)):[]}function ir(e,t,n=!1){const s=function(e,t){for(let n=0;n<e.allWrites.length;n++){const i=e.allWrites[n];if(i.writeId===t)return i}return null}(e.pendingWriteTree_,t);if(function(e,t){const n=e.allWrites.findIndex(e=>e.writeId===t);i(n>=0,"removeWrite called with nonexistent writeId.");const s=e.allWrites[n];e.allWrites.splice(n,1);let r=s.visible,o=!1,a=e.allWrites.length-1;for(;r&&a>=0;){const t=e.allWrites[a];t.visible&&(a>=n&&_s(t,s.path)?r=!1:jn(s.path,t.path)&&(o=!0)),a--}return!!r&&(o?(function(e){e.visibleWrites=vs(e.allWrites,ys,An()),e.allWrites.length>0?e.lastWriteId=e.allWrites[e.allWrites.length-1].writeId:e.lastWriteId=-1}(e),!0):(s.snap?e.visibleWrites=cs(e.visibleWrites,s.path):Xt(s.children,t=>{e.visibleWrites=cs(e.visibleWrites,Mn(s.path,t))}),!0))}(e.pendingWriteTree_,t)){let t=new ss(null);return null!=s.snap?t=t.set(An(),!0):Xt(s.children,e=>{t=t.set(new Nn(e),!0)}),hr(e,new Hi(s.path,t,n))}return[]}function sr(e,t,n){return hr(e,new Ki({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,n))}function rr(e,t,n,s,r=!1){const o=t._path,a=e.syncPointTree_.get(o);let c=[];if(a&&("default"===t._queryIdentifier||Xs(a,t))){const h=function(e,t,n,s){const r=t._queryIdentifier,o=[];let a=[];const c=Js(e);if("default"===r)for(const[i,h]of e.views.entries())a=a.concat(qs(h,n,s)),Vs(h)&&(e.views.delete(i),h.query._queryParams.loadsAllData()||o.push(h.query));else{const t=e.views.get(r);t&&(a=a.concat(qs(t,n,s)),Vs(t)&&(e.views.delete(r),t.query._queryParams.loadsAllData()||o.push(t.query)))}return c&&!Js(e)&&o.push(new(i(zs,"Reference.ts has not been loaded"),zs)(t._repo,t._path)),{removed:o,events:a}}(a,t,n,s);0===a.views.size&&(e.syncPointTree_=e.syncPointTree_.remove(o));const l=h.removed;if(c=h.events,!r){const n=-1!==l.findIndex(e=>e._queryParams.loadsAllData()),i=e.syncPointTree_.findOnPath(o,(e,t)=>Js(t));if(n&&!i){const t=e.syncPointTree_.subtree(o);if(!t.isEmpty()){const n=function(e){return e.fold((e,t,n)=>{if(t&&Js(t))return[Zs(t)];{let e=[];return t&&(e=Gs(t)),Xt(n,(t,n)=>{e=e.concat(n)}),e}})}(t);for(let t=0;t<n.length;++t){const i=n[t],s=i.query,r=dr(e,i);e.listenProvider_.startListening(yr(s),fr(e,s),r.hashFn,r.onComplete)}}}if(!i&&l.length>0&&!s)if(n){const n=null;e.listenProvider_.stopListening(yr(t),n)}else l.forEach(t=>{const n=e.queryToTagMap.get(pr(t));e.listenProvider_.stopListening(yr(t),n)})}!function(e,t){for(let n=0;n<t.length;++n){const i=t[n];if(!i._queryParams.loadsAllData()){const t=pr(i),n=e.queryToTagMap.get(t);e.queryToTagMap.delete(t),e.tagToQueryMap.delete(n)}}}(e,l)}return c}function or(e,t,n,i){const s=gr(e,i);if(null!=s){const i=mr(s),r=i.path,o=i.queryId,a=Fn(r,t);return _r(e,r,new Ki($i(o),a,n))}return[]}function ar(e,t,n,s=!1){const r=t._path;let o=null,a=!1;e.syncPointTree_.foreachOnPath(r,(e,t)=>{const n=Fn(e,r);o=o||Qs(t,n),a=a||Js(t)});let c,h=e.syncPointTree_.get(r);h?(a=a||Js(h),o=o||Qs(h,An())):(h=new Hs,e.syncPointTree_=e.syncPointTree_.set(r,h)),null!=o?c=!0:(c=!1,o=vi.EMPTY_NODE,e.syncPointTree_.subtree(r).foreachChild((e,t)=>{const n=Qs(t,An());n&&(o=o.updateImmediateChild(e,n))}));const l=Xs(h,t);if(!l&&!t._queryParams.loadsAllData()){const n=pr(t);i(!e.queryToTagMap.has(n),"View does not exist, but we have a tag");const s=er++;e.queryToTagMap.set(n,s),e.tagToQueryMap.set(s,n)}let u=function(e,t,n,i,s,r){const o=Ks(e,t,i,s,r);return e.views.has(t._queryIdentifier)||e.views.set(t._queryIdentifier,o),function(e,t){e.eventRegistrations_.push(t)}(o,n),function(e,t){const n=e.viewCache_.eventCache,i=[];return n.getNode().isLeafNode()||n.getNode().forEachChild(ui,(e,t)=>{i.push(Ci(e,t))}),n.isFullyInitialized()&&i.push(bi(n.getNode())),Bs(e,i,n.getNode(),t)}(o,n)}(h,t,n,ms(e.pendingWriteTree_,r),o,c);if(!l&&!a&&!s){const n=Ys(h,t);u=u.concat(function(e,t,n){const s=t._path,r=fr(e,t),o=dr(e,n),a=e.listenProvider_.startListening(yr(t),r,o.hashFn,o.onComplete),c=e.syncPointTree_.subtree(s);if(r)i(!Js(c.value),"If we're adding a query, it shouldn't be shadowed");else{const t=c.fold((e,t,n)=>{if(!Un(e)&&t&&Js(t))return[Zs(t).query];{let e=[];return t&&(e=e.concat(Gs(t).map(e=>e.query))),Xt(n,(t,n)=>{e=e.concat(n)}),e}});for(let n=0;n<t.length;++n){const i=t[n];e.listenProvider_.stopListening(yr(i),fr(e,i))}}return a}
/**
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
 */(e,t,n))}return u}function cr(e,t,n){const i=e.pendingWriteTree_,s=e.syncPointTree_.findOnPath(t,(e,n)=>{const i=Qs(n,Fn(e,t));if(i)return i});return ws(i,t,s,n,!0)}function hr(e,t){return lr(t,e.syncPointTree_,null,ms(e.pendingWriteTree_,An()))}function lr(e,t,n,i){if(Un(e.path))return ur(e,t,n,i);{const s=t.get(An());null==n&&null!=s&&(n=Qs(s,An()));let r=[];const o=Rn(e.path),a=e.operationForChild(o),c=t.children.get(o);if(c&&a){const e=n?n.getImmediateChild(o):null,t=Ss(i,o);r=r.concat(lr(a,c,e,t))}return s&&(r=r.concat(Ws(s,e,i,n))),r}}function ur(e,t,n,i){const s=t.get(An());null==n&&null!=s&&(n=Qs(s,An()));let r=[];return t.children.inorderTraversal((t,s)=>{const o=n?n.getImmediateChild(t):null,a=Ss(i,t),c=e.operationForChild(t);c&&(r=r.concat(ur(c,s,o,a)))}),s&&(r=r.concat(Ws(s,e,i,n))),r}function dr(e,t){const n=t.query,i=fr(e,n);return{hashFn:()=>{const e=function(e){return e.viewCache_.serverCache.getNode()}(t)||vi.EMPTY_NODE;return e.hash()},onComplete:t=>{if("ok"===t)return i?function(e,t,n){const i=gr(e,n);if(i){const n=mr(i),s=n.path,r=n.queryId,o=Fn(s,t);return _r(e,s,new Wi($i(r),o))}return[]}(e,n._path,i):function(e,t){return hr(e,new Wi({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t))}(e,n._path);{const i=function(e,t){let n="Unknown Error";"too_big"===e?n="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"===e?n="Client doesn't have permission to access the desired data.":"unavailable"===e&&(n="The service is unavailable");const i=new Error(e+" at "+t._path.toString()+": "+n);return i.code=e.toUpperCase(),i}(t,n);return rr(e,n,null,i)}}}}function fr(e,t){const n=pr(t);return e.queryToTagMap.get(n)}function pr(e){return e._path.toString()+"$"+e._queryIdentifier}function gr(e,t){return e.tagToQueryMap.get(t)}function mr(e){const t=e.indexOf("$");return i(-1!==t&&t<e.length-1,"Bad queryKey."),{queryId:e.substr(t+1),path:new Nn(e.substr(0,t))}}function _r(e,t,n){const s=e.syncPointTree_.get(t);return i(s,"Missing sync point for query tag that we're tracking"),Ws(s,n,ms(e.pendingWriteTree_,t),null)}function yr(e){return e._queryParams.loadsAllData()&&!e._queryParams.isDefault()?new(i($s,"Reference.ts has not been loaded"),$s)(e._repo,e._path):e}class vr{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new vr(t)}node(){return this.node_}}class wr{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=Mn(this.path_,e);return new wr(this.syncTree_,t)}node(){return cr(this.syncTree_,this.path_)}}const Tr=function(e,t,n){return e&&"object"==typeof e?(i(".sv"in e,"Unexpected leaf node or priority contents"),"string"==typeof e[".sv"]?Ir(e[".sv"],t,n):"object"==typeof e[".sv"]?Er(e[".sv"],t):void i(!1,"Unexpected server value: "+JSON.stringify(e,null,2))):e},Ir=function(e,t,n){if("timestamp"===e)return n.timestamp;i(!1,"Unexpected server value: "+e)},Er=function(e,t,n){e.hasOwnProperty("increment")||i(!1,"Unexpected server value: "+JSON.stringify(e,null,2));const s=e.increment;"number"!=typeof s&&i(!1,"Unexpected increment value: "+s);const r=t.node();if(i(null!=r,"Expected ChildrenNode.EMPTY_NODE for nulls"),!r.isLeafNode())return s;const o=r.getValue();return"number"!=typeof o?s:o+s},br=function(e,t,n){return Cr(e,new vr(t),n)};function Cr(e,t,n){const i=e.getPriority().val(),s=Tr(i,t.getImmediateChild(".priority"),n);let r;if(e.isLeafNode()){const i=e,r=Tr(i.getValue(),t,n);return r!==i.getValue()||s!==i.getPriority().val()?new li(r,Ti(s)):e}{const i=e;return r=i,s!==i.getPriority().val()&&(r=r.updatePriority(new li(s))),i.forEachChild(ui,(e,i)=>{const s=Cr(i,t.getImmediateChild(e),n);s!==i&&(r=r.updateImmediateChild(e,s))}),r}}
/**
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
 */class Sr{constructor(e="",t=null,n={children:{},childCount:0}){this.name=e,this.parent=t,this.node=n}}function kr(e,t){let n=t instanceof Nn?t:new Nn(t),i=e,s=Rn(n);for(;null!==s;){const e=M(i.node.children,s)||{children:{},childCount:0};i=new Sr(s,i,e),n=Dn(n),s=Rn(n)}return i}function Nr(e){return e.node.value}function Ar(e,t){e.node.value=t,xr(e)}function Rr(e){return e.node.childCount>0}function Pr(e,t){Xt(e.node.children,(n,i)=>{t(new Sr(n,e,i))})}function Dr(e,t,n,i){n&&t(e),Pr(e,e=>{Dr(e,t,!0)})}function Or(e){return new Nn(null===e.parent?e.name:Or(e.parent)+"/"+e.name)}function xr(e){null!==e.parent&&function(e,t,n){const i=function(e){return void 0===Nr(e)&&!Rr(e)}(n),s=L(e.node.children,t);i&&s?(delete e.node.children[t],e.node.childCount--,xr(e)):i||s||(e.node.children[t]=n.node,e.node.childCount++,xr(e))}
/**
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
 */(e.parent,e.name,e)}const Lr=/[\[\].#$\/\u0000-\u001F\u007F]/,Mr=/[\[\].#$\u0000-\u001F\u007F]/,Ur=10485760,Fr=function(e){return"string"==typeof e&&0!==e.length&&!Lr.test(e)},Vr=function(e){return"string"==typeof e&&0!==e.length&&!Mr.test(e)},qr=function(e){return null===e||"string"==typeof e||"number"==typeof e&&!zt(e)||e&&"object"==typeof e&&L(e,".sv")},jr=function(e,t,n,i){i&&void 0===t||Br(K(e,"value"),t,n)},Br=function(e,t,n){const i=n instanceof Nn?new Bn(n,e):n;if(void 0===t)throw new Error(e+"contains undefined "+$n(i));if("function"==typeof t)throw new Error(e+"contains a function "+$n(i)+" with contents = "+t.toString());if(zt(t))throw new Error(e+"contains "+t.toString()+" "+$n(i));if("string"==typeof t&&t.length>Ur/3&&G(t)>Ur)throw new Error(e+"contains a string greater than "+Ur+" utf8 bytes "+$n(i)+" ('"+t.substring(0,50)+"...')");if(t&&"object"==typeof t){let n=!1,s=!1;if(Xt(t,(t,r)=>{if(".value"===t)n=!0;else if(".priority"!==t&&".sv"!==t&&(s=!0,!Fr(t)))throw new Error(e+" contains an invalid key ("+t+") "+$n(i)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');var o,a;a=t,(o=i).parts_.length>0&&(o.byteLength_+=1),o.parts_.push(a),o.byteLength_+=G(a),zn(o),Br(e,r,i),function(e){const t=e.parts_.pop();e.byteLength_-=G(t),e.parts_.length>0&&(e.byteLength_-=1)}(i)}),n&&s)throw new Error(e+' contains ".value" child '+$n(i)+" in addition to actual children.")}},zr=function(e,t,n,i){if(!Vr(n))throw new Error(K(e,t)+'was an invalid path = "'+n+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"')},$r=function(e,t){if(".info"===Rn(t))throw new Error(e+" failed = Can't modify data under /.info/")};
/**
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
 */
class Hr{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Wr(e,t){let n=null;for(let i=0;i<t.length;i++){const s=t[i],r=s.getPath();null===n||qn(r,n.path)||(e.eventLists_.push(n),n=null),null===n&&(n={events:[],path:r}),n.events.push(s)}n&&e.eventLists_.push(n)}function Kr(e,t,n){Wr(e,n),Qr(e,e=>qn(e,t))}function Gr(e,t,n){Wr(e,n),Qr(e,e=>jn(e,t)||jn(t,e))}function Qr(e,t){e.recursionDepth_++;let n=!0;for(let i=0;i<e.eventLists_.length;i++){const s=e.eventLists_[i];s&&(t(s.path)?(Yr(e.eventLists_[i]),e.eventLists_[i]=null):n=!1)}n&&(e.eventLists_=[]),e.recursionDepth_--}function Yr(e){for(let t=0;t<e.events.length;t++){const n=e.events[t];if(null!==n){e.events[t]=null;const i=n.getEventRunner();Mt&&Ft("event: "+n.toString()),tn(i)}}}
/**
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
 */class Xr{constructor(e,t,n,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=n,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Hr,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Mi(),this.transactionQueueTree_=new Sr,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function Jr(t,n,i){if(t.stats_=mn(t.repoInfo_),t.forceRestClient_||("object"==typeof window&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0)t.server_=new xi(t.repoInfo_,(e,n,i,s)=>{to(t,e,n,i,s)},t.authTokenProvider_,t.appCheckProvider_),setTimeout(()=>no(t,!0),0);else{if(null!=i){if("object"!=typeof i)throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{O(i)}catch(e){throw new Error("Invalid authOverride provided: "+e)}}t.persistentConnection_=new Kn(t.repoInfo_,n,(e,n,i,s)=>{to(t,e,n,i,s)},e=>{no(t,e)},e=>{!function(e,t){Xt(t,(t,n)=>{io(e,t,n)})}(t,e)},t.authTokenProvider_,t.appCheckProvider_,i),t.server_=t.persistentConnection_}t.authTokenProvider_.addTokenChangeListener(e=>{t.server_.refreshAuthToken(e)}),t.appCheckProvider_.addTokenChangeListener(e=>{t.server_.refreshAppCheckToken(e.token)}),t.statsReporter_=function(e){const n=e.toString();return gn[n]||(gn[n]=new ji(t.stats_,t.server_)),gn[n]}(t.repoInfo_),t.infoData_=new Li,t.infoSyncTree_=new tr({startListening:(e,n,i,s)=>{let r=[];const o=t.infoData_.getNode(e._path);return o.isEmpty()||(r=sr(t.infoSyncTree_,e._path,o),setTimeout(()=>{s("ok")},0)),r},stopListening:()=>{}}),io(t,"connected",!1),t.serverSyncTree_=new tr({startListening:(e,n,i,s)=>(t.server_.listen(e,i,n,(n,i)=>{const r=s(n,i);Gr(t.eventQueue_,e._path,r)}),[]),stopListening:(e,n)=>{t.server_.unlisten(e,n)}})}function Zr(e){const t=e.infoData_.getNode(new Nn(".info/serverTimeOffset")).val()||0;return(new Date).getTime()+t}function eo(e){return(t=(t={timestamp:Zr(e)})||{}).timestamp=t.timestamp||(new Date).getTime(),t;var t}function to(e,t,n,i,s){e.dataUpdateCount++;const r=new Nn(t);n=e.interceptServerDataCallback_?e.interceptServerDataCallback_(t,n):n;let o=[];if(s)if(i){const t=F(n,e=>Ti(e));o=function(e,t,n,i){const s=gr(e,i);if(s){const i=mr(s),r=i.path,o=i.queryId,a=Fn(r,t),c=ss.fromObject(n);return _r(e,r,new Gi($i(o),a,c))}return[]}(e.serverSyncTree_,r,t,s)}else{const t=Ti(n);o=or(e.serverSyncTree_,r,t,s)}else if(i){const t=F(n,e=>Ti(e));o=function(e,t,n){const i=ss.fromObject(n);return hr(e,new Gi({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,i))}(e.serverSyncTree_,r,t)}else{const t=Ti(n);o=sr(e.serverSyncTree_,r,t)}let a=r;o.length>0&&(a=fo(e,r)),Gr(e.eventQueue_,a,o)}function no(e,t){io(e,"connected",t),!1===t&&function(e){co(e,"onDisconnectEvents");const t=eo(e),n=Mi();Vi(e.onDisconnect_,An(),(i,s)=>{const r=function(e,t,n,i){return Cr(t,new wr(n,e),i)}(i,s,e.serverSyncTree_,t);Ui(n,i,r)});let i=[];Vi(n,An(),(t,n)=>{i=i.concat(sr(e.serverSyncTree_,t,n));const s=yo(e,t);fo(e,s)}),e.onDisconnect_=Mi(),Gr(e.eventQueue_,An(),i)}(e)}function io(e,t,n){const i=new Nn("/.info/"+t),s=Ti(n);e.infoData_.updateSnapshot(i,s);const r=sr(e.infoSyncTree_,i,s);Gr(e.eventQueue_,i,r)}function so(e){return e.nextWriteId_++}function ro(e,t,n){e.server_.onDisconnectCancel(t.toString(),(i,s)=>{"ok"===i&&Fi(e.onDisconnect_,t),ho(0,n,i,s)})}function oo(e,t,n,i){const s=Ti(n);e.server_.onDisconnectPut(t.toString(),s.val(!0),(n,r)=>{"ok"===n&&Ui(e.onDisconnect_,t,s),ho(0,i,n,r)})}function ao(e,t,n){let i;i=".info"===Rn(t._path)?rr(e.infoSyncTree_,t,n):rr(e.serverSyncTree_,t,n),Kr(e.eventQueue_,t._path,i)}function co(e,...t){let n="";e.persistentConnection_&&(n=e.persistentConnection_.id+":"),Ft(n,...t)}function ho(e,t,n,i){t&&tn(()=>{if("ok"===n)t(null);else{const e=(n||"error").toUpperCase();let s=e;i&&(s+=": "+i);const r=new Error(s);r.code=e,t(r)}})}function lo(e,t,n){return cr(e.serverSyncTree_,t,n)||vi.EMPTY_NODE}function uo(e,t=e.transactionQueueTree_){if(t||_o(e,t),Nr(t)){const n=go(e,t);i(n.length>0,"Sending zero length transaction queue"),n.every(e=>0===e.status)&&function(e,t,n){const s=n.map(e=>e.currentWriteId),r=lo(e,t,s);let o=r;const a=r.hash();for(let l=0;l<n.length;l++){const e=n[l];i(0===e.status,"tryToSendTransactionQueue_: items in queue should all be run."),e.status=1,e.retryCount++;const s=Fn(t,e.path);o=o.updateChild(s,e.currentOutputSnapshotRaw)}const c=o.val(!0),h=t;e.server_.put(h.toString(),c,i=>{co(e,"transaction put response",{path:h.toString(),status:i});let s=[];if("ok"===i){const i=[];for(let t=0;t<n.length;t++)n[t].status=2,s=s.concat(ir(e.serverSyncTree_,n[t].currentWriteId)),n[t].onComplete&&i.push(()=>n[t].onComplete(null,!0,n[t].currentOutputSnapshotResolved)),n[t].unwatcher();_o(e,kr(e.transactionQueueTree_,t)),uo(e,e.transactionQueueTree_),Gr(e.eventQueue_,t,s);for(let e=0;e<i.length;e++)tn(i[e])}else{if("datastale"===i)for(let e=0;e<n.length;e++)3===n[e].status?n[e].status=4:n[e].status=0;else{Bt("transaction at "+h.toString()+" failed: "+i);for(let e=0;e<n.length;e++)n[e].status=4,n[e].abortReason=i}fo(e,t)}},a)}(e,Or(t),n)}else Rr(t)&&Pr(t,t=>{uo(e,t)})}function fo(e,t){const n=po(e,t),s=Or(n);return function(e,t,n){if(0===t.length)return;const s=[];let r=[];const o=t.filter(e=>0===e.status).map(e=>e.currentWriteId);for(let a=0;a<t.length;a++){const c=t[a],h=Fn(n,c.path);let l,u=!1;if(i(null!==h,"rerunTransactionsUnderNode_: relativePath should not be null."),4===c.status)u=!0,l=c.abortReason,r=r.concat(ir(e.serverSyncTree_,c.currentWriteId,!0));else if(0===c.status)if(c.retryCount>=25)u=!0,l="maxretry",r=r.concat(ir(e.serverSyncTree_,c.currentWriteId,!0));else{const n=lo(e,c.path,o);c.currentInputSnapshot=n;const i=t[a].update(n.val());if(void 0!==i){Br("transaction failed: Data returned ",i,c.path);let t=Ti(i);"object"==typeof i&&null!=i&&L(i,".priority")||(t=t.updatePriority(n.getPriority()));const s=c.currentWriteId,a=eo(e),h=br(t,n,a);c.currentOutputSnapshotRaw=t,c.currentOutputSnapshotResolved=h,c.currentWriteId=so(e),o.splice(o.indexOf(s),1),r=r.concat(nr(e.serverSyncTree_,c.path,h,c.currentWriteId,c.applyLocally)),r=r.concat(ir(e.serverSyncTree_,s,!0))}else u=!0,l="nodata",r=r.concat(ir(e.serverSyncTree_,c.currentWriteId,!0))}Gr(e.eventQueue_,n,r),r=[],u&&(t[a].status=2,function(e){setTimeout(e,Math.floor(0))}(t[a].unwatcher),t[a].onComplete&&("nodata"===l?s.push(()=>t[a].onComplete(null,!1,t[a].currentInputSnapshot)):s.push(()=>t[a].onComplete(new Error(l),!1,null))))}_o(e,e.transactionQueueTree_);for(let i=0;i<s.length;i++)tn(s[i]);uo(e,e.transactionQueueTree_)}(e,go(e,n),s),s}function po(e,t){let n,i=e.transactionQueueTree_;for(n=Rn(t);null!==n&&void 0===Nr(i);)i=kr(i,n),n=Rn(t=Dn(t));return i}function go(e,t){const n=[];return mo(e,t,n),n.sort((e,t)=>e.order-t.order),n}function mo(e,t,n){const i=Nr(t);if(i)for(let s=0;s<i.length;s++)n.push(i[s]);Pr(t,t=>{mo(e,t,n)})}function _o(e,t){const n=Nr(t);if(n){let e=0;for(let t=0;t<n.length;t++)2!==n[t].status&&(n[e]=n[t],e++);n.length=e,Ar(t,n.length>0?n:void 0)}Pr(t,t=>{_o(e,t)})}function yo(e,t){const n=Or(po(e,t)),i=kr(e.transactionQueueTree_,t);return function(e,t){let n=e.parent;for(;null!==n;){if(t(n))return!0;n=n.parent}}(i,t=>{vo(e,t)}),vo(e,i),Dr(i,t=>{vo(e,t)}),n}function vo(e,t){const n=Nr(t);if(n){const s=[];let r=[],o=-1;for(let t=0;t<n.length;t++)3===n[t].status||(1===n[t].status?(i(o===t-1,"All SENT items should be at beginning of queue."),o=t,n[t].status=3,n[t].abortReason="set"):(i(0===n[t].status,"Unexpected transaction status in abort"),n[t].unwatcher(),r=r.concat(ir(e.serverSyncTree_,n[t].currentWriteId,!0)),n[t].onComplete&&s.push(n[t].onComplete.bind(null,new Error("set"),!1,null))));-1===o?Ar(t,void 0):n.length=o+1,Gr(e.eventQueue_,Or(t),r);for(let e=0;e<s.length;e++)tn(s[e])}}
/**
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
 */const wo=function(e,t){const n=To(e),i=n.namespace;"firebase.com"===n.domain&&jt(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),i&&"undefined"!==i||"localhost"===n.domain||jt("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),n.secure||"undefined"!=typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&Bt("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");const s="ws"===n.scheme||"wss"===n.scheme;return{repoInfo:new un(n.host,n.secure,i,s,t,"",i!==n.subdomain),path:new Nn(n.pathString)}},To=function(t){let n="",i="",s="",r="",o="",a=!0,c="https",h=443;if("string"==typeof t){let l=t.indexOf("//");l>=0&&(c=t.substring(0,l-1),t=t.substring(l+2));let u=t.indexOf("/");-1===u&&(u=t.length);let d=t.indexOf("?");-1===d&&(d=t.length),n=t.substring(0,Math.min(u,d)),u<d&&(r=function(t){let n="";const i=t.split("/");for(let s=0;s<i.length;s++)if(i[s].length>0){let t=i[s];try{t=decodeURIComponent(t.replace(/\+/g," "))}catch(e){}n+="/"+t}return n}(t.substring(u,d)));const f=function(e){const t={};"?"===e.charAt(0)&&(e=e.substring(1));for(const n of e.split("&")){if(0===n.length)continue;const i=n.split("=");2===i.length?t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]):Bt(`Invalid query segment '${n}' in query '${e}'`)}return t}(t.substring(Math.min(t.length,d)));l=n.indexOf(":"),l>=0?(a="https"===c||"wss"===c,h=parseInt(n.substring(l+1),10)):l=n.length;const p=n.slice(0,l);if("localhost"===p.toLowerCase())i="localhost";else if(p.split(".").length<=2)i=p;else{const e=n.indexOf(".");s=n.substring(0,e).toLowerCase(),i=n.substring(e+1),o=s}"ns"in f&&(o=f.ns)}return{host:n,port:h,domain:i,subdomain:s,secure:a,scheme:c,pathString:r,namespace:o}},Io="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",Eo=function(){let e=0;const t=[];return function(n){const s=n===e;let r;e=n;const o=new Array(8);for(r=7;r>=0;r--)o[r]=Io.charAt(n%64),n=Math.floor(n/64);i(0===n,"Cannot push at time == 0");let a=o.join("");if(s){for(r=11;r>=0&&63===t[r];r--)t[r]=0;t[r]++}else for(r=0;r<12;r++)t[r]=Math.floor(64*Math.random());for(r=0;r<12;r++)a+=Io.charAt(t[r]);return i(20===a.length,"nextPushId: Length should be 20."),a}}();
/**
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
 */
class bo{constructor(e,t,n,i){this.eventType=e,this.eventRegistration=t,this.snapshot=n,this.prevName=i}getPath(){const e=this.snapshot.ref;return"value"===this.eventType?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+O(this.snapshot.exportVal())}}class Co{constructor(e,t,n){this.eventRegistration=e,this.error=t,this.path=n}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}
/**
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
 */class So{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return i(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||void 0!==this.snapshotCallback.userCallback&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}
/**
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
 */class ko{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new v;return ro(this._repo,this._path,e.wrapCallback(()=>{})),e.promise}remove(){$r("OnDisconnect.remove",this._path);const e=new v;return oo(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){$r("OnDisconnect.set",this._path),jr("OnDisconnect.set",e,this._path,!1);const t=new v;return oo(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){$r("OnDisconnect.setWithPriority",this._path),jr("OnDisconnect.setWithPriority",e,this._path,!1),function(e,t){if(zt(t))throw new Error(K(e,"priority")+"is "+t.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!qr(t))throw new Error(K(e,"priority")+"must be a valid Firebase priority (a string, finite number, server value, or null).")}("OnDisconnect.setWithPriority",t);const n=new v;return function(e,t,n,i,s){const r=Ti(n,i);e.server_.onDisconnectPut(t.toString(),r.val(!0),(n,i)=>{"ok"===n&&Ui(e.onDisconnect_,t,r),ho(0,s,n,i)})}(this._repo,this._path,e,t,n.wrapCallback(()=>{})),n.promise}update(e){$r("OnDisconnect.update",this._path),function(e,t,n){const i=K(e,"values");if(!t||"object"!=typeof t||Array.isArray(t))throw new Error(i+" must be an object containing the children to replace.");const s=[];Xt(t,(e,t)=>{const r=new Nn(e);if(Br(i,t,Mn(n,r)),".priority"===On(r)&&!qr(t))throw new Error(i+"contains an invalid value for '"+r.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");s.push(r)}),function(e,t){let n,i;for(n=0;n<t.length;n++){i=t[n];const s=xn(i);for(let t=0;t<s.length;t++)if(".priority"===s[t]&&t===s.length-1);else if(!Fr(s[t]))throw new Error(e+"contains an invalid key ("+s[t]+") in path "+i.toString()+'. Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"')}t.sort(Vn);let s=null;for(n=0;n<t.length;n++){if(i=t[n],null!==s&&jn(s,i))throw new Error(e+"contains a path "+s.toString()+" that is ancestor of another path "+i.toString());s=i}}(i,s)}("OnDisconnect.update",e,this._path);const t=new v;return function(e,t,n,i){if(U(n))return Ft("onDisconnect().update() called with empty data.  Don't do anything."),void ho(0,i,"ok",void 0);e.server_.onDisconnectMerge(t.toString(),n,(s,r)=>{"ok"===s&&Xt(n,(n,i)=>{const s=Ti(i);Ui(e.onDisconnect_,Mn(t,n),s)}),ho(0,i,s,r)})}(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}
/**
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
 */class No{constructor(e,t,n,i){this._repo=e,this._path=t,this._queryParams=n,this._orderByCalled=i}get key(){return Un(this._path)?null:On(this._path)}get ref(){return new Ao(this._repo,this._path)}get _queryIdentifier(){const e=Oi(this._queryParams),t=Qt(e);return"{}"===t?"default":t}get _queryObject(){return Oi(this._queryParams)}isEqual(e){if(!((e=Q(e))instanceof No))return!1;const t=this._repo===e._repo,n=qn(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&n&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+function(e){let t="";for(let n=e.pieceNum_;n<e.pieces_.length;n++)""!==e.pieces_[n]&&(t+="/"+encodeURIComponent(String(e.pieces_[n])));return t||"/"}(this._path)}}class Ao extends No{constructor(e,t){super(e,t,new Pi,!1)}get parent(){const e=Ln(this._path);return null===e?null:new Ao(this._repo,e)}get root(){let e=this;for(;null!==e.parent;)e=e.parent;return e}}class Ro{constructor(e,t,n){this._node=e,this.ref=t,this._index=n}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new Nn(e),n=Do(this.ref,e);return new Ro(this._node.getChild(t),n,ui)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return!this._node.isLeafNode()&&!!this._node.forEachChild(this._index,(t,n)=>e(new Ro(n,Do(this.ref,t),ui)))}hasChild(e){const t=new Nn(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return!this._node.isLeafNode()&&!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function Po(e,t){return(e=Q(e))._checkNotDeleted("ref"),void 0!==t?Do(e._root,t):e._root}function Do(e,t){var n;return null===Rn((e=Q(e))._path)?((n=t)&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),zr("child","path",n)):zr("child","path",t),new Ao(e._repo,Mn(e._path,t))}function Oo(e){return e=Q(e),new ko(e._repo,e._path)}function xo(e,t){e=Q(e),$r("push",e._path),jr("push",t,e._path,!0);const n=Zr(e._repo),i=Eo(n),s=Do(e,i),r=Do(e,i);let o;return o=Promise.resolve(r),s.then=o.then.bind(o),s.catch=o.then.bind(o,void 0),s}function Lo(e){return $r("remove",e._path),Mo(e,null)}function Mo(e,t){e=Q(e),$r("set",e._path),jr("set",t,e._path,!1);const n=new v;return function(e,t,n,i,s){co(e,"set",{path:t.toString(),value:n,priority:null});const r=eo(e),o=Ti(n,null),a=cr(e.serverSyncTree_,t),c=br(o,a,r),h=so(e),l=nr(e.serverSyncTree_,t,c,h,!0);Wr(e.eventQueue_,l),e.server_.put(t.toString(),o.val(!0),(n,i)=>{const r="ok"===n;r||Bt("set at "+t+" failed: "+n);const o=ir(e.serverSyncTree_,h,!r);Gr(e.eventQueue_,t,o),ho(0,s,n,i)});const u=yo(e,t);fo(e,u),Gr(e.eventQueue_,u,[])}(e._repo,e._path,t,0,n.wrapCallback(()=>{})),n.promise}function Uo(e){e=Q(e);const t=new So(()=>{}),n=new Fo(t);return function(e,t,n){const i=function(e,t){const n=t._path;let i=null;e.syncPointTree_.foreachOnPath(n,(e,t)=>{const s=Fn(e,n);i=i||Qs(t,s)});let s=e.syncPointTree_.get(n);s?i=i||Qs(s,An()):(s=new Hs,e.syncPointTree_=e.syncPointTree_.set(n,s));const r=null!=i,o=r?new Qi(i,!0,!1):null;return ts(Ks(s,t,ms(e.pendingWriteTree_,t._path),r?o.getNode():vi.EMPTY_NODE,r).viewCache_)}(e.serverSyncTree_,t);return null!=i?Promise.resolve(i):e.server_.get(t).then(i=>{const s=Ti(i).withIndex(t._queryParams.getIndex());let r;if(ar(e.serverSyncTree_,t,n,!0),t._queryParams.loadsAllData())r=sr(e.serverSyncTree_,t._path,s);else{const n=fr(e.serverSyncTree_,t);r=or(e.serverSyncTree_,t._path,s,n)}return Gr(e.eventQueue_,t._path,r),rr(e.serverSyncTree_,t,n,null,!0),s},n=>(co(e,"get for query "+O(t)+" failed: "+n),Promise.reject(new Error(n))))}(e._repo,e,n).then(t=>new Ro(t,new Ao(e._repo,e._path),e._queryParams.getIndex()))}class Fo{constructor(e){this.callbackContext=e}respondsTo(e){return"value"===e}createEvent(e,t){const n=t._queryParams.getIndex();return new bo("value",this,new Ro(e.snapshotNode,new Ao(t._repo,t._path),n))}getEventRunner(e){return"cancel"===e.getEventType()?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new Co(this,e,t):null}matches(e){return e instanceof Fo&&(!e.callbackContext||!this.callbackContext||e.callbackContext.matches(this.callbackContext))}hasAnyCallback(){return null!==this.callbackContext}}function Vo(e,t,n,i){return function(e,t,n,i,s){let r;if("object"==typeof i&&(r=void 0,s=i),"function"==typeof i&&(r=i),s&&s.onlyOnce){const t=n,i=(n,i)=>{ao(e._repo,e,a),t(n,i)};i.userCallback=n.userCallback,i.context=n.context,n=i}const o=new So(n,r||void 0),a=new Fo(o);return function(e,t,n){let i;i=".info"===Rn(t._path)?ar(e.infoSyncTree_,t,n):ar(e.serverSyncTree_,t,n),Kr(e.eventQueue_,t._path,i)}(e._repo,e,a),()=>ao(e._repo,e,a)}(e,0,t,n,i)}var qo;qo=Ao,i(!zs,"__referenceConstructor has already been defined"),zs=qo,function(e){i(!$s,"__referenceConstructor has already been defined"),$s=e}(Ao);
/**
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
 */
const jo={};function Bo(e,t,n,i,s){let r=i||e.options.databaseURL;void 0===r&&(e.options.projectId||jt("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Ft("Using default host for project ",e.options.projectId),r=`${e.options.projectId}-default-rtdb.firebaseio.com`);let o,a=wo(r,s),c=a.repoInfo;"undefined"!=typeof process&&Et&&(o=Et.FIREBASE_DATABASE_EMULATOR_HOST),o?(r=`http://${o}?ns=${c.namespace}`,a=wo(r,s),c=a.repoInfo):a.repoInfo.secure;const h=new rn(e.name,e.options,t);(function(e,t){const n=t.path.toString();if("string"!=typeof t.repoInfo.host||0===t.repoInfo.host.length||!Fr(t.repoInfo.namespace)&&"localhost"!==t.repoInfo.host.split(":")[0]||0!==n.length&&!function(e){return e&&(e=e.replace(/^\/*\.info(\/|$)/,"/")),Vr(e)}(n))throw new Error(K(e,"url")+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".')})("Invalid Firebase Database URL",a),Un(a.path)||jt("Database URL must point to the root of a Firebase Database (not including a child path).");const l=function(e,t,n,i){let s=jo[t.name];s||(s={},jo[t.name]=s);let r=s[e.toURLString()];return r&&jt("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Xr(e,false,n,i),s[e.toURLString()]=r,r}(c,e,h,new sn(e,n));return new zo(l,e)}class zo{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(Jr(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Ao(this._repo,An())),this._rootInternal}_delete(){return null!==this._rootInternal&&(function(e,t){const n=jo[t];n&&n[e.key]===e||jt(`Database ${t}(${e.repoInfo_}) has already been deleted.`),function(e){e.persistentConnection_&&e.persistentConnection_.interrupt("repo_interrupt")}(e),delete n[e.key]}(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){null===this._rootInternal&&jt("Cannot call "+e+" on a deleted database.")}}function $o(e=dt(),t){const n=ot(e,"database").getImmediate({identifier:t});if(!n._instanceStarted){const e=m("database");e&&function(e,t,n,i={}){(e=Q(e))._checkNotDeleted("useEmulator");const s=`${t}:${n}`,r=e._repoInternal;if(e._instanceStarted){if(s===e._repoInternal.repoInfo_.host&&V(i,r.repoInfo_.emulatorOptions))return;jt("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.")}let o;if(r.repoInfo_.nodeAdmin)i.mockUserToken&&jt('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),o=new on(on.OWNER);else if(i.mockUserToken){const t="string"==typeof i.mockUserToken?i.mockUserToken:I(i.mockUserToken,e.app.options.projectId);o=new on(t)}w(t)&&(T(t),C("Database",!0)),function(e,t,n,i){const s=t.lastIndexOf(":"),r=w(t.substring(0,s));e.repoInfo_=new un(t,r,e.repoInfo_.namespace,e.repoInfo_.webSocketOnly,e.repoInfo_.nodeAdmin,e.repoInfo_.persistenceKey,e.repoInfo_.includeNamespaceInQueryParams,!0,n),i&&(e.authTokenProvider_=i)}(r,s,i,o)}
/**
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
 */(n,...e)}return n}Kn.prototype.simpleListen=function(e,t){this.sendRequest("q",{p:e},t)},Kn.prototype.echo=function(e,t){this.sendRequest("echo",{d:e},t)},St=lt,rt(new Y("database",(e,{instanceIdentifier:t})=>Bo(e.getProvider("app").getImmediate(),e.getProvider("auth-internal"),e.getProvider("app-check-internal"),t),"PUBLIC").setMultipleInstances(!0)),ft(bt,Ct,void 0),ft(bt,Ct,"esm2020");var Ho,Wo,Ko="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};
/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/(function(){var e;
/** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  */function t(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.B=Array(this.blockSize),this.o=this.h=0,this.s()}function n(e,t,n){n||(n=0);var i=Array(16);if("string"==typeof t)for(var s=0;16>s;++s)i[s]=t.charCodeAt(n++)|t.charCodeAt(n++)<<8|t.charCodeAt(n++)<<16|t.charCodeAt(n++)<<24;else for(s=0;16>s;++s)i[s]=t[n++]|t[n++]<<8|t[n++]<<16|t[n++]<<24;t=e.g[0],n=e.g[1],s=e.g[2];var r=e.g[3],o=t+(r^n&(s^r))+i[0]+3614090360&4294967295;o=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=(n=(s=(r=(t=n+(o<<7&4294967295|o>>>25))+((o=r+(s^t&(n^s))+i[1]+3905402710&4294967295)<<12&4294967295|o>>>20))+((o=s+(n^r&(t^n))+i[2]+606105819&4294967295)<<17&4294967295|o>>>15))+((o=n+(t^s&(r^t))+i[3]+3250441966&4294967295)<<22&4294967295|o>>>10))+((o=t+(r^n&(s^r))+i[4]+4118548399&4294967295)<<7&4294967295|o>>>25))+((o=r+(s^t&(n^s))+i[5]+1200080426&4294967295)<<12&4294967295|o>>>20))+((o=s+(n^r&(t^n))+i[6]+2821735955&4294967295)<<17&4294967295|o>>>15))+((o=n+(t^s&(r^t))+i[7]+4249261313&4294967295)<<22&4294967295|o>>>10))+((o=t+(r^n&(s^r))+i[8]+1770035416&4294967295)<<7&4294967295|o>>>25))+((o=r+(s^t&(n^s))+i[9]+2336552879&4294967295)<<12&4294967295|o>>>20))+((o=s+(n^r&(t^n))+i[10]+4294925233&4294967295)<<17&4294967295|o>>>15))+((o=n+(t^s&(r^t))+i[11]+2304563134&4294967295)<<22&4294967295|o>>>10))+((o=t+(r^n&(s^r))+i[12]+1804603682&4294967295)<<7&4294967295|o>>>25))+((o=r+(s^t&(n^s))+i[13]+4254626195&4294967295)<<12&4294967295|o>>>20))+((o=s+(n^r&(t^n))+i[14]+2792965006&4294967295)<<17&4294967295|o>>>15))+((o=n+(t^s&(r^t))+i[15]+1236535329&4294967295)<<22&4294967295|o>>>10))+((o=t+(s^r&(n^s))+i[1]+4129170786&4294967295)<<5&4294967295|o>>>27))+((o=r+(n^s&(t^n))+i[6]+3225465664&4294967295)<<9&4294967295|o>>>23))+((o=s+(t^n&(r^t))+i[11]+643717713&4294967295)<<14&4294967295|o>>>18))+((o=n+(r^t&(s^r))+i[0]+3921069994&4294967295)<<20&4294967295|o>>>12))+((o=t+(s^r&(n^s))+i[5]+3593408605&4294967295)<<5&4294967295|o>>>27))+((o=r+(n^s&(t^n))+i[10]+38016083&4294967295)<<9&4294967295|o>>>23))+((o=s+(t^n&(r^t))+i[15]+3634488961&4294967295)<<14&4294967295|o>>>18))+((o=n+(r^t&(s^r))+i[4]+3889429448&4294967295)<<20&4294967295|o>>>12))+((o=t+(s^r&(n^s))+i[9]+568446438&4294967295)<<5&4294967295|o>>>27))+((o=r+(n^s&(t^n))+i[14]+3275163606&4294967295)<<9&4294967295|o>>>23))+((o=s+(t^n&(r^t))+i[3]+4107603335&4294967295)<<14&4294967295|o>>>18))+((o=n+(r^t&(s^r))+i[8]+1163531501&4294967295)<<20&4294967295|o>>>12))+((o=t+(s^r&(n^s))+i[13]+2850285829&4294967295)<<5&4294967295|o>>>27))+((o=r+(n^s&(t^n))+i[2]+4243563512&4294967295)<<9&4294967295|o>>>23))+((o=s+(t^n&(r^t))+i[7]+1735328473&4294967295)<<14&4294967295|o>>>18))+((o=n+(r^t&(s^r))+i[12]+2368359562&4294967295)<<20&4294967295|o>>>12))+((o=t+(n^s^r)+i[5]+4294588738&4294967295)<<4&4294967295|o>>>28))+((o=r+(t^n^s)+i[8]+2272392833&4294967295)<<11&4294967295|o>>>21))+((o=s+(r^t^n)+i[11]+1839030562&4294967295)<<16&4294967295|o>>>16))+((o=n+(s^r^t)+i[14]+4259657740&4294967295)<<23&4294967295|o>>>9))+((o=t+(n^s^r)+i[1]+2763975236&4294967295)<<4&4294967295|o>>>28))+((o=r+(t^n^s)+i[4]+1272893353&4294967295)<<11&4294967295|o>>>21))+((o=s+(r^t^n)+i[7]+4139469664&4294967295)<<16&4294967295|o>>>16))+((o=n+(s^r^t)+i[10]+3200236656&4294967295)<<23&4294967295|o>>>9))+((o=t+(n^s^r)+i[13]+681279174&4294967295)<<4&4294967295|o>>>28))+((o=r+(t^n^s)+i[0]+3936430074&4294967295)<<11&4294967295|o>>>21))+((o=s+(r^t^n)+i[3]+3572445317&4294967295)<<16&4294967295|o>>>16))+((o=n+(s^r^t)+i[6]+76029189&4294967295)<<23&4294967295|o>>>9))+((o=t+(n^s^r)+i[9]+3654602809&4294967295)<<4&4294967295|o>>>28))+((o=r+(t^n^s)+i[12]+3873151461&4294967295)<<11&4294967295|o>>>21))+((o=s+(r^t^n)+i[15]+530742520&4294967295)<<16&4294967295|o>>>16))+((o=n+(s^r^t)+i[2]+3299628645&4294967295)<<23&4294967295|o>>>9))+((o=t+(s^(n|~r))+i[0]+4096336452&4294967295)<<6&4294967295|o>>>26))+((o=r+(n^(t|~s))+i[7]+1126891415&4294967295)<<10&4294967295|o>>>22))+((o=s+(t^(r|~n))+i[14]+2878612391&4294967295)<<15&4294967295|o>>>17))+((o=n+(r^(s|~t))+i[5]+4237533241&4294967295)<<21&4294967295|o>>>11))+((o=t+(s^(n|~r))+i[12]+1700485571&4294967295)<<6&4294967295|o>>>26))+((o=r+(n^(t|~s))+i[3]+2399980690&4294967295)<<10&4294967295|o>>>22))+((o=s+(t^(r|~n))+i[10]+4293915773&4294967295)<<15&4294967295|o>>>17))+((o=n+(r^(s|~t))+i[1]+2240044497&4294967295)<<21&4294967295|o>>>11))+((o=t+(s^(n|~r))+i[8]+1873313359&4294967295)<<6&4294967295|o>>>26))+((o=r+(n^(t|~s))+i[15]+4264355552&4294967295)<<10&4294967295|o>>>22))+((o=s+(t^(r|~n))+i[6]+2734768916&4294967295)<<15&4294967295|o>>>17))+((o=n+(r^(s|~t))+i[13]+1309151649&4294967295)<<21&4294967295|o>>>11))+((r=(t=n+((o=t+(s^(n|~r))+i[4]+4149444226&4294967295)<<6&4294967295|o>>>26))+((o=r+(n^(t|~s))+i[11]+3174756917&4294967295)<<10&4294967295|o>>>22))^((s=r+((o=s+(t^(r|~n))+i[2]+718787259&4294967295)<<15&4294967295|o>>>17))|~t))+i[9]+3951481745&4294967295,e.g[0]=e.g[0]+t&4294967295,e.g[1]=e.g[1]+(s+(o<<21&4294967295|o>>>11))&4294967295,e.g[2]=e.g[2]+s&4294967295,e.g[3]=e.g[3]+r&4294967295}function i(e,t){this.h=t;for(var n=[],i=!0,s=e.length-1;0<=s;s--){var r=0|e[s];i&&r==t||(n[s]=r,i=!1)}this.g=n}!function(e,t){function n(){}n.prototype=t.prototype,e.D=t.prototype,e.prototype=new n,e.prototype.constructor=e,e.C=function(e,n,i){for(var s=Array(arguments.length-2),r=2;r<arguments.length;r++)s[r-2]=arguments[r];return t.prototype[n].apply(e,s)}}(t,function(){this.blockSize=-1}),t.prototype.s=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0},t.prototype.u=function(e,t){void 0===t&&(t=e.length);for(var i=t-this.blockSize,s=this.B,r=this.h,o=0;o<t;){if(0==r)for(;o<=i;)n(this,e,o),o+=this.blockSize;if("string"==typeof e){for(;o<t;)if(s[r++]=e.charCodeAt(o++),r==this.blockSize){n(this,s),r=0;break}}else for(;o<t;)if(s[r++]=e[o++],r==this.blockSize){n(this,s),r=0;break}}this.h=r,this.o+=t},t.prototype.v=function(){var e=Array((56>this.h?this.blockSize:2*this.blockSize)-this.h);e[0]=128;for(var t=1;t<e.length-8;++t)e[t]=0;var n=8*this.o;for(t=e.length-8;t<e.length;++t)e[t]=255&n,n/=256;for(this.u(e),e=Array(16),t=n=0;4>t;++t)for(var i=0;32>i;i+=8)e[n++]=this.g[t]>>>i&255;return e};var s={};function r(e){return-128<=e&&128>e?function(e){var t=s;return Object.prototype.hasOwnProperty.call(t,e)?t[e]:t[e]=function(e){return new i([0|e],0>e?-1:0)}(e)}(e):new i([0|e],0>e?-1:0)}function o(e){if(isNaN(e)||!isFinite(e))return a;if(0>e)return d(o(-e));for(var t=[],n=1,s=0;e>=n;s++)t[s]=e/n|0,n*=4294967296;return new i(t,0)}var a=r(0),c=r(1),h=r(16777216);function l(e){if(0!=e.h)return!1;for(var t=0;t<e.g.length;t++)if(0!=e.g[t])return!1;return!0}function u(e){return-1==e.h}function d(e){for(var t=e.g.length,n=[],s=0;s<t;s++)n[s]=~e.g[s];return new i(n,~e.h).add(c)}function f(e,t){return e.add(d(t))}function p(e,t){for(;(65535&e[t])!=e[t];)e[t+1]+=e[t]>>>16,e[t]&=65535,t++}function g(e,t){this.g=e,this.h=t}function m(e,t){if(l(t))throw Error("division by zero");if(l(e))return new g(a,a);if(u(e))return t=m(d(e),t),new g(d(t.g),d(t.h));if(u(t))return t=m(e,d(t)),new g(d(t.g),t.h);if(30<e.g.length){if(u(e)||u(t))throw Error("slowDivide_ only works with positive integers.");for(var n=c,i=t;0>=i.l(e);)n=_(n),i=_(i);var s=y(n,1),r=y(i,1);for(i=y(i,2),n=y(n,2);!l(i);){var h=r.add(i);0>=h.l(e)&&(s=s.add(n),r=h),i=y(i,1),n=y(n,1)}return t=f(e,s.j(t)),new g(s,t)}for(s=a;0<=e.l(t);){for(n=Math.max(1,Math.floor(e.m()/t.m())),i=48>=(i=Math.ceil(Math.log(n)/Math.LN2))?1:Math.pow(2,i-48),h=(r=o(n)).j(t);u(h)||0<h.l(e);)h=(r=o(n-=i)).j(t);l(r)&&(r=c),s=s.add(r),e=f(e,h)}return new g(s,e)}function _(e){for(var t=e.g.length+1,n=[],s=0;s<t;s++)n[s]=e.i(s)<<1|e.i(s-1)>>>31;return new i(n,e.h)}function y(e,t){var n=t>>5;t%=32;for(var s=e.g.length-n,r=[],o=0;o<s;o++)r[o]=0<t?e.i(o+n)>>>t|e.i(o+n+1)<<32-t:e.i(o+n);return new i(r,e.h)}(e=i.prototype).m=function(){if(u(this))return-d(this).m();for(var e=0,t=1,n=0;n<this.g.length;n++){var i=this.i(n);e+=(0<=i?i:4294967296+i)*t,t*=4294967296}return e},e.toString=function(e){if(2>(e=e||10)||36<e)throw Error("radix out of range: "+e);if(l(this))return"0";if(u(this))return"-"+d(this).toString(e);for(var t=o(Math.pow(e,6)),n=this,i="";;){var s=m(n,t).g,r=((0<(n=f(n,s.j(t))).g.length?n.g[0]:n.h)>>>0).toString(e);if(l(n=s))return r+i;for(;6>r.length;)r="0"+r;i=r+i}},e.i=function(e){return 0>e?0:e<this.g.length?this.g[e]:this.h},e.l=function(e){return u(e=f(this,e))?-1:l(e)?0:1},e.abs=function(){return u(this)?d(this):this},e.add=function(e){for(var t=Math.max(this.g.length,e.g.length),n=[],s=0,r=0;r<=t;r++){var o=s+(65535&this.i(r))+(65535&e.i(r)),a=(o>>>16)+(this.i(r)>>>16)+(e.i(r)>>>16);s=a>>>16,o&=65535,a&=65535,n[r]=a<<16|o}return new i(n,-2147483648&n[n.length-1]?-1:0)},e.j=function(e){if(l(this)||l(e))return a;if(u(this))return u(e)?d(this).j(d(e)):d(d(this).j(e));if(u(e))return d(this.j(d(e)));if(0>this.l(h)&&0>e.l(h))return o(this.m()*e.m());for(var t=this.g.length+e.g.length,n=[],s=0;s<2*t;s++)n[s]=0;for(s=0;s<this.g.length;s++)for(var r=0;r<e.g.length;r++){var c=this.i(s)>>>16,f=65535&this.i(s),g=e.i(r)>>>16,m=65535&e.i(r);n[2*s+2*r]+=f*m,p(n,2*s+2*r),n[2*s+2*r+1]+=c*m,p(n,2*s+2*r+1),n[2*s+2*r+1]+=f*g,p(n,2*s+2*r+1),n[2*s+2*r+2]+=c*g,p(n,2*s+2*r+2)}for(s=0;s<t;s++)n[s]=n[2*s+1]<<16|n[2*s];for(s=t;s<2*t;s++)n[s]=0;return new i(n,0)},e.A=function(e){return m(this,e).h},e.and=function(e){for(var t=Math.max(this.g.length,e.g.length),n=[],s=0;s<t;s++)n[s]=this.i(s)&e.i(s);return new i(n,this.h&e.h)},e.or=function(e){for(var t=Math.max(this.g.length,e.g.length),n=[],s=0;s<t;s++)n[s]=this.i(s)|e.i(s);return new i(n,this.h|e.h)},e.xor=function(e){for(var t=Math.max(this.g.length,e.g.length),n=[],s=0;s<t;s++)n[s]=this.i(s)^e.i(s);return new i(n,this.h^e.h)},t.prototype.digest=t.prototype.v,t.prototype.reset=t.prototype.s,t.prototype.update=t.prototype.u,Wo=t,i.prototype.add=i.prototype.add,i.prototype.multiply=i.prototype.j,i.prototype.modulo=i.prototype.A,i.prototype.compare=i.prototype.l,i.prototype.toNumber=i.prototype.m,i.prototype.toString=i.prototype.toString,i.prototype.getBits=i.prototype.i,i.fromNumber=o,i.fromString=function e(t,n){if(0==t.length)throw Error("number format error: empty string");if(2>(n=n||10)||36<n)throw Error("radix out of range: "+n);if("-"==t.charAt(0))return d(e(t.substring(1),n));if(0<=t.indexOf("-"))throw Error('number format error: interior "-" character');for(var i=o(Math.pow(n,8)),s=a,r=0;r<t.length;r+=8){var c=Math.min(8,t.length-r),h=parseInt(t.substring(r,r+c),n);8>c?(c=o(Math.pow(n,c)),s=s.j(c).add(o(h))):s=(s=s.j(i)).add(o(h))}return s},Ho=i}).apply(void 0!==Ko?Ko:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});var Go,Qo,Yo,Xo,Jo,Zo,ea,ta,na="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};
/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/(function(){var t,n="function"==typeof Object.defineProperties?Object.defineProperty:function(e,t,n){return e==Array.prototype||e==Object.prototype||(e[t]=n.value),e},i=function(e){e=["object"==typeof globalThis&&globalThis,e,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof na&&na];for(var t=0;t<e.length;++t){var n=e[t];if(n&&n.Math==Math)return n}throw Error("Cannot find global object")}(this);!function(e,t){if(t)e:{var s=i;e=e.split(".");for(var r=0;r<e.length-1;r++){var o=e[r];if(!(o in s))break e;s=s[o]}(t=t(r=s[e=e[e.length-1]]))!=r&&null!=t&&n(s,e,{configurable:!0,writable:!0,value:t})}}("Array.prototype.values",function(e){return e||function(){return function(e,t){e instanceof String&&(e+="");var n=0,i=!1,s={next:function(){if(!i&&n<e.length){var s=n++;return{value:t(0,e[s]),done:!1}}return i=!0,{done:!0,value:void 0}}};return s[Symbol.iterator]=function(){return s},s}(this,function(e,t){return t})}});
/** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  */
var s=s||{},r=this||self;function o(e){var t=typeof e;return"array"==(t="object"!=t?t:e?Array.isArray(e)?"array":t:"null")||"object"==t&&"number"==typeof e.length}function a(e){var t=typeof e;return"object"==t&&null!=e||"function"==t}function c(e,t,n){return e.call.apply(e.bind,arguments)}function h(e,t,n){if(!e)throw Error();if(2<arguments.length){var i=Array.prototype.slice.call(arguments,2);return function(){var n=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(n,i),e.apply(t,n)}}return function(){return e.apply(t,arguments)}}function l(e,t,n){return(l=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?c:h).apply(null,arguments)}function u(e,t){var n=Array.prototype.slice.call(arguments,1);return function(){var t=n.slice();return t.push.apply(t,arguments),e.apply(this,t)}}function d(e,t){function n(){}n.prototype=t.prototype,e.aa=t.prototype,e.prototype=new n,e.prototype.constructor=e,e.Qb=function(e,n,i){for(var s=Array(arguments.length-2),r=2;r<arguments.length;r++)s[r-2]=arguments[r];return t.prototype[n].apply(e,s)}}function f(e){const t=e.length;if(0<t){const n=Array(t);for(let i=0;i<t;i++)n[i]=e[i];return n}return[]}function p(e,t){for(let n=1;n<arguments.length;n++){const t=arguments[n];if(o(t)){const n=e.length||0,i=t.length||0;e.length=n+i;for(let s=0;s<i;s++)e[n+s]=t[s]}else e.push(t)}}function g(e){return/^[\s\xa0]*$/.test(e)}function m(){var e=r.navigator;return e&&(e=e.userAgent)?e:""}function _(e){return _[" "](e),e}_[" "]=function(){};var y=!(-1==m().indexOf("Gecko")||-1!=m().toLowerCase().indexOf("webkit")&&-1==m().indexOf("Edge")||-1!=m().indexOf("Trident")||-1!=m().indexOf("MSIE")||-1!=m().indexOf("Edge"));function v(e,t,n){for(const i in e)t.call(n,e[i],i,e)}function w(e){const t={};for(const n in e)t[n]=e[n];return t}const T="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function I(e,t){let n,i;for(let s=1;s<arguments.length;s++){for(n in i=arguments[s],i)e[n]=i[n];for(let t=0;t<T.length;t++)n=T[t],Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n])}}function E(e){var t=1;e=e.split(":");const n=[];for(;0<t&&e.length;)n.push(e.shift()),t--;return e.length&&n.push(e.join(":")),n}function b(e){r.setTimeout(()=>{throw e},0)}function C(){var e=R;let t=null;return e.g&&(t=e.g,e.g=e.g.next,e.g||(e.h=null),t.next=null),t}var S=new class{constructor(e,t){this.i=e,this.j=t,this.h=0,this.g=null}get(){let e;return 0<this.h?(this.h--,e=this.g,this.g=e.next,e.next=null):e=this.i(),e}}(()=>new k,e=>e.reset());class k{constructor(){this.next=this.g=this.h=null}set(e,t){this.h=e,this.g=t,this.next=null}reset(){this.next=this.g=this.h=null}}let N,A=!1,R=new class{constructor(){this.h=this.g=null}add(e,t){const n=S.get();n.set(e,t),this.h?this.h.next=n:this.g=n,this.h=n}},P=()=>{const e=r.Promise.resolve(void 0);N=()=>{e.then(D)}};var D=()=>{for(var e;e=C();){try{e.h.call(e.g)}catch(n){b(n)}var t=S;t.j(e),100>t.h&&(t.h++,e.next=t.g,t.g=e)}A=!1};function O(){this.s=this.s,this.C=this.C}function x(e,t){this.type=e,this.g=this.target=t,this.defaultPrevented=!1}O.prototype.s=!1,O.prototype.ma=function(){this.s||(this.s=!0,this.N())},O.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()},x.prototype.h=function(){this.defaultPrevented=!0};var L=function(){if(!r.addEventListener||!Object.defineProperty)return!1;var e=!1,t=Object.defineProperty({},"passive",{get:function(){e=!0}});try{const e=()=>{};r.addEventListener("test",e,t),r.removeEventListener("test",e,t)}catch(n){}return e}();function M(e,t){if(x.call(this,e?e.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,e){var n=this.type=e.type,i=e.changedTouches&&e.changedTouches.length?e.changedTouches[0]:null;if(this.target=e.target||e.srcElement,this.g=t,t=e.relatedTarget){if(y){e:{try{_(t.nodeName);var s=!0;break e}catch(r){}s=!1}s||(t=null)}}else"mouseover"==n?t=e.fromElement:"mouseout"==n&&(t=e.toElement);this.relatedTarget=t,i?(this.clientX=void 0!==i.clientX?i.clientX:i.pageX,this.clientY=void 0!==i.clientY?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0):(this.clientX=void 0!==e.clientX?e.clientX:e.pageX,this.clientY=void 0!==e.clientY?e.clientY:e.pageY,this.screenX=e.screenX||0,this.screenY=e.screenY||0),this.button=e.button,this.key=e.key||"",this.ctrlKey=e.ctrlKey,this.altKey=e.altKey,this.shiftKey=e.shiftKey,this.metaKey=e.metaKey,this.pointerId=e.pointerId||0,this.pointerType="string"==typeof e.pointerType?e.pointerType:U[e.pointerType]||"",this.state=e.state,this.i=e,e.defaultPrevented&&M.aa.h.call(this)}}d(M,x);var U={2:"touch",3:"pen",4:"mouse"};M.prototype.h=function(){M.aa.h.call(this);var e=this.i;e.preventDefault?e.preventDefault():e.returnValue=!1};var F="closure_listenable_"+(1e6*Math.random()|0),V=0;function q(e,t,n,i,s){this.listener=e,this.proxy=null,this.src=t,this.type=n,this.capture=!!i,this.ha=s,this.key=++V,this.da=this.fa=!1}function j(e){e.da=!0,e.listener=null,e.proxy=null,e.src=null,e.ha=null}function B(e){this.src=e,this.g={},this.h=0}function z(e,t){var n=t.type;if(n in e.g){var i,s=e.g[n],r=Array.prototype.indexOf.call(s,t,void 0);(i=0<=r)&&Array.prototype.splice.call(s,r,1),i&&(j(t),0==e.g[n].length&&(delete e.g[n],e.h--))}}function $(e,t,n,i){for(var s=0;s<e.length;++s){var r=e[s];if(!r.da&&r.listener==t&&r.capture==!!n&&r.ha==i)return s}return-1}B.prototype.add=function(e,t,n,i,s){var r=e.toString();(e=this.g[r])||(e=this.g[r]=[],this.h++);var o=$(e,t,i,s);return-1<o?(t=e[o],n||(t.fa=!1)):((t=new q(t,this.src,r,!!i,s)).fa=n,e.push(t)),t};var H="closure_lm_"+(1e6*Math.random()|0),W={};function K(e,t,n,i,s){if(Array.isArray(t)){for(var r=0;r<t.length;r++)K(e,t[r],n,i,s);return null}return n=ee(n),e&&e[F]?e.K(t,n,!!a(i)&&!!i.capture,s):function(e,t,n,i,s,r){if(!t)throw Error("Invalid event type");var o=a(s)?!!s.capture:!!s,c=J(e);if(c||(e[H]=c=new B(e)),(n=c.add(t,n,i,o,r)).proxy)return n;if(i=function(){const e=X;return function t(n){return e.call(t.src,t.listener,n)}}(),n.proxy=i,i.src=e,i.listener=n,e.addEventListener)L||(s=o),void 0===s&&(s=!1),e.addEventListener(t.toString(),i,s);else if(e.attachEvent)e.attachEvent(Y(t.toString()),i);else{if(!e.addListener||!e.removeListener)throw Error("addEventListener and attachEvent are unavailable.");e.addListener(i)}return n}(e,t,n,!1,i,s)}function G(e,t,n,i,s){if(Array.isArray(t))for(var r=0;r<t.length;r++)G(e,t[r],n,i,s);else i=a(i)?!!i.capture:!!i,n=ee(n),e&&e[F]?(e=e.i,(t=String(t).toString())in e.g&&-1<(n=$(r=e.g[t],n,i,s))&&(j(r[n]),Array.prototype.splice.call(r,n,1),0==r.length&&(delete e.g[t],e.h--))):e&&(e=J(e))&&(t=e.g[t.toString()],e=-1,t&&(e=$(t,n,i,s)),(n=-1<e?t[e]:null)&&Q(n))}function Q(e){if("number"!=typeof e&&e&&!e.da){var t=e.src;if(t&&t[F])z(t.i,e);else{var n=e.type,i=e.proxy;t.removeEventListener?t.removeEventListener(n,i,e.capture):t.detachEvent?t.detachEvent(Y(n),i):t.addListener&&t.removeListener&&t.removeListener(i),(n=J(t))?(z(n,e),0==n.h&&(n.src=null,t[H]=null)):j(e)}}}function Y(e){return e in W?W[e]:W[e]="on"+e}function X(e,t){if(e.da)e=!0;else{t=new M(t,this);var n=e.listener,i=e.ha||e.src;e.fa&&Q(e),e=n.call(i,t)}return e}function J(e){return(e=e[H])instanceof B?e:null}var Z="__closure_events_fn_"+(1e9*Math.random()>>>0);function ee(e){return"function"==typeof e?e:(e[Z]||(e[Z]=function(t){return e.handleEvent(t)}),e[Z])}function te(){O.call(this),this.i=new B(this),this.M=this,this.F=null}function ne(e,t){var n,i=e.F;if(i)for(n=[];i;i=i.F)n.push(i);if(e=e.M,i=t.type||t,"string"==typeof t)t=new x(t,e);else if(t instanceof x)t.target=t.target||e;else{var s=t;I(t=new x(i,e),s)}if(s=!0,n)for(var r=n.length-1;0<=r;r--){var o=t.g=n[r];s=ie(o,i,!0,t)&&s}if(s=ie(o=t.g=e,i,!0,t)&&s,s=ie(o,i,!1,t)&&s,n)for(r=0;r<n.length;r++)s=ie(o=t.g=n[r],i,!1,t)&&s}function ie(e,t,n,i){if(!(t=e.i.g[String(t)]))return!0;t=t.concat();for(var s=!0,r=0;r<t.length;++r){var o=t[r];if(o&&!o.da&&o.capture==n){var a=o.listener,c=o.ha||o.src;o.fa&&z(e.i,o),s=!1!==a.call(c,i)&&s}}return s&&!i.defaultPrevented}function se(e,t,n){if("function"==typeof e)n&&(e=l(e,n));else{if(!e||"function"!=typeof e.handleEvent)throw Error("Invalid listener argument");e=l(e.handleEvent,e)}return 2147483647<Number(t)?-1:r.setTimeout(e,t||0)}function re(e){e.g=se(()=>{e.g=null,e.i&&(e.i=!1,re(e))},e.l);const t=e.h;e.h=null,e.m.apply(null,t)}d(te,O),te.prototype[F]=!0,te.prototype.removeEventListener=function(e,t,n,i){G(this,e,t,n,i)},te.prototype.N=function(){if(te.aa.N.call(this),this.i){var e,t=this.i;for(e in t.g){for(var n=t.g[e],i=0;i<n.length;i++)j(n[i]);delete t.g[e],t.h--}}this.F=null},te.prototype.K=function(e,t,n,i){return this.i.add(String(e),t,!1,n,i)},te.prototype.L=function(e,t,n,i){return this.i.add(String(e),t,!0,n,i)};class oe extends O{constructor(e,t){super(),this.m=e,this.l=t,this.h=null,this.i=!1,this.g=null}j(e){this.h=arguments,this.g?this.i=!0:re(this)}N(){super.N(),this.g&&(r.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ae(e){O.call(this),this.h=e,this.g={}}d(ae,O);var ce=[];function he(e){v(e.g,function(e,t){this.g.hasOwnProperty(t)&&Q(e)},e),e.g={}}ae.prototype.N=function(){ae.aa.N.call(this),he(this)},ae.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var le=r.JSON.stringify,ue=r.JSON.parse,de=class{stringify(e){return r.JSON.stringify(e,void 0)}parse(e){return r.JSON.parse(e,void 0)}};function fe(){}function pe(e){return e.h||(e.h=e.i())}function ge(){}fe.prototype.h=null;var me={OPEN:"a",kb:"b",Ja:"c",wb:"d"};function _e(){x.call(this,"d")}function ye(){x.call(this,"c")}d(_e,x),d(ye,x);var ve={},we=null;function Te(){return we=we||new te}function Ie(e){x.call(this,ve.La,e)}function Ee(e){const t=Te();ne(t,new Ie(t))}function be(e,t){x.call(this,ve.STAT_EVENT,e),this.stat=t}function Ce(e){const t=Te();ne(t,new be(t,e))}function Se(e,t){x.call(this,ve.Ma,e),this.size=t}function ke(e,t){if("function"!=typeof e)throw Error("Fn must not be null and must be a function");return r.setTimeout(function(){e()},t)}function Ne(){this.g=!0}function Ae(e,t,n,i){e.info(function(){return"XMLHTTP TEXT ("+t+"): "+function(e,t){if(!e.g)return t;if(!t)return null;try{var n=JSON.parse(t);if(n)for(e=0;e<n.length;e++)if(Array.isArray(n[e])){var i=n[e];if(!(2>i.length)){var s=i[1];if(Array.isArray(s)&&!(1>s.length)){var r=s[0];if("noop"!=r&&"stop"!=r&&"close"!=r)for(var o=1;o<s.length;o++)s[o]=""}}}return le(n)}catch(a){return t}}(e,n)+(i?" "+i:"")})}ve.La="serverreachability",d(Ie,x),ve.STAT_EVENT="statevent",d(be,x),ve.Ma="timingevent",d(Se,x),Ne.prototype.xa=function(){this.g=!1},Ne.prototype.info=function(){};var Re,Pe={NO_ERROR:0,gb:1,tb:2,sb:3,nb:4,rb:5,ub:6,Ia:7,TIMEOUT:8,xb:9},De={lb:"complete",Hb:"success",Ja:"error",Ia:"abort",zb:"ready",Ab:"readystatechange",TIMEOUT:"timeout",vb:"incrementaldata",yb:"progress",ob:"downloadprogress",Pb:"uploadprogress"};function Oe(){}function xe(e,t,n,i){this.j=e,this.i=t,this.l=n,this.R=i||1,this.U=new ae(this),this.I=45e3,this.H=null,this.o=!1,this.m=this.A=this.v=this.L=this.F=this.S=this.B=null,this.D=[],this.g=null,this.C=0,this.s=this.u=null,this.X=-1,this.J=!1,this.O=0,this.M=null,this.W=this.K=this.T=this.P=!1,this.h=new Le}function Le(){this.i=null,this.g="",this.h=!1}d(Oe,fe),Oe.prototype.g=function(){return new XMLHttpRequest},Oe.prototype.i=function(){return{}},Re=new Oe;var Me={},Ue={};function Fe(e,t,n){e.L=1,e.v=lt(rt(t)),e.m=n,e.P=!0,Ve(e,null)}function Ve(e,t){e.F=Date.now(),Be(e),e.A=rt(e.v);var n=e.A,i=e.R;Array.isArray(i)||(i=[String(i)]),Et(n.i,"t",i),e.C=0,n=e.j.J,e.h=new Le,e.g=un(e.j,n?t:null,!e.m),0<e.O&&(e.M=new oe(l(e.Y,e,e.g),e.O)),t=e.U,n=e.g,i=e.ca;var s="readystatechange";Array.isArray(s)||(s&&(ce[0]=s.toString()),s=ce);for(var r=0;r<s.length;r++){var o=K(n,s[r],i||t.handleEvent,!1,t.h||t);if(!o)break;t.g[o.key]=o}t=e.H?w(e.H):{},e.m?(e.u||(e.u="POST"),t["Content-Type"]="application/x-www-form-urlencoded",e.g.ea(e.A,e.u,e.m,t)):(e.u="GET",e.g.ea(e.A,e.u,null,t)),Ee(),function(e,t,n,i,s,r){e.info(function(){if(e.g)if(r)for(var o="",a=r.split("&"),c=0;c<a.length;c++){var h=a[c].split("=");if(1<h.length){var l=h[0];h=h[1];var u=l.split("_");o=2<=u.length&&"type"==u[1]?o+(l+"=")+h+"&":o+(l+"=redacted&")}}else o=null;else o=r;return"XMLHTTP REQ ("+i+") [attempt "+s+"]: "+t+"\n"+n+"\n"+o})}(e.i,e.u,e.A,e.l,e.R,e.m)}function qe(e){return!!e.g&&"GET"==e.u&&2!=e.L&&e.j.Ca}function je(e,t){var n=e.C,i=t.indexOf("\n",n);return-1==i?Ue:(n=Number(t.substring(n,i)),isNaN(n)?Me:(i+=1)+n>t.length?Ue:(t=t.slice(i,i+n),e.C=i+n,t))}function Be(e){e.S=Date.now()+e.I,ze(e,e.I)}function ze(e,t){if(null!=e.B)throw Error("WatchDog timer not null");e.B=ke(l(e.ba,e),t)}function $e(e){e.B&&(r.clearTimeout(e.B),e.B=null)}function He(e){0==e.j.G||e.J||on(e.j,e)}function We(e){$e(e);var t=e.M;t&&"function"==typeof t.ma&&t.ma(),e.M=null,he(e.U),e.g&&(t=e.g,e.g=null,t.abort(),t.ma())}function Ke(e,t){try{var n=e.j;if(0!=n.G&&(n.g==e||Je(n.h,e)))if(!e.K&&Je(n.h,e)&&3==n.G){try{var i=n.Da.g.parse(t)}catch(h){i=null}if(Array.isArray(i)&&3==i.length){var s=i;if(0==s[0]){e:if(!n.u){if(n.g){if(!(n.g.F+3e3<e.F))break e;rn(n),Gt(n)}tn(n),Ce(18)}}else n.za=s[1],0<n.za-n.T&&37500>s[2]&&n.F&&0==n.v&&!n.C&&(n.C=ke(l(n.Za,n),6e3));if(1>=Xe(n.h)&&n.ca){try{n.ca()}catch(h){}n.ca=void 0}}else cn(n,11)}else if((e.K||n.g==e)&&rn(n),!g(t))for(s=n.Da.g.parse(t),t=0;t<s.length;t++){let h=s[t];if(n.T=h[0],h=h[1],2==n.G)if("c"==h[0]){n.K=h[1],n.ia=h[2];const t=h[3];null!=t&&(n.la=t,n.j.info("VER="+n.la));const s=h[4];null!=s&&(n.Aa=s,n.j.info("SVER="+n.Aa));const l=h[5];null!=l&&"number"==typeof l&&0<l&&(i=1.5*l,n.L=i,n.j.info("backChannelRequestTimeoutMs_="+i)),i=n;const u=e.g;if(u){const e=u.g?u.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(e){var r=i.h;r.g||-1==e.indexOf("spdy")&&-1==e.indexOf("quic")&&-1==e.indexOf("h2")||(r.j=r.l,r.g=new Set,r.h&&(Ze(r,r.h),r.h=null))}if(i.D){const e=u.g?u.g.getResponseHeader("X-HTTP-Session-Id"):null;e&&(i.ya=e,ht(i.I,i.D,e))}}n.G=3,n.l&&n.l.ua(),n.ba&&(n.R=Date.now()-e.F,n.j.info("Handshake RTT: "+n.R+"ms"));var o=e;if((i=n).qa=ln(i,i.J?i.ia:null,i.W),o.K){et(i.h,o);var a=o,c=i.L;c&&(a.I=c),a.B&&($e(a),Be(a)),i.g=o}else en(i);0<n.i.length&&Yt(n)}else"stop"!=h[0]&&"close"!=h[0]||cn(n,7);else 3==n.G&&("stop"==h[0]||"close"==h[0]?"stop"==h[0]?cn(n,7):Kt(n):"noop"!=h[0]&&n.l&&n.l.ta(h),n.v=0)}Ee()}catch(h){}}xe.prototype.ca=function(e){e=e.target;const t=this.M;t&&3==zt(e)?t.j():this.Y(e)},xe.prototype.Y=function(e){try{if(e==this.g)e:{const d=zt(this.g);var t=this.g.Ba();if(this.g.Z(),!(3>d)&&(3!=d||this.g&&(this.h.h||this.g.oa()||$t(this.g)))){this.J||4!=d||7==t||Ee(),$e(this);var n=this.g.Z();this.X=n;t:if(qe(this)){var i=$t(this.g);e="";var s=i.length,o=4==zt(this.g);if(!this.h.i){if("undefined"==typeof TextDecoder){We(this),He(this);var a="";break t}this.h.i=new r.TextDecoder}for(t=0;t<s;t++)this.h.h=!0,e+=this.h.i.decode(i[t],{stream:!(o&&t==s-1)});i.length=0,this.h.g+=e,this.C=0,a=this.h.g}else a=this.g.oa();if(this.o=200==n,function(e,t,n,i,s,r,o){e.info(function(){return"XMLHTTP RESP ("+i+") [ attempt "+s+"]: "+t+"\n"+n+"\n"+r+" "+o})}(this.i,this.u,this.A,this.l,this.R,d,n),this.o){if(this.T&&!this.K){t:{if(this.g){var c,h=this.g;if((c=h.g?h.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!g(c)){var l=c;break t}}l=null}if(!(n=l)){this.o=!1,this.s=3,Ce(12),We(this),He(this);break e}Ae(this.i,this.l,n,"Initial handshake response via X-HTTP-Initial-Response"),this.K=!0,Ke(this,n)}if(this.P){let e;for(n=!0;!this.J&&this.C<a.length;){if(e=je(this,a),e==Ue){4==d&&(this.s=4,Ce(14),n=!1),Ae(this.i,this.l,null,"[Incomplete Response]");break}if(e==Me){this.s=4,Ce(15),Ae(this.i,this.l,a,"[Invalid Chunk]"),n=!1;break}Ae(this.i,this.l,e,null),Ke(this,e)}if(qe(this)&&0!=this.C&&(this.h.g=this.h.g.slice(this.C),this.C=0),4!=d||0!=a.length||this.h.h||(this.s=1,Ce(16),n=!1),this.o=this.o&&n,n){if(0<a.length&&!this.W){this.W=!0;var u=this.j;u.g==this&&u.ba&&!u.M&&(u.j.info("Great, no buffering proxy detected. Bytes received: "+a.length),nn(u),u.M=!0,Ce(11))}}else Ae(this.i,this.l,a,"[Invalid Chunked Response]"),We(this),He(this)}else Ae(this.i,this.l,a,null),Ke(this,a);4==d&&We(this),this.o&&!this.J&&(4==d?on(this.j,this):(this.o=!1,Be(this)))}else(function(e){const t={};e=(e.g&&2<=zt(e)&&e.g.getAllResponseHeaders()||"").split("\r\n");for(let i=0;i<e.length;i++){if(g(e[i]))continue;var n=E(e[i]);const s=n[0];if("string"!=typeof(n=n[1]))continue;n=n.trim();const r=t[s]||[];t[s]=r,r.push(n)}!function(e,t){for(const n in e)t.call(void 0,e[n],n,e)}(t,function(e){return e.join(", ")})})(this.g),400==n&&0<a.indexOf("Unknown SID")?(this.s=3,Ce(12)):(this.s=0,Ce(13)),We(this),He(this)}}}catch(d){}},xe.prototype.cancel=function(){this.J=!0,We(this)},xe.prototype.ba=function(){this.B=null;const e=Date.now();0<=e-this.S?(function(e,t){e.info(function(){return"TIMEOUT: "+t})}(this.i,this.A),2!=this.L&&(Ee(),Ce(17)),We(this),this.s=2,He(this)):ze(this,this.S-e)};var Ge=class{constructor(e,t){this.g=e,this.map=t}};function Qe(e){this.l=e||10,e=r.PerformanceNavigationTiming?0<(e=r.performance.getEntriesByType("navigation")).length&&("hq"==e[0].nextHopProtocol||"h2"==e[0].nextHopProtocol):!!(r.chrome&&r.chrome.loadTimes&&r.chrome.loadTimes()&&r.chrome.loadTimes().wasFetchedViaSpdy),this.j=e?this.l:1,this.g=null,1<this.j&&(this.g=new Set),this.h=null,this.i=[]}function Ye(e){return!!e.h||!!e.g&&e.g.size>=e.j}function Xe(e){return e.h?1:e.g?e.g.size:0}function Je(e,t){return e.h?e.h==t:!!e.g&&e.g.has(t)}function Ze(e,t){e.g?e.g.add(t):e.h=t}function et(e,t){e.h&&e.h==t?e.h=null:e.g&&e.g.has(t)&&e.g.delete(t)}function tt(e){if(null!=e.h)return e.i.concat(e.h.D);if(null!=e.g&&0!==e.g.size){let t=e.i;for(const n of e.g.values())t=t.concat(n.D);return t}return f(e.i)}function nt(e,t){if(e.forEach&&"function"==typeof e.forEach)e.forEach(t,void 0);else if(o(e)||"string"==typeof e)Array.prototype.forEach.call(e,t,void 0);else for(var n=function(e){if(e.na&&"function"==typeof e.na)return e.na();if(!e.V||"function"!=typeof e.V){if("undefined"!=typeof Map&&e instanceof Map)return Array.from(e.keys());if(!("undefined"!=typeof Set&&e instanceof Set)){if(o(e)||"string"==typeof e){var t=[];e=e.length;for(var n=0;n<e;n++)t.push(n);return t}t=[],n=0;for(const i in e)t[n++]=i;return t}}}(e),i=function(e){if(e.V&&"function"==typeof e.V)return e.V();if("undefined"!=typeof Map&&e instanceof Map||"undefined"!=typeof Set&&e instanceof Set)return Array.from(e.values());if("string"==typeof e)return e.split("");if(o(e)){for(var t=[],n=e.length,i=0;i<n;i++)t.push(e[i]);return t}for(i in t=[],n=0,e)t[n++]=e[i];return t}(e),s=i.length,r=0;r<s;r++)t.call(void 0,i[r],n&&n[r],e)}Qe.prototype.cancel=function(){if(this.i=tt(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&0!==this.g.size){for(const e of this.g.values())e.cancel();this.g.clear()}};var it=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function st(e){if(this.g=this.o=this.j="",this.s=null,this.m=this.l="",this.h=!1,e instanceof st){this.h=e.h,ot(this,e.j),this.o=e.o,this.g=e.g,at(this,e.s),this.l=e.l;var t=e.i,n=new vt;n.i=t.i,t.g&&(n.g=new Map(t.g),n.h=t.h),ct(this,n),this.m=e.m}else e&&(t=String(e).match(it))?(this.h=!1,ot(this,t[1]||"",!0),this.o=ut(t[2]||""),this.g=ut(t[3]||"",!0),at(this,t[4]),this.l=ut(t[5]||"",!0),ct(this,t[6]||"",!0),this.m=ut(t[7]||"")):(this.h=!1,this.i=new vt(null,this.h))}function rt(e){return new st(e)}function ot(e,t,n){e.j=n?ut(t,!0):t,e.j&&(e.j=e.j.replace(/:$/,""))}function at(e,t){if(t){if(t=Number(t),isNaN(t)||0>t)throw Error("Bad port number "+t);e.s=t}else e.s=null}function ct(e,t,n){t instanceof vt?(e.i=t,function(e,t){t&&!e.j&&(wt(e),e.i=null,e.g.forEach(function(e,t){var n=t.toLowerCase();t!=n&&(Tt(this,t),Et(this,n,e))},e)),e.j=t}(e.i,e.h)):(n||(t=dt(t,_t)),e.i=new vt(t,e.h))}function ht(e,t,n){e.i.set(t,n)}function lt(e){return ht(e,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36)),e}function ut(e,t){return e?t?decodeURI(e.replace(/%25/g,"%2525")):decodeURIComponent(e):""}function dt(e,t,n){return"string"==typeof e?(e=encodeURI(e).replace(t,ft),n&&(e=e.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),e):null}function ft(e){return"%"+((e=e.charCodeAt(0))>>4&15).toString(16)+(15&e).toString(16)}st.prototype.toString=function(){var e=[],t=this.j;t&&e.push(dt(t,pt,!0),":");var n=this.g;return(n||"file"==t)&&(e.push("//"),(t=this.o)&&e.push(dt(t,pt,!0),"@"),e.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),null!=(n=this.s)&&e.push(":",String(n))),(n=this.l)&&(this.g&&"/"!=n.charAt(0)&&e.push("/"),e.push(dt(n,"/"==n.charAt(0)?mt:gt,!0))),(n=this.i.toString())&&e.push("?",n),(n=this.m)&&e.push("#",dt(n,yt)),e.join("")};var pt=/[#\/\?@]/g,gt=/[#\?:]/g,mt=/[#\?]/g,_t=/[#\?@]/g,yt=/#/g;function vt(e,t){this.h=this.g=null,this.i=e||null,this.j=!!t}function wt(e){e.g||(e.g=new Map,e.h=0,e.i&&function(e,t){if(e){e=e.split("&");for(var n=0;n<e.length;n++){var i=e[n].indexOf("="),s=null;if(0<=i){var r=e[n].substring(0,i);s=e[n].substring(i+1)}else r=e[n];t(r,s?decodeURIComponent(s.replace(/\+/g," ")):"")}}}(e.i,function(t,n){e.add(decodeURIComponent(t.replace(/\+/g," ")),n)}))}function Tt(e,t){wt(e),t=bt(e,t),e.g.has(t)&&(e.i=null,e.h-=e.g.get(t).length,e.g.delete(t))}function It(e,t){return wt(e),t=bt(e,t),e.g.has(t)}function Et(e,t,n){Tt(e,t),0<n.length&&(e.i=null,e.g.set(bt(e,t),f(n)),e.h+=n.length)}function bt(e,t){return t=String(t),e.j&&(t=t.toLowerCase()),t}function Ct(e,t,n,i,s){try{s&&(s.onload=null,s.onerror=null,s.onabort=null,s.ontimeout=null),i(n)}catch(r){}}function St(){this.g=new de}function kt(t,n,i){const s=i||"";try{nt(t,function(e,t){let i=e;a(e)&&(i=le(e)),n.push(s+t+"="+encodeURIComponent(i))})}catch(e){throw n.push(s+"type="+encodeURIComponent("_badmap")),e}}function Nt(e){this.l=e.Ub||null,this.j=e.eb||!1}function At(e,t){te.call(this),this.D=e,this.o=t,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.u=new Headers,this.h=null,this.B="GET",this.A="",this.g=!1,this.v=this.j=this.l=null}function Rt(e){e.j.read().then(e.Pa.bind(e)).catch(e.ga.bind(e))}function Pt(e){e.readyState=4,e.l=null,e.j=null,e.v=null,Dt(e)}function Dt(e){e.onreadystatechange&&e.onreadystatechange.call(e)}function Ot(e){let t="";return v(e,function(e,n){t+=n,t+=":",t+=e,t+="\r\n"}),t}function xt(e,t,n){e:{for(i in n){var i=!1;break e}i=!0}i||(n=Ot(n),"string"==typeof e?null!=n&&encodeURIComponent(String(n)):ht(e,t,n))}function Lt(e){te.call(this),this.headers=new Map,this.o=e||null,this.h=!1,this.v=this.g=null,this.D="",this.m=0,this.l="",this.j=this.B=this.u=this.A=!1,this.I=null,this.H="",this.J=!1}(t=vt.prototype).add=function(e,t){wt(this),this.i=null,e=bt(this,e);var n=this.g.get(e);return n||this.g.set(e,n=[]),n.push(t),this.h+=1,this},t.forEach=function(e,t){wt(this),this.g.forEach(function(n,i){n.forEach(function(n){e.call(t,n,i,this)},this)},this)},t.na=function(){wt(this);const e=Array.from(this.g.values()),t=Array.from(this.g.keys()),n=[];for(let i=0;i<t.length;i++){const s=e[i];for(let e=0;e<s.length;e++)n.push(t[i])}return n},t.V=function(e){wt(this);let t=[];if("string"==typeof e)It(this,e)&&(t=t.concat(this.g.get(bt(this,e))));else{e=Array.from(this.g.values());for(let n=0;n<e.length;n++)t=t.concat(e[n])}return t},t.set=function(e,t){return wt(this),this.i=null,It(this,e=bt(this,e))&&(this.h-=this.g.get(e).length),this.g.set(e,[t]),this.h+=1,this},t.get=function(e,t){return e&&0<(e=this.V(e)).length?String(e[0]):t},t.toString=function(){if(this.i)return this.i;if(!this.g)return"";const e=[],t=Array.from(this.g.keys());for(var n=0;n<t.length;n++){var i=t[n];const r=encodeURIComponent(String(i)),o=this.V(i);for(i=0;i<o.length;i++){var s=r;""!==o[i]&&(s+="="+encodeURIComponent(String(o[i]))),e.push(s)}}return this.i=e.join("&")},d(Nt,fe),Nt.prototype.g=function(){return new At(this.l,this.j)},Nt.prototype.i=function(e){return function(){return e}}({}),d(At,te),(t=At.prototype).open=function(e,t){if(0!=this.readyState)throw this.abort(),Error("Error reopening a connection");this.B=e,this.A=t,this.readyState=1,Dt(this)},t.send=function(e){if(1!=this.readyState)throw this.abort(),Error("need to call open() first. ");this.g=!0;const t={headers:this.u,method:this.B,credentials:this.m,cache:void 0};e&&(t.body=e),(this.D||r).fetch(new Request(this.A,t)).then(this.Sa.bind(this),this.ga.bind(this))},t.abort=function(){this.response=this.responseText="",this.u=new Headers,this.status=0,this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),1<=this.readyState&&this.g&&4!=this.readyState&&(this.g=!1,Pt(this)),this.readyState=0},t.Sa=function(e){if(this.g&&(this.l=e,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=e.headers,this.readyState=2,Dt(this)),this.g&&(this.readyState=3,Dt(this),this.g)))if("arraybuffer"===this.responseType)e.arrayBuffer().then(this.Qa.bind(this),this.ga.bind(this));else if(void 0!==r.ReadableStream&&"body"in e){if(this.j=e.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.v=new TextDecoder;Rt(this)}else e.text().then(this.Ra.bind(this),this.ga.bind(this))},t.Pa=function(e){if(this.g){if(this.o&&e.value)this.response.push(e.value);else if(!this.o){var t=e.value?e.value:new Uint8Array(0);(t=this.v.decode(t,{stream:!e.done}))&&(this.response=this.responseText+=t)}e.done?Pt(this):Dt(this),3==this.readyState&&Rt(this)}},t.Ra=function(e){this.g&&(this.response=this.responseText=e,Pt(this))},t.Qa=function(e){this.g&&(this.response=e,Pt(this))},t.ga=function(){this.g&&Pt(this)},t.setRequestHeader=function(e,t){this.u.append(e,t)},t.getResponseHeader=function(e){return this.h&&this.h.get(e.toLowerCase())||""},t.getAllResponseHeaders=function(){if(!this.h)return"";const e=[],t=this.h.entries();for(var n=t.next();!n.done;)n=n.value,e.push(n[0]+": "+n[1]),n=t.next();return e.join("\r\n")},Object.defineProperty(At.prototype,"withCredentials",{get:function(){return"include"===this.m},set:function(e){this.m=e?"include":"same-origin"}}),d(Lt,te);var Mt=/^https?$/i,Ut=["POST","PUT"];function Ft(e,t){e.h=!1,e.g&&(e.j=!0,e.g.abort(),e.j=!1),e.l=t,e.m=5,Vt(e),jt(e)}function Vt(e){e.A||(e.A=!0,ne(e,"complete"),ne(e,"error"))}function qt(e){if(e.h&&void 0!==s&&(!e.v[1]||4!=zt(e)||2!=e.Z()))if(e.u&&4==zt(e))se(e.Ea,0,e);else if(ne(e,"readystatechange"),4==zt(e)){e.h=!1;try{const s=e.Z();e:switch(s){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var t=!0;break e;default:t=!1}var n;if(!(n=t)){var i;if(i=0===s){var o=String(e.D).match(it)[1]||null;!o&&r.self&&r.self.location&&(o=r.self.location.protocol.slice(0,-1)),i=!Mt.test(o?o.toLowerCase():"")}n=i}if(n)ne(e,"complete"),ne(e,"success");else{e.m=6;try{var a=2<zt(e)?e.g.statusText:""}catch(c){a=""}e.l=a+" ["+e.Z()+"]",Vt(e)}}finally{jt(e)}}}function jt(t,n){if(t.g){Bt(t);const i=t.g,s=t.v[0]?()=>{}:null;t.g=null,t.v=null,n||ne(t,"ready");try{i.onreadystatechange=s}catch(e){}}}function Bt(e){e.I&&(r.clearTimeout(e.I),e.I=null)}function zt(e){return e.g?e.g.readyState:0}function $t(e){try{if(!e.g)return null;if("response"in e.g)return e.g.response;switch(e.H){case"":case"text":return e.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in e.g)return e.g.mozResponseArrayBuffer}return null}catch(t){return null}}function Ht(e,t,n){return n&&n.internalChannelParams&&n.internalChannelParams[e]||t}function Wt(e){this.Aa=0,this.i=[],this.j=new Ne,this.ia=this.qa=this.I=this.W=this.g=this.ya=this.D=this.H=this.m=this.S=this.o=null,this.Ya=this.U=0,this.Va=Ht("failFast",!1,e),this.F=this.C=this.u=this.s=this.l=null,this.X=!0,this.za=this.T=-1,this.Y=this.v=this.B=0,this.Ta=Ht("baseRetryDelayMs",5e3,e),this.cb=Ht("retryDelaySeedMs",1e4,e),this.Wa=Ht("forwardChannelMaxRetries",2,e),this.wa=Ht("forwardChannelRequestTimeoutMs",2e4,e),this.pa=e&&e.xmlHttpFactory||void 0,this.Xa=e&&e.Tb||void 0,this.Ca=e&&e.useFetchStreams||!1,this.L=void 0,this.J=e&&e.supportsCrossDomainXhr||!1,this.K="",this.h=new Qe(e&&e.concurrentRequestLimit),this.Da=new St,this.P=e&&e.fastHandshake||!1,this.O=e&&e.encodeInitMessageHeaders||!1,this.P&&this.O&&(this.O=!1),this.Ua=e&&e.Rb||!1,e&&e.xa&&this.j.xa(),e&&e.forceLongPolling&&(this.X=!1),this.ba=!this.P&&this.X&&e&&e.detectBufferingProxy||!1,this.ja=void 0,e&&e.longPollingTimeout&&0<e.longPollingTimeout&&(this.ja=e.longPollingTimeout),this.ca=void 0,this.R=0,this.M=!1,this.ka=this.A=null}function Kt(e){if(Qt(e),3==e.G){var t=e.U++,n=rt(e.I);if(ht(n,"SID",e.K),ht(n,"RID",t),ht(n,"TYPE","terminate"),Jt(e,n),(t=new xe(e,e.j,t)).L=2,t.v=lt(rt(n)),n=!1,r.navigator&&r.navigator.sendBeacon)try{n=r.navigator.sendBeacon(t.v.toString(),"")}catch(i){}!n&&r.Image&&((new Image).src=t.v,n=!0),n||(t.g=un(t.j,null),t.g.ea(t.v)),t.F=Date.now(),Be(t)}hn(e)}function Gt(e){e.g&&(nn(e),e.g.cancel(),e.g=null)}function Qt(e){Gt(e),e.u&&(r.clearTimeout(e.u),e.u=null),rn(e),e.h.cancel(),e.s&&("number"==typeof e.s&&r.clearTimeout(e.s),e.s=null)}function Yt(e){if(!Ye(e.h)&&!e.s){e.s=!0;var t=e.Ga;N||P(),A||(N(),A=!0),R.add(t,e),e.B=0}}function Xt(e,t){var n;n=t?t.l:e.U++;const i=rt(e.I);ht(i,"SID",e.K),ht(i,"RID",n),ht(i,"AID",e.T),Jt(e,i),e.m&&e.o&&xt(i,e.m,e.o),n=new xe(e,e.j,n,e.B+1),null===e.m&&(n.H=e.o),t&&(e.i=t.D.concat(e.i)),t=Zt(e,n,1e3),n.I=Math.round(.5*e.wa)+Math.round(.5*e.wa*Math.random()),Ze(e.h,n),Fe(n,i,t)}function Jt(e,t){e.H&&v(e.H,function(e,n){ht(t,n,e)}),e.l&&nt({},function(e,n){ht(t,n,e)})}function Zt(e,t,n){n=Math.min(e.i.length,n);var i=e.l?l(e.l.Na,e.l,e):null;e:{var s=e.i;let t=-1;for(;;){const e=["count="+n];-1==t?0<n?(t=s[0].g,e.push("ofs="+t)):t=0:e.push("ofs="+t);let o=!0;for(let a=0;a<n;a++){let n=s[a].g;const c=s[a].map;if(n-=t,0>n)t=Math.max(0,s[a].g-100),o=!1;else try{kt(c,e,"req"+n+"_")}catch(r){i&&i(c)}}if(o){i=e.join("&");break e}}}return e=e.i.splice(0,n),t.D=e,i}function en(e){if(!e.g&&!e.u){e.Y=1;var t=e.Fa;N||P(),A||(N(),A=!0),R.add(t,e),e.v=0}}function tn(e){return!(e.g||e.u||3<=e.v||(e.Y++,e.u=ke(l(e.Fa,e),an(e,e.v)),e.v++,0))}function nn(e){null!=e.A&&(r.clearTimeout(e.A),e.A=null)}function sn(e){e.g=new xe(e,e.j,"rpc",e.Y),null===e.m&&(e.g.H=e.o),e.g.O=0;var t=rt(e.qa);ht(t,"RID","rpc"),ht(t,"SID",e.K),ht(t,"AID",e.T),ht(t,"CI",e.F?"0":"1"),!e.F&&e.ja&&ht(t,"TO",e.ja),ht(t,"TYPE","xmlhttp"),Jt(e,t),e.m&&e.o&&xt(t,e.m,e.o),e.L&&(e.g.I=e.L);var n=e.g;e=e.ia,n.L=1,n.v=lt(rt(t)),n.m=null,n.P=!0,Ve(n,e)}function rn(e){null!=e.C&&(r.clearTimeout(e.C),e.C=null)}function on(e,t){var n=null;if(e.g==t){rn(e),nn(e),e.g=null;var i=2}else{if(!Je(e.h,t))return;n=t.D,et(e.h,t),i=1}if(0!=e.G)if(t.o)if(1==i){n=t.m?t.m.length:0,t=Date.now()-t.F;var s=e.B;ne(i=Te(),new Se(i,n)),Yt(e)}else en(e);else if(3==(s=t.s)||0==s&&0<t.X||!(1==i&&function(e,t){return!(Xe(e.h)>=e.h.j-(e.s?1:0)||(e.s?(e.i=t.D.concat(e.i),0):1==e.G||2==e.G||e.B>=(e.Va?0:e.Wa)||(e.s=ke(l(e.Ga,e,t),an(e,e.B)),e.B++,0)))}(e,t)||2==i&&tn(e)))switch(n&&0<n.length&&(t=e.h,t.i=t.i.concat(n)),s){case 1:cn(e,5);break;case 4:cn(e,10);break;case 3:cn(e,6);break;default:cn(e,2)}}function an(e,t){let n=e.Ta+Math.floor(Math.random()*e.cb);return e.isActive()||(n*=2),n*t}function cn(e,t){if(e.j.info("Error code "+t),2==t){var n=l(e.fb,e),i=e.Xa;const t=!i;i=new st(i||"//www.google.com/images/cleardot.gif"),r.location&&"http"==r.location.protocol||ot(i,"https"),lt(i),t?function(e,t){const n=new Ne;if(r.Image){const i=new Image;i.onload=u(Ct,n,"TestLoadImage: loaded",!0,t,i),i.onerror=u(Ct,n,"TestLoadImage: error",!1,t,i),i.onabort=u(Ct,n,"TestLoadImage: abort",!1,t,i),i.ontimeout=u(Ct,n,"TestLoadImage: timeout",!1,t,i),r.setTimeout(function(){i.ontimeout&&i.ontimeout()},1e4),i.src=e}else t(!1)}(i.toString(),n):function(e,t){new Ne;const n=new AbortController,i=setTimeout(()=>{n.abort(),Ct(0,0,!1,t)},1e4);fetch(e,{signal:n.signal}).then(e=>{clearTimeout(i),e.ok?Ct(0,0,!0,t):Ct(0,0,!1,t)}).catch(()=>{clearTimeout(i),Ct(0,0,!1,t)})}(i.toString(),n)}else Ce(2);e.G=0,e.l&&e.l.sa(t),hn(e),Qt(e)}function hn(e){if(e.G=0,e.ka=[],e.l){const t=tt(e.h);0==t.length&&0==e.i.length||(p(e.ka,t),p(e.ka,e.i),e.h.i.length=0,f(e.i),e.i.length=0),e.l.ra()}}function ln(e,t,n){var i=n instanceof st?rt(n):new st(n);if(""!=i.g)t&&(i.g=t+"."+i.g),at(i,i.s);else{var s=r.location;i=s.protocol,t=t?t+"."+s.hostname:s.hostname,s=+s.port;var o=new st(null);i&&ot(o,i),t&&(o.g=t),s&&at(o,s),n&&(o.l=n),i=o}return n=e.D,t=e.ya,n&&t&&ht(i,n,t),ht(i,"VER",e.la),Jt(e,i),i}function un(e,t,n){if(t&&!e.J)throw Error("Can't create secondary domain capable XhrIo object.");return(t=e.Ca&&!e.pa?new Lt(new Nt({eb:n})):new Lt(e.pa)).Ha(e.J),t}function dn(){}function fn(){}function pn(e,t){te.call(this),this.g=new Wt(t),this.l=e,this.h=t&&t.messageUrlParams||null,e=t&&t.messageHeaders||null,t&&t.clientProtocolHeaderRequired&&(e?e["X-Client-Protocol"]="webchannel":e={"X-Client-Protocol":"webchannel"}),this.g.o=e,e=t&&t.initMessageHeaders||null,t&&t.messageContentType&&(e?e["X-WebChannel-Content-Type"]=t.messageContentType:e={"X-WebChannel-Content-Type":t.messageContentType}),t&&t.va&&(e?e["X-WebChannel-Client-Profile"]=t.va:e={"X-WebChannel-Client-Profile":t.va}),this.g.S=e,(e=t&&t.Sb)&&!g(e)&&(this.g.m=e),this.v=t&&t.supportsCrossDomainXhr||!1,this.u=t&&t.sendRawJson||!1,(t=t&&t.httpSessionIdParam)&&!g(t)&&(this.g.D=t,null!==(e=this.h)&&t in e&&t in(e=this.h)&&delete e[t]),this.j=new _n(this)}function gn(e){_e.call(this),e.__headers__&&(this.headers=e.__headers__,this.statusCode=e.__status__,delete e.__headers__,delete e.__status__);var t=e.__sm__;if(t){e:{for(const n in t){e=n;break e}e=void 0}(this.i=e)&&(e=this.i,t=null!==t&&e in t?t[e]:void 0),this.data=t}else this.data=e}function mn(){ye.call(this),this.status=1}function _n(e){this.g=e}(t=Lt.prototype).Ha=function(e){this.J=e},t.ea=function(e,t,n,i){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+e);t=t?t.toUpperCase():"GET",this.D=e,this.l="",this.m=0,this.A=!1,this.h=!0,this.g=this.o?this.o.g():Re.g(),this.v=this.o?pe(this.o):pe(Re),this.g.onreadystatechange=l(this.Ea,this);try{this.B=!0,this.g.open(t,String(e),!0),this.B=!1}catch(o){return void Ft(this,o)}if(e=n||"",n=new Map(this.headers),i)if(Object.getPrototypeOf(i)===Object.prototype)for(var s in i)n.set(s,i[s]);else{if("function"!=typeof i.keys||"function"!=typeof i.get)throw Error("Unknown input type for opt_headers: "+String(i));for(const e of i.keys())n.set(e,i.get(e))}i=Array.from(n.keys()).find(e=>"content-type"==e.toLowerCase()),s=r.FormData&&e instanceof r.FormData,!(0<=Array.prototype.indexOf.call(Ut,t,void 0))||i||s||n.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[r,a]of n)this.g.setRequestHeader(r,a);this.H&&(this.g.responseType=this.H),"withCredentials"in this.g&&this.g.withCredentials!==this.J&&(this.g.withCredentials=this.J);try{Bt(this),this.u=!0,this.g.send(e),this.u=!1}catch(o){Ft(this,o)}},t.abort=function(e){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.m=e||7,ne(this,"complete"),ne(this,"abort"),jt(this))},t.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),jt(this,!0)),Lt.aa.N.call(this)},t.Ea=function(){this.s||(this.B||this.u||this.j?qt(this):this.bb())},t.bb=function(){qt(this)},t.isActive=function(){return!!this.g},t.Z=function(){try{return 2<zt(this)?this.g.status:-1}catch(e){return-1}},t.oa=function(){try{return this.g?this.g.responseText:""}catch(e){return""}},t.Oa=function(e){if(this.g){var t=this.g.responseText;return e&&0==t.indexOf(e)&&(t=t.substring(e.length)),ue(t)}},t.Ba=function(){return this.m},t.Ka=function(){return"string"==typeof this.l?this.l:String(this.l)},(t=Wt.prototype).la=8,t.G=1,t.connect=function(e,t,n,i){Ce(0),this.W=e,this.H=t||{},n&&void 0!==i&&(this.H.OSID=n,this.H.OAID=i),this.F=this.X,this.I=ln(this,null,this.W),Yt(this)},t.Ga=function(e){if(this.s)if(this.s=null,1==this.G){if(!e){this.U=Math.floor(1e5*Math.random()),e=this.U++;const s=new xe(this,this.j,e);let r=this.o;if(this.S&&(r?(r=w(r),I(r,this.S)):r=this.S),null!==this.m||this.O||(s.H=r,r=null),this.P)e:{for(var t=0,n=0;n<this.i.length;n++){var i=this.i[n];if(void 0===(i="__data__"in i.map&&"string"==typeof(i=i.map.__data__)?i.length:void 0))break;if(4096<(t+=i)){t=n;break e}if(4096===t||n===this.i.length-1){t=n+1;break e}}t=1e3}else t=1e3;t=Zt(this,s,t),ht(n=rt(this.I),"RID",e),ht(n,"CVER",22),this.D&&ht(n,"X-HTTP-Session-Id",this.D),Jt(this,n),r&&(this.O?t="headers="+encodeURIComponent(String(Ot(r)))+"&"+t:this.m&&xt(n,this.m,r)),Ze(this.h,s),this.Ua&&ht(n,"TYPE","init"),this.P?(ht(n,"$req",t),ht(n,"SID","null"),s.T=!0,Fe(s,n,null)):Fe(s,n,t),this.G=2}}else 3==this.G&&(e?Xt(this,e):0==this.i.length||Ye(this.h)||Xt(this))},t.Fa=function(){if(this.u=null,sn(this),this.ba&&!(this.M||null==this.g||0>=this.R)){var e=2*this.R;this.j.info("BP detection timer enabled: "+e),this.A=ke(l(this.ab,this),e)}},t.ab=function(){this.A&&(this.A=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.M=!0,Ce(10),Gt(this),sn(this))},t.Za=function(){null!=this.C&&(this.C=null,Gt(this),tn(this),Ce(19))},t.fb=function(e){e?(this.j.info("Successfully pinged google.com"),Ce(2)):(this.j.info("Failed to ping google.com"),Ce(1))},t.isActive=function(){return!!this.l&&this.l.isActive(this)},(t=dn.prototype).ua=function(){},t.ta=function(){},t.sa=function(){},t.ra=function(){},t.isActive=function(){return!0},t.Na=function(){},fn.prototype.g=function(e,t){return new pn(e,t)},d(pn,te),pn.prototype.m=function(){this.g.l=this.j,this.v&&(this.g.J=!0),this.g.connect(this.l,this.h||void 0)},pn.prototype.close=function(){Kt(this.g)},pn.prototype.o=function(e){var t=this.g;if("string"==typeof e){var n={};n.__data__=e,e=n}else this.u&&((n={}).__data__=le(e),e=n);t.i.push(new Ge(t.Ya++,e)),3==t.G&&Yt(t)},pn.prototype.N=function(){this.g.l=null,delete this.j,Kt(this.g),delete this.g,pn.aa.N.call(this)},d(gn,_e),d(mn,ye),d(_n,dn),_n.prototype.ua=function(){ne(this.g,"a")},_n.prototype.ta=function(e){ne(this.g,new gn(e))},_n.prototype.sa=function(e){ne(this.g,new mn)},_n.prototype.ra=function(){ne(this.g,"b")},fn.prototype.createWebChannel=fn.prototype.g,pn.prototype.send=pn.prototype.o,pn.prototype.open=pn.prototype.m,pn.prototype.close=pn.prototype.close,ta=function(){return new fn},ea=function(){return Te()},Zo=ve,Jo={mb:0,pb:1,qb:2,Jb:3,Ob:4,Lb:5,Mb:6,Kb:7,Ib:8,Nb:9,PROXY:10,NOPROXY:11,Gb:12,Cb:13,Db:14,Bb:15,Eb:16,Fb:17,ib:18,hb:19,jb:20},Pe.NO_ERROR=0,Pe.TIMEOUT=8,Pe.HTTP_ERROR=6,Xo=Pe,De.COMPLETE="complete",Yo=De,ge.EventType=me,me.OPEN="a",me.CLOSE="b",me.ERROR="c",me.MESSAGE="d",te.prototype.listen=te.prototype.K,Qo=ge,Lt.prototype.listenOnce=Lt.prototype.L,Lt.prototype.getLastError=Lt.prototype.Ka,Lt.prototype.getLastErrorCode=Lt.prototype.Ba,Lt.prototype.getStatus=Lt.prototype.Z,Lt.prototype.getResponseJson=Lt.prototype.Oa,Lt.prototype.getResponseText=Lt.prototype.oa,Lt.prototype.send=Lt.prototype.ea,Lt.prototype.setWithCredentials=Lt.prototype.Ha,Go=Lt}).apply(void 0!==na?na:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});const ia="@firebase/firestore",sa="4.9.1";
/**
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
 */class ra{constructor(e){this.uid=e}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}ra.UNAUTHENTICATED=new ra(null),ra.GOOGLE_CREDENTIALS=new ra("google-credentials-uid"),ra.FIRST_PARTY=new ra("first-party-uid"),ra.MOCK_USER=new ra("mock-user");
/**
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
 */
let oa="12.2.0";
/**
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
 */const aa=new oe("@firebase/firestore");function ca(){return aa.logLevel}function ha(e,...t){if(aa.logLevel<=ee.DEBUG){const n=t.map(da);aa.debug(`Firestore (${oa}): ${e}`,...n)}}function la(e,...t){if(aa.logLevel<=ee.ERROR){const n=t.map(da);aa.error(`Firestore (${oa}): ${e}`,...n)}}function ua(e,...t){if(aa.logLevel<=ee.WARN){const n=t.map(da);aa.warn(`Firestore (${oa}): ${e}`,...n)}}function da(e){if("string"==typeof e)return e;try{
/**
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
    */
return t=e,JSON.stringify(t)}catch(n){return e}var t}
/**
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
 */function fa(e,t,n){let i="Unexpected state";"string"==typeof t?i=t:n=t,pa(e,i,n)}function pa(e,t,n){let i=`FIRESTORE (${oa}) INTERNAL ASSERTION FAILED: ${t} (ID: ${e.toString(16)})`;if(void 0!==n)try{i+=" CONTEXT: "+JSON.stringify(n)}catch(s){i+=" CONTEXT: "+n}throw la(i),new Error(i)}function ga(e,t,n,i){let s="Unexpected state";"string"==typeof n?s=n:i=n,e||pa(t,s,i)}function ma(e,t){return e}
/**
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
 */const _a={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class ya extends A{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}
/**
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
 */class va{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}
/**
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
 */class wa{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class Ta{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(ra.UNAUTHENTICATED))}shutdown(){}}class Ia{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class Ea{constructor(e){this.t=e,this.currentUser=ra.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){ga(void 0===this.o,42304);let n=this.i;const i=e=>this.i!==n?(n=this.i,t(e)):Promise.resolve();let s=new va;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new va,e.enqueueRetryable(()=>i(this.currentUser))};const r=()=>{const t=s;e.enqueueRetryable(async()=>{await t.promise,await i(this.currentUser)})},o=e=>{ha("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=e,this.o&&(this.auth.addAuthTokenListener(this.o),r())};this.t.onInit(e=>o(e)),setTimeout(()=>{if(!this.auth){const e=this.t.getImmediate({optional:!0});e?o(e):(ha("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new va)}},0),r()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(t=>this.i!==e?(ha("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):t?(ga("string"==typeof t.accessToken,31837,{l:t}),new wa(t.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return ga(null===e||"string"==typeof e,2055,{h:e}),new ra(e)}}class ba{constructor(e,t,n){this.P=e,this.T=t,this.I=n,this.type="FirstParty",this.user=ra.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class Ca{constructor(e,t,n){this.P=e,this.T=t,this.I=n}getToken(){return Promise.resolve(new ba(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(ra.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class Sa{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class ka{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,at(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){ga(void 0===this.o,3512);const n=e=>{null!=e.error&&ha("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${e.error.message}`);const n=e.token!==this.m;return this.m=e.token,ha("FirebaseAppCheckTokenProvider",`Received ${n?"new":"existing"} token.`),n?t(e.token):Promise.resolve()};this.o=t=>{e.enqueueRetryable(()=>n(t))};const i=e=>{ha("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=e,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(e=>i(e)),setTimeout(()=>{if(!this.appCheck){const e=this.V.getImmediate({optional:!0});e?i(e):ha("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new Sa(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(e=>e?(ga("string"==typeof e.token,44558,{tokenResult:e}),this.m=e.token,new Sa(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}
/**
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
 */function Na(e){const t="undefined"!=typeof self&&(self.crypto||self.msCrypto),n=new Uint8Array(e);if(t&&"function"==typeof t.getRandomValues)t.getRandomValues(n);else for(let i=0;i<e;i++)n[i]=Math.floor(256*Math.random());return n}
/**
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
 */class Aa{static newId(){const e=62*Math.floor(256/62);let t="";for(;t.length<20;){const n=Na(40);for(let i=0;i<n.length;++i)t.length<20&&n[i]<e&&(t+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(n[i]%62))}return t}}function Ra(e,t){return e<t?-1:e>t?1:0}function Pa(e,t){const n=Math.min(e.length,t.length);for(let i=0;i<n;i++){const n=e.charAt(i),s=t.charAt(i);if(n!==s)return xa(n)===xa(s)?Ra(n,s):xa(n)?1:-1}return Ra(e.length,t.length)}const Da=55296,Oa=57343;function xa(e){const t=e.charCodeAt(0);return t>=Da&&t<=Oa}function La(e,t,n){return e.length===t.length&&e.every((e,i)=>n(e,t[i]))}
/**
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
 */const Ma="__name__";class Ua{constructor(e,t,n){void 0===t?t=0:t>e.length&&fa(637,{offset:t,range:e.length}),void 0===n?n=e.length-t:n>e.length-t&&fa(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return 0===Ua.comparator(this,e)}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof Ua?e.forEach(e=>{t.push(e)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=void 0===e?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return 0===this.length}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let i=0;i<n;i++){const n=Ua.compareSegments(e.get(i),t.get(i));if(0!==n)return n}return Ra(e.length,t.length)}static compareSegments(e,t){const n=Ua.isNumericId(e),i=Ua.isNumericId(t);return n&&!i?-1:!n&&i?1:n&&i?Ua.extractNumericId(e).compare(Ua.extractNumericId(t)):Pa(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Ho.fromString(e.substring(4,e.length-2))}}class Fa extends Ua{construct(e,t,n){return new Fa(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new ya(_a.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(e=>e.length>0))}return new Fa(t)}static emptyPath(){return new Fa([])}}const Va=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class qa extends Ua{construct(e,t,n){return new qa(e,t,n)}static isValidIdentifier(e){return Va.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),qa.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return 1===this.length&&this.get(0)===Ma}static keyField(){return new qa([Ma])}static fromServerFormat(e){const t=[];let n="",i=0;const s=()=>{if(0===n.length)throw new ya(_a.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let r=!1;for(;i<e.length;){const t=e[i];if("\\"===t){if(i+1===e.length)throw new ya(_a.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const t=e[i+1];if("\\"!==t&&"."!==t&&"`"!==t)throw new ya(_a.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=t,i+=2}else"`"===t?(r=!r,i++):"."!==t||r?(n+=t,i++):(s(),i++)}if(s(),r)throw new ya(_a.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new qa(t)}static emptyPath(){return new qa([])}}
/**
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
 */class ja{constructor(e){this.path=e}static fromPath(e){return new ja(Fa.fromString(e))}static fromName(e){return new ja(Fa.fromString(e).popFirst(5))}static empty(){return new ja(Fa.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return null!==e&&0===Fa.comparator(this.path,e.path)}toString(){return this.path.toString()}static comparator(e,t){return Fa.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new ja(new Fa(e.slice()))}}
/**
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
 */function Ba(e,t,n){if(!n)throw new ya(_a.INVALID_ARGUMENT,`Function ${e}() cannot be called with an empty ${t}.`)}function za(e){if(!ja.isDocumentKey(e))throw new ya(_a.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${e} has ${e.length}.`)}function $a(e){if(ja.isDocumentKey(e))throw new ya(_a.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${e} has ${e.length}.`)}function Ha(e){return"object"==typeof e&&null!==e&&(Object.getPrototypeOf(e)===Object.prototype||null===Object.getPrototypeOf(e))}function Wa(e){if(void 0===e)return"undefined";if(null===e)return"null";if("string"==typeof e)return e.length>20&&(e=`${e.substring(0,20)}...`),JSON.stringify(e);if("number"==typeof e||"boolean"==typeof e)return""+e;if("object"==typeof e){if(e instanceof Array)return"an array";{const n=(t=e).constructor?t.constructor.name:null;return n?`a custom ${n} object`:"an object"}}var t;return"function"==typeof e?"a function":fa(12329,{type:typeof e})}function Ka(e,t){if("_delegate"in e&&(e=e._delegate),!(e instanceof t)){if(t.name===e.constructor.name)throw new ya(_a.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=Wa(e);throw new ya(_a.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${n}`)}}return e}
/**
 * @license
 * Copyright 2025 Google LLC
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
 */
function Ga(e,t){const n={typeString:e};return t&&(n.value=t),n}function Qa(e,t){if(!Ha(e))throw new ya(_a.INVALID_ARGUMENT,"JSON must be an object");let n;for(const i in t)if(t[i]){const s=t[i].typeString,r="value"in t[i]?{value:t[i].value}:void 0;if(!(i in e)){n=`JSON missing required field: '${i}'`;break}const o=e[i];if(s&&typeof o!==s){n=`JSON field '${i}' must be a ${s}.`;break}if(void 0!==r&&o!==r.value){n=`Expected '${i}' field to equal '${r.value}'`;break}}if(n)throw new ya(_a.INVALID_ARGUMENT,n);return!0}
/**
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
 */const Ya=-62135596800,Xa=1e6;class Ja{static now(){return Ja.fromMillis(Date.now())}static fromDate(e){return Ja.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*Xa);return new Ja(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new ya(_a.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new ya(_a.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<Ya)throw new ya(_a.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new ya(_a.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Xa}_compareTo(e){return this.seconds===e.seconds?Ra(this.nanoseconds,e.nanoseconds):Ra(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Ja._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Qa(e,Ja._jsonSchema))return new Ja(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-Ya;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Ja._jsonSchemaVersion="firestore/timestamp/1.0",Ja._jsonSchema={type:Ga("string",Ja._jsonSchemaVersion),seconds:Ga("number"),nanoseconds:Ga("number")};
/**
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
 */
class Za{static fromTimestamp(e){return new Za(e)}static min(){return new Za(new Ja(0,0))}static max(){return new Za(new Ja(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}
/**
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
 */function ec(e){return new tc(e.readTime,e.key,-1)}class tc{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new tc(Za.min(),ja.empty(),-1)}static max(){return new tc(Za.max(),ja.empty(),-1)}}function nc(e,t){let n=e.readTime.compareTo(t.readTime);return 0!==n?n:(n=ja.comparator(e.documentKey,t.documentKey),0!==n?n:Ra(e.largestBatchId,t.largestBatchId)
/**
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
 */)}class ic{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}
/**
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
 */async function sc(e){if(e.code!==_a.FAILED_PRECONDITION||"The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab."!==e.message)throw e;ha("LocalStore","Unexpectedly lost primary lease")}
/**
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
 */class rc{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&fa(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new rc((n,i)=>{this.nextCallback=t=>{this.wrapSuccess(e,t).next(n,i)},this.catchCallback=e=>{this.wrapFailure(t,e).next(n,i)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof rc?t:rc.resolve(t)}catch(t){return rc.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):rc.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):rc.reject(t)}static resolve(e){return new rc((t,n)=>{t(e)})}static reject(e){return new rc((t,n)=>{n(e)})}static waitFor(e){return new rc((t,n)=>{let i=0,s=0,r=!1;e.forEach(e=>{++i,e.next(()=>{++s,r&&s===i&&t()},e=>n(e))}),r=!0,s===i&&t()})}static or(e){let t=rc.resolve(!1);for(const n of e)t=t.next(e=>e?rc.resolve(e):n());return t}static forEach(e,t){const n=[];return e.forEach((e,i)=>{n.push(t.call(this,e,i))}),this.waitFor(n)}static mapArray(e,t){return new rc((n,i)=>{const s=e.length,r=new Array(s);let o=0;for(let a=0;a<s;a++){const c=a;t(e[c]).next(e=>{r[c]=e,++o,o===s&&n(r)},e=>i(e))}})}static doWhile(e,t){return new rc((n,i)=>{const s=()=>{!0===e()?t().next(()=>{s()},i):n()};s()})}}function oc(e){return"IndexedDbTransactionError"===e.name}
/**
 * @license
 * Copyright 2018 Google LLC
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
 */class ac{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=e=>this.ae(e),this.ue=e=>t.writeSequenceNumber(e))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}function cc(e){return null==e}function hc(e){return 0===e&&1/e==-1/0}function lc(e,t){let n=t;const i=e.length;for(let s=0;s<i;s++){const t=e.charAt(s);switch(t){case"\0":n+="";break;case"":n+="";break;default:n+=t}}return n}function uc(e){return e+""}
/**
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
 */function dc(e){let t=0;for(const n in e)Object.prototype.hasOwnProperty.call(e,n)&&t++;return t}function fc(e,t){for(const n in e)Object.prototype.hasOwnProperty.call(e,n)&&t(n,e[n])}function pc(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}
/**
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
 */ac.ce=-1;class gc{constructor(e,t){this.comparator=e,this.root=t||_c.EMPTY}insert(e,t){return new gc(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,_c.BLACK,null,null))}remove(e){return new gc(this.comparator,this.root.remove(e,this.comparator).copy(null,null,_c.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(0===n)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const i=this.comparator(e,n.key);if(0===i)return t+n.left.size;i<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new mc(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new mc(this.root,e,this.comparator,!1)}getReverseIterator(){return new mc(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new mc(this.root,e,this.comparator,!0)}}class mc{constructor(e,t,n,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=t?n(e.key,t):1,t&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(0===s){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(0===this.nodeStack.length)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class _c{constructor(e,t,n,i,s){this.key=e,this.value=t,this.color=null!=n?n:_c.RED,this.left=null!=i?i:_c.EMPTY,this.right=null!=s?s:_c.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,i,s){return new _c(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=i?i:this.left,null!=s?s:this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let i=this;const s=n(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,n),null):0===s?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.fixUp()}removeMin(){if(this.left.isEmpty())return _c.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,i=this;if(t(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),0===t(e,i.key)){if(i.right.isEmpty())return _c.EMPTY;n=i.right.min(),i=i.copy(n.key,n.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,_c.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,_c.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw fa(43730,{key:this.key,value:this.value});if(this.right.isRed())throw fa(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw fa(27949);return e+(this.isRed()?0:1)}}_c.EMPTY=null,_c.RED=!0,_c.BLACK=!1,_c.EMPTY=new class{constructor(){this.size=0}get key(){throw fa(57766)}get value(){throw fa(16141)}get color(){throw fa(16727)}get left(){throw fa(29726)}get right(){throw fa(36894)}copy(e,t,n,i,s){return this}insert(e,t,n){return new _c(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};
/**
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
 */
class yc{constructor(e){this.comparator=e,this.data=new gc(this.comparator)}has(e){return null!==this.data.get(e)}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const i=n.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let n;for(n=void 0!==t?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new vc(this.data.getIterator())}getIteratorFrom(e){return new vc(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(e=>{t=t.add(e)}),t}isEqual(e){if(!(e instanceof yc))return!1;if(this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const e=t.getNext().key,i=n.getNext().key;if(0!==this.comparator(e,i))return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new yc(this.comparator);return t.data=e,t}}class vc{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}
/**
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
 */class wc{constructor(e){this.fields=e,e.sort(qa.comparator)}static empty(){return new wc([])}unionWith(e){let t=new yc(qa.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new wc(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return La(this.fields,e.fields,(e,t)=>e.isEqual(t))}}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */class Tc extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}
/**
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
 */class Ic{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(e){try{return atob(e)}catch(t){throw"undefined"!=typeof DOMException&&t instanceof DOMException?new Tc("Invalid base64 string: "+t):t}}(e);return new Ic(t)}static fromUint8Array(e){const t=function(e){let t="";for(let n=0;n<e.length;++n)t+=String.fromCharCode(e[n]);return t}(e);return new Ic(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(e){return btoa(e)}(this.binaryString)}toUint8Array(){return function(e){const t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return Ra(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ic.EMPTY_BYTE_STRING=new Ic("");const Ec=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function bc(e){if(ga(!!e,39018),"string"==typeof e){let t=0;const n=Ec.exec(e);if(ga(!!n,46558,{timestamp:e}),n[1]){let e=n[1];e=(e+"000000000").substr(0,9),t=Number(e)}const i=new Date(e);return{seconds:Math.floor(i.getTime()/1e3),nanos:t}}return{seconds:Cc(e.seconds),nanos:Cc(e.nanos)}}function Cc(e){return"number"==typeof e?e:"string"==typeof e?Number(e):0}function Sc(e){return"string"==typeof e?Ic.fromBase64String(e):Ic.fromUint8Array(e)}
/**
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
 */const kc="server_timestamp",Nc="__type__",Ac="__previous_value__",Rc="__local_write_time__";function Pc(e){var t,n;return(null==(n=((null==(t=null==e?void 0:e.mapValue)?void 0:t.fields)||{})[Nc])?void 0:n.stringValue)===kc}function Dc(e){const t=e.mapValue.fields[Ac];return Pc(t)?Dc(t):t}function Oc(e){const t=bc(e.mapValue.fields[Rc].timestampValue);return new Ja(t.seconds,t.nanos)}
/**
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
 */class xc{constructor(e,t,n,i,s,r,o,a,c,h){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=i,this.ssl=s,this.forceLongPolling=r,this.autoDetectLongPolling=o,this.longPollingOptions=a,this.useFetchStreams=c,this.isUsingEmulator=h}}const Lc="(default)";class Mc{constructor(e,t){this.projectId=e,this.database=t||Lc}static empty(){return new Mc("","")}get isDefaultDatabase(){return this.database===Lc}isEqual(e){return e instanceof Mc&&e.projectId===this.projectId&&e.database===this.database}}
/**
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
 */const Uc="__type__",Fc={},Vc="__vector__",qc="value";function jc(e){return"nullValue"in e?0:"booleanValue"in e?1:"integerValue"in e||"doubleValue"in e?2:"timestampValue"in e?3:"stringValue"in e?5:"bytesValue"in e?6:"referenceValue"in e?7:"geoPointValue"in e?8:"arrayValue"in e?9:"mapValue"in e?Pc(e)?4:function(e){return"__max__"===(((e.mapValue||{}).fields||{}).__type__||{}).stringValue}
/**
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
 */(e)?9007199254740991:function(e){var t,n;return(null==(n=((null==(t=null==e?void 0:e.mapValue)?void 0:t.fields)||{})[Uc])?void 0:n.stringValue)===Vc}(e)?10:11:fa(28295,{value:e})}function Bc(e,t){if(e===t)return!0;const n=jc(e);if(n!==jc(t))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return e.booleanValue===t.booleanValue;case 4:return Oc(e).isEqual(Oc(t));case 3:return function(e,t){if("string"==typeof e.timestampValue&&"string"==typeof t.timestampValue&&e.timestampValue.length===t.timestampValue.length)return e.timestampValue===t.timestampValue;const n=bc(e.timestampValue),i=bc(t.timestampValue);return n.seconds===i.seconds&&n.nanos===i.nanos}(e,t);case 5:return e.stringValue===t.stringValue;case 6:return i=t,Sc(e.bytesValue).isEqual(Sc(i.bytesValue));case 7:return e.referenceValue===t.referenceValue;case 8:return function(e,t){return Cc(e.geoPointValue.latitude)===Cc(t.geoPointValue.latitude)&&Cc(e.geoPointValue.longitude)===Cc(t.geoPointValue.longitude)}(e,t);case 2:return function(e,t){if("integerValue"in e&&"integerValue"in t)return Cc(e.integerValue)===Cc(t.integerValue);if("doubleValue"in e&&"doubleValue"in t){const n=Cc(e.doubleValue),i=Cc(t.doubleValue);return n===i?hc(n)===hc(i):isNaN(n)&&isNaN(i)}return!1}(e,t);case 9:return La(e.arrayValue.values||[],t.arrayValue.values||[],Bc);case 10:case 11:return function(e,t){const n=e.mapValue.fields||{},i=t.mapValue.fields||{};if(dc(n)!==dc(i))return!1;for(const s in n)if(n.hasOwnProperty(s)&&(void 0===i[s]||!Bc(n[s],i[s])))return!1;return!0}(e,t);default:return fa(52216,{left:e})}var i}function zc(e,t){return void 0!==(e.values||[]).find(e=>Bc(e,t))}function $c(e,t){if(e===t)return 0;const n=jc(e),i=jc(t);if(n!==i)return Ra(n,i);switch(n){case 0:case 9007199254740991:return 0;case 1:return Ra(e.booleanValue,t.booleanValue);case 2:return function(e,t){const n=Cc(e.integerValue||e.doubleValue),i=Cc(t.integerValue||t.doubleValue);return n<i?-1:n>i?1:n===i?0:isNaN(n)?isNaN(i)?0:-1:1}(e,t);case 3:return Hc(e.timestampValue,t.timestampValue);case 4:return Hc(Oc(e),Oc(t));case 5:return Pa(e.stringValue,t.stringValue);case 6:return function(e,t){const n=Sc(e),i=Sc(t);return n.compareTo(i)}(e.bytesValue,t.bytesValue);case 7:return function(e,t){const n=e.split("/"),i=t.split("/");for(let s=0;s<n.length&&s<i.length;s++){const e=Ra(n[s],i[s]);if(0!==e)return e}return Ra(n.length,i.length)}(e.referenceValue,t.referenceValue);case 8:return function(e,t){const n=Ra(Cc(e.latitude),Cc(t.latitude));return 0!==n?n:Ra(Cc(e.longitude),Cc(t.longitude))}(e.geoPointValue,t.geoPointValue);case 9:return Wc(e.arrayValue,t.arrayValue);case 10:return function(e,t){var n,i,s,r;const o=e.fields||{},a=t.fields||{},c=null==(n=o[qc])?void 0:n.arrayValue,h=null==(i=a[qc])?void 0:i.arrayValue,l=Ra((null==(s=null==c?void 0:c.values)?void 0:s.length)||0,(null==(r=null==h?void 0:h.values)?void 0:r.length)||0);return 0!==l?l:Wc(c,h)}(e.mapValue,t.mapValue);case 11:return function(e,t){if(e===Fc&&t===Fc)return 0;if(e===Fc)return 1;if(t===Fc)return-1;const n=e.fields||{},i=Object.keys(n),s=t.fields||{},r=Object.keys(s);i.sort(),r.sort();for(let o=0;o<i.length&&o<r.length;++o){const e=Pa(i[o],r[o]);if(0!==e)return e;const t=$c(n[i[o]],s[r[o]]);if(0!==t)return t}return Ra(i.length,r.length)}(e.mapValue,t.mapValue);default:throw fa(23264,{he:n})}}function Hc(e,t){if("string"==typeof e&&"string"==typeof t&&e.length===t.length)return Ra(e,t);const n=bc(e),i=bc(t),s=Ra(n.seconds,i.seconds);return 0!==s?s:Ra(n.nanos,i.nanos)}function Wc(e,t){const n=e.values||[],i=t.values||[];for(let s=0;s<n.length&&s<i.length;++s){const e=$c(n[s],i[s]);if(e)return e}return Ra(n.length,i.length)}function Kc(e){return Gc(e)}function Gc(e){return"nullValue"in e?"null":"booleanValue"in e?""+e.booleanValue:"integerValue"in e?""+e.integerValue:"doubleValue"in e?""+e.doubleValue:"timestampValue"in e?function(e){const t=bc(e);return`time(${t.seconds},${t.nanos})`}(e.timestampValue):"stringValue"in e?e.stringValue:"bytesValue"in e?Sc(e.bytesValue).toBase64():"referenceValue"in e?(t=e.referenceValue,ja.fromName(t).toString()):"geoPointValue"in e?function(e){return`geo(${e.latitude},${e.longitude})`}(e.geoPointValue):"arrayValue"in e?function(e){let t="[",n=!0;for(const i of e.values||[])n?n=!1:t+=",",t+=Gc(i);return t+"]"}(e.arrayValue):"mapValue"in e?function(e){const t=Object.keys(e.fields||{}).sort();let n="{",i=!0;for(const s of t)i?i=!1:n+=",",n+=`${s}:${Gc(e.fields[s])}`;return n+"}"}(e.mapValue):fa(61005,{value:e});var t}function Qc(e){switch(jc(e)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=Dc(e);return t?16+Qc(t):16;case 5:return 2*e.stringValue.length;case 6:return Sc(e.bytesValue).approximateByteSize();case 7:return e.referenceValue.length;case 9:return(e.arrayValue.values||[]).reduce((e,t)=>e+Qc(t),0);case 10:case 11:return function(e){let t=0;return fc(e.fields,(e,n)=>{t+=e.length+Qc(n)}),t}(e.mapValue);default:throw fa(13486,{value:e})}}function Yc(e,t){return{referenceValue:`projects/${e.projectId}/databases/${e.database}/documents/${t.path.canonicalString()}`}}function Xc(e){return!!e&&"integerValue"in e}function Jc(e){return!!e&&"arrayValue"in e}function Zc(e){return!!e&&"nullValue"in e}function eh(e){return!!e&&"doubleValue"in e&&isNaN(Number(e.doubleValue))}function th(e){return!!e&&"mapValue"in e}function nh(e){if(e.geoPointValue)return{geoPointValue:{...e.geoPointValue}};if(e.timestampValue&&"object"==typeof e.timestampValue)return{timestampValue:{...e.timestampValue}};if(e.mapValue){const t={mapValue:{fields:{}}};return fc(e.mapValue.fields,(e,n)=>t.mapValue.fields[e]=nh(n)),t}if(e.arrayValue){const t={arrayValue:{values:[]}};for(let n=0;n<(e.arrayValue.values||[]).length;++n)t.arrayValue.values[n]=nh(e.arrayValue.values[n]);return t}return{...e}}class ih{constructor(e){this.value=e}static empty(){return new ih({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!th(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=nh(t)}setAll(e){let t=qa.emptyPath(),n={},i=[];e.forEach((e,s)=>{if(!t.isImmediateParentOf(s)){const e=this.getFieldsMap(t);this.applyChanges(e,n,i),n={},i=[],t=s.popLast()}e?n[s.lastSegment()]=nh(e):i.push(s.lastSegment())});const s=this.getFieldsMap(t);this.applyChanges(s,n,i)}delete(e){const t=this.field(e.popLast());th(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return Bc(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let i=t.mapValue.fields[e.get(n)];th(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,n){fc(t,(t,n)=>e[t]=n);for(const i of n)delete e[i]}clone(){return new ih(nh(this.value))}}function sh(e){const t=[];return fc(e.fields,(e,n)=>{const i=new qa([e]);if(th(n)){const e=sh(n.mapValue).fields;if(0===e.length)t.push(i);else for(const n of e)t.push(i.child(n))}else t.push(i)}),new wc(t)
/**
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
 */}class rh{constructor(e,t,n,i,s,r,o){this.key=e,this.documentType=t,this.version=n,this.readTime=i,this.createTime=s,this.data=r,this.documentState=o}static newInvalidDocument(e){return new rh(e,0,Za.min(),Za.min(),Za.min(),ih.empty(),0)}static newFoundDocument(e,t,n,i){return new rh(e,1,t,Za.min(),n,i,0)}static newNoDocument(e,t){return new rh(e,2,t,Za.min(),Za.min(),ih.empty(),0)}static newUnknownDocument(e,t){return new rh(e,3,t,Za.min(),Za.min(),ih.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(Za.min())||2!==this.documentType&&0!==this.documentType||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=ih.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=ih.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=Za.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return 1===this.documentState}get hasCommittedMutations(){return 2===this.documentState}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return 0!==this.documentType}isFoundDocument(){return 1===this.documentType}isNoDocument(){return 2===this.documentType}isUnknownDocument(){return 3===this.documentType}isEqual(e){return e instanceof rh&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new rh(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}
/**
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
 */class oh{constructor(e,t){this.position=e,this.inclusive=t}}function ah(e,t,n){let i=0;for(let s=0;s<e.position.length;s++){const r=t[s],o=e.position[s];if(i=r.field.isKeyField()?ja.comparator(ja.fromName(o.referenceValue),n.key):$c(o,n.data.field(r.field)),"desc"===r.dir&&(i*=-1),0!==i)break}return i}function ch(e,t){if(null===e)return null===t;if(null===t)return!1;if(e.inclusive!==t.inclusive||e.position.length!==t.position.length)return!1;for(let n=0;n<e.position.length;n++)if(!Bc(e.position[n],t.position[n]))return!1;return!0}
/**
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
 */class hh{constructor(e,t="asc"){this.field=e,this.dir=t}}function lh(e,t){return e.dir===t.dir&&e.field.isEqual(t.field)}
/**
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
 */class uh{}class dh extends uh{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?"in"===t||"not-in"===t?this.createKeyFieldInFilter(e,t,n):new vh(e,t,n):"array-contains"===t?new Eh(e,n):"in"===t?new bh(e,n):"not-in"===t?new Ch(e,n):"array-contains-any"===t?new Sh(e,n):new dh(e,t,n)}static createKeyFieldInFilter(e,t,n){return"in"===t?new wh(e,n):new Th(e,n)}matches(e){const t=e.data.field(this.field);return"!="===this.op?null!==t&&void 0===t.nullValue&&this.matchesComparison($c(t,this.value)):null!==t&&jc(this.value)===jc(t)&&this.matchesComparison($c(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return 0===e;case"!=":return 0!==e;case">":return e>0;case">=":return e>=0;default:return fa(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class fh extends uh{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new fh(e,t)}matches(e){return ph(this)?void 0===this.filters.find(t=>!t.matches(e)):void 0!==this.filters.find(t=>t.matches(e))}getFlattenedFilters(){return null!==this.Pe||(this.Pe=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function ph(e){return"and"===e.op}function gh(e){return function(e){for(const t of e.filters)if(t instanceof fh)return!1;return!0}(e)&&ph(e)}function mh(e){if(e instanceof dh)return e.field.canonicalString()+e.op.toString()+Kc(e.value);if(gh(e))return e.filters.map(e=>mh(e)).join(",");{const t=e.filters.map(e=>mh(e)).join(",");return`${e.op}(${t})`}}function _h(e,t){return e instanceof dh?(n=e,(i=t)instanceof dh&&n.op===i.op&&n.field.isEqual(i.field)&&Bc(n.value,i.value)):e instanceof fh?function(e,t){return t instanceof fh&&e.op===t.op&&e.filters.length===t.filters.length&&e.filters.reduce((e,n,i)=>e&&_h(n,t.filters[i]),!0)}(e,t):void fa(19439);var n,i}function yh(e){return e instanceof dh?`${(t=e).field.canonicalString()} ${t.op} ${Kc(t.value)}`:e instanceof fh?function(e){return e.op.toString()+" {"+e.getFilters().map(yh).join(" ,")+"}"}(e):"Filter";var t}class vh extends dh{constructor(e,t,n){super(e,t,n),this.key=ja.fromName(n.referenceValue)}matches(e){const t=ja.comparator(e.key,this.key);return this.matchesComparison(t)}}class wh extends dh{constructor(e,t){super(e,"in",t),this.keys=Ih(0,t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class Th extends dh{constructor(e,t){super(e,"not-in",t),this.keys=Ih(0,t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function Ih(e,t){var n;return((null==(n=t.arrayValue)?void 0:n.values)||[]).map(e=>ja.fromName(e.referenceValue))}class Eh extends dh{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Jc(t)&&zc(t.arrayValue,this.value)}}class bh extends dh{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return null!==t&&zc(this.value.arrayValue,t)}}class Ch extends dh{constructor(e,t){super(e,"not-in",t)}matches(e){if(zc(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return null!==t&&void 0===t.nullValue&&!zc(this.value.arrayValue,t)}}class Sh extends dh{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Jc(t)||!t.arrayValue.values)&&t.arrayValue.values.some(e=>zc(this.value.arrayValue,e))}}
/**
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
 */class kh{constructor(e,t=null,n=[],i=[],s=null,r=null,o=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=i,this.limit=s,this.startAt=r,this.endAt=o,this.Te=null}}function Nh(e,t=null,n=[],i=[],s=null,r=null,o=null){return new kh(e,t,n,i,s,r,o)}function Ah(e){const t=ma(e);if(null===t.Te){let e=t.path.canonicalString();null!==t.collectionGroup&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(e=>mh(e)).join(","),e+="|ob:",e+=t.orderBy.map(e=>{return(t=e).field.canonicalString()+t.dir;var t}).join(","),cc(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(e=>Kc(e)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(e=>Kc(e)).join(",")),t.Te=e}return t.Te}function Rh(e,t){if(e.limit!==t.limit)return!1;if(e.orderBy.length!==t.orderBy.length)return!1;for(let n=0;n<e.orderBy.length;n++)if(!lh(e.orderBy[n],t.orderBy[n]))return!1;if(e.filters.length!==t.filters.length)return!1;for(let n=0;n<e.filters.length;n++)if(!_h(e.filters[n],t.filters[n]))return!1;return e.collectionGroup===t.collectionGroup&&!!e.path.isEqual(t.path)&&!!ch(e.startAt,t.startAt)&&ch(e.endAt,t.endAt)}function Ph(e){return ja.isDocumentKey(e.path)&&null===e.collectionGroup&&0===e.filters.length}
/**
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
 */class Dh{constructor(e,t=null,n=[],i=[],s=null,r="F",o=null,a=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=i,this.limit=s,this.limitType=r,this.startAt=o,this.endAt=a,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function Oh(e){return new Dh(e)}function xh(e){return 0===e.filters.length&&null===e.limit&&null==e.startAt&&null==e.endAt&&(0===e.explicitOrderBy.length||1===e.explicitOrderBy.length&&e.explicitOrderBy[0].field.isKeyField())}function Lh(e){return null!==e.collectionGroup}function Mh(e){const t=ma(e);if(null===t.Ie){t.Ie=[];const e=new Set;for(const i of t.explicitOrderBy)t.Ie.push(i),e.add(i.field.canonicalString());const n=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(e){let t=new yc(qa.comparator);return e.filters.forEach(e=>{e.getFlattenedFilters().forEach(e=>{e.isInequality()&&(t=t.add(e.field))})}),t})(t).forEach(i=>{e.has(i.canonicalString())||i.isKeyField()||t.Ie.push(new hh(i,n))}),e.has(qa.keyField().canonicalString())||t.Ie.push(new hh(qa.keyField(),n))}return t.Ie}function Uh(e){const t=ma(e);return t.Ee||(t.Ee=function(e,t){if("F"===e.limitType)return Nh(e.path,e.collectionGroup,t,e.filters,e.limit,e.startAt,e.endAt);{t=t.map(e=>{const t="desc"===e.dir?"asc":"desc";return new hh(e.field,t)});const n=e.endAt?new oh(e.endAt.position,e.endAt.inclusive):null,i=e.startAt?new oh(e.startAt.position,e.startAt.inclusive):null;return Nh(e.path,e.collectionGroup,t,e.filters,e.limit,n,i)}}(t,Mh(e))),t.Ee}function Fh(e,t){const n=e.filters.concat([t]);return new Dh(e.path,e.collectionGroup,e.explicitOrderBy.slice(),n,e.limit,e.limitType,e.startAt,e.endAt)}function Vh(e,t,n){return new Dh(e.path,e.collectionGroup,e.explicitOrderBy.slice(),e.filters.slice(),t,n,e.startAt,e.endAt)}function qh(e,t){return Rh(Uh(e),Uh(t))&&e.limitType===t.limitType}function jh(e){return`${Ah(Uh(e))}|lt:${e.limitType}`}function Bh(e){return`Query(target=${function(e){let t=e.path.canonicalString();return null!==e.collectionGroup&&(t+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(t+=`, filters: [${e.filters.map(e=>yh(e)).join(", ")}]`),cc(e.limit)||(t+=", limit: "+e.limit),e.orderBy.length>0&&(t+=`, orderBy: [${e.orderBy.map(e=>{return`${(t=e).field.canonicalString()} (${t.dir})`;var t}).join(", ")}]`),e.startAt&&(t+=", startAt: ",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(e=>Kc(e)).join(",")),e.endAt&&(t+=", endAt: ",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(e=>Kc(e)).join(",")),`Target(${t})`}(Uh(e))}; limitType=${e.limitType})`}function zh(e,t){return t.isFoundDocument()&&function(e,t){const n=t.key.path;return null!==e.collectionGroup?t.key.hasCollectionId(e.collectionGroup)&&e.path.isPrefixOf(n):ja.isDocumentKey(e.path)?e.path.isEqual(n):e.path.isImmediateParentOf(n)}(e,t)&&function(e,t){for(const n of Mh(e))if(!n.field.isKeyField()&&null===t.data.field(n.field))return!1;return!0}(e,t)&&function(e,t){for(const n of e.filters)if(!n.matches(t))return!1;return!0}(e,t)&&(i=t,!((n=e).startAt&&!function(e,t,n){const i=ah(e,t,n);return e.inclusive?i<=0:i<0}(n.startAt,Mh(n),i)||n.endAt&&!function(e,t,n){const i=ah(e,t,n);return e.inclusive?i>=0:i>0}(n.endAt,Mh(n),i)));var n,i}function $h(e){return(t,n)=>{let i=!1;for(const s of Mh(e)){const e=Hh(s,t,n);if(0!==e)return e;i=i||s.field.isKeyField()}return 0}}function Hh(e,t,n){const i=e.field.isKeyField()?ja.comparator(t.key,n.key):function(e,t,n){const i=t.data.field(e),s=n.data.field(e);return null!==i&&null!==s?$c(i,s):fa(42886)}(e.field,t,n);switch(e.dir){case"asc":return i;case"desc":return-1*i;default:return fa(19790,{direction:e.dir})}}
/**
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
 */class Wh{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(void 0!==n)for(const[i,s]of n)if(this.equalsFn(i,e))return s}has(e){return void 0!==this.get(e)}set(e,t){const n=this.mapKeyFn(e),i=this.inner[n];if(void 0===i)return this.inner[n]=[[e,t]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,t]);i.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(void 0===n)return!1;for(let i=0;i<n.length;i++)if(this.equalsFn(n[i][0],e))return 1===n.length?delete this.inner[t]:n.splice(i,1),this.innerSize--,!0;return!1}forEach(e){fc(this.inner,(t,n)=>{for(const[i,s]of n)e(i,s)})}isEmpty(){return pc(this.inner)}size(){return this.innerSize}}
/**
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
 */const Kh=new gc(ja.comparator);function Gh(){return Kh}const Qh=new gc(ja.comparator);function Yh(...e){let t=Qh;for(const n of e)t=t.insert(n.key,n);return t}function Xh(e){let t=Qh;return e.forEach((e,n)=>t=t.insert(e,n.overlayedDocument)),t}function Jh(){return el()}function Zh(){return el()}function el(){return new Wh(e=>e.toString(),(e,t)=>e.isEqual(t))}const tl=new gc(ja.comparator),nl=new yc(ja.comparator);function il(...e){let t=nl;for(const n of e)t=t.add(n);return t}const sl=new yc(Ra);
/**
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
 */
function rl(e,t){if(e.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:hc(t)?"-0":t}}function ol(e){return{integerValue:""+e}}
/**
 * @license
 * Copyright 2018 Google LLC
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
 */
class al{constructor(){this._=void 0}}function cl(e,t,n){return e instanceof ul?function(e,t){const n={fields:{[Nc]:{stringValue:kc},[Rc]:{timestampValue:{seconds:e.seconds,nanos:e.nanoseconds}}}};return t&&Pc(t)&&(t=Dc(t)),t&&(n.fields[Ac]=t),{mapValue:n}}(n,t):e instanceof dl?fl(e,t):e instanceof pl?gl(e,t):function(e,t){const n=ll(e,t),i=_l(n)+_l(e.Ae);return Xc(n)&&Xc(e.Ae)?ol(i):rl(e.serializer,i)}(e,t)}function hl(e,t,n){return e instanceof dl?fl(e,t):e instanceof pl?gl(e,t):n}function ll(e,t){return e instanceof ml?Xc(n=t)||(i=n)&&"doubleValue"in i?t:{integerValue:0}:null;var n,i}class ul extends al{}class dl extends al{constructor(e){super(),this.elements=e}}function fl(e,t){const n=yl(t);for(const i of e.elements)n.some(e=>Bc(e,i))||n.push(i);return{arrayValue:{values:n}}}class pl extends al{constructor(e){super(),this.elements=e}}function gl(e,t){let n=yl(t);for(const i of e.elements)n=n.filter(e=>!Bc(e,i));return{arrayValue:{values:n}}}class ml extends al{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function _l(e){return Cc(e.integerValue||e.doubleValue)}function yl(e){return Jc(e)&&e.arrayValue.values?e.arrayValue.values.slice():[]}
/**
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
 */class vl{constructor(e,t){this.field=e,this.transform=t}}class wl{constructor(e,t){this.version=e,this.transformResults=t}}class Tl{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Tl}static exists(e){return new Tl(void 0,e)}static updateTime(e){return new Tl(e)}get isNone(){return void 0===this.updateTime&&void 0===this.exists}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Il(e,t){return void 0!==e.updateTime?t.isFoundDocument()&&t.version.isEqual(e.updateTime):void 0===e.exists||e.exists===t.isFoundDocument()}class El{}function bl(e,t){if(!e.hasLocalMutations||t&&0===t.fields.length)return null;if(null===t)return e.isNoDocument()?new xl(e.key,Tl.none()):new Al(e.key,e.data,Tl.none());{const n=e.data,i=ih.empty();let s=new yc(qa.comparator);for(let e of t.fields)if(!s.has(e)){let t=n.field(e);null===t&&e.length>1&&(e=e.popLast(),t=n.field(e)),null===t?i.delete(e):i.set(e,t),s=s.add(e)}return new Rl(e.key,i,new wc(s.toArray()),Tl.none())}}function Cl(e,t,n){var i;e instanceof Al?function(e,t,n){const i=e.value.clone(),s=Dl(e.fieldTransforms,t,n.transformResults);i.setAll(s),t.convertToFoundDocument(n.version,i).setHasCommittedMutations()}(e,t,n):e instanceof Rl?function(e,t,n){if(!Il(e.precondition,t))return void t.convertToUnknownDocument(n.version);const i=Dl(e.fieldTransforms,t,n.transformResults),s=t.data;s.setAll(Pl(e)),s.setAll(i),t.convertToFoundDocument(n.version,s).setHasCommittedMutations()}(e,t,n):(i=n,t.convertToNoDocument(i.version).setHasCommittedMutations())}function Sl(e,t,n,i){return e instanceof Al?function(e,t,n,i){if(!Il(e.precondition,t))return n;const s=e.value.clone(),r=Ol(e.fieldTransforms,i,t);return s.setAll(r),t.convertToFoundDocument(t.version,s).setHasLocalMutations(),null}(e,t,n,i):e instanceof Rl?function(e,t,n,i){if(!Il(e.precondition,t))return n;const s=Ol(e.fieldTransforms,i,t),r=t.data;return r.setAll(Pl(e)),r.setAll(s),t.convertToFoundDocument(t.version,r).setHasLocalMutations(),null===n?null:n.unionWith(e.fieldMask.fields).unionWith(e.fieldTransforms.map(e=>e.field))}(e,t,n,i):(s=t,r=n,Il(e.precondition,s)?(s.convertToNoDocument(s.version).setHasLocalMutations(),null):r);var s,r}function kl(e,t){let n=null;for(const i of e.fieldTransforms){const e=t.data.field(i.field),s=ll(i.transform,e||null);null!=s&&(null===n&&(n=ih.empty()),n.set(i.field,s))}return n||null}function Nl(e,t){return e.type===t.type&&!!e.key.isEqual(t.key)&&!!e.precondition.isEqual(t.precondition)&&(n=e.fieldTransforms,i=t.fieldTransforms,!!(void 0===n&&void 0===i||n&&i&&La(n,i,(e,t)=>function(e,t){return e.field.isEqual(t.field)&&(n=e.transform,i=t.transform,n instanceof dl&&i instanceof dl||n instanceof pl&&i instanceof pl?La(n.elements,i.elements,Bc):n instanceof ml&&i instanceof ml?Bc(n.Ae,i.Ae):n instanceof ul&&i instanceof ul);var n,i}(e,t)))&&(0===e.type?e.value.isEqual(t.value):1!==e.type||e.data.isEqual(t.data)&&e.fieldMask.isEqual(t.fieldMask)));var n,i}class Al extends El{constructor(e,t,n,i=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class Rl extends El{constructor(e,t,n,i,s=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function Pl(e){const t=new Map;return e.fieldMask.fields.forEach(n=>{if(!n.isEmpty()){const i=e.data.field(n);t.set(n,i)}}),t}function Dl(e,t,n){const i=new Map;ga(e.length===n.length,32656,{Re:n.length,Ve:e.length});for(let s=0;s<n.length;s++){const r=e[s],o=r.transform,a=t.data.field(r.field);i.set(r.field,hl(o,a,n[s]))}return i}function Ol(e,t,n){const i=new Map;for(const s of e){const e=s.transform,r=n.data.field(s.field);i.set(s.field,cl(e,r,t))}return i}class xl extends El{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Ll extends El{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}
/**
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
 */class Ml{constructor(e,t,n,i){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=i}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let i=0;i<this.mutations.length;i++){const t=this.mutations[i];t.key.isEqual(e.key)&&Cl(t,e,n[i])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=Sl(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=Sl(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=Zh();return this.mutations.forEach(i=>{const s=e.get(i.key),r=s.overlayedDocument;let o=this.applyToLocalView(r,s.mutatedFields);o=t.has(i.key)?null:o;const a=bl(r,o);null!==a&&n.set(i.key,a),r.isValidDocument()||r.convertToNoDocument(Za.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),il())}isEqual(e){return this.batchId===e.batchId&&La(this.mutations,e.mutations,(e,t)=>Nl(e,t))&&La(this.baseMutations,e.baseMutations,(e,t)=>Nl(e,t))}}class Ul{constructor(e,t,n,i){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=i}static from(e,t,n){ga(e.mutations.length===n.length,58842,{me:e.mutations.length,fe:n.length});let i=function(){return tl}();const s=e.mutations;for(let r=0;r<s.length;r++)i=i.insert(s[r].key,n[r].version);return new Ul(e,t,n,i)}}
/**
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
 */class Fl{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return null!==e&&this.mutation===e.mutation}toString(){return`Overlay{\n      largestBatchId: ${this.largestBatchId},\n      mutation: ${this.mutation.toString()}\n    }`}}
/**
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
 */class Vl{constructor(e,t){this.count=e,this.unchangedNames=t}}
/**
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
 */var ql,jl;function Bl(e){if(void 0===e)return la("GRPC error has no .code"),_a.UNKNOWN;switch(e){case ql.OK:return _a.OK;case ql.CANCELLED:return _a.CANCELLED;case ql.UNKNOWN:return _a.UNKNOWN;case ql.DEADLINE_EXCEEDED:return _a.DEADLINE_EXCEEDED;case ql.RESOURCE_EXHAUSTED:return _a.RESOURCE_EXHAUSTED;case ql.INTERNAL:return _a.INTERNAL;case ql.UNAVAILABLE:return _a.UNAVAILABLE;case ql.UNAUTHENTICATED:return _a.UNAUTHENTICATED;case ql.INVALID_ARGUMENT:return _a.INVALID_ARGUMENT;case ql.NOT_FOUND:return _a.NOT_FOUND;case ql.ALREADY_EXISTS:return _a.ALREADY_EXISTS;case ql.PERMISSION_DENIED:return _a.PERMISSION_DENIED;case ql.FAILED_PRECONDITION:return _a.FAILED_PRECONDITION;case ql.ABORTED:return _a.ABORTED;case ql.OUT_OF_RANGE:return _a.OUT_OF_RANGE;case ql.UNIMPLEMENTED:return _a.UNIMPLEMENTED;case ql.DATA_LOSS:return _a.DATA_LOSS;default:return fa(39323,{code:e})}}(jl=ql||(ql={}))[jl.OK=0]="OK",jl[jl.CANCELLED=1]="CANCELLED",jl[jl.UNKNOWN=2]="UNKNOWN",jl[jl.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",jl[jl.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",jl[jl.NOT_FOUND=5]="NOT_FOUND",jl[jl.ALREADY_EXISTS=6]="ALREADY_EXISTS",jl[jl.PERMISSION_DENIED=7]="PERMISSION_DENIED",jl[jl.UNAUTHENTICATED=16]="UNAUTHENTICATED",jl[jl.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",jl[jl.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",jl[jl.ABORTED=10]="ABORTED",jl[jl.OUT_OF_RANGE=11]="OUT_OF_RANGE",jl[jl.UNIMPLEMENTED=12]="UNIMPLEMENTED",jl[jl.INTERNAL=13]="INTERNAL",jl[jl.UNAVAILABLE=14]="UNAVAILABLE",jl[jl.DATA_LOSS=15]="DATA_LOSS";
/**
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
 */
const zl=new Ho([4294967295,4294967295],0);function $l(e){const t=(new TextEncoder).encode(e),n=new Wo;return n.update(t),new Uint8Array(n.digest())}function Hl(e){const t=new DataView(e.buffer),n=t.getUint32(0,!0),i=t.getUint32(4,!0),s=t.getUint32(8,!0),r=t.getUint32(12,!0);return[new Ho([n,i],0),new Ho([s,r],0)]}class Wl{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new Kl(`Invalid padding: ${t}`);if(n<0)throw new Kl(`Invalid hash count: ${n}`);if(e.length>0&&0===this.hashCount)throw new Kl(`Invalid hash count: ${n}`);if(0===e.length&&0!==t)throw new Kl(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=Ho.fromNumber(this.ge)}ye(e,t,n){let i=e.add(t.multiply(Ho.fromNumber(n)));return 1===i.compare(zl)&&(i=new Ho([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(0===this.ge)return!1;const t=$l(e),[n,i]=Hl(t);for(let s=0;s<this.hashCount;s++){const e=this.ye(n,i,s);if(!this.we(e))return!1}return!0}static create(e,t,n){const i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),r=new Wl(s,i,t);return n.forEach(e=>r.insert(e)),r}insert(e){if(0===this.ge)return;const t=$l(e),[n,i]=Hl(t);for(let s=0;s<this.hashCount;s++){const e=this.ye(n,i,s);this.Se(e)}}Se(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class Kl extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}
/**
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
 */class Gl{constructor(e,t,n,i,s){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const i=new Map;return i.set(e,Ql.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new Gl(Za.min(),i,new gc(Ra),Gh(),il())}}class Ql{constructor(e,t,n,i,s){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new Ql(n,t,il(),il(),il())}}
/**
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
 */class Yl{constructor(e,t,n,i){this.be=e,this.removedTargetIds=t,this.key=n,this.De=i}}class Xl{constructor(e,t){this.targetId=e,this.Ce=t}}class Jl{constructor(e,t,n=Ic.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=i}}class Zl{constructor(){this.ve=0,this.Fe=nu(),this.Me=Ic.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return 0!==this.ve}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=il(),t=il(),n=il();return this.Fe.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:t=t.add(i);break;case 1:n=n.add(i);break;default:fa(38017,{changeType:s})}}),new Ql(this.Me,this.xe,e,t,n)}qe(){this.Oe=!1,this.Fe=nu()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,ga(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class eu{constructor(e){this.Ge=e,this.ze=new Map,this.je=Gh(),this.Je=tu(),this.He=tu(),this.Ye=new gc(Ra)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,t=>{const n=this.nt(t);switch(e.state){case 0:this.rt(t)&&n.Le(e.resumeToken);break;case 1:n.Ke(),n.Ne||n.qe(),n.Le(e.resumeToken);break;case 2:n.Ke(),n.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(n.We(),n.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),n.Le(e.resumeToken));break;default:fa(56790,{state:e.state})}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach((e,n)=>{this.rt(n)&&t(n)})}st(e){const t=e.targetId,n=e.Ce.count,i=this.ot(t);if(i){const s=i.target;if(Ph(s))if(0===n){const e=new ja(s.path);this.et(t,e,rh.newNoDocument(e,Za.min()))}else ga(1===n,20013,{expectedCount:n});else{const i=this._t(t);if(i!==n){const n=this.ut(e),s=n?this.ct(n,e,i):1;if(0!==s){this.it(t);const e=2===s?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,e)}}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:i=0},hashCount:s=0}=t;let r,o;try{r=Sc(n).toUint8Array()}catch(a){if(a instanceof Tc)return ua("Decoding the base64 bloom filter in existence filter failed ("+a.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw a}try{o=new Wl(r,i,s)}catch(a){return ua(a instanceof Kl?"BloomFilter error: ":"Applying bloom filter failed: ",a),null}return 0===o.ge?null:o}ct(e,t,n){return t.Ce.count===n-this.Pt(e,t.targetId)?0:2}Pt(e,t){const n=this.Ge.getRemoteKeysForTarget(t);let i=0;return n.forEach(n=>{const s=this.Ge.ht(),r=`projects/${s.projectId}/databases/${s.database}/documents/${n.path.canonicalString()}`;e.mightContain(r)||(this.et(t,n,null),i++)}),i}Tt(e){const t=new Map;this.ze.forEach((n,i)=>{const s=this.ot(i);if(s){if(n.current&&Ph(s.target)){const t=new ja(s.target.path);this.It(t).has(i)||this.Et(i,t)||this.et(i,t,rh.newNoDocument(t,e))}n.Be&&(t.set(i,n.ke()),n.qe())}});let n=il();this.He.forEach((e,t)=>{let i=!0;t.forEachWhile(e=>{const t=this.ot(e);return!t||"TargetPurposeLimboResolution"===t.purpose||(i=!1,!1)}),i&&(n=n.add(e))}),this.je.forEach((t,n)=>n.setReadTime(e));const i=new Gl(e,t,this.Ye,this.je,n);return this.je=Gh(),this.Je=tu(),this.He=tu(),this.Ye=new gc(Ra),i}Xe(e,t){if(!this.rt(e))return;const n=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,n),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,n){if(!this.rt(e))return;const i=this.nt(e);this.Et(e,t)?i.Qe(t,1):i.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),n&&(this.je=this.je.insert(t,n))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new Zl,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new yc(Ra),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new yc(Ra),this.Je=this.Je.insert(e,t)),t}rt(e){const t=null!==this.ot(e);return t||ha("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new Zl),this.Ge.getRemoteKeysForTarget(e).forEach(t=>{this.et(e,t,null)})}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function tu(){return new gc(ja.comparator)}function nu(){return new gc(ja.comparator)}const iu=(()=>({asc:"ASCENDING",desc:"DESCENDING"}))(),su=(()=>({"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"}))(),ru=(()=>({and:"AND",or:"OR"}))();class ou{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function au(e,t){return e.useProto3Json||cc(t)?t:{value:t}}function cu(e,t){return e.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function hu(e,t){return e.useProto3Json?t.toBase64():t.toUint8Array()}function lu(e,t){return cu(e,t.toTimestamp())}function uu(e){return ga(!!e,49232),Za.fromTimestamp(function(e){const t=bc(e);return new Ja(t.seconds,t.nanos)}(e))}function du(e,t){return fu(e,t).canonicalString()}function fu(e,t){const n=(i=e,new Fa(["projects",i.projectId,"databases",i.database])).child("documents");var i;return void 0===t?n:n.child(t)}function pu(e){const t=Fa.fromString(e);return ga(Du(t),10190,{key:t.toString()}),t}function gu(e,t){return du(e.databaseId,t.path)}function mu(e,t){const n=pu(t);if(n.get(1)!==e.databaseId.projectId)throw new ya(_a.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+e.databaseId.projectId);if(n.get(3)!==e.databaseId.database)throw new ya(_a.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+e.databaseId.database);return new ja(vu(n))}function _u(e,t){return du(e.databaseId,t)}function yu(e){return new Fa(["projects",e.databaseId.projectId,"databases",e.databaseId.database]).canonicalString()}function vu(e){return ga(e.length>4&&"documents"===e.get(4),29091,{key:e.toString()}),e.popFirst(5)}function wu(e,t,n){return{name:gu(e,t),fields:n.value.mapValue.fields}}function Tu(e,t){return{documents:[_u(e,t.path)]}}function Iu(e,t){const n={structuredQuery:{}},i=t.path;let s;null!==t.collectionGroup?(s=i,n.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=i.popLast(),n.structuredQuery.from=[{collectionId:i.lastSegment()}]),n.parent=_u(e,s);const r=function(e){if(0!==e.length)return Ru(fh.create(e,"and"))}(t.filters);r&&(n.structuredQuery.where=r);const o=function(e){if(0!==e.length)return e.map(e=>{return{field:Nu((t=e).field),direction:Cu(t.dir)};var t})}(t.orderBy);o&&(n.structuredQuery.orderBy=o);const a=au(e,t.limit);return null!==a&&(n.structuredQuery.limit=a),t.startAt&&(n.structuredQuery.startAt={before:(c=t.startAt).inclusive,values:c.position}),t.endAt&&(n.structuredQuery.endAt=function(e){return{before:!e.inclusive,values:e.position}}(t.endAt)),{ft:n,parent:s};var c}function Eu(e){let t=function(e){const t=pu(e);return 4===t.length?Fa.emptyPath():vu(t)}(e.parent);const n=e.structuredQuery,i=n.from?n.from.length:0;let s=null;if(i>0){ga(1===i,65062);const e=n.from[0];e.allDescendants?s=e.collectionId:t=t.child(e.collectionId)}let r=[];n.where&&(r=function(e){const t=bu(e);return t instanceof fh&&gh(t)?t.getFilters():[t]}(n.where));let o=[];n.orderBy&&(o=n.orderBy.map(e=>{return new hh(Au((t=e).field),function(e){switch(e){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(t.direction));var t}));let a=null;n.limit&&(a=function(e){let t;return t="object"==typeof e?e.value:e,cc(t)?null:t}(n.limit));let c=null;n.startAt&&(c=function(e){const t=!!e.before,n=e.values||[];return new oh(n,t)}(n.startAt));let h=null;return n.endAt&&(h=function(e){const t=!e.before,n=e.values||[];return new oh(n,t)}(n.endAt)),function(e,t,n,i,s,r,o,a){return new Dh(e,t,n,i,s,"F",o,a)}(t,s,o,r,a,0,c,h)}function bu(e){return void 0!==e.unaryFilter?function(e){switch(e.unaryFilter.op){case"IS_NAN":const t=Au(e.unaryFilter.field);return dh.create(t,"==",{doubleValue:NaN});case"IS_NULL":const n=Au(e.unaryFilter.field);return dh.create(n,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=Au(e.unaryFilter.field);return dh.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const s=Au(e.unaryFilter.field);return dh.create(s,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return fa(61313);default:return fa(60726)}}(e):void 0!==e.fieldFilter?(t=e,dh.create(Au(t.fieldFilter.field),function(e){switch(e){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return fa(58110);default:return fa(50506)}}(t.fieldFilter.op),t.fieldFilter.value)):void 0!==e.compositeFilter?function(e){return fh.create(e.compositeFilter.filters.map(e=>bu(e)),function(e){switch(e){case"AND":return"and";case"OR":return"or";default:return fa(1026)}}(e.compositeFilter.op))}(e):fa(30097,{filter:e});var t}function Cu(e){return iu[e]}function Su(e){return su[e]}function ku(e){return ru[e]}function Nu(e){return{fieldPath:e.canonicalString()}}function Au(e){return qa.fromServerFormat(e.fieldPath)}function Ru(e){return e instanceof dh?function(e){if("=="===e.op){if(eh(e.value))return{unaryFilter:{field:Nu(e.field),op:"IS_NAN"}};if(Zc(e.value))return{unaryFilter:{field:Nu(e.field),op:"IS_NULL"}}}else if("!="===e.op){if(eh(e.value))return{unaryFilter:{field:Nu(e.field),op:"IS_NOT_NAN"}};if(Zc(e.value))return{unaryFilter:{field:Nu(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:Nu(e.field),op:Su(e.op),value:e.value}}}(e):e instanceof fh?function(e){const t=e.getFilters().map(e=>Ru(e));return 1===t.length?t[0]:{compositeFilter:{op:ku(e.op),filters:t}}}(e):fa(54877,{filter:e})}function Pu(e){const t=[];return e.fields.forEach(e=>t.push(e.canonicalString())),{fieldPaths:t}}function Du(e){return e.length>=4&&"projects"===e.get(0)&&"databases"===e.get(2)}
/**
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
 */class Ou{constructor(e,t,n,i,s=Za.min(),r=Za.min(),o=Ic.EMPTY_BYTE_STRING,a=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=r,this.resumeToken=o,this.expectedCount=a}withSequenceNumber(e){return new Ou(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Ou(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Ou(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Ou(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}
/**
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
 */class xu{constructor(e){this.yt=e}}function Lu(e){const t=Eu({parent:e.parent,structuredQuery:e.structuredQuery});return"LAST"===e.limitType?Vh(t,t.limit,"L"):t}
/**
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
 */class Mu{constructor(){this.Cn=new Uu}addToCollectionParentIndex(e,t){return this.Cn.add(t),rc.resolve()}getCollectionParents(e,t){return rc.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return rc.resolve()}deleteFieldIndex(e,t){return rc.resolve()}deleteAllFieldIndexes(e){return rc.resolve()}createTargetIndexes(e,t){return rc.resolve()}getDocumentsMatchingTarget(e,t){return rc.resolve(null)}getIndexType(e,t){return rc.resolve(0)}getFieldIndexes(e,t){return rc.resolve([])}getNextCollectionGroupToUpdate(e){return rc.resolve(null)}getMinOffset(e,t){return rc.resolve(tc.min())}getMinOffsetFromCollectionGroup(e,t){return rc.resolve(tc.min())}updateCollectionGroup(e,t,n){return rc.resolve()}updateIndexEntries(e,t){return rc.resolve()}}class Uu{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),i=this.index[t]||new yc(Fa.comparator),s=!i.has(n);return this.index[t]=i.add(n),s}has(e){const t=e.lastSegment(),n=e.popLast(),i=this.index[t];return i&&i.has(n)}getEntries(e){return(this.index[e]||new yc(Fa.comparator)).toArray()}}
/**
 * @license
 * Copyright 2018 Google LLC
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
 */const Fu={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Vu=41943040;class qu{static withCacheSize(e){return new qu(e,qu.DEFAULT_COLLECTION_PERCENTILE,qu.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}
/**
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
 */qu.DEFAULT_COLLECTION_PERCENTILE=10,qu.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,qu.DEFAULT=new qu(Vu,qu.DEFAULT_COLLECTION_PERCENTILE,qu.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),qu.DISABLED=new qu(-1,0,0);
/**
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
 */
class ju{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new ju(0)}static cr(){return new ju(-1)}}
/**
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
 */const Bu="LruGarbageCollector";function zu([e,t],[n,i]){const s=Ra(e,n);return 0===s?Ra(t,i):s}class $u{constructor(e){this.Ir=e,this.buffer=new yc(zu),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const e=this.buffer.last();zu(t,e)<0&&(this.buffer=this.buffer.delete(e).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Hu{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Rr=null}start(){-1!==this.garbageCollector.params.cacheSizeCollectionThreshold&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return null!==this.Rr}Vr(e){ha(Bu,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){oc(e)?ha(Bu,"Ignoring IndexedDB error during garbage collection: ",e):await sc(e)}await this.Vr(3e5)})}}class Wu{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next(e=>Math.floor(t/100*e))}nthSequenceNumber(e,t){if(0===t)return rc.resolve(ac.ce);const n=new $u(t);return this.mr.forEachTarget(e,e=>n.Ar(e.sequenceNumber)).next(()=>this.mr.pr(e,e=>n.Ar(e))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.mr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return-1===this.params.cacheSizeCollectionThreshold?(ha("LruGarbageCollector","Garbage collection skipped; disabled"),rc.resolve(Fu)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(ha("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Fu):this.yr(e,t))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let n,i,s,r,o,a,c;const h=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(t=>(t>this.params.maximumSequenceNumbersToCollect?(ha("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${t}`),i=this.params.maximumSequenceNumbersToCollect):i=t,r=Date.now(),this.nthSequenceNumber(e,i))).next(i=>(n=i,o=Date.now(),this.removeTargets(e,n,t))).next(t=>(s=t,a=Date.now(),this.removeOrphanedDocuments(e,n))).next(e=>(c=Date.now(),ca()<=ee.DEBUG&&ha("LruGarbageCollector",`LRU Garbage Collection\n\tCounted targets in ${r-h}ms\n\tDetermined least recently used ${i} in `+(o-r)+`ms\n\tRemoved ${s} targets in `+(a-o)+`ms\n\tRemoved ${e} documents in `+(c-a)+`ms\nTotal Duration: ${c-h}ms`),rc.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:s,documentsRemoved:e})))}}
/**
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
 */
class Ku{constructor(){this.changes=new Wh(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,rh.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return void 0!==n?rc.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}
/**
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
 */
/**
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
 */class Gu{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}
/**
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
 */class Qu{constructor(e,t,n,i){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=i}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(i=>(n=i,this.remoteDocumentCache.getEntry(e,t))).next(e=>(null!==n&&Sl(n.mutation,e,wc.empty(),Ja.now()),e))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.getLocalViewOfDocuments(e,t,il()).next(()=>t))}getLocalViewOfDocuments(e,t,n=il()){const i=Jh();return this.populateOverlays(e,i,t).next(()=>this.computeViews(e,t,i,n).next(e=>{let t=Yh();return e.forEach((e,n)=>{t=t.insert(e,n.overlayedDocument)}),t}))}getOverlayedDocuments(e,t){const n=Jh();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,il()))}populateOverlays(e,t,n){const i=[];return n.forEach(e=>{t.has(e)||i.push(e)}),this.documentOverlayCache.getOverlays(e,i).next(e=>{e.forEach((e,n)=>{t.set(e,n)})})}computeViews(e,t,n,i){let s=Gh();const r=el(),o=el();return t.forEach((e,t)=>{const o=n.get(t.key);i.has(t.key)&&(void 0===o||o.mutation instanceof Rl)?s=s.insert(t.key,t):void 0!==o?(r.set(t.key,o.mutation.getFieldMask()),Sl(o.mutation,t,o.mutation.getFieldMask(),Ja.now())):r.set(t.key,wc.empty())}),this.recalculateAndSaveOverlays(e,s).next(e=>(e.forEach((e,t)=>r.set(e,t)),t.forEach((e,t)=>{var n;return o.set(e,new Gu(t,null!=(n=r.get(e))?n:null))}),o))}recalculateAndSaveOverlays(e,t){const n=el();let i=new gc((e,t)=>e-t),s=il();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(e=>{for(const s of e)s.keys().forEach(e=>{const r=t.get(e);if(null===r)return;let o=n.get(e)||wc.empty();o=s.applyToLocalView(r,o),n.set(e,o);const a=(i.get(s.batchId)||il()).add(e);i=i.insert(s.batchId,a)})}).next(()=>{const r=[],o=i.getReverseIterator();for(;o.hasNext();){const i=o.getNext(),a=i.key,c=i.value,h=Zh();c.forEach(e=>{if(!s.has(e)){const i=bl(t.get(e),n.get(e));null!==i&&h.set(e,i),s=s.add(e)}}),r.push(this.documentOverlayCache.saveOverlays(e,a,h))}return rc.waitFor(r)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.recalculateAndSaveOverlays(e,t))}getDocumentsMatchingQuery(e,t,n,i){return s=t,ja.isDocumentKey(s.path)&&null===s.collectionGroup&&0===s.filters.length?this.getDocumentsMatchingDocumentQuery(e,t.path):Lh(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,i):this.getDocumentsMatchingCollectionQuery(e,t,n,i);var s}getNextDocuments(e,t,n,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,i).next(s=>{const r=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,i-s.size):rc.resolve(Jh());let o=-1,a=s;return r.next(t=>rc.forEach(t,(t,n)=>(o<n.largestBatchId&&(o=n.largestBatchId),s.get(t)?rc.resolve():this.remoteDocumentCache.getEntry(e,t).next(e=>{a=a.insert(t,e)}))).next(()=>this.populateOverlays(e,t,s)).next(()=>this.computeViews(e,a,t,il())).next(e=>({batchId:o,changes:Xh(e)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new ja(t)).next(e=>{let t=Yh();return e.isFoundDocument()&&(t=t.insert(e.key,e)),t})}getDocumentsMatchingCollectionGroupQuery(e,t,n,i){const s=t.collectionGroup;let r=Yh();return this.indexManager.getCollectionParents(e,s).next(o=>rc.forEach(o,o=>{const a=(c=t,h=o.child(s),new Dh(h,null,c.explicitOrderBy.slice(),c.filters.slice(),c.limit,c.limitType,c.startAt,c.endAt));var c,h;return this.getDocumentsMatchingCollectionQuery(e,a,n,i).next(e=>{e.forEach((e,t)=>{r=r.insert(e,t)})})}).next(()=>r))}getDocumentsMatchingCollectionQuery(e,t,n,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(r=>(s=r,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,s,i))).next(e=>{s.forEach((t,n)=>{const i=n.getKey();null===e.get(i)&&(e=e.insert(i,rh.newInvalidDocument(i)))});let n=Yh();return e.forEach((e,i)=>{const r=s.get(e);void 0!==r&&Sl(r.mutation,i,wc.empty(),Ja.now()),zh(t,i)&&(n=n.insert(e,i))}),n})}}
/**
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
 */class Yu{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return rc.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,{id:(n=t).id,version:n.version,createTime:uu(n.createTime)}),rc.resolve();var n}getNamedQuery(e,t){return rc.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,{name:(n=t).name,query:Lu(n.bundledQuery),readTime:uu(n.readTime)}),rc.resolve();var n}}
/**
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
 */class Xu{constructor(){this.overlays=new gc(ja.comparator),this.qr=new Map}getOverlay(e,t){return rc.resolve(this.overlays.get(t))}getOverlays(e,t){const n=Jh();return rc.forEach(t,t=>this.getOverlay(e,t).next(e=>{null!==e&&n.set(t,e)})).next(()=>n)}saveOverlays(e,t,n){return n.forEach((n,i)=>{this.St(e,t,i)}),rc.resolve()}removeOverlaysForBatchId(e,t,n){const i=this.qr.get(n);return void 0!==i&&(i.forEach(e=>this.overlays=this.overlays.remove(e)),this.qr.delete(n)),rc.resolve()}getOverlaysForCollection(e,t,n){const i=Jh(),s=t.length+1,r=new ja(t.child("")),o=this.overlays.getIteratorFrom(r);for(;o.hasNext();){const e=o.getNext().value,r=e.getKey();if(!t.isPrefixOf(r.path))break;r.path.length===s&&e.largestBatchId>n&&i.set(e.getKey(),e)}return rc.resolve(i)}getOverlaysForCollectionGroup(e,t,n,i){let s=new gc((e,t)=>e-t);const r=this.overlays.getIterator();for(;r.hasNext();){const e=r.getNext().value;if(e.getKey().getCollectionGroup()===t&&e.largestBatchId>n){let t=s.get(e.largestBatchId);null===t&&(t=Jh(),s=s.insert(e.largestBatchId,t)),t.set(e.getKey(),e)}}const o=Jh(),a=s.getIterator();for(;a.hasNext()&&(a.getNext().value.forEach((e,t)=>o.set(e,t)),!(o.size()>=i)););return rc.resolve(o)}St(e,t,n){const i=this.overlays.get(n.key);if(null!==i){const e=this.qr.get(i.largestBatchId).delete(n.key);this.qr.set(i.largestBatchId,e)}this.overlays=this.overlays.insert(n.key,new Fl(t,n));let s=this.qr.get(t);void 0===s&&(s=il(),this.qr.set(t,s)),this.qr.set(t,s.add(n.key))}}
/**
 * @license
 * Copyright 2024 Google LLC
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
 */class Ju{constructor(){this.sessionToken=Ic.EMPTY_BYTE_STRING}getSessionToken(e){return rc.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,rc.resolve()}}
/**
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
 */class Zu{constructor(){this.Qr=new yc(ed.$r),this.Ur=new yc(ed.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const n=new ed(e,t);this.Qr=this.Qr.add(n),this.Ur=this.Ur.add(n)}Wr(e,t){e.forEach(e=>this.addReference(e,t))}removeReference(e,t){this.Gr(new ed(e,t))}zr(e,t){e.forEach(e=>this.removeReference(e,t))}jr(e){const t=new ja(new Fa([])),n=new ed(t,e),i=new ed(t,e+1),s=[];return this.Ur.forEachInRange([n,i],e=>{this.Gr(e),s.push(e.key)}),s}Jr(){this.Qr.forEach(e=>this.Gr(e))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new ja(new Fa([])),n=new ed(t,e),i=new ed(t,e+1);let s=il();return this.Ur.forEachInRange([n,i],e=>{s=s.add(e.key)}),s}containsKey(e){const t=new ed(e,0),n=this.Qr.firstAfterOrEqual(t);return null!==n&&e.isEqual(n.key)}}class ed{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return ja.comparator(e.key,t.key)||Ra(e.Yr,t.Yr)}static Kr(e,t){return Ra(e.Yr,t.Yr)||ja.comparator(e.key,t.key)}}
/**
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
 */class td{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new yc(ed.$r)}checkEmpty(e){return rc.resolve(0===this.mutationQueue.length)}addMutationBatch(e,t,n,i){const s=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const r=new Ml(s,t,n,i);this.mutationQueue.push(r);for(const o of i)this.Zr=this.Zr.add(new ed(o.key,s)),this.indexManager.addToCollectionParentIndex(e,o.key.path.popLast());return rc.resolve(r)}lookupMutationBatch(e,t){return rc.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,i=this.ei(n),s=i<0?0:i;return rc.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return rc.resolve(0===this.mutationQueue.length?-1:this.tr-1)}getAllMutationBatches(e){return rc.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new ed(t,0),i=new ed(t,Number.POSITIVE_INFINITY),s=[];return this.Zr.forEachInRange([n,i],e=>{const t=this.Xr(e.Yr);s.push(t)}),rc.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new yc(Ra);return t.forEach(e=>{const t=new ed(e,0),i=new ed(e,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([t,i],e=>{n=n.add(e.Yr)})}),rc.resolve(this.ti(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,i=n.length+1;let s=n;ja.isDocumentKey(s)||(s=s.child(""));const r=new ed(new ja(s),0);let o=new yc(Ra);return this.Zr.forEachWhile(e=>{const t=e.key.path;return!!n.isPrefixOf(t)&&(t.length===i&&(o=o.add(e.Yr)),!0)},r),rc.resolve(this.ti(o))}ti(e){const t=[];return e.forEach(e=>{const n=this.Xr(e);null!==n&&t.push(n)}),t}removeMutationBatch(e,t){ga(0===this.ni(t.batchId,"removed"),55003),this.mutationQueue.shift();let n=this.Zr;return rc.forEach(t.mutations,i=>{const s=new ed(i.key,t.batchId);return n=n.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Zr=n})}ir(e){}containsKey(e,t){const n=new ed(t,0),i=this.Zr.firstAfterOrEqual(n);return rc.resolve(t.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,rc.resolve()}ni(e,t){return this.ei(e)}ei(e){return 0===this.mutationQueue.length?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}
/**
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
 */class nd{constructor(e){this.ri=e,this.docs=new gc(ja.comparator),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,i=this.docs.get(n),s=i?i.size:0,r=this.ri(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:r}),this.size+=r-s,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return rc.resolve(n?n.document.mutableCopy():rh.newInvalidDocument(t))}getEntries(e,t){let n=Gh();return t.forEach(e=>{const t=this.docs.get(e);n=n.insert(e,t?t.document.mutableCopy():rh.newInvalidDocument(e))}),rc.resolve(n)}getDocumentsMatchingQuery(e,t,n,i){let s=Gh();const r=t.path,o=new ja(r.child("__id-9223372036854775808__")),a=this.docs.getIteratorFrom(o);for(;a.hasNext();){const{key:e,value:{document:o}}=a.getNext();if(!r.isPrefixOf(e.path))break;e.path.length>r.length+1||nc(ec(o),n)<=0||(i.has(o.key)||zh(t,o))&&(s=s.insert(o.key,o.mutableCopy()))}return rc.resolve(s)}getAllFromCollectionGroup(e,t,n,i){fa(9500)}ii(e,t){return rc.forEach(this.docs,e=>t(e))}newChangeBuffer(e){return new id(this)}getSize(e){return rc.resolve(this.size)}}class id extends Ku{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach((n,i)=>{i.isValidDocument()?t.push(this.Nr.addEntry(e,i)):this.Nr.removeEntry(n)}),rc.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}
/**
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
 */class sd{constructor(e){this.persistence=e,this.si=new Wh(e=>Ah(e),Rh),this.lastRemoteSnapshotVersion=Za.min(),this.highestTargetId=0,this.oi=0,this._i=new Zu,this.targetCount=0,this.ai=ju.ur()}forEachTarget(e,t){return this.si.forEach((e,n)=>t(n)),rc.resolve()}getLastRemoteSnapshotVersion(e){return rc.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return rc.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),rc.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.oi&&(this.oi=t),rc.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new ju(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,rc.resolve()}updateTargetData(e,t){return this.Pr(t),rc.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,rc.resolve()}removeTargets(e,t,n){let i=0;const s=[];return this.si.forEach((r,o)=>{o.sequenceNumber<=t&&null===n.get(o.targetId)&&(this.si.delete(r),s.push(this.removeMatchingKeysForTargetId(e,o.targetId)),i++)}),rc.waitFor(s).next(()=>i)}getTargetCount(e){return rc.resolve(this.targetCount)}getTargetData(e,t){const n=this.si.get(t)||null;return rc.resolve(n)}addMatchingKeys(e,t,n){return this._i.Wr(t,n),rc.resolve()}removeMatchingKeys(e,t,n){this._i.zr(t,n);const i=this.persistence.referenceDelegate,s=[];return i&&t.forEach(t=>{s.push(i.markPotentiallyOrphaned(e,t))}),rc.waitFor(s)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),rc.resolve()}getMatchingKeysForTargetId(e,t){const n=this._i.Hr(t);return rc.resolve(n)}containsKey(e,t){return rc.resolve(this._i.containsKey(t))}}
/**
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
 */class rd{constructor(e,t){this.ui={},this.overlays={},this.ci=new ac(0),this.li=!1,this.li=!0,this.hi=new Ju,this.referenceDelegate=e(this),this.Pi=new sd(this),this.indexManager=new Mu,this.remoteDocumentCache=new nd(e=>this.referenceDelegate.Ti(e)),this.serializer=new xu(t),this.Ii=new Yu(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Xu,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.ui[e.toKey()];return n||(n=new td(t,this.referenceDelegate),this.ui[e.toKey()]=n),n}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,n){ha("MemoryPersistence","Starting transaction:",e);const i=new od(this.ci.next());return this.referenceDelegate.Ei(),n(i).next(e=>this.referenceDelegate.di(i).next(()=>e)).toPromise().then(e=>(i.raiseOnCommittedEvent(),e))}Ai(e,t){return rc.or(Object.values(this.ui).map(n=>()=>n.containsKey(e,t)))}}class od extends ic{constructor(e){super(),this.currentSequenceNumber=e}}class ad{constructor(e){this.persistence=e,this.Ri=new Zu,this.Vi=null}static mi(e){return new ad(e)}get fi(){if(this.Vi)return this.Vi;throw fa(60996)}addReference(e,t,n){return this.Ri.addReference(n,t),this.fi.delete(n.toString()),rc.resolve()}removeReference(e,t,n){return this.Ri.removeReference(n,t),this.fi.add(n.toString()),rc.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),rc.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach(e=>this.fi.add(e.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(e=>{e.forEach(e=>this.fi.add(e.toString()))}).next(()=>n.removeTargetData(e,t))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return rc.forEach(this.fi,n=>{const i=ja.fromPath(n);return this.gi(e,i).next(e=>{e||t.removeEntry(i,Za.min())})}).next(()=>(this.Vi=null,t.apply(e)))}updateLimboDocument(e,t){return this.gi(e,t).next(e=>{e?this.fi.delete(t.toString()):this.fi.add(t.toString())})}Ti(e){return 0}gi(e,t){return rc.or([()=>rc.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class cd{constructor(e,t){this.persistence=e,this.pi=new Wh(e=>function(e){let t="";for(let n=0;n<e.length;n++)t.length>0&&(t=uc(t)),t=lc(e.get(n),t);return uc(t)}(e.path),(e,t)=>e.isEqual(t)),this.garbageCollector=function(e,t){return new Wu(e,t)}(this,t)}static mi(e,t){return new cd(e,t)}Ei(){}di(e){return rc.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next(e=>t.next(t=>e+t))}wr(e){let t=0;return this.pr(e,e=>{t++}).next(()=>t)}pr(e,t){return rc.forEach(this.pi,(n,i)=>this.br(e,n,i).next(e=>e?rc.resolve():t(i)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const i=this.persistence.getRemoteDocumentCache(),s=i.newChangeBuffer();return i.ii(e,i=>this.br(e,i,t).next(e=>{e||(n++,s.removeEntry(i,Za.min()))})).next(()=>s.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),rc.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),rc.resolve()}removeReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),rc.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),rc.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Qc(e.data.value)),t}br(e,t,n){return rc.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const e=this.pi.get(t);return rc.resolve(void 0!==e&&e>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}
/**
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
 */class hd{constructor(e,t,n,i){this.targetId=e,this.fromCache=t,this.Es=n,this.ds=i}static As(e,t){let n=il(),i=il();for(const s of t.docChanges)switch(s.type){case 0:n=n.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new hd(e,t.fromCache,n,i)}}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */class ld{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}
/**
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
 */class ud{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=!function(){var t;const n=null==(t=p())?void 0:t.forceEnvironment;if("node"===n)return!0;if("browser"===n)return!1;try{return"[object process]"===Object.prototype.toString.call(global.process)}catch(e){return!1}}()&&navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")?8:function(){const e=S().match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}()>0?6:4}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,n,i){const s={result:null};return this.ys(e,t).next(e=>{s.result=e}).next(()=>{if(!s.result)return this.ws(e,t,i,n).next(e=>{s.result=e})}).next(()=>{if(s.result)return;const n=new ld;return this.Ss(e,t,n).next(i=>{if(s.result=i,this.Vs)return this.bs(e,t,n,i.size)})}).next(()=>s.result)}bs(e,t,n,i){return n.documentReadCount<this.fs?(ca()<=ee.DEBUG&&ha("QueryEngine","SDK will not create cache indexes for query:",Bh(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),rc.resolve()):(ca()<=ee.DEBUG&&ha("QueryEngine","Query:",Bh(t),"scans",n.documentReadCount,"local documents and returns",i,"documents as results."),n.documentReadCount>this.gs*i?(ca()<=ee.DEBUG&&ha("QueryEngine","The SDK decides to create cache indexes for query:",Bh(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,Uh(t))):rc.resolve())}ys(e,t){if(xh(t))return rc.resolve(null);let n=Uh(t);return this.indexManager.getIndexType(e,n).next(i=>0===i?null:(null!==t.limit&&1===i&&(t=Vh(t,null,"F"),n=Uh(t)),this.indexManager.getDocumentsMatchingTarget(e,n).next(i=>{const s=il(...i);return this.ps.getDocuments(e,s).next(i=>this.indexManager.getMinOffset(e,n).next(n=>{const r=this.Ds(t,i);return this.Cs(t,r,s,n.readTime)?this.ys(e,Vh(t,null,"F")):this.vs(e,r,t,n)}))})))}ws(e,t,n,i){return xh(t)||i.isEqual(Za.min())?rc.resolve(null):this.ps.getDocuments(e,n).next(s=>{const r=this.Ds(t,s);return this.Cs(t,r,n,i)?rc.resolve(null):(ca()<=ee.DEBUG&&ha("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),Bh(t)),this.vs(e,r,t,function(e){const t=e.toTimestamp().seconds,n=e.toTimestamp().nanoseconds+1,i=Za.fromTimestamp(1e9===n?new Ja(t+1,0):new Ja(t,n));return new tc(i,ja.empty(),-1)}(i)).next(e=>e))})}Ds(e,t){let n=new yc($h(e));return t.forEach((t,i)=>{zh(e,i)&&(n=n.add(i))}),n}Cs(e,t,n,i){if(null===e.limit)return!1;if(n.size!==t.size)return!0;const s="F"===e.limitType?t.last():t.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}Ss(e,t,n){return ca()<=ee.DEBUG&&ha("QueryEngine","Using full collection scan to execute query:",Bh(t)),this.ps.getDocumentsMatchingQuery(e,t,tc.min(),n)}vs(e,t,n,i){return this.ps.getDocumentsMatchingQuery(e,n,i).next(e=>(t.forEach(t=>{e=e.insert(t.key,t)}),e))}}
/**
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
 */const dd="LocalStore";class fd{constructor(e,t,n,i){this.persistence=e,this.Fs=t,this.serializer=i,this.Ms=new gc(Ra),this.xs=new Wh(e=>Ah(e),Rh),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(n)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new Qu(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Ms))}}async function pd(e,t){const n=ma(e);return await n.persistence.runTransaction("Handle user change","readonly",e=>{let i;return n.mutationQueue.getAllMutationBatches(e).next(s=>(i=s,n.Bs(t),n.mutationQueue.getAllMutationBatches(e))).next(t=>{const s=[],r=[];let o=il();for(const e of i){s.push(e.batchId);for(const t of e.mutations)o=o.add(t.key)}for(const e of t){r.push(e.batchId);for(const t of e.mutations)o=o.add(t.key)}return n.localDocuments.getDocuments(e,o).next(e=>({Ls:e,removedBatchIds:s,addedBatchIds:r}))})})}function gd(e){const t=ma(e);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Pi.getLastRemoteSnapshotVersion(e))}function md(e,t){const n=ma(e);return n.persistence.runTransaction("Get next mutation batch","readonly",e=>(void 0===t&&(t=-1),n.mutationQueue.getNextMutationBatchAfterBatchId(e,t)))}async function _d(e,t,n){const i=ma(e),s=i.Ms.get(t),r=n?"readwrite":"readwrite-primary";try{n||await i.persistence.runTransaction("Release target",r,e=>i.persistence.referenceDelegate.removeTarget(e,s))}catch(o){if(!oc(o))throw o;ha(dd,`Failed to update sequence numbers for target ${t}: ${o}`)}i.Ms=i.Ms.remove(t),i.xs.delete(s.target)}function yd(e,t,n){const i=ma(e);let s=Za.min(),r=il();return i.persistence.runTransaction("Execute query","readwrite",e=>function(e,t,n){const i=ma(e),s=i.xs.get(n);return void 0!==s?rc.resolve(i.Ms.get(s)):i.Pi.getTargetData(t,n)}(i,e,Uh(t)).next(t=>{if(t)return s=t.lastLimboFreeSnapshotVersion,i.Pi.getMatchingKeysForTargetId(e,t.targetId).next(e=>{r=e})}).next(()=>i.Fs.getDocumentsMatchingQuery(e,t,n?s:Za.min(),n?r:il())).next(e=>(function(e,t,n){let i=e.Os.get(t)||Za.min();n.forEach((e,t)=>{t.readTime.compareTo(i)>0&&(i=t.readTime)}),e.Os.set(t,i)}(i,function(e){return e.collectionGroup||(e.path.length%2==1?e.path.lastSegment():e.path.get(e.path.length-2))}(t),e),{documents:e,Qs:r})))}class vd{constructor(){this.activeTargetIds=sl}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class wd{constructor(){this.Mo=new vd,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,n){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new vd,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}
/**
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
 */class Td{Oo(e){}shutdown(){}}
/**
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
 */const Id="ConnectivityMonitor";class Ed{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){ha(Id,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){ha(Id,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return"undefined"!=typeof window&&void 0!==window.addEventListener&&void 0!==window.removeEventListener}}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */let bd=null;function Cd(){return null===bd?bd=268435456+Math.round(2147483648*Math.random()):bd++,"0x"+bd.toString(16)
/**
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
 */}const Sd="RestConnection",kd={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class Nd{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${n}/databases/${i}`,this.Wo=this.databaseId.database===Lc?`project_id=${n}`:`project_id=${n}&database_id=${i}`}Go(e,t,n,i,s){const r=Cd(),o=this.zo(e,t.toUriEncodedString());ha(Sd,`Sending RPC '${e}' ${r}:`,o,n);const a={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(a,i,s);const{host:c}=new URL(o),h=w(c);return this.Jo(e,o,a,n,h).then(t=>(ha(Sd,`Received RPC '${e}' ${r}: `,t),t),t=>{throw ua(Sd,`RPC '${e}' ${r} failed with error: `,t,"url: ",o,"request:",n),t})}Ho(e,t,n,i,s,r){return this.Go(e,t,n,i,s)}jo(e,t,n){e["X-Goog-Api-Client"]="gl-js/ fire/"+oa,e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((t,n)=>e[n]=t),n&&n.headers.forEach((t,n)=>e[n]=t)}zo(e,t){const n=kd[e];return`${this.Uo}/v1/${t}:${n}`}terminate(){}}
/**
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
 */class Ad{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}
/**
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
 */const Rd="WebChannelConnection";class Pd extends Nd{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,n,i,s){const r=Cd();return new Promise((s,o)=>{const a=new Go;a.setWithCredentials(!0),a.listenOnce(Yo.COMPLETE,()=>{try{switch(a.getLastErrorCode()){case Xo.NO_ERROR:const t=a.getResponseJson();ha(Rd,`XHR for RPC '${e}' ${r} received:`,JSON.stringify(t)),s(t);break;case Xo.TIMEOUT:ha(Rd,`RPC '${e}' ${r} timed out`),o(new ya(_a.DEADLINE_EXCEEDED,"Request time out"));break;case Xo.HTTP_ERROR:const n=a.getStatus();if(ha(Rd,`RPC '${e}' ${r} failed with status:`,n,"response text:",a.getResponseText()),n>0){let e=a.getResponseJson();Array.isArray(e)&&(e=e[0]);const t=null==e?void 0:e.error;if(t&&t.status&&t.message){const e=function(e){const t=e.toLowerCase().replace(/_/g,"-");return Object.values(_a).indexOf(t)>=0?t:_a.UNKNOWN}(t.status);o(new ya(e,t.message))}else o(new ya(_a.UNKNOWN,"Server responded with status "+a.getStatus()))}else o(new ya(_a.UNAVAILABLE,"Connection failed."));break;default:fa(9055,{l_:e,streamId:r,h_:a.getLastErrorCode(),P_:a.getLastError()})}}finally{ha(Rd,`RPC '${e}' ${r} completed.`)}});const c=JSON.stringify(i);ha(Rd,`RPC '${e}' ${r} sending request:`,i),a.send(t,"POST",c,n,15)})}T_(e,t,n){const i=Cd(),s=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],r=ta(),o=ea(),a={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;void 0!==c&&(a.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(a.useFetchStreams=!0),this.jo(a.initMessageHeaders,t,n),a.encodeInitMessageHeaders=!0;const h=s.join("");ha(Rd,`Creating RPC '${e}' stream ${i}: ${h}`,a);const l=r.createWebChannel(h,a);this.I_(l);let u=!1,d=!1;const f=new Ad({Yo:t=>{d?ha(Rd,`Not sending because RPC '${e}' stream ${i} is closed:`,t):(u||(ha(Rd,`Opening RPC '${e}' stream ${i} transport.`),l.open(),u=!0),ha(Rd,`RPC '${e}' stream ${i} sending:`,t),l.send(t))},Zo:()=>l.close()}),p=(e,t,n)=>{e.listen(t,e=>{try{n(e)}catch(t){setTimeout(()=>{throw t},0)}})};return p(l,Qo.EventType.OPEN,()=>{d||(ha(Rd,`RPC '${e}' stream ${i} transport opened.`),f.o_())}),p(l,Qo.EventType.CLOSE,()=>{d||(d=!0,ha(Rd,`RPC '${e}' stream ${i} transport closed`),f.a_(),this.E_(l))}),p(l,Qo.EventType.ERROR,t=>{d||(d=!0,ua(Rd,`RPC '${e}' stream ${i} transport errored. Name:`,t.name,"Message:",t.message),f.a_(new ya(_a.UNAVAILABLE,"The operation could not be completed")))}),p(l,Qo.EventType.MESSAGE,t=>{var n;if(!d){const s=t.data[0];ga(!!s,16349);const r=s,o=(null==r?void 0:r.error)||(null==(n=r[0])?void 0:n.error);if(o){ha(Rd,`RPC '${e}' stream ${i} received error:`,o);const t=o.status;let n=function(e){const t=ql[e];if(void 0!==t)return Bl(t)}(t),s=o.message;void 0===n&&(n=_a.INTERNAL,s="Unknown error status: "+t+" with message "+o.message),d=!0,f.a_(new ya(n,s)),l.close()}else ha(Rd,`RPC '${e}' stream ${i} received:`,s),f.u_(s)}}),p(o,Zo.STAT_EVENT,t=>{t.stat===Jo.PROXY?ha(Rd,`RPC '${e}' stream ${i} detected buffering proxy`):t.stat===Jo.NOPROXY&&ha(Rd,`RPC '${e}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{f.__()},0),f}terminate(){this.c_.forEach(e=>e.close()),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter(t=>t===e)}}function Dd(){return"undefined"!=typeof document?document:null}
/**
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
 */function Od(e){return new ou(e,!0)}
/**
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
 */class xd{constructor(e,t,n=1e3,i=1.5,s=6e4){this.Mi=e,this.timerId=t,this.d_=n,this.A_=i,this.R_=s,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),n=Math.max(0,Date.now()-this.f_),i=Math.max(0,t-n);i>0&&ha("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),e())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){null!==this.m_&&(this.m_.skipDelay(),this.m_=null)}cancel(){null!==this.m_&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}
/**
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
 */const Ld="PersistentStream";class Md{constructor(e,t,n,i,s,r,o,a){this.Mi=e,this.S_=n,this.b_=i,this.connection=s,this.authCredentialsProvider=r,this.appCheckCredentialsProvider=o,this.listener=a,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new xd(e,t)}x_(){return 1===this.state||5===this.state||this.O_()}O_(){return 2===this.state||3===this.state}start(){this.F_=0,4!==this.state?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&null===this.C_&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,4!==e?this.M_.reset():t&&t.code===_a.RESOURCE_EXHAUSTED?(la(t.toString()),la("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===_a.UNAUTHENTICATED&&3!==this.state&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),null!==this.stream&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([e,n])=>{this.D_===t&&this.G_(e,n)},t=>{e(()=>{const e=new ya(_a.UNKNOWN,"Fetching auth token failed: "+t.message);return this.z_(e)})})}G_(e,t){const n=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo(()=>{n(()=>this.listener.Xo())}),this.stream.t_(()=>{n(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(e=>{n(()=>this.z_(e))}),this.stream.onMessage(e=>{n(()=>1==++this.F_?this.J_(e):this.onNext(e))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return ha(Ld,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget(()=>this.D_===e?t():(ha(Ld,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class Ud extends Md{constructor(e,t,n,i,s,r){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,i,r),this.serializer=s}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=function(e,t){let n;if("targetChange"in t){t.targetChange;const s="NO_CHANGE"===(i=t.targetChange.targetChangeType||"NO_CHANGE")?0:"ADD"===i?1:"REMOVE"===i?2:"CURRENT"===i?3:"RESET"===i?4:fa(39313,{state:i}),r=t.targetChange.targetIds||[],o=function(e,t){return e.useProto3Json?(ga(void 0===t||"string"==typeof t,58123),Ic.fromBase64String(t||"")):(ga(void 0===t||t instanceof Buffer||t instanceof Uint8Array,16193),Ic.fromUint8Array(t||new Uint8Array))}(e,t.targetChange.resumeToken),a=t.targetChange.cause,c=a&&function(e){const t=void 0===e.code?_a.UNKNOWN:Bl(e.code);return new ya(t,e.message||"")}(a);n=new Jl(s,r,o,c||null)}else if("documentChange"in t){t.documentChange;const i=t.documentChange;i.document,i.document.name,i.document.updateTime;const s=mu(e,i.document.name),r=uu(i.document.updateTime),o=i.document.createTime?uu(i.document.createTime):Za.min(),a=new ih({mapValue:{fields:i.document.fields}}),c=rh.newFoundDocument(s,r,o,a),h=i.targetIds||[],l=i.removedTargetIds||[];n=new Yl(h,l,c.key,c)}else if("documentDelete"in t){t.documentDelete;const i=t.documentDelete;i.document;const s=mu(e,i.document),r=i.readTime?uu(i.readTime):Za.min(),o=rh.newNoDocument(s,r),a=i.removedTargetIds||[];n=new Yl([],a,o.key,o)}else if("documentRemove"in t){t.documentRemove;const i=t.documentRemove;i.document;const s=mu(e,i.document),r=i.removedTargetIds||[];n=new Yl([],r,s,null)}else{if(!("filter"in t))return fa(11601,{Rt:t});{t.filter;const e=t.filter;e.targetId;const{count:i=0,unchangedNames:s}=e,r=new Vl(i,s),o=e.targetId;n=new Xl(o,r)}}var i;return n}(this.serializer,e),n=function(e){if(!("targetChange"in e))return Za.min();const t=e.targetChange;return t.targetIds&&t.targetIds.length?Za.min():t.readTime?uu(t.readTime):Za.min()}(e);return this.listener.H_(t,n)}Y_(e){const t={};t.database=yu(this.serializer),t.addTarget=function(e,t){let n;const i=t.target;if(n=Ph(i)?{documents:Tu(e,i)}:{query:Iu(e,i).ft},n.targetId=t.targetId,t.resumeToken.approximateByteSize()>0){n.resumeToken=hu(e,t.resumeToken);const i=au(e,t.expectedCount);null!==i&&(n.expectedCount=i)}else if(t.snapshotVersion.compareTo(Za.min())>0){n.readTime=cu(e,t.snapshotVersion.toTimestamp());const i=au(e,t.expectedCount);null!==i&&(n.expectedCount=i)}return n}(this.serializer,e);const n=function(e,t){const n=function(e){switch(e){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return fa(28987,{purpose:e})}}(t.purpose);return null==n?null:{"goog-listen-tags":n}}(this.serializer,e);n&&(t.labels=n),this.q_(t)}Z_(e){const t={};t.database=yu(this.serializer),t.removeTarget=e,this.q_(t)}}class Fd extends Md{constructor(e,t,n,i,s,r){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,i,r),this.serializer=s}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return ga(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,ga(!e.writeResults||0===e.writeResults.length,55816),this.listener.ta()}onNext(e){ga(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=function(e,t){return e&&e.length>0?(ga(void 0!==t,14353),e.map(e=>function(e,t){let n=e.updateTime?uu(e.updateTime):uu(t);return n.isEqual(Za.min())&&(n=uu(t)),new wl(n,e.transformResults||[])}(e,t))):[]}(e.writeResults,e.commitTime),n=uu(e.commitTime);return this.listener.na(n,t)}ra(){const e={};e.database=yu(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map(e=>function(e,t){let n;if(t instanceof Al)n={update:wu(e,t.key,t.value)};else if(t instanceof xl)n={delete:gu(e,t.key)};else if(t instanceof Rl)n={update:wu(e,t.key,t.data),updateMask:Pu(t.fieldMask)};else{if(!(t instanceof Ll))return fa(16599,{Vt:t.type});n={verify:gu(e,t.key)}}return t.fieldTransforms.length>0&&(n.updateTransforms=t.fieldTransforms.map(e=>function(e,t){const n=t.transform;if(n instanceof ul)return{fieldPath:t.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(n instanceof dl)return{fieldPath:t.field.canonicalString(),appendMissingElements:{values:n.elements}};if(n instanceof pl)return{fieldPath:t.field.canonicalString(),removeAllFromArray:{values:n.elements}};if(n instanceof ml)return{fieldPath:t.field.canonicalString(),increment:n.Ae};throw fa(20930,{transform:t.transform})}(0,e))),t.precondition.isNone||(n.currentDocument=(i=e,void 0!==(s=t.precondition).updateTime?{updateTime:lu(i,s.updateTime)}:void 0!==s.exists?{exists:s.exists}:fa(27497))),n;var i,s}(this.serializer,e))};this.q_(t)}}
/**
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
 */class Vd{}class qd extends Vd{constructor(e,t,n,i){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new ya(_a.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,n,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,r])=>this.connection.Go(e,fu(t,n),i,s,r)).catch(e=>{throw"FirebaseError"===e.name?(e.code===_a.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new ya(_a.UNKNOWN,e.toString())})}Ho(e,t,n,i,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([r,o])=>this.connection.Ho(e,fu(t,n),i,r,o,s)).catch(e=>{throw"FirebaseError"===e.name?(e.code===_a.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new ya(_a.UNKNOWN,e.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class jd{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){0===this.oa&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){"Online"===this.state?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,"Online"===e&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}\nThis typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(la(t),this.aa=!1):ha("OnlineStateTracker",t)}Pa(){null!==this._a&&(this._a.cancel(),this._a=null)}}
/**
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
 */const Bd="RemoteStore";class zd{constructor(e,t,n,i,s){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=s,this.Aa.Oo(e=>{n.enqueueAndForget(async()=>{Jd(this)&&(ha(Bd,"Restarting streams for network reachability change."),await async function(e){const t=ma(e);t.Ea.add(4),await Hd(t),t.Ra.set("Unknown"),t.Ea.delete(4),await $d(t)}(this))})}),this.Ra=new jd(n,i)}}async function $d(e){if(Jd(e))for(const t of e.da)await t(!0)}async function Hd(e){for(const t of e.da)await t(!1)}function Wd(e,t){const n=ma(e);n.Ia.has(t.targetId)||(n.Ia.set(t.targetId,t),Xd(n)?Yd(n):_f(n).O_()&&Gd(n,t))}function Kd(e,t){const n=ma(e),i=_f(n);n.Ia.delete(t),i.O_()&&Qd(n,t),0===n.Ia.size&&(i.O_()?i.L_():Jd(n)&&n.Ra.set("Unknown"))}function Gd(e,t){if(e.Va.Ue(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(Za.min())>0){const n=e.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(n)}_f(e).Y_(t)}function Qd(e,t){e.Va.Ue(t),_f(e).Z_(t)}function Yd(e){e.Va=new eu({getRemoteKeysForTarget:t=>e.remoteSyncer.getRemoteKeysForTarget(t),At:t=>e.Ia.get(t)||null,ht:()=>e.datastore.serializer.databaseId}),_f(e).start(),e.Ra.ua()}function Xd(e){return Jd(e)&&!_f(e).x_()&&e.Ia.size>0}function Jd(e){return 0===ma(e).Ea.size}function Zd(e){e.Va=void 0}async function ef(e){e.Ra.set("Online")}async function tf(e){e.Ia.forEach((t,n)=>{Gd(e,t)})}async function nf(e,t){Zd(e),Xd(e)?(e.Ra.ha(t),Yd(e)):e.Ra.set("Unknown")}async function sf(e,t,n){if(e.Ra.set("Online"),t instanceof Jl&&2===t.state&&t.cause)try{await async function(e,t){const n=t.cause;for(const i of t.targetIds)e.Ia.has(i)&&(await e.remoteSyncer.rejectListen(i,n),e.Ia.delete(i),e.Va.removeTarget(i))}(e,t)}catch(i){ha(Bd,"Failed to remove targets %s: %s ",t.targetIds.join(","),i),await rf(e,i)}else if(t instanceof Yl?e.Va.Ze(t):t instanceof Xl?e.Va.st(t):e.Va.tt(t),!n.isEqual(Za.min()))try{const t=await gd(e.localStore);n.compareTo(t)>=0&&await function(e,t){const n=e.Va.Tt(t);return n.targetChanges.forEach((n,i)=>{if(n.resumeToken.approximateByteSize()>0){const s=e.Ia.get(i);s&&e.Ia.set(i,s.withResumeToken(n.resumeToken,t))}}),n.targetMismatches.forEach((t,n)=>{const i=e.Ia.get(t);if(!i)return;e.Ia.set(t,i.withResumeToken(Ic.EMPTY_BYTE_STRING,i.snapshotVersion)),Qd(e,t);const s=new Ou(i.target,t,n,i.sequenceNumber);Gd(e,s)}),e.remoteSyncer.applyRemoteEvent(n)}(e,n)}catch(s){ha(Bd,"Failed to raise snapshot:",s),await rf(e,s)}}async function rf(e,t,n){if(!oc(t))throw t;e.Ea.add(1),await Hd(e),e.Ra.set("Offline"),n||(n=()=>gd(e.localStore)),e.asyncQueue.enqueueRetryable(async()=>{ha(Bd,"Retrying IndexedDB access"),await n(),e.Ea.delete(1),await $d(e)})}function of(e,t){return t().catch(n=>rf(e,n,t))}async function af(e){const t=ma(e),n=yf(t);let i=t.Ta.length>0?t.Ta[t.Ta.length-1].batchId:-1;for(;cf(t);)try{const e=await md(t.localStore,i);if(null===e){0===t.Ta.length&&n.L_();break}i=e.batchId,hf(t,e)}catch(s){await rf(t,s)}lf(t)&&uf(t)}function cf(e){return Jd(e)&&e.Ta.length<10}function hf(e,t){e.Ta.push(t);const n=yf(e);n.O_()&&n.X_&&n.ea(t.mutations)}function lf(e){return Jd(e)&&!yf(e).x_()&&e.Ta.length>0}function uf(e){yf(e).start()}async function df(e){yf(e).ra()}async function ff(e){const t=yf(e);for(const n of e.Ta)t.ea(n.mutations)}async function pf(e,t,n){const i=e.Ta.shift(),s=Ul.from(i,t,n);await of(e,()=>e.remoteSyncer.applySuccessfulWrite(s)),await af(e)}async function gf(e,t){t&&yf(e).X_&&await async function(e,t){if(function(e){switch(e){case _a.OK:return fa(64938);case _a.CANCELLED:case _a.UNKNOWN:case _a.DEADLINE_EXCEEDED:case _a.RESOURCE_EXHAUSTED:case _a.INTERNAL:case _a.UNAVAILABLE:case _a.UNAUTHENTICATED:return!1;case _a.INVALID_ARGUMENT:case _a.NOT_FOUND:case _a.ALREADY_EXISTS:case _a.PERMISSION_DENIED:case _a.FAILED_PRECONDITION:case _a.ABORTED:case _a.OUT_OF_RANGE:case _a.UNIMPLEMENTED:case _a.DATA_LOSS:return!0;default:return fa(15467,{code:e})}}(n=t.code)&&n!==_a.ABORTED){const n=e.Ta.shift();yf(e).B_(),await of(e,()=>e.remoteSyncer.rejectFailedWrite(n.batchId,t)),await af(e)}var n}(e,t),lf(e)&&uf(e)}async function mf(e,t){const n=ma(e);n.asyncQueue.verifyOperationInProgress(),ha(Bd,"RemoteStore received new credentials");const i=Jd(n);n.Ea.add(3),await Hd(n),i&&n.Ra.set("Unknown"),await n.remoteSyncer.handleCredentialChange(t),n.Ea.delete(3),await $d(n)}function _f(e){return e.ma||(e.ma=function(e,t,n){const i=ma(e);return i.sa(),new Ud(t,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,n)}(e.datastore,e.asyncQueue,{Xo:ef.bind(null,e),t_:tf.bind(null,e),r_:nf.bind(null,e),H_:sf.bind(null,e)}),e.da.push(async t=>{t?(e.ma.B_(),Xd(e)?Yd(e):e.Ra.set("Unknown")):(await e.ma.stop(),Zd(e))})),e.ma}function yf(e){return e.fa||(e.fa=function(e,t,n){const i=ma(e);return i.sa(),new Fd(t,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,n)}(e.datastore,e.asyncQueue,{Xo:()=>Promise.resolve(),t_:df.bind(null,e),r_:gf.bind(null,e),ta:ff.bind(null,e),na:pf.bind(null,e)}),e.da.push(async t=>{t?(e.fa.B_(),await af(e)):(await e.fa.stop(),e.Ta.length>0&&(ha(Bd,`Stopping write stream with ${e.Ta.length} pending writes`),e.Ta=[]))})),e.fa
/**
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
 */}class vf{constructor(e,t,n,i,s){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=i,this.removalCallback=s,this.deferred=new va,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(e=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,i,s){const r=Date.now()+n,o=new vf(e,t,r,i,s);return o.start(n),o}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){null!==this.timerHandle&&(this.clearTimeout(),this.deferred.reject(new ya(_a.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>null!==this.timerHandle?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){null!==this.timerHandle&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function wf(e,t){if(la("AsyncQueue",`${t}: ${e}`),oc(e))return new ya(_a.UNAVAILABLE,`${t}: ${e}`);throw e}
/**
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
 */class Tf{static emptySet(e){return new Tf(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||ja.comparator(t.key,n.key):(e,t)=>ja.comparator(e.key,t.key),this.keyedMap=Yh(),this.sortedSet=new gc(this.comparator)}has(e){return null!=this.keyedMap.get(e)}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Tf))return!1;if(this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const e=t.getNext().key,i=n.getNext().key;if(!e.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),0===e.length?"DocumentSet ()":"DocumentSet (\n  "+e.join("  \n")+"\n)"}copy(e,t){const n=new Tf;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}
/**
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
 */class If{constructor(){this.ga=new gc(ja.comparator)}track(e){const t=e.doc.key,n=this.ga.get(t);n?0!==e.type&&3===n.type?this.ga=this.ga.insert(t,e):3===e.type&&1!==n.type?this.ga=this.ga.insert(t,{type:n.type,doc:e.doc}):2===e.type&&2===n.type?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):2===e.type&&0===n.type?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):1===e.type&&0===n.type?this.ga=this.ga.remove(t):1===e.type&&2===n.type?this.ga=this.ga.insert(t,{type:1,doc:n.doc}):0===e.type&&1===n.type?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):fa(63341,{Rt:e,pa:n}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal((t,n)=>{e.push(n)}),e}}class Ef{constructor(e,t,n,i,s,r,o,a,c){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=i,this.mutatedKeys=s,this.fromCache=r,this.syncStateChanged=o,this.excludesMetadataChanges=a,this.hasCachedResults=c}static fromInitialDocuments(e,t,n,i,s){const r=[];return t.forEach(e=>{r.push({type:0,doc:e})}),new Ef(e,t,Tf.emptySet(t),r,n,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&qh(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let i=0;i<t.length;i++)if(t[i].type!==n[i].type||!t[i].doc.isEqual(n[i].doc))return!1;return!0}}
/**
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
 */class bf{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class Cf{constructor(){this.queries=Sf(),this.onlineState="Unknown",this.Ca=new Set}terminate(){!function(e,t){const n=ma(e),i=n.queries;n.queries=Sf(),i.forEach((e,n)=>{for(const i of n.Sa)i.onError(t)})}(this,new ya(_a.ABORTED,"Firestore shutting down"))}}function Sf(){return new Wh(e=>jh(e),qh)}async function kf(e,t){const n=ma(e);let i=3;const s=t.query;let r=n.queries.get(s);r?!r.ba()&&t.Da()&&(i=2):(r=new bf,i=t.Da()?0:1);try{switch(i){case 0:r.wa=await n.onListen(s,!0);break;case 1:r.wa=await n.onListen(s,!1);break;case 2:await n.onFirstRemoteStoreListen(s)}}catch(o){const e=wf(o,`Initialization of query '${Bh(t.query)}' failed`);return void t.onError(e)}n.queries.set(s,r),r.Sa.push(t),t.va(n.onlineState),r.wa&&t.Fa(r.wa)&&Pf(n)}async function Nf(e,t){const n=ma(e),i=t.query;let s=3;const r=n.queries.get(i);if(r){const e=r.Sa.indexOf(t);e>=0&&(r.Sa.splice(e,1),0===r.Sa.length?s=t.Da()?0:1:!r.ba()&&t.Da()&&(s=2))}switch(s){case 0:return n.queries.delete(i),n.onUnlisten(i,!0);case 1:return n.queries.delete(i),n.onUnlisten(i,!1);case 2:return n.onLastRemoteStoreUnlisten(i);default:return}}function Af(e,t){const n=ma(e);let i=!1;for(const s of t){const e=s.query,t=n.queries.get(e);if(t){for(const e of t.Sa)e.Fa(s)&&(i=!0);t.wa=s}}i&&Pf(n)}function Rf(e,t,n){const i=ma(e),s=i.queries.get(t);if(s)for(const r of s.Sa)r.onError(n);i.queries.delete(t)}function Pf(e){e.Ca.forEach(e=>{e.next()})}var Df,Of;(Of=Df||(Df={})).Ma="default",Of.Cache="cache";class xf{constructor(e,t,n){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(e){if(!this.options.includeMetadataChanges){const t=[];for(const n of e.docChanges)3!==n.type&&t.push(n);e=new Ef(e.query,e.docs,e.oldDocs,t,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache)return!0;if(!this.Da())return!0;const n="Offline"!==t;return(!this.options.qa||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||"Offline"===t)}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&!0===this.options.includeMetadataChanges}ka(e){e=Ef.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==Df.Cache}}
/**
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
 */class Lf{constructor(e){this.key=e}}class Mf{constructor(e){this.key=e}}class Uf{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=il(),this.mutatedKeys=il(),this.eu=$h(e),this.tu=new Tf(this.eu)}get nu(){return this.Ya}ru(e,t){const n=t?t.iu:new If,i=t?t.tu:this.tu;let s=t?t.mutatedKeys:this.mutatedKeys,r=i,o=!1;const a="F"===this.query.limitType&&i.size===this.query.limit?i.last():null,c="L"===this.query.limitType&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((e,t)=>{const h=i.get(e),l=zh(this.query,t)?t:null,u=!!h&&this.mutatedKeys.has(h.key),d=!!l&&(l.hasLocalMutations||this.mutatedKeys.has(l.key)&&l.hasCommittedMutations);let f=!1;h&&l?h.data.isEqual(l.data)?u!==d&&(n.track({type:3,doc:l}),f=!0):this.su(h,l)||(n.track({type:2,doc:l}),f=!0,(a&&this.eu(l,a)>0||c&&this.eu(l,c)<0)&&(o=!0)):!h&&l?(n.track({type:0,doc:l}),f=!0):h&&!l&&(n.track({type:1,doc:h}),f=!0,(a||c)&&(o=!0)),f&&(l?(r=r.add(l),s=d?s.add(e):s.delete(e)):(r=r.delete(e),s=s.delete(e)))}),null!==this.query.limit)for(;r.size>this.query.limit;){const e="F"===this.query.limitType?r.last():r.first();r=r.delete(e.key),s=s.delete(e.key),n.track({type:1,doc:e})}return{tu:r,iu:n,Cs:o,mutatedKeys:s}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,i){const s=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const r=e.iu.ya();r.sort((e,t)=>function(e,t){const n=e=>{switch(e){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return fa(20277,{Rt:e})}};return n(e)-n(t)}(e.type,t.type)||this.eu(e.doc,t.doc)),this.ou(n),i=null!=i&&i;const o=t&&!i?this._u():[],a=0===this.Xa.size&&this.current&&!i?1:0,c=a!==this.Za;return this.Za=a,0!==r.length||c?{snapshot:new Ef(this.query,e.tu,s,r,e.mutatedKeys,0===a,c,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:o}:{au:o}}va(e){return this.current&&"Offline"===e?(this.current=!1,this.applyChanges({tu:this.tu,iu:new If,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(e=>this.Ya=this.Ya.add(e)),e.modifiedDocuments.forEach(e=>{}),e.removedDocuments.forEach(e=>this.Ya=this.Ya.delete(e)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=il(),this.tu.forEach(e=>{this.uu(e.key)&&(this.Xa=this.Xa.add(e.key))});const t=[];return e.forEach(e=>{this.Xa.has(e)||t.push(new Mf(e))}),this.Xa.forEach(n=>{e.has(n)||t.push(new Lf(n))}),t}cu(e){this.Ya=e.Qs,this.Xa=il();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return Ef.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,0===this.Za,this.hasCachedResults)}}const Ff="SyncEngine";class Vf{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class qf{constructor(e){this.key=e,this.hu=!1}}class jf{constructor(e,t,n,i,s,r){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=r,this.Pu={},this.Tu=new Wh(e=>jh(e),qh),this.Iu=new Map,this.Eu=new Set,this.du=new gc(ja.comparator),this.Au=new Map,this.Ru=new Zu,this.Vu={},this.mu=new Map,this.fu=ju.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return!0===this.gu}}async function Bf(e,t,n=!0){const i=hp(e);let s;const r=i.Tu.get(t);return r?(i.sharedClientState.addLocalQueryTarget(r.targetId),s=r.view.lu()):s=await $f(i,t,n,!0),s}async function zf(e,t){const n=hp(e);await $f(n,t,!0,!1)}async function $f(e,t,n,i){const s=await function(e,t){const n=ma(e);return n.persistence.runTransaction("Allocate target","readwrite",e=>{let i;return n.Pi.getTargetData(e,t).next(s=>s?(i=s,rc.resolve(i)):n.Pi.allocateTargetId(e).next(s=>(i=new Ou(t,s,"TargetPurposeListen",e.currentSequenceNumber),n.Pi.addTargetData(e,i).next(()=>i))))}).then(e=>{const i=n.Ms.get(e.targetId);return(null===i||e.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(n.Ms=n.Ms.insert(e.targetId,e),n.xs.set(t,e.targetId)),e})}(e.localStore,Uh(t)),r=s.targetId,o=e.sharedClientState.addLocalQueryTarget(r,n);let a;return i&&(a=await async function(e,t,n,i,s){e.pu=(t,n,i)=>async function(e,t,n,i){let s=t.view.ru(n);s.Cs&&(s=await yd(e.localStore,t.query,!1).then(({documents:e})=>t.view.ru(e,s)));const r=i&&i.targetChanges.get(t.targetId),o=i&&null!=i.targetMismatches.get(t.targetId),a=t.view.applyChanges(s,e.isPrimaryClient,r,o);return ip(e,t.targetId,a.au),a.snapshot}(e,t,n,i);const r=await yd(e.localStore,t,!0),o=new Uf(t,r.Qs),a=o.ru(r.documents),c=Ql.createSynthesizedTargetChangeForCurrentChange(n,i&&"Offline"!==e.onlineState,s),h=o.applyChanges(a,e.isPrimaryClient,c);ip(e,n,h.au);const l=new Vf(t,n,o);return e.Tu.set(t,l),e.Iu.has(n)?e.Iu.get(n).push(t):e.Iu.set(n,[t]),h.snapshot}(e,t,r,"current"===o,s.resumeToken)),e.isPrimaryClient&&n&&Wd(e.remoteStore,s),a}async function Hf(e,t,n){const i=ma(e),s=i.Tu.get(t),r=i.Iu.get(s.targetId);if(r.length>1)return i.Iu.set(s.targetId,r.filter(e=>!qh(e,t))),void i.Tu.delete(t);i.isPrimaryClient?(i.sharedClientState.removeLocalQueryTarget(s.targetId),i.sharedClientState.isActiveQueryTarget(s.targetId)||await _d(i.localStore,s.targetId,!1).then(()=>{i.sharedClientState.clearQueryState(s.targetId),n&&Kd(i.remoteStore,s.targetId),tp(i,s.targetId)}).catch(sc)):(tp(i,s.targetId),await _d(i.localStore,s.targetId,!0))}async function Wf(e,t){const n=ma(e),i=n.Tu.get(t),s=n.Iu.get(i.targetId);n.isPrimaryClient&&1===s.length&&(n.sharedClientState.removeLocalQueryTarget(i.targetId),Kd(n.remoteStore,i.targetId))}async function Kf(e,t,n){const i=function(e){const t=ma(e);return t.remoteStore.remoteSyncer.applySuccessfulWrite=Xf.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=Jf.bind(null,t),t}(e);try{const e=await function(e,t){const n=ma(e),i=Ja.now(),s=t.reduce((e,t)=>e.add(t.key),il());let r,o;return n.persistence.runTransaction("Locally write mutations","readwrite",e=>{let a=Gh(),c=il();return n.Ns.getEntries(e,s).next(e=>{a=e,a.forEach((e,t)=>{t.isValidDocument()||(c=c.add(e))})}).next(()=>n.localDocuments.getOverlayedDocuments(e,a)).next(s=>{r=s;const o=[];for(const e of t){const t=kl(e,r.get(e.key).overlayedDocument);null!=t&&o.push(new Rl(e.key,t,sh(t.value.mapValue),Tl.exists(!0)))}return n.mutationQueue.addMutationBatch(e,i,o,t)}).next(t=>{o=t;const i=t.applyToLocalDocumentSet(r,c);return n.documentOverlayCache.saveOverlays(e,t.batchId,i)})}).then(()=>({batchId:o.batchId,changes:Xh(r)}))}(i.localStore,t);i.sharedClientState.addPendingMutation(e.batchId),function(e,t,n){let i=e.Vu[e.currentUser.toKey()];i||(i=new gc(Ra)),i=i.insert(t,n),e.Vu[e.currentUser.toKey()]=i}(i,e.batchId,n),await op(i,e.changes),await af(i.remoteStore)}catch(s){const e=wf(s,"Failed to persist write");n.reject(e)}}async function Gf(e,t){const n=ma(e);try{const e=await function(e,t){const n=ma(e),i=t.snapshotVersion;let s=n.Ms;return n.persistence.runTransaction("Apply remote event","readwrite-primary",e=>{const r=n.Ns.newChangeBuffer({trackRemovals:!0});s=n.Ms;const o=[];t.targetChanges.forEach((r,a)=>{const c=s.get(a);if(!c)return;o.push(n.Pi.removeMatchingKeys(e,r.removedDocuments,a).next(()=>n.Pi.addMatchingKeys(e,r.addedDocuments,a)));let h=c.withSequenceNumber(e.currentSequenceNumber);var l,u,d;null!==t.targetMismatches.get(a)?h=h.withResumeToken(Ic.EMPTY_BYTE_STRING,Za.min()).withLastLimboFreeSnapshotVersion(Za.min()):r.resumeToken.approximateByteSize()>0&&(h=h.withResumeToken(r.resumeToken,i)),s=s.insert(a,h),u=h,d=r,(0===(l=c).resumeToken.approximateByteSize()||u.snapshotVersion.toMicroseconds()-l.snapshotVersion.toMicroseconds()>=3e8||d.addedDocuments.size+d.modifiedDocuments.size+d.removedDocuments.size>0)&&o.push(n.Pi.updateTargetData(e,h))});let a=Gh(),c=il();if(t.documentUpdates.forEach(i=>{t.resolvedLimboDocuments.has(i)&&o.push(n.persistence.referenceDelegate.updateLimboDocument(e,i))}),o.push(function(e,t,n){let i=il(),s=il();return n.forEach(e=>i=i.add(e)),t.getEntries(e,i).next(e=>{let i=Gh();return n.forEach((n,r)=>{const o=e.get(n);r.isFoundDocument()!==o.isFoundDocument()&&(s=s.add(n)),r.isNoDocument()&&r.version.isEqual(Za.min())?(t.removeEntry(n,r.readTime),i=i.insert(n,r)):!o.isValidDocument()||r.version.compareTo(o.version)>0||0===r.version.compareTo(o.version)&&o.hasPendingWrites?(t.addEntry(r),i=i.insert(n,r)):ha(dd,"Ignoring outdated watch update for ",n,". Current version:",o.version," Watch version:",r.version)}),{ks:i,qs:s}})}(e,r,t.documentUpdates).next(e=>{a=e.ks,c=e.qs})),!i.isEqual(Za.min())){const t=n.Pi.getLastRemoteSnapshotVersion(e).next(t=>n.Pi.setTargetsMetadata(e,e.currentSequenceNumber,i));o.push(t)}return rc.waitFor(o).next(()=>r.apply(e)).next(()=>n.localDocuments.getLocalViewOfDocuments(e,a,c)).next(()=>a)}).then(e=>(n.Ms=s,e))}(n.localStore,t);t.targetChanges.forEach((e,t)=>{const i=n.Au.get(t);i&&(ga(e.addedDocuments.size+e.modifiedDocuments.size+e.removedDocuments.size<=1,22616),e.addedDocuments.size>0?i.hu=!0:e.modifiedDocuments.size>0?ga(i.hu,14607):e.removedDocuments.size>0&&(ga(i.hu,42227),i.hu=!1))}),await op(n,e,t)}catch(i){await sc(i)}}function Qf(e,t,n){const i=ma(e);if(i.isPrimaryClient&&0===n||!i.isPrimaryClient&&1===n){const e=[];i.Tu.forEach((n,i)=>{const s=i.view.va(t);s.snapshot&&e.push(s.snapshot)}),function(e,t){const n=ma(e);n.onlineState=t;let i=!1;n.queries.forEach((e,n)=>{for(const s of n.Sa)s.va(t)&&(i=!0)}),i&&Pf(n)}(i.eventManager,t),e.length&&i.Pu.H_(e),i.onlineState=t,i.isPrimaryClient&&i.sharedClientState.setOnlineState(t)}}async function Yf(e,t,n){const i=ma(e);i.sharedClientState.updateQueryState(t,"rejected",n);const s=i.Au.get(t),r=s&&s.key;if(r){let e=new gc(ja.comparator);e=e.insert(r,rh.newNoDocument(r,Za.min()));const n=il().add(r),s=new Gl(Za.min(),new Map,new gc(Ra),e,n);await Gf(i,s),i.du=i.du.remove(r),i.Au.delete(t),rp(i)}else await _d(i.localStore,t,!1).then(()=>tp(i,t,n)).catch(sc)}async function Xf(e,t){const n=ma(e),i=t.batch.batchId;try{const e=await function(e,t){const n=ma(e);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",e=>{const i=t.batch.keys(),s=n.Ns.newChangeBuffer({trackRemovals:!0});return function(e,t,n,i){const s=n.batch,r=s.keys();let o=rc.resolve();return r.forEach(e=>{o=o.next(()=>i.getEntry(t,e)).next(t=>{const r=n.docVersions.get(e);ga(null!==r,48541),t.version.compareTo(r)<0&&(s.applyToRemoteDocument(t,n),t.isValidDocument()&&(t.setReadTime(n.commitVersion),i.addEntry(t)))})}),o.next(()=>e.mutationQueue.removeMutationBatch(t,s))}(n,e,t,s).next(()=>s.apply(e)).next(()=>n.mutationQueue.performConsistencyCheck(e)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(e,i,t.batch.batchId)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e,function(e){let t=il();for(let n=0;n<e.mutationResults.length;++n)e.mutationResults[n].transformResults.length>0&&(t=t.add(e.batch.mutations[n].key));return t}(t))).next(()=>n.localDocuments.getDocuments(e,i))})}(n.localStore,t);ep(n,i,null),Zf(n,i),n.sharedClientState.updateMutationState(i,"acknowledged"),await op(n,e)}catch(s){await sc(s)}}async function Jf(e,t,n){const i=ma(e);try{const e=await function(e,t){const n=ma(e);return n.persistence.runTransaction("Reject batch","readwrite-primary",e=>{let i;return n.mutationQueue.lookupMutationBatch(e,t).next(t=>(ga(null!==t,37113),i=t.keys(),n.mutationQueue.removeMutationBatch(e,t))).next(()=>n.mutationQueue.performConsistencyCheck(e)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(e,i,t)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e,i)).next(()=>n.localDocuments.getDocuments(e,i))})}(i.localStore,t);ep(i,t,n),Zf(i,t),i.sharedClientState.updateMutationState(t,"rejected",n),await op(i,e)}catch(s){await sc(s)}}function Zf(e,t){(e.mu.get(t)||[]).forEach(e=>{e.resolve()}),e.mu.delete(t)}function ep(e,t,n){const i=ma(e);let s=i.Vu[i.currentUser.toKey()];if(s){const e=s.get(t);e&&(n?e.reject(n):e.resolve(),s=s.remove(t)),i.Vu[i.currentUser.toKey()]=s}}function tp(e,t,n=null){e.sharedClientState.removeLocalQueryTarget(t);for(const i of e.Iu.get(t))e.Tu.delete(i),n&&e.Pu.yu(i,n);e.Iu.delete(t),e.isPrimaryClient&&e.Ru.jr(t).forEach(t=>{e.Ru.containsKey(t)||np(e,t)})}function np(e,t){e.Eu.delete(t.path.canonicalString());const n=e.du.get(t);null!==n&&(Kd(e.remoteStore,n),e.du=e.du.remove(t),e.Au.delete(n),rp(e))}function ip(e,t,n){for(const i of n)i instanceof Lf?(e.Ru.addReference(i.key,t),sp(e,i)):i instanceof Mf?(ha(Ff,"Document no longer in limbo: "+i.key),e.Ru.removeReference(i.key,t),e.Ru.containsKey(i.key)||np(e,i.key)):fa(19791,{wu:i})}function sp(e,t){const n=t.key,i=n.path.canonicalString();e.du.get(n)||e.Eu.has(i)||(ha(Ff,"New document in limbo: "+n),e.Eu.add(i),rp(e))}function rp(e){for(;e.Eu.size>0&&e.du.size<e.maxConcurrentLimboResolutions;){const t=e.Eu.values().next().value;e.Eu.delete(t);const n=new ja(Fa.fromString(t)),i=e.fu.next();e.Au.set(i,new qf(n)),e.du=e.du.insert(n,i),Wd(e.remoteStore,new Ou(Uh(Oh(n.path)),i,"TargetPurposeLimboResolution",ac.ce))}}async function op(e,t,n){const i=ma(e),s=[],r=[],o=[];i.Tu.isEmpty()||(i.Tu.forEach((e,a)=>{o.push(i.pu(a,t,n).then(e=>{var t;if((e||n)&&i.isPrimaryClient){const s=e?!e.fromCache:null==(t=null==n?void 0:n.targetChanges.get(a.targetId))?void 0:t.current;i.sharedClientState.updateQueryState(a.targetId,s?"current":"not-current")}if(e){s.push(e);const t=hd.As(a.targetId,e);r.push(t)}}))}),await Promise.all(o),i.Pu.H_(s),await async function(e,t){const n=ma(e);try{await n.persistence.runTransaction("notifyLocalViewChanges","readwrite",e=>rc.forEach(t,t=>rc.forEach(t.Es,i=>n.persistence.referenceDelegate.addReference(e,t.targetId,i)).next(()=>rc.forEach(t.ds,i=>n.persistence.referenceDelegate.removeReference(e,t.targetId,i)))))}catch(i){if(!oc(i))throw i;ha(dd,"Failed to update sequence numbers: "+i)}for(const s of t){const e=s.targetId;if(!s.fromCache){const t=n.Ms.get(e),i=t.snapshotVersion,s=t.withLastLimboFreeSnapshotVersion(i);n.Ms=n.Ms.insert(e,s)}}}(i.localStore,r))}async function ap(e,t){const n=ma(e);if(!n.currentUser.isEqual(t)){ha(Ff,"User change. New user:",t.toKey());const e=await pd(n.localStore,t);n.currentUser=t,(i=n).mu.forEach(e=>{e.forEach(e=>{e.reject(new ya(_a.CANCELLED,"'waitForPendingWrites' promise is rejected due to a user change."))})}),i.mu.clear(),n.sharedClientState.handleUserChange(t,e.removedBatchIds,e.addedBatchIds),await op(n,e.Ls)}var i}function cp(e,t){const n=ma(e),i=n.Au.get(t);if(i&&i.hu)return il().add(i.key);{let e=il();const i=n.Iu.get(t);if(!i)return e;for(const t of i){const i=n.Tu.get(t);e=e.unionWith(i.view.nu)}return e}}function hp(e){const t=ma(e);return t.remoteStore.remoteSyncer.applyRemoteEvent=Gf.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=cp.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Yf.bind(null,t),t.Pu.H_=Af.bind(null,t.eventManager),t.Pu.yu=Rf.bind(null,t.eventManager),t}class lp{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Od(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return function(e,t,n,i){return new fd(e,t,n,i)}(this.persistence,new ud,e.initialUser,this.serializer)}Cu(e){return new rd(ad.mi,this.serializer)}Du(e){return new wd}async terminate(){var e,t;null==(e=this.gcScheduler)||e.stop(),null==(t=this.indexBackfillerScheduler)||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}lp.provider={build:()=>new lp};class up extends lp{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){ga(this.persistence.referenceDelegate instanceof cd,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Hu(n,e.asyncQueue,t)}Cu(e){const t=void 0!==this.cacheSizeBytes?qu.withCacheSize(this.cacheSizeBytes):qu.DEFAULT;return new rd(e=>cd.mi(e,t),this.serializer)}}class dp{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=e=>Qf(this.syncEngine,e,1),this.remoteStore.remoteSyncer.handleCredentialChange=ap.bind(null,this.syncEngine),await async function(e,t){const n=ma(e);t?(n.Ea.delete(2),await $d(n)):t||(n.Ea.add(2),await Hd(n),n.Ra.set("Unknown"))}(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return new Cf}createDatastore(e){const t=Od(e.databaseInfo.databaseId),n=(i=e.databaseInfo,new Pd(i));var i;return function(e,t,n,i){return new qd(e,t,n,i)}(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return function(e,t,n,i,s){return new zd(e,t,n,i,s)}(this.localStore,this.datastore,e.asyncQueue,e=>Qf(this.syncEngine,e,0),Ed.v()?new Ed:new Td)}createSyncEngine(e,t){return function(e,t,n,i,s,r,o){const a=new jf(e,t,n,i,s,r);return o&&(a.gu=!0),a}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(e){const t=ma(e);ha(Bd,"RemoteStore shutting down."),t.Ea.add(5),await Hd(t),t.Aa.shutdown(),t.Ra.set("Unknown")}(this.remoteStore),null==(e=this.datastore)||e.terminate(),null==(t=this.eventManager)||t.terminate()}}dp.provider={build:()=>new dp};
/**
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
 */
/**
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
 */
class fp{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):la("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout(()=>{this.muted||e(t)},0)}}
/**
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
 */const pp="FirestoreClient";class gp{constructor(e,t,n,i,s){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this.databaseInfo=i,this.user=ra.UNAUTHENTICATED,this.clientId=Aa.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(n,async e=>{ha(pp,"Received user=",e.uid),await this.authCredentialListener(e),this.user=e}),this.appCheckCredentials.start(n,e=>(ha(pp,"Received new app check token=",e),this.appCheckCredentialListener(e,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new va;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=wf(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function mp(e,t){e.asyncQueue.verifyOperationInProgress(),ha(pp,"Initializing OfflineComponentProvider");const n=e.configuration;await t.initialize(n);let i=n.initialUser;e.setCredentialChangeListener(async e=>{i.isEqual(e)||(await pd(t.localStore,e),i=e)}),t.persistence.setDatabaseDeletedListener(()=>e.terminate()),e._offlineComponents=t}async function _p(e,t){e.asyncQueue.verifyOperationInProgress();const n=await async function(e){if(!e._offlineComponents)if(e._uninitializedComponentsProvider){ha(pp,"Using user provided OfflineComponentProvider");try{await mp(e,e._uninitializedComponentsProvider._offline)}catch(t){const s=t;if(!("FirebaseError"===(n=s).name?n.code===_a.FAILED_PRECONDITION||n.code===_a.UNIMPLEMENTED:!("undefined"!=typeof DOMException&&n instanceof DOMException)||22===n.code||20===n.code||11===n.code))throw s;ua("Error using user provided cache. Falling back to memory cache: "+s),await mp(e,new lp)}}else ha(pp,"Using default OfflineComponentProvider"),await mp(e,new up(void 0));var n;return e._offlineComponents}(e);ha(pp,"Initializing OnlineComponentProvider"),await t.initialize(n,e.configuration),e.setCredentialChangeListener(e=>mf(t.remoteStore,e)),e.setAppCheckTokenChangeListener((e,n)=>mf(t.remoteStore,n)),e._onlineComponents=t}async function yp(e){return e._onlineComponents||(e._uninitializedComponentsProvider?(ha(pp,"Using user provided OnlineComponentProvider"),await _p(e,e._uninitializedComponentsProvider._online)):(ha(pp,"Using default OnlineComponentProvider"),await _p(e,new dp))),e._onlineComponents}async function vp(e){const t=await yp(e),n=t.eventManager;return n.onListen=Bf.bind(null,t.syncEngine),n.onUnlisten=Hf.bind(null,t.syncEngine),n.onFirstRemoteStoreListen=zf.bind(null,t.syncEngine),n.onLastRemoteStoreUnlisten=Wf.bind(null,t.syncEngine),n}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */
function wp(e){const t={};return void 0!==e.timeoutSeconds&&(t.timeoutSeconds=e.timeoutSeconds),t
/**
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
 */}const Tp=new Map,Ip="firestore.googleapis.com",Ep=!0;
/**
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
 */class bp{constructor(e){var t,n;if(void 0===e.host){if(void 0!==e.ssl)throw new ya(_a.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Ip,this.ssl=Ep}else this.host=e.host,this.ssl=null!=(t=e.ssl)?t:Ep;if(this.isUsingEmulator=void 0!==e.emulatorOptions,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,void 0===e.cacheSizeBytes)this.cacheSizeBytes=Vu;else{if(-1!==e.cacheSizeBytes&&e.cacheSizeBytes<1048576)throw new ya(_a.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}(function(e,t,n,i){if(!0===t&&!0===i)throw new ya(_a.INVALID_ARGUMENT,"experimentalForceLongPolling and experimentalAutoDetectLongPolling cannot be used together.")})(0,e.experimentalForceLongPolling,0,e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:void 0===e.experimentalAutoDetectLongPolling?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=wp(null!=(n=e.experimentalLongPollingOptions)?n:{}),function(e){if(void 0!==e.timeoutSeconds){if(isNaN(e.timeoutSeconds))throw new ya(_a.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (must not be NaN)`);if(e.timeoutSeconds<5)throw new ya(_a.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (minimum allowed value is 5)`);if(e.timeoutSeconds>30)throw new ya(_a.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(t=this.experimentalLongPollingOptions,n=e.experimentalLongPollingOptions,t.timeoutSeconds===n.timeoutSeconds)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams;var t,n}}class Cp{constructor(e,t,n,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new bp({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new ya(_a.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return"notTerminated"!==this._terminateTask}_setSettings(e){if(this._settingsFrozen)throw new ya(_a.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new bp(e),this._emulatorOptions=e.emulatorOptions||{},void 0!==e.credentials&&(this._authCredentials=function(e){if(!e)return new Ta;switch(e.type){case"firstParty":return new Ca(e.sessionIndex||"0",e.iamToken||null,e.authTokenFactory||null);case"provider":return e.client;default:throw new ya(_a.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return"notTerminated"===this._terminateTask&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){"notTerminated"===this._terminateTask?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){const t=Tp.get(e);t&&(ha("ComponentProvider","Removing Datastore"),Tp.delete(e),t.terminate())}(this),Promise.resolve()}}
/**
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
 */
class Sp{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new Sp(this.firestore,e,this._query)}}class kp{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Np(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new kp(this.firestore,e,this._key)}toJSON(){return{type:kp._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Qa(t,kp._jsonSchema))return new kp(e,n||null,new ja(Fa.fromString(t.referencePath)))}}kp._jsonSchemaVersion="firestore/documentReference/1.0",kp._jsonSchema={type:Ga("string",kp._jsonSchemaVersion),referencePath:Ga("string")};class Np extends Sp{constructor(e,t,n){super(e,t,Oh(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new kp(this.firestore,null,new ja(e))}withConverter(e){return new Np(this.firestore,e,this._path)}}function Ap(e,t,...n){if(e=Q(e),Ba("collection","path",t),e instanceof Cp){const i=Fa.fromString(t,...n);return $a(i),new Np(e,null,i)}{if(!(e instanceof kp||e instanceof Np))throw new ya(_a.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const i=e._path.child(Fa.fromString(t,...n));return $a(i),new Np(e.firestore,null,i)}}function Rp(e,t,...n){if(e=Q(e),1===arguments.length&&(t=Aa.newId()),Ba("doc","path",t),e instanceof Cp){const i=Fa.fromString(t,...n);return za(i),new kp(e,null,new ja(i))}{if(!(e instanceof kp||e instanceof Np))throw new ya(_a.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const i=e._path.child(Fa.fromString(t,...n));return za(i),new kp(e.firestore,e instanceof Np?e.converter:null,new ja(i))}}
/**
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
 */const Pp="AsyncQueue";class Dp{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new xd(this,"async_queue_retry"),this._c=()=>{const e=Dd();e&&ha(Pp,"Visibility state changed to "+e.visibilityState),this.M_.w_()},this.ac=e;const t=Dd();t&&"function"==typeof t.addEventListener&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=Dd();t&&"function"==typeof t.removeEventListener&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const t=new va;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Xu.push(e),this.lc()))}async lc(){if(0!==this.Xu.length){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!oc(e))throw e;ha(Pp,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const t=this.ac.then(()=>(this.rc=!0,e().catch(e=>{throw this.nc=e,this.rc=!1,la("INTERNAL UNHANDLED ERROR: ",Op(e)),e}).then(e=>(this.rc=!1,e))));return this.ac=t,t}enqueueAfterDelay(e,t,n){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const i=vf.createAndSchedule(this,e,t,n,e=>this.hc(e));return this.tc.push(i),i}uc(){this.nc&&fa(47125,{Pc:Op(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do{e=this.ac,await e}while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then(()=>{this.tc.sort((e,t)=>e.targetTimeMs-t.targetTimeMs);for(const t of this.tc)if(t.skipDelay(),"all"!==e&&t.timerId===e)break;return this.Tc()})}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function Op(e){let t=e.message||"";return e.stack&&(t=e.stack.includes(e.message)?e.stack:e.message+"\n"+e.stack),t
/**
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
 */}function xp(e){return function(e){if("object"!=typeof e||null===e)return!1;const t=e;for(const n of["next","error","complete"])if(n in t&&"function"==typeof t[n])return!0;return!1}(e)}class Lp extends Cp{constructor(e,t,n,i){super(e,t,n,i),this.type="firestore",this._queue=new Dp,this._persistenceKey=(null==i?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Dp(e),this._firestoreClient=void 0,await e}}}function Mp(e,t){const n="object"==typeof e?e:dt(),i="string"==typeof e?e:Lc,s=ot(n,"firestore").getImmediate({identifier:i});if(!s._initialized){const e=m("firestore");e&&function(e,t,n,i={}){var s;e=Ka(e,Cp);const r=w(t),o=e._getSettings(),a={...o,emulatorOptions:e._getEmulatorOptions()},c=`${t}:${n}`;r&&(T(`https://${c}`),C("Firestore",!0)),o.host!==Ip&&o.host!==c&&ua("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const h={...o,host:c,ssl:r,emulatorOptions:i};if(!V(h,a)&&(e._setSettings(h),i.mockUserToken)){let t,n;if("string"==typeof i.mockUserToken)t=i.mockUserToken,n=ra.MOCK_USER;else{t=I(i.mockUserToken,null==(s=e._app)?void 0:s.options.projectId);const r=i.mockUserToken.sub||i.mockUserToken.user_id;if(!r)throw new ya(_a.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");n=new ra(r)}e._authCredentials=new Ia(new wa(t,n))}}(s,...e)}return s}function Up(e){if(e._terminated)throw new ya(_a.FAILED_PRECONDITION,"The client has already been terminated.");return e._firestoreClient||function(e){var t,n,i;const s=e._freezeSettings(),r=(o=e._databaseId,a=(null==(t=e._app)?void 0:t.options.appId)||"",c=e._persistenceKey,new xc(o,a,c,(h=s).host,h.ssl,h.experimentalForceLongPolling,h.experimentalAutoDetectLongPolling,wp(h.experimentalLongPollingOptions),h.useFetchStreams,h.isUsingEmulator));var o,a,c,h;e._componentsProvider||(null==(n=s.localCache)?void 0:n._offlineComponentProvider)&&(null==(i=s.localCache)?void 0:i._onlineComponentProvider)&&(e._componentsProvider={_offline:s.localCache._offlineComponentProvider,_online:s.localCache._onlineComponentProvider}),e._firestoreClient=new gp(e._authCredentials,e._appCheckCredentials,e._queue,r,e._componentsProvider&&function(e){const t=null==e?void 0:e._online.build();return{_offline:null==e?void 0:e._offline.build(t),_online:t}}(e._componentsProvider))}
/**
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
 */(e),e._firestoreClient}class Fp{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Fp(Ic.fromBase64String(e))}catch(t){throw new ya(_a.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Fp(Ic.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Fp._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Qa(e,Fp._jsonSchema))return Fp.fromBase64String(e.bytes)}}Fp._jsonSchemaVersion="firestore/bytes/1.0",Fp._jsonSchema={type:Ga("string",Fp._jsonSchemaVersion),bytes:Ga("string")};
/**
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
 */
class Vp{constructor(...e){for(let t=0;t<e.length;++t)if(0===e[t].length)throw new ya(_a.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new qa(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}
/**
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
 */class qp{constructor(e){this._methodName=e}}
/**
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
 */class jp{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new ya(_a.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new ya(_a.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return Ra(this._lat,e._lat)||Ra(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:jp._jsonSchemaVersion}}static fromJSON(e){if(Qa(e,jp._jsonSchema))return new jp(e.latitude,e.longitude)}}jp._jsonSchemaVersion="firestore/geoPoint/1.0",jp._jsonSchema={type:Ga("string",jp._jsonSchemaVersion),latitude:Ga("number"),longitude:Ga("number")};
/**
 * @license
 * Copyright 2024 Google LLC
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
 */
class Bp{constructor(e){this._values=(e||[]).map(e=>e)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;++n)if(e[n]!==t[n])return!1;return!0}(this._values,e._values)}toJSON(){return{type:Bp._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Qa(e,Bp._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(e=>"number"==typeof e))return new Bp(e.vectorValues);throw new ya(_a.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Bp._jsonSchemaVersion="firestore/vectorValue/1.0",Bp._jsonSchema={type:Ga("string",Bp._jsonSchemaVersion),vectorValues:Ga("object")};
/**
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
 */
const zp=/^__.*__$/;class $p{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return null!==this.fieldMask?new Rl(e,this.data,this.fieldMask,t,this.fieldTransforms):new Al(e,this.data,t,this.fieldTransforms)}}class Hp{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Rl(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Wp(e){switch(e){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw fa(40011,{Ac:e})}}class Kp{constructor(e,t,n,i,s,r){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=i,void 0===s&&this.Rc(),this.fieldTransforms=s||[],this.fieldMask=r||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new Kp({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){var t;const n=null==(t=this.path)?void 0:t.child(e),i=this.Vc({path:n,fc:!1});return i.gc(e),i}yc(e){var t;const n=null==(t=this.path)?void 0:t.child(e),i=this.Vc({path:n,fc:!1});return i.Rc(),i}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return ag(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return void 0!==this.fieldMask.find(t=>e.isPrefixOf(t))||void 0!==this.fieldTransforms.find(t=>e.isPrefixOf(t.field))}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(0===e.length)throw this.Sc("Document fields must not be empty");if(Wp(this.Ac)&&zp.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class Gp{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Od(e)}Cc(e,t,n,i=!1){return new Kp({Ac:e,methodName:t,Dc:n,path:qa.emptyPath(),fc:!1,bc:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Qp(e){const t=e._freezeSettings(),n=Od(e._databaseId);return new Gp(e._databaseId,!!t.ignoreUndefinedProperties,n)}function Yp(e,t,n,i,s,r={}){const o=e.Cc(r.merge||r.mergeFields?2:0,t,n,s);ig("Data must be an object, but it was:",o,i);const a=tg(i,o);let c,h;if(r.merge)c=new wc(o.fieldMask),h=o.fieldTransforms;else if(r.mergeFields){const e=[];for(const i of r.mergeFields){const s=sg(t,i,n);if(!o.contains(s))throw new ya(_a.INVALID_ARGUMENT,`Field '${s}' is specified in your field mask but missing from your input data.`);cg(e,s)||e.push(s)}c=new wc(e),h=o.fieldTransforms.filter(e=>c.covers(e.field))}else c=null,h=o.fieldTransforms;return new $p(new ih(a),c,h)}class Xp extends qp{_toFieldTransform(e){if(2!==e.Ac)throw 1===e.Ac?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Xp}}class Jp extends qp{_toFieldTransform(e){return new vl(e.path,new ul)}isEqual(e){return e instanceof Jp}}function Zp(e,t,n,i=!1){return eg(n,e.Cc(i?4:3,t))}function eg(e,t){if(ng(e=Q(e)))return ig("Unsupported field value:",t,e),tg(e,t);if(e instanceof qp)return function(e,t){if(!Wp(t.Ac))throw t.Sc(`${e._methodName}() can only be used with update() and set()`);if(!t.path)throw t.Sc(`${e._methodName}() is not currently supported inside arrays`);const n=e._toFieldTransform(t);n&&t.fieldTransforms.push(n)}(e,t),null;if(void 0===e&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),e instanceof Array){if(t.settings.fc&&4!==t.Ac)throw t.Sc("Nested arrays are not supported");return function(e,t){const n=[];let i=0;for(const s of e){let e=eg(s,t.wc(i));null==e&&(e={nullValue:"NULL_VALUE"}),n.push(e),i++}return{arrayValue:{values:n}}}(e,t)}return function(e,t){if(null===(e=Q(e)))return{nullValue:"NULL_VALUE"};if("number"==typeof e)return function(e,t){return function(e){return"number"==typeof e&&Number.isInteger(e)&&!hc(e)&&e<=Number.MAX_SAFE_INTEGER&&e>=Number.MIN_SAFE_INTEGER}
/**
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
 */(t)?ol(t):rl(e,t)}(t.serializer,e);if("boolean"==typeof e)return{booleanValue:e};if("string"==typeof e)return{stringValue:e};if(e instanceof Date){const n=Ja.fromDate(e);return{timestampValue:cu(t.serializer,n)}}if(e instanceof Ja){const n=new Ja(e.seconds,1e3*Math.floor(e.nanoseconds/1e3));return{timestampValue:cu(t.serializer,n)}}if(e instanceof jp)return{geoPointValue:{latitude:e.latitude,longitude:e.longitude}};if(e instanceof Fp)return{bytesValue:hu(t.serializer,e._byteString)};if(e instanceof kp){const n=t.databaseId,i=e.firestore._databaseId;if(!i.isEqual(n))throw t.Sc(`Document reference is for database ${i.projectId}/${i.database} but should be for database ${n.projectId}/${n.database}`);return{referenceValue:du(e.firestore._databaseId||t.databaseId,e._key.path)}}if(e instanceof Bp)return n=e,i=t,{mapValue:{fields:{[Uc]:{stringValue:Vc},[qc]:{arrayValue:{values:n.toArray().map(e=>{if("number"!=typeof e)throw i.Sc("VectorValues must only contain numeric values.");return rl(i.serializer,e)})}}}}};var n,i;throw t.Sc(`Unsupported field value: ${Wa(e)}`)}(e,t)}function tg(e,t){const n={};return pc(e)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):fc(e,(e,i)=>{const s=eg(i,t.mc(e));null!=s&&(n[e]=s)}),{mapValue:{fields:n}}}function ng(e){return!("object"!=typeof e||null===e||e instanceof Array||e instanceof Date||e instanceof Ja||e instanceof jp||e instanceof Fp||e instanceof kp||e instanceof qp||e instanceof Bp)}function ig(e,t,n){if(!ng(n)||!Ha(n)){const i=Wa(n);throw"an object"===i?t.Sc(e+" a custom object"):t.Sc(e+" "+i)}}function sg(e,t,n){if((t=Q(t))instanceof Vp)return t._internalPath;if("string"==typeof t)return og(e,t);throw ag("Field path arguments must be of type string or ",e,!1,void 0,n)}const rg=new RegExp("[~\\*/\\[\\]]");function og(e,t,n){if(t.search(rg)>=0)throw ag(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,e,!1,void 0,n);try{return new Vp(...t.split("."))._internalPath}catch(i){throw ag(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,e,!1,void 0,n)}}function ag(e,t,n,i,s){const r=i&&!i.isEmpty(),o=void 0!==s;let a=`Function ${t}() called with invalid data`;n&&(a+=" (via `toFirestore()`)"),a+=". ";let c="";return(r||o)&&(c+=" (found",r&&(c+=` in field ${i}`),o&&(c+=` in document ${s}`),c+=")"),new ya(_a.INVALID_ARGUMENT,a+e+c)}function cg(e,t){return e.some(e=>e.isEqual(t))}
/**
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
 */class hg{constructor(e,t,n,i,s){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new kp(this._firestore,this._converter,this._key)}exists(){return null!==this._document}data(){if(this._document){if(this._converter){const e=new lg(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(ug("DocumentSnapshot.get",e));if(null!==t)return this._userDataWriter.convertValue(t)}}}class lg extends hg{data(){return super.data()}}function ug(e,t){return"string"==typeof t?og(e,t):t instanceof Vp?t._internalPath:t._delegate._internalPath}
/**
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
 */function dg(e){if("L"===e.limitType&&0===e.explicitOrderBy.length)throw new ya(_a.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class fg{}class pg extends fg{}function gg(e,t,...n){let i=[];t instanceof fg&&i.push(t),i=i.concat(n),function(e){const t=e.filter(e=>e instanceof yg).length,n=e.filter(e=>e instanceof mg).length;if(t>1||t>0&&n>0)throw new ya(_a.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(i);for(const s of i)e=s._apply(e);return e}class mg extends pg{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new mg(e,t,n)}_apply(e){const t=this._parse(e);return kg(e._query,t),new Sp(e.firestore,e.converter,Fh(e._query,t))}_parse(e){const t=Qp(e.firestore);return function(e,t,n,i,s,r,o){let a;if(s.isKeyField()){if("array-contains"===r||"array-contains-any"===r)throw new ya(_a.INVALID_ARGUMENT,`Invalid Query. You can't perform '${r}' queries on documentId().`);if("in"===r||"not-in"===r){Sg(o,r);const t=[];for(const n of o)t.push(Cg(i,e,n));a={arrayValue:{values:t}}}else a=Cg(i,e,o)}else"in"!==r&&"not-in"!==r&&"array-contains-any"!==r||Sg(o,r),a=Zp(n,"where",o,"in"===r||"not-in"===r);return dh.create(s,r,a)}(e._query,0,t,e.firestore._databaseId,this._field,this._op,this._value)}}function _g(e,t,n){const i=t,s=ug("where",e);return mg._create(s,i,n)}class yg extends fg{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new yg(e,t)}_parse(e){const t=this._queryConstraints.map(t=>t._parse(e)).filter(e=>e.getFilters().length>0);return 1===t.length?t[0]:fh.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return 0===t.getFilters().length?e:(function(e,t){let n=e;const i=t.getFlattenedFilters();for(const s of i)kg(n,s),n=Fh(n,s)}(e._query,t),new Sp(e.firestore,e.converter,Fh(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return"and"===this.type?"and":"or"}}class vg extends pg{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new vg(e,t)}_apply(e){const t=function(e,t,n){if(null!==e.startAt)throw new ya(_a.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(null!==e.endAt)throw new ya(_a.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new hh(t,n)}(e._query,this._field,this._direction);return new Sp(e.firestore,e.converter,function(e,t){const n=e.explicitOrderBy.concat([t]);return new Dh(e.path,e.collectionGroup,n,e.filters.slice(),e.limit,e.limitType,e.startAt,e.endAt)}(e._query,t))}}function wg(e,t="asc"){const n=t,i=ug("orderBy",e);return vg._create(i,n)}class Tg extends pg{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Tg(e,t,n)}_apply(e){return new Sp(e.firestore,e.converter,Vh(e._query,this._limit,this._limitType))}}function Ig(e){return function(e,t){if(t<=0)throw new ya(_a.INVALID_ARGUMENT,`Function limit() requires a positive number, but it was: ${t}.`)}(0,e),Tg._create("limit",e,"F")}class Eg extends pg{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Eg(e,t,n)}_apply(e){const t=function(e,t,n,i){if(n[0]=Q(n[0]),n[0]instanceof hg)return function(e,t,n,i,s){if(!i)throw new ya(_a.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${n}().`);const r=[];for(const o of Mh(e))if(o.field.isKeyField())r.push(Yc(t,i.key));else{const e=i.data.field(o.field);if(Pc(e))throw new ya(_a.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+o.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(null===e){const e=o.field.canonicalString();throw new ya(_a.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${e}' (used as the orderBy) does not exist.`)}r.push(e)}return new oh(r,s)}(e._query,e.firestore._databaseId,t,n[0]._document,i);{const s=Qp(e.firestore);return function(e,t,n,i,s,r){const o=e.explicitOrderBy;if(s.length>o.length)throw new ya(_a.INVALID_ARGUMENT,`Too many arguments provided to ${i}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const a=[];for(let c=0;c<s.length;c++){const r=s[c];if(o[c].field.isKeyField()){if("string"!=typeof r)throw new ya(_a.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${i}(), but got a ${typeof r}`);if(!Lh(e)&&-1!==r.indexOf("/"))throw new ya(_a.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${i}() must be a plain document ID, but '${r}' contains a slash.`);const n=e.path.child(Fa.fromString(r));if(!ja.isDocumentKey(n))throw new ya(_a.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${i}() must result in a valid document path, but '${n}' is not because it contains an odd number of segments.`);const s=new ja(n);a.push(Yc(t,s))}else{const e=Zp(n,i,r);a.push(e)}}return new oh(a,r)}(e._query,e.firestore._databaseId,s,t,n,i)}}(e,this.type,this._docOrFields,this._inclusive);return new Sp(e.firestore,e.converter,(n=e._query,i=t,new Dh(n.path,n.collectionGroup,n.explicitOrderBy.slice(),n.filters.slice(),n.limit,n.limitType,i,n.endAt)));var n,i}}function bg(...e){return Eg._create("startAfter",e,!1)}function Cg(e,t,n){if("string"==typeof(n=Q(n))){if(""===n)throw new ya(_a.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Lh(t)&&-1!==n.indexOf("/"))throw new ya(_a.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);const i=t.path.child(Fa.fromString(n));if(!ja.isDocumentKey(i))throw new ya(_a.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${i}' is not because it has an odd number of segments (${i.length}).`);return Yc(e,new ja(i))}if(n instanceof kp)return Yc(e,n._key);throw new ya(_a.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Wa(n)}.`)}function Sg(e,t){if(!Array.isArray(e)||0===e.length)throw new ya(_a.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function kg(e,t){const n=function(e,t){for(const n of e)for(const e of n.getFlattenedFilters())if(t.indexOf(e.op)>=0)return e.op;return null}(e.filters,function(e){switch(e){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(t.op));if(null!==n)throw n===t.op?new ya(_a.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new ya(_a.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${n.toString()}' filters.`)}class Ng{convertValue(e,t="none"){switch(jc(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Cc(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(Sc(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw fa(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return fc(e,(e,i)=>{n[e]=this.convertValue(i,t)}),n}convertVectorValue(e){var t,n,i;const s=null==(i=null==(n=null==(t=e.fields)?void 0:t[qc].arrayValue)?void 0:n.values)?void 0:i.map(e=>Cc(e.doubleValue));return new Bp(s)}convertGeoPoint(e){return new jp(Cc(e.latitude),Cc(e.longitude))}convertArray(e,t){return(e.values||[]).map(e=>this.convertValue(e,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=Dc(e);return null==n?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(Oc(e));default:return null}}convertTimestamp(e){const t=bc(e);return new Ja(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=Fa.fromString(e);ga(Du(n),9688,{name:e});const i=new Mc(n.get(1),n.get(3)),s=new ja(n.popFirst(5));return i.isEqual(t)||la(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),s}}
/**
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
 */function Ag(e,t,n){let i;return i=e?n&&(n.merge||n.mergeFields)?e.toFirestore(t,n):e.toFirestore(t):t,i}class Rg{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Pg extends hg{constructor(e,t,n,i,s,r){super(e,t,n,i,r),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new Dg(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(ug("DocumentSnapshot.get",e));if(null!==n)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new ya(_a.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Pg._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),e&&e.isValidDocument()&&e.isFoundDocument()?(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t):t}}Pg._jsonSchemaVersion="firestore/documentSnapshot/1.0",Pg._jsonSchema={type:Ga("string",Pg._jsonSchemaVersion),bundleSource:Ga("string","DocumentSnapshot"),bundleName:Ga("string"),bundle:Ga("string")};class Dg extends Pg{data(e={}){return super.data(e)}}class Og{constructor(e,t,n,i){this._firestore=e,this._userDataWriter=t,this._snapshot=i,this.metadata=new Rg(i.hasPendingWrites,i.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return 0===this.size}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new Dg(this._firestore,this._userDataWriter,n.key,n,new Rg(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new ya(_a.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(e,t){if(e._snapshot.oldDocs.isEmpty()){let t=0;return e._snapshot.docChanges.map(n=>{const i=new Dg(e._firestore,e._userDataWriter,n.doc.key,n.doc,new Rg(e._snapshot.mutatedKeys.has(n.doc.key),e._snapshot.fromCache),e.query.converter);return n.doc,{type:"added",doc:i,oldIndex:-1,newIndex:t++}})}{let n=e._snapshot.oldDocs;return e._snapshot.docChanges.filter(e=>t||3!==e.type).map(t=>{const i=new Dg(e._firestore,e._userDataWriter,t.doc.key,t.doc,new Rg(e._snapshot.mutatedKeys.has(t.doc.key),e._snapshot.fromCache),e.query.converter);let s=-1,r=-1;return 0!==t.type&&(s=n.indexOf(t.doc.key),n=n.delete(t.doc.key)),1!==t.type&&(n=n.add(t.doc),r=n.indexOf(t.doc.key)),{type:xg(t.type),doc:i,oldIndex:s,newIndex:r}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new ya(_a.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Og._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Aa.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],i=[];return this.docs.forEach(e=>{null!==e._document&&(t.push(e._document),n.push(this._userDataWriter.convertObjectMap(e._document.data.value.mapValue.fields,"previous")),i.push(e.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function xg(e){switch(e){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return fa(61501,{type:e})}}
/**
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
 */function Lg(e){e=Ka(e,kp);const t=Ka(e.firestore,Lp);return function(e,t,n={}){const i=new va;return e.asyncQueue.enqueueAndForget(async()=>function(e,t,n,i,s){const r=new fp({next:a=>{r.Nu(),t.enqueueAndForget(()=>Nf(e,o));const c=a.docs.has(n);!c&&a.fromCache?s.reject(new ya(_a.UNAVAILABLE,"Failed to get document because the client is offline.")):c&&a.fromCache&&i&&"server"===i.source?s.reject(new ya(_a.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):s.resolve(a)},error:e=>s.reject(e)}),o=new xf(Oh(n.path),r,{includeMetadataChanges:!0,qa:!0});return kf(e,o)}(await vp(e),e.asyncQueue,t,n,i)),i.promise}(Up(t),e._key).then(n=>$g(t,e,n))}Og._jsonSchemaVersion="firestore/querySnapshot/1.0",Og._jsonSchema={type:Ga("string",Og._jsonSchemaVersion),bundleSource:Ga("string","QuerySnapshot"),bundleName:Ga("string"),bundle:Ga("string")};class Mg extends Ng{constructor(e){super(),this.firestore=e}convertBytes(e){return new Fp(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new kp(this.firestore,null,t)}}function Ug(e){e=Ka(e,Sp);const t=Ka(e.firestore,Lp),n=Up(t),i=new Mg(t);return dg(e._query),function(e,t,n={}){const i=new va;return e.asyncQueue.enqueueAndForget(async()=>function(e,t,n,i,s){const r=new fp({next:n=>{r.Nu(),t.enqueueAndForget(()=>Nf(e,o)),n.fromCache&&"server"===i.source?s.reject(new ya(_a.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):s.resolve(n)},error:e=>s.reject(e)}),o=new xf(n,r,{includeMetadataChanges:!0,qa:!0});return kf(e,o)}(await vp(e),e.asyncQueue,t,n,i)),i.promise}(n,e._query).then(n=>new Og(t,i,e,n))}function Fg(e,t,n){e=Ka(e,kp);const i=Ka(e.firestore,Lp),s=Ag(e.converter,t,n);return zg(i,[Yp(Qp(i),"setDoc",e._key,s,null!==e.converter,n).toMutation(e._key,Tl.none())])}function Vg(e,t,n,...i){e=Ka(e,kp);const s=Ka(e.firestore,Lp),r=Qp(s);let o;return o="string"==typeof(t=Q(t))||t instanceof Vp?function(e,t,n,i,s,r){const o=e.Cc(1,t,n),a=[sg(t,i,n)],c=[s];if(r.length%2!=0)throw new ya(_a.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let d=0;d<r.length;d+=2)a.push(sg(t,r[d])),c.push(r[d+1]);const h=[],l=ih.empty();for(let d=a.length-1;d>=0;--d)if(!cg(h,a[d])){const e=a[d];let t=c[d];t=Q(t);const n=o.yc(e);if(t instanceof Xp)h.push(e);else{const i=eg(t,n);null!=i&&(h.push(e),l.set(e,i))}}const u=new wc(h);return new Hp(l,u,o.fieldTransforms)}(r,"updateDoc",e._key,t,n,i):function(e,t,n,i){const s=e.Cc(1,t,n);ig("Data must be an object, but it was:",s,i);const r=[],o=ih.empty();fc(i,(e,i)=>{const a=og(t,e,n);i=Q(i);const c=s.yc(a);if(i instanceof Xp)r.push(a);else{const e=eg(i,c);null!=e&&(r.push(a),o.set(a,e))}});const a=new wc(r);return new Hp(o,a,s.fieldTransforms)}(r,"updateDoc",e._key,t),zg(s,[o.toMutation(e._key,Tl.exists(!0))])}function qg(e){return zg(Ka(e.firestore,Lp),[new xl(e._key,Tl.none())])}function jg(e,t){const n=Ka(e.firestore,Lp),i=Rp(e),s=Ag(e.converter,t);return zg(n,[Yp(Qp(e.firestore),"addDoc",i._key,s,null!==e.converter,{}).toMutation(i._key,Tl.exists(!1))]).then(()=>i)}function Bg(e,...t){var n,i,s;e=Q(e);let r={includeMetadataChanges:!1,source:"default"},o=0;"object"!=typeof t[o]||xp(t[o])||(r=t[o++]);const a={includeMetadataChanges:r.includeMetadataChanges,source:r.source};if(xp(t[o])){const e=t[o];t[o]=null==(n=e.next)?void 0:n.bind(e),t[o+1]=null==(i=e.error)?void 0:i.bind(e),t[o+2]=null==(s=e.complete)?void 0:s.bind(e)}let c,h,l;if(e instanceof kp)h=Ka(e.firestore,Lp),l=Oh(e._key.path),c={next:n=>{t[o]&&t[o]($g(h,e,n))},error:t[o+1],complete:t[o+2]};else{const n=Ka(e,Sp);h=Ka(n.firestore,Lp),l=n._query;const i=new Mg(h);c={next:e=>{t[o]&&t[o](new Og(h,i,n,e))},error:t[o+1],complete:t[o+2]},dg(e._query)}return function(e,t,n,i){const s=new fp(i),r=new xf(t,s,n);return e.asyncQueue.enqueueAndForget(async()=>kf(await vp(e),r)),()=>{s.Nu(),e.asyncQueue.enqueueAndForget(async()=>Nf(await vp(e),r))}}(Up(h),l,a,c)}function zg(e,t){return function(e,t){const n=new va;return e.asyncQueue.enqueueAndForget(async()=>Kf(await function(e){return yp(e).then(e=>e.syncEngine)}(e),t,n)),n.promise}(Up(e),t)}function $g(e,t,n){const i=n.docs.get(t._key),s=new Mg(e);return new Pg(e,s,t._key,i,new Rg(n.hasPendingWrites,n.fromCache),t.converter)}function Hg(){return new Jp("serverTimestamp")}!function(e,t=!0){oa=lt,rt(new Y("firestore",(e,{instanceIdentifier:n,options:i})=>{const s=e.getProvider("app").getImmediate(),r=new Lp(new Ea(e.getProvider("auth-internal")),new ka(s,e.getProvider("app-check-internal")),function(e,t){if(!Object.prototype.hasOwnProperty.apply(e.options,["projectId"]))throw new ya(_a.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Mc(e.options.projectId,t)}(s,n),s);return i={useFetchStreams:t,...i},r._setSettings(i),r},"PUBLIC").setMultipleInstances(!0)),ft(ia,sa,e),ft(ia,sa,"esm2020")}();const Wg=function(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}},Kg=new R("auth","Firebase",{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}),Gg=new oe("@firebase/auth");function Qg(e,...t){Gg.logLevel<=ee.ERROR&&Gg.error(`Auth (${lt}): ${e}`,...t)}
/**
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
 */function Yg(e,...t){throw em(e,...t)}function Xg(e,...t){return em(e,...t)}function Jg(e,t,n){const i={...Wg(),[t]:n};return new R("auth","Firebase",i).create(t,{appName:e.name})}function Zg(e){return Jg(e,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function em(e,...t){if("string"!=typeof e){const n=t[0],i=[...t.slice(1)];return i[0]&&(i[0].appName=e.name),e._errorFactory.create(n,...i)}return Kg.create(e,...t)}function tm(e,t,...n){if(!e)throw em(t,...n)}function nm(e){const t="INTERNAL ASSERTION FAILED: "+e;throw Qg(t),new Error(t)}function im(e,t){e||nm(t)}
/**
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
 */function sm(){var e;return"undefined"!=typeof self&&(null==(e=self.location)?void 0:e.href)||""}function rm(){var e;return"undefined"!=typeof self&&(null==(e=self.location)?void 0:e.protocol)||null}
/**
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
 */
/**
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
 */
class om{constructor(e,t){this.shortDelay=e,this.longDelay=t,im(t>e,"Short delay should be less than long delay!"),this.isMobile=k()||N()}get(){return"undefined"!=typeof navigator&&navigator&&"onLine"in navigator&&"boolean"==typeof navigator.onLine&&("http:"===rm()||"https:"===rm()||function(){const e="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof e&&void 0!==e.id}()||"connection"in navigator)&&!navigator.onLine?Math.min(5e3,this.shortDelay):this.isMobile?this.longDelay:this.shortDelay}}
/**
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
 */function am(e,t){im(e.emulator,"Emulator should always be set here");const{url:n}=e.emulator;return t?`${n}${t.startsWith("/")?t.slice(1):t}`:n}
/**
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
 */class cm{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){return this.fetchImpl?this.fetchImpl:"undefined"!=typeof self&&"fetch"in self?self.fetch:"undefined"!=typeof globalThis&&globalThis.fetch?globalThis.fetch:"undefined"!=typeof fetch?fetch:void nm("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){return this.headersImpl?this.headersImpl:"undefined"!=typeof self&&"Headers"in self?self.Headers:"undefined"!=typeof globalThis&&globalThis.Headers?globalThis.Headers:"undefined"!=typeof Headers?Headers:void nm("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){return this.responseImpl?this.responseImpl:"undefined"!=typeof self&&"Response"in self?self.Response:"undefined"!=typeof globalThis&&globalThis.Response?globalThis.Response:"undefined"!=typeof Response?Response:void nm("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}
/**
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
 */const hm={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"},lm=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],um=new om(3e4,6e4);
/**
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
 */function dm(e,t){return e.tenantId&&!t.tenantId?{...t,tenantId:e.tenantId}:t}async function fm(e,t,n,i,s={}){return pm(e,s,async()=>{let s={},r={};i&&("GET"===t?r=i:s={body:JSON.stringify(i)});const o=j({key:e.config.apiKey,...r}).slice(1),a=await e._getAdditionalHeaders();a["Content-Type"]="application/json",e.languageCode&&(a["X-Firebase-Locale"]=e.languageCode);const c={method:t,headers:a,...s};return"undefined"!=typeof navigator&&"Cloudflare-Workers"===navigator.userAgent||(c.referrerPolicy="no-referrer"),e.emulatorConfig&&w(e.emulatorConfig.host)&&(c.credentials="include"),cm.fetch()(await mm(e,e.config.apiHost,n,o),c)})}async function pm(t,n,i){t._canInitEmulator=!1;const s={...hm,...n};try{const e=new ym(t),n=await Promise.race([i(),e.promise]);e.clearNetworkTimeout();const r=await n.json();if("needConfirmation"in r)throw vm(t,"account-exists-with-different-credential",r);if(n.ok&&!("errorMessage"in r))return r;{const e=n.ok?r.errorMessage:r.error.message,[i,o]=e.split(" : ");if("FEDERATED_USER_ID_ALREADY_LINKED"===i)throw vm(t,"credential-already-in-use",r);if("EMAIL_EXISTS"===i)throw vm(t,"email-already-in-use",r);if("USER_DISABLED"===i)throw vm(t,"user-disabled",r);const a=s[i]||i.toLowerCase().replace(/[_\s]+/g,"-");if(o)throw Jg(t,a,o);Yg(t,a)}}catch(e){if(e instanceof A)throw e;Yg(t,"network-request-failed",{message:String(e)})}}async function gm(e,t,n,i,s={}){const r=await fm(e,t,n,i,s);return"mfaPendingCredential"in r&&Yg(e,"multi-factor-auth-required",{_serverResponse:r}),r}async function mm(e,t,n,i){const s=`${t}${n}?${i}`,r=e,o=r.config.emulator?am(e.config,s):`${e.config.apiScheme}://${s}`;return lm.includes(n)&&(await r._persistenceManagerAvailable,"COOKIE"===r._getPersistenceType())?r._getPersistence()._getFinalTarget(o).toString():o}function _m(e){switch(e){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class ym{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((e,t)=>{this.timer=setTimeout(()=>t(Xg(this.auth,"network-request-failed")),um.get())})}}function vm(e,t,n){const i={appName:e.name};n.email&&(i.email=n.email),n.phoneNumber&&(i.phoneNumber=n.phoneNumber);const s=Xg(e,t,i);return s.customData._tokenResponse=n,s}function wm(e){return void 0!==e&&void 0!==e.enterprise}class Tm{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],void 0===e.recaptchaKey)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||0===this.recaptchaEnforcementState.length)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return _m(t.enforcementState);return null}isProviderEnabled(e){return"ENFORCE"===this.getProviderEnforcementState(e)||"AUDIT"===this.getProviderEnforcementState(e)}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}async function Im(e,t){return fm(e,"POST","/v1/accounts:lookup",t)}
/**
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
 */function Em(t){if(t)try{const e=new Date(Number(t));if(!isNaN(e.getTime()))return e.toUTCString()}catch(e){}}async function bm(e,t=!1){const n=Q(e),i=await n.getIdToken(t),s=Sm(i);tm(s&&s.exp&&s.auth_time&&s.iat,n.auth,"internal-error");const r="object"==typeof s.firebase?s.firebase:void 0,o=null==r?void 0:r.sign_in_provider;return{claims:s,token:i,authTime:Em(Cm(s.auth_time)),issuedAtTime:Em(Cm(s.iat)),expirationTime:Em(Cm(s.exp)),signInProvider:o||null,signInSecondFactor:(null==r?void 0:r.sign_in_second_factor)||null}}function Cm(e){return 1e3*Number(e)}function Sm(t){const[n,i,s]=t.split(".");if(void 0===n||void 0===i||void 0===s)return Qg("JWT malformed, contained fewer than 3 sections"),null;try{const e=l(i);return e?JSON.parse(e):(Qg("Failed to decode base64 JWT payload"),null)}catch(e){return Qg("Caught error parsing JWT payload as JSON",null==e?void 0:e.toString()),null}}function km(e){const t=Sm(e);return tm(t,"internal-error"),tm(void 0!==t.exp,"internal-error"),tm(void 0!==t.iat,"internal-error"),Number(t.exp)-Number(t.iat)}
/**
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
 */async function Nm(t,n,i=!1){if(i)return n;try{return await n}catch(e){throw e instanceof A&&function({code:e}){return"auth/user-disabled"===e||"auth/user-token-expired"===e}
/**
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
 */(e)&&t.auth.currentUser===t&&await t.auth.signOut(),e}}class Am{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,null!==this.timerId&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const e=this.errorBackoff;return this.errorBackoff=Math.min(2*this.errorBackoff,96e4),e}{this.errorBackoff=3e4;const e=(null!=(t=this.user.stsTokenManager.expirationTime)?t:0)-Date.now()-3e5;return Math.max(0,e)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){return void("auth/network-request-failed"===(null==e?void 0:e.code)&&this.schedule(!0))}this.schedule()}}
/**
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
 */class Rm{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Em(this.lastLoginAt),this.creationTime=Em(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}
/**
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
 */async function Pm(e){var t;const n=e.auth,i=await e.getIdToken(),s=await Nm(e,Im(n,{idToken:i}));tm(null==s?void 0:s.users.length,n,"internal-error");const r=s.users[0];e._notifyReloadListener(r);const o=(null==(t=r.providerUserInfo)?void 0:t.length)?Om(r.providerUserInfo):[],a=function(e,t){const n=e.filter(e=>!t.some(t=>t.providerId===e.providerId));return[...n,...t]}(e.providerData,o),c=e.isAnonymous,h=!(e.email&&r.passwordHash||(null==a?void 0:a.length)),l=!!c&&h,u={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new Rm(r.createdAt,r.lastLoginAt),isAnonymous:l};Object.assign(e,u)}async function Dm(e){const t=Q(e);await Pm(t),await t.auth._persistUserIfCurrent(t),t.auth._notifyListenersIfCurrent(t)}function Om(e){return e.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}
/**
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
 */
/**
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
 */
class xm{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){tm(e.idToken,"internal-error"),tm(void 0!==e.idToken,"internal-error"),tm(void 0!==e.refreshToken,"internal-error");const t="expiresIn"in e&&void 0!==e.expiresIn?Number(e.expiresIn):km(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){tm(0!==e.length,"internal-error");const t=km(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return t||!this.accessToken||this.isExpired?(tm(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null):this.accessToken}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:i,expiresIn:s}=await async function(e,t){const n=await pm(e,{},async()=>{const n=j({grant_type:"refresh_token",refresh_token:t}).slice(1),{tokenApiHost:i,apiKey:s}=e.config,r=await mm(e,i,"/v1/token",`key=${s}`),o=await e._getAdditionalHeaders();o["Content-Type"]="application/x-www-form-urlencoded";const a={method:"POST",headers:o,body:n};return e.emulatorConfig&&w(e.emulatorConfig.host)&&(a.credentials="include"),cm.fetch()(r,a)});return{accessToken:n.access_token,expiresIn:n.expires_in,refreshToken:n.refresh_token}}(e,t);this.updateTokensAndExpiration(n,i,Number(s))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+1e3*n}static fromJSON(e,t){const{refreshToken:n,accessToken:i,expirationTime:s}=t,r=new xm;return n&&(tm("string"==typeof n,"internal-error",{appName:e}),r.refreshToken=n),i&&(tm("string"==typeof i,"internal-error",{appName:e}),r.accessToken=i),s&&(tm("number"==typeof s,"internal-error",{appName:e}),r.expirationTime=s),r}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new xm,this.toJSON())}_performRefresh(){return nm("not implemented")}}
/**
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
 */function Lm(e,t){tm("string"==typeof e||void 0===e,"internal-error",{appName:t})}class Mm{constructor({uid:e,auth:t,stsTokenManager:n,...i}){this.providerId="firebase",this.proactiveRefresh=new Am(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=i.displayName||null,this.email=i.email||null,this.emailVerified=i.emailVerified||!1,this.phoneNumber=i.phoneNumber||null,this.photoURL=i.photoURL||null,this.isAnonymous=i.isAnonymous||!1,this.tenantId=i.tenantId||null,this.providerData=i.providerData?[...i.providerData]:[],this.metadata=new Rm(i.createdAt||void 0,i.lastLoginAt||void 0)}async getIdToken(e){const t=await Nm(this,this.stsTokenManager.getToken(this.auth,e));return tm(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return bm(this,e)}reload(){return Dm(this)}_assign(e){this!==e&&(tm(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(e=>({...e})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Mm({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){tm(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await Pm(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(at(this.auth.app))return Promise.reject(Zg(this.auth));const e=await this.getIdToken();return await Nm(this,
/**
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
 */
async function(e,t){return fm(e,"POST","/v1/accounts:delete",t)}(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var n,i,s,r,o,a,c,h;const l=null!=(n=t.displayName)?n:void 0,u=null!=(i=t.email)?i:void 0,d=null!=(s=t.phoneNumber)?s:void 0,f=null!=(r=t.photoURL)?r:void 0,p=null!=(o=t.tenantId)?o:void 0,g=null!=(a=t._redirectEventId)?a:void 0,m=null!=(c=t.createdAt)?c:void 0,_=null!=(h=t.lastLoginAt)?h:void 0,{uid:y,emailVerified:v,isAnonymous:w,providerData:T,stsTokenManager:I}=t;tm(y&&I,e,"internal-error");const E=xm.fromJSON(this.name,I);tm("string"==typeof y,e,"internal-error"),Lm(l,e.name),Lm(u,e.name),tm("boolean"==typeof v,e,"internal-error"),tm("boolean"==typeof w,e,"internal-error"),Lm(d,e.name),Lm(f,e.name),Lm(p,e.name),Lm(g,e.name),Lm(m,e.name),Lm(_,e.name);const b=new Mm({uid:y,auth:e,email:u,emailVerified:v,displayName:l,isAnonymous:w,photoURL:f,phoneNumber:d,tenantId:p,stsTokenManager:E,createdAt:m,lastLoginAt:_});return T&&Array.isArray(T)&&(b.providerData=T.map(e=>({...e}))),g&&(b._redirectEventId=g),b}static async _fromIdTokenResponse(e,t,n=!1){const i=new xm;i.updateFromServerResponse(t);const s=new Mm({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:n});return await Pm(s),s}static async _fromGetAccountInfoResponse(e,t,n){const i=t.users[0];tm(void 0!==i.localId,"internal-error");const s=void 0!==i.providerUserInfo?Om(i.providerUserInfo):[],r=!(i.email&&i.passwordHash||(null==s?void 0:s.length)),o=new xm;o.updateFromIdToken(n);const a=new Mm({uid:i.localId,auth:e,stsTokenManager:o,isAnonymous:r}),c={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:s,metadata:new Rm(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash||(null==s?void 0:s.length))};return Object.assign(a,c),a}}
/**
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
 */const Um=new Map;function Fm(e){im(e instanceof Function,"Expected a class definition");let t=Um.get(e);return t?(im(t instanceof e,"Instance stored in cache mismatched with class"),t):(t=new e,Um.set(e,t),t)}
/**
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
 */class Vm{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return void 0===t?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Vm.type="NONE";const qm=Vm;
/**
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
 */function jm(e,t,n){return`firebase:${e}:${t}:${n}`}class Bm{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:i,name:s}=this.auth;this.fullUserKey=jm(this.userKey,i.apiKey,s),this.fullPersistenceKey=jm("persistence",i.apiKey,s),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if("string"==typeof e){const t=await Im(this.auth,{idToken:e}).catch(()=>{});return t?Mm._fromGetAccountInfoResponse(this.auth,t,e):null}return Mm._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();return await this.removeCurrentUser(),this.persistence=e,t?this.setCurrentUser(t):void 0}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(t,n,i="authUser"){if(!n.length)return new Bm(Fm(qm),t,i);const s=(await Promise.all(n.map(async e=>{if(await e._isAvailable())return e}))).filter(e=>e);let r=s[0]||Fm(qm);const o=jm(i,t.config.apiKey,t.name);let a=null;for(const h of n)try{const e=await h._get(o);if(e){let n;if("string"==typeof e){const i=await Im(t,{idToken:e}).catch(()=>{});if(!i)break;n=await Mm._fromGetAccountInfoResponse(t,i,e)}else n=Mm._fromJSON(t,e);h!==r&&(a=n),r=h;break}}catch(e){}const c=s.filter(e=>e._shouldAllowMigration);return r._shouldAllowMigration&&c.length?(r=c[0],a&&await r._set(o,a.toJSON()),await Promise.all(n.map(async t=>{if(t!==r)try{await t._remove(o)}catch(e){}})),new Bm(r,t,i)):new Bm(r,t,i)}}
/**
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
 */function zm(e){const t=e.toLowerCase();if(t.includes("opera/")||t.includes("opr/")||t.includes("opios/"))return"Opera";if(Km(t))return"IEMobile";if(t.includes("msie")||t.includes("trident/"))return"IE";if(t.includes("edge/"))return"Edge";if($m(t))return"Firefox";if(t.includes("silk/"))return"Silk";if(Qm(t))return"Blackberry";if(Ym(t))return"Webos";if(Hm(t))return"Safari";if((t.includes("chrome/")||Wm(t))&&!t.includes("edge/"))return"Chrome";if(Gm(t))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=e.match(t);if(2===(null==n?void 0:n.length))return n[1]}return"Other"}function $m(e=S()){return/firefox\//i.test(e)}function Hm(e=S()){const t=e.toLowerCase();return t.includes("safari/")&&!t.includes("chrome/")&&!t.includes("crios/")&&!t.includes("android")}function Wm(e=S()){return/crios\//i.test(e)}function Km(e=S()){return/iemobile/i.test(e)}function Gm(e=S()){return/android/i.test(e)}function Qm(e=S()){return/blackberry/i.test(e)}function Ym(e=S()){return/webos/i.test(e)}function Xm(e=S()){return/iphone|ipad|ipod/i.test(e)||/macintosh/i.test(e)&&/mobile/i.test(e)}function Jm(e=S()){return Xm(e)||Gm(e)||Ym(e)||Qm(e)||/windows phone/i.test(e)||Km(e)}
/**
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
 */function Zm(e,t=[]){let n;switch(e){case"Browser":n=zm(S());break;case"Worker":n=`${zm(S())}-${e}`;break;default:n=e}const i=t.length?t.join(","):"FirebaseCore-web";return`${n}/JsCore/${lt}/${i}`}
/**
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
 */class e_{constructor(e){this.auth=e,this.queue=[]}pushCallback(t,n){const i=n=>new Promise((i,s)=>{try{i(t(n))}catch(e){s(e)}});i.onAbort=n,this.queue.push(i);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(t){if(this.auth.currentUser===t)return;const n=[];try{for(const e of this.queue)await e(t),e.onAbort&&n.push(e.onAbort)}catch(e){n.reverse();for(const e of n)try{e()}catch(i){}throw this.auth._errorFactory.create("login-blocked",{originalMessage:null==e?void 0:e.message})}}}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */class t_{constructor(e){var t,n,i,s;const r=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=null!=(t=r.minPasswordLength)?t:6,r.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=r.maxPasswordLength),void 0!==r.containsLowercaseCharacter&&(this.customStrengthOptions.containsLowercaseLetter=r.containsLowercaseCharacter),void 0!==r.containsUppercaseCharacter&&(this.customStrengthOptions.containsUppercaseLetter=r.containsUppercaseCharacter),void 0!==r.containsNumericCharacter&&(this.customStrengthOptions.containsNumericCharacter=r.containsNumericCharacter),void 0!==r.containsNonAlphanumericCharacter&&(this.customStrengthOptions.containsNonAlphanumericCharacter=r.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,"ENFORCEMENT_STATE_UNSPECIFIED"===this.enforcementState&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=null!=(i=null==(n=e.allowedNonAlphanumericCharacters)?void 0:n.join(""))?i:"",this.forceUpgradeOnSignin=null!=(s=e.forceUpgradeOnSignin)&&s,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,n,i,s,r,o;const a={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,a),this.validatePasswordCharacterOptions(e,a),a.isValid&&(a.isValid=null==(t=a.meetsMinPasswordLength)||t),a.isValid&&(a.isValid=null==(n=a.meetsMaxPasswordLength)||n),a.isValid&&(a.isValid=null==(i=a.containsLowercaseLetter)||i),a.isValid&&(a.isValid=null==(s=a.containsUppercaseLetter)||s),a.isValid&&(a.isValid=null==(r=a.containsNumericCharacter)||r),a.isValid&&(a.isValid=null==(o=a.containsNonAlphanumericCharacter)||o),a}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){let n;this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);for(let i=0;i<e.length;i++)n=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,i,s){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=s))}}
/**
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
 */class n_{constructor(e,t,n,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new s_(this),this.idTokenSubscription=new s_(this),this.beforeStateQueue=new e_(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Kg,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion,this._persistenceManagerAvailable=new Promise(e=>this._resolvePersistenceManagerAvailable=e)}_initializeWithPersistence(t,n){return n&&(this._popupRedirectResolver=Fm(n)),this._initializationPromise=this.queue(async()=>{var i,s,r;if(!this._deleted&&(this.persistenceManager=await Bm.create(this,t),null==(i=this._resolvePersistenceManagerAvailable)||i.call(this),!this._deleted)){if(null==(s=this._popupRedirectResolver)?void 0:s._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch(e){}await this.initializeCurrentUser(n),this.lastNotifiedUid=(null==(r=this.currentUser)?void 0:r.uid)||null,this._deleted||(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();return this.currentUser||e?this.currentUser&&e&&this.currentUser.uid===e.uid?(this._currentUser._assign(e),void(await this.currentUser.getIdToken())):void(await this._updateCurrentUser(e,!0)):void 0}async initializeCurrentUserFromIdToken(e){try{const t=await Im(this,{idToken:e}),n=await Mm._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){await this.directlySetCurrentUser(null)}}async initializeCurrentUser(t){var n;if(at(this.app)){const e=this.app.settings.authIdToken;return e?new Promise(t=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(e).then(t,t))}):this.directlySetCurrentUser(null)}const i=await this.assertedPersistence.getCurrentUser();let s=i,r=!1;if(t&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const e=null==(n=this.redirectUser)?void 0:n._redirectEventId,i=null==s?void 0:s._redirectEventId,o=await this.tryRedirectSignIn(t);e&&e!==i||!(null==o?void 0:o.user)||(s=o.user,r=!0)}if(!s)return this.directlySetCurrentUser(null);if(!s._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(s)}catch(e){s=i,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(e))}return s?this.reloadAndSetCurrentUserOrClear(s):this.directlySetCurrentUser(null)}return tm(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===s._redirectEventId?this.directlySetCurrentUser(s):this.reloadAndSetCurrentUserOrClear(s)}async tryRedirectSignIn(t){let n=null;try{n=await this._popupRedirectResolver._completeRedirectFn(this,t,!0)}catch(e){await this._setRedirectUser(null)}return n}async reloadAndSetCurrentUserOrClear(t){try{await Pm(t)}catch(e){if("auth/network-request-failed"!==(null==e?void 0:e.code))return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(t)}useDeviceLanguage(){this.languageCode=function(){if("undefined"==typeof navigator)return null;const e=navigator;return e.languages&&e.languages[0]||e.language||null}()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(at(this.app))return Promise.reject(Zg(this));const t=e?Q(e):null;return t&&tm(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&tm(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return at(this.app)?Promise.reject(Zg(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return at(this.app)?Promise.reject(Zg(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(Fm(e))})}_getRecaptchaConfig(){return null==this.tenantId?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return null===this.tenantId?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await async function(e,t={}){return fm(e,"GET","/v2/passwordPolicy",dm(e,t))}
/**
 * @license
 * Copyright 2023 Google LLC
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
 */(this),t=new t_(e);null===this.tenantId?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new R("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:await this.currentUser.getIdToken()};null!=this.tenantId&&(t.tenantId=this.tenantId),await async function(e,t){return fm(e,"POST","/v2/accounts:revokeToken",dm(e,t))}(this,t)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:null==(e=this._currentUser)?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return null===e?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&Fm(e)||this._popupRedirectResolver;tm(t,this,"argument-error"),this.redirectPersistenceManager=await Bm.create(this,[Fm(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),(null==(t=this._currentUser)?void 0:t._redirectEventId)===e?this._currentUser:(null==(n=this.redirectUser)?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const n=null!=(t=null==(e=this.currentUser)?void 0:e.uid)?t:null;this.lastNotifiedUid!==n&&(this.lastNotifiedUid=n,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,i){if(this._deleted)return()=>{};const s="function"==typeof t?t:t.next.bind(t);let r=!1;const o=this._isInitialized?Promise.resolve():this._initializationPromise;if(tm(o,this,"internal-error"),o.then(()=>{r||s(this.currentUser)}),"function"==typeof t){const s=e.addObserver(t,n,i);return()=>{r=!0,s()}}{const n=e.addObserver(t);return()=>{r=!0,n()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return tm(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){e&&!this.frameworks.includes(e)&&(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Zm(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const n=await(null==(e=this.heartbeatServiceProvider.getImmediate({optional:!0}))?void 0:e.getHeartbeatsHeader());n&&(t["X-Firebase-Client"]=n);const i=await this._getAppCheckToken();return i&&(t["X-Firebase-AppCheck"]=i),t}async _getAppCheckToken(){var e;if(at(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const t=await(null==(e=this.appCheckServiceProvider.getImmediate({optional:!0}))?void 0:e.getToken());return(null==t?void 0:t.error)&&function(e,...t){Gg.logLevel<=ee.WARN&&Gg.warn(`Auth (${lt}): ${e}`,...t)}(`Error while retrieving App Check token: ${t.error}`),null==t?void 0:t.token}}function i_(e){return Q(e)}class s_{constructor(e){this.auth=e,this.observer=null,this.addObserver=function(e){const t=new H(e,void 0);return t.subscribe.bind(t)}(e=>this.observer=e)}get next(){return tm(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}
/**
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
 */let r_={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function o_(e){return r_.loadJS(e)}class a_{constructor(){this.enterprise=new c_}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class c_{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}const h_="NO_RECAPTCHA";class l_{constructor(e){this.type="recaptcha-enterprise",this.auth=i_(e)}async verify(e="verify",t=!1){function n(t,n,i){const s=window.grecaptcha;wm(s)?s.enterprise.ready(()=>{s.enterprise.execute(t,{action:e}).then(e=>{n(e)}).catch(()=>{n(h_)})}):i(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?(new a_).execute("siteKey",{action:"verify"}):new Promise((e,i)=>{(async function(e){if(!t){if(null==e.tenantId&&null!=e._agentRecaptchaConfig)return e._agentRecaptchaConfig.siteKey;if(null!=e.tenantId&&void 0!==e._tenantRecaptchaConfigs[e.tenantId])return e._tenantRecaptchaConfigs[e.tenantId].siteKey}return new Promise(async(t,n)=>{(async function(e){return fm(e,"GET","/v2/recaptchaConfig",dm(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}))})(e).then(i=>{if(void 0!==i.recaptchaKey){const n=new Tm(i);return null==e.tenantId?e._agentRecaptchaConfig=n:e._tenantRecaptchaConfigs[e.tenantId]=n,t(n.siteKey)}n(new Error("recaptcha Enterprise site key undefined"))}).catch(e=>{n(e)})})})(this.auth).then(s=>{if(!t&&wm(window.grecaptcha))n(s,e,i);else{if("undefined"==typeof window)return void i(new Error("RecaptchaVerifier is only supported in browser"));let t=r_.recaptchaEnterpriseScript;0!==t.length&&(t+=s),o_(t).then(()=>{n(s,e,i)}).catch(e=>{i(e)})}}).catch(e=>{i(e)})})}}async function u_(e,t,n,i=!1,s=!1){const r=new l_(e);let o;if(s)o=h_;else try{o=await r.verify(n)}catch(c){o=await r.verify(n,!0)}const a={...t};if("mfaSmsEnrollment"===n||"mfaSmsSignIn"===n){if("phoneEnrollmentInfo"in a){const e=a.phoneEnrollmentInfo.phoneNumber,t=a.phoneEnrollmentInfo.recaptchaToken;Object.assign(a,{phoneEnrollmentInfo:{phoneNumber:e,recaptchaToken:t,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in a){const e=a.phoneSignInInfo.recaptchaToken;Object.assign(a,{phoneSignInInfo:{recaptchaToken:e,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return a}return i?Object.assign(a,{captchaResp:o}):Object.assign(a,{captchaResponse:o}),Object.assign(a,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(a,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),a}async function d_(e,t,n,i,s){var r;if(null==(r=e._getRecaptchaConfig())?void 0:r.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const s=await u_(e,t,n,"getOobCode"===n);return i(e,s)}return i(e,t).catch(async s=>{if("auth/missing-recaptcha-token"===s.code){const s=await u_(e,t,n,"getOobCode"===n);return i(e,s)}return Promise.reject(s)})}
/**
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
 */function f_(e,t){const n=ot(e,"auth");if(n.isInitialized()){const e=n.getImmediate();if(V(n.getOptions(),null!=t?t:{}))return e;Yg(e,"already-initialized")}return n.initialize({options:t})}function p_(e,t,n){const i=i_(e);tm(/^https?:\/\//.test(t),i,"invalid-emulator-scheme");const s=g_(t),{host:r,port:o}=function(e){const t=g_(e),n=/(\/\/)?([^?#/]+)/.exec(e.substr(t.length));if(!n)return{host:"",port:null};const i=n[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(i);if(s){const e=s[1];return{host:e,port:m_(i.substr(e.length+1))}}{const[e,t]=i.split(":");return{host:e,port:m_(t)}}}(t),a=null===o?"":`:${o}`,c={url:`${s}//${r}${a}/`},h=Object.freeze({host:r,port:o,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:!1})});if(!i._canInitEmulator)return tm(i.config.emulator&&i.emulatorConfig,i,"emulator-config-failed"),void tm(V(c,i.config.emulator)&&V(h,i.emulatorConfig),i,"emulator-config-failed");i.config.emulator=c,i.emulatorConfig=h,i.settings.appVerificationDisabledForTesting=!0,w(r)?(T(`${s}//${r}${a}`),C("Auth",!0)):function(){function e(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}"undefined"!=typeof console&&console.info,"undefined"!=typeof window&&"undefined"!=typeof document&&("loading"===document.readyState?window.addEventListener("DOMContentLoaded",e):e())}
/**
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
 */()}function g_(e){const t=e.indexOf(":");return t<0?"":e.substr(0,t+1)}function m_(e){if(!e)return null;const t=Number(e);return isNaN(t)?null:t}class __{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return nm("not implemented")}_getIdTokenResponse(e){return nm("not implemented")}_linkToIdToken(e,t){return nm("not implemented")}_getReauthenticationResolver(e){return nm("not implemented")}}async function y_(e,t){return fm(e,"POST","/v1/accounts:signUp",t)}
/**
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
 */async function v_(e,t){return gm(e,"POST","/v1/accounts:signInWithPassword",dm(e,t))}async function w_(e,t){return async function(e,t){return fm(e,"POST","/v1/accounts:sendOobCode",dm(e,t))}(e,t)}
/**
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
 */
/**
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
 */
class T_ extends __{constructor(e,t,n,i=null){super("password",n),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new T_(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new T_(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t="string"==typeof e?JSON.parse(e):e;if((null==t?void 0:t.email)&&(null==t?void 0:t.password)){if("password"===t.signInMethod)return this._fromEmailAndPassword(t.email,t.password);if("emailLink"===t.signInMethod)return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":return d_(e,{returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"},"signInWithPassword",v_);case"emailLink":return async function(e,t){return gm(e,"POST","/v1/accounts:signInWithEmailLink",dm(e,t))}(e,{email:this._email,oobCode:this._password});default:Yg(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":return d_(e,{idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",y_);case"emailLink":return async function(e,t){return gm(e,"POST","/v1/accounts:signInWithEmailLink",dm(e,t))}(e,{idToken:t,email:this._email,oobCode:this._password});default:Yg(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}
/**
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
 */async function I_(e,t){return gm(e,"POST","/v1/accounts:signInWithIdp",dm(e,t))}
/**
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
 */class E_ extends __{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new E_(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Yg("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t="string"==typeof e?JSON.parse(e):e,{providerId:n,signInMethod:i,...s}=t;if(!n||!i)return null;const r=new E_(n,i);return r.idToken=s.idToken||void 0,r.accessToken=s.accessToken||void 0,r.secret=s.secret,r.nonce=s.nonce,r.pendingToken=s.pendingToken||null,r}_getIdTokenResponse(e){return I_(e,this.buildRequest())}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,I_(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,I_(e,t)}buildRequest(){const e={requestUri:"http://localhost",returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=j(t)}return e}}
/**
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
 */class b_{constructor(e){var t,n,i,s,r,o;const a=B(z(e)),c=null!=(t=a.apiKey)?t:null,h=null!=(n=a.oobCode)?n:null,l=function(e){switch(e){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}(null!=(i=a.mode)?i:null);tm(c&&h&&l,"argument-error"),this.apiKey=c,this.operation=l,this.code=h,this.continueUrl=null!=(s=a.continueUrl)?s:null,this.languageCode=null!=(r=a.lang)?r:null,this.tenantId=null!=(o=a.tenantId)?o:null}static parseLink(t){const n=function(e){const t=B(z(e)).link,n=t?B(z(t)).deep_link_id:null,i=B(z(e)).deep_link_id;return(i?B(z(i)).link:null)||i||n||t||e}(t);try{return new b_(n)}catch(e){return null}}}
/**
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
 */class C_{constructor(){this.providerId=C_.PROVIDER_ID}static credential(e,t){return T_._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const n=b_.parseLink(t);return tm(n,"argument-error"),T_._fromEmailAndCode(e,n.code,n.tenantId)}}C_.PROVIDER_ID="password",C_.EMAIL_PASSWORD_SIGN_IN_METHOD="password",C_.EMAIL_LINK_SIGN_IN_METHOD="emailLink";
/**
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
 */
class S_{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}
/**
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
 */class k_ extends S_{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}
/**
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
 */class N_ extends k_{constructor(){super("facebook.com")}static credential(e){return E_._fromParams({providerId:N_.PROVIDER_ID,signInMethod:N_.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return N_.credentialFromTaggedObject(e)}static credentialFromError(e){return N_.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t||!("oauthAccessToken"in t))return null;if(!t.oauthAccessToken)return null;try{return N_.credential(t.oauthAccessToken)}catch(e){return null}}}N_.FACEBOOK_SIGN_IN_METHOD="facebook.com",N_.PROVIDER_ID="facebook.com";
/**
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
 */
class A_ extends k_{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return E_._fromParams({providerId:A_.PROVIDER_ID,signInMethod:A_.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return A_.credentialFromTaggedObject(e)}static credentialFromError(e){return A_.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t)return null;const{oauthIdToken:n,oauthAccessToken:i}=t;if(!n&&!i)return null;try{return A_.credential(n,i)}catch(e){return null}}}A_.GOOGLE_SIGN_IN_METHOD="google.com",A_.PROVIDER_ID="google.com";
/**
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
 */
class R_ extends k_{constructor(){super("github.com")}static credential(e){return E_._fromParams({providerId:R_.PROVIDER_ID,signInMethod:R_.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return R_.credentialFromTaggedObject(e)}static credentialFromError(e){return R_.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t||!("oauthAccessToken"in t))return null;if(!t.oauthAccessToken)return null;try{return R_.credential(t.oauthAccessToken)}catch(e){return null}}}R_.GITHUB_SIGN_IN_METHOD="github.com",R_.PROVIDER_ID="github.com";
/**
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
 */
class P_ extends k_{constructor(){super("twitter.com")}static credential(e,t){return E_._fromParams({providerId:P_.PROVIDER_ID,signInMethod:P_.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return P_.credentialFromTaggedObject(e)}static credentialFromError(e){return P_.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t)return null;const{oauthAccessToken:n,oauthTokenSecret:i}=t;if(!n||!i)return null;try{return P_.credential(n,i)}catch(e){return null}}}
/**
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
 */
async function D_(e,t){return gm(e,"POST","/v1/accounts:signUp",dm(e,t))}
/**
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
 */P_.TWITTER_SIGN_IN_METHOD="twitter.com",P_.PROVIDER_ID="twitter.com";class O_{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,i=!1){const s=await Mm._fromIdTokenResponse(e,n,i),r=x_(n);return new O_({user:s,providerId:r,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const i=x_(n);return new O_({user:e,providerId:i,_tokenResponse:n,operationType:t})}}function x_(e){return e.providerId?e.providerId:"phoneNumber"in e?"phone":null}
/**
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
 */async function L_(e){var t;if(at(e.app))return Promise.reject(Zg(e));const n=i_(e);if(await n._initializationPromise,null==(t=n.currentUser)?void 0:t.isAnonymous)return new O_({user:n.currentUser,providerId:null,operationType:"signIn"});const i=await D_(n,{returnSecureToken:!0}),s=await O_._fromIdTokenResponse(n,"signIn",i,!0);return await n._updateCurrentUser(s.user),s}
/**
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
 */class M_ extends A{constructor(e,t,n,i){var s;super(t.code,t.message),this.operationType=n,this.user=i,Object.setPrototypeOf(this,M_.prototype),this.customData={appName:e.name,tenantId:null!=(s=e.tenantId)?s:void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,i){return new M_(e,t,n,i)}}function U_(e,t,n,i){return("reauthenticate"===t?n._getReauthenticationResolver(e):n._getIdTokenResponse(e)).catch(n=>{if("auth/multi-factor-auth-required"===n.code)throw M_._fromErrorAndOperation(e,n,t,i);throw n})}
/**
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
 */async function F_(e,t,n=!1){const i=await Nm(e,t._linkToIdToken(e.auth,await e.getIdToken()),n);return O_._forOperation(e,"link",i)}
/**
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
 */
async function V_(e,t,n=!1){if(at(e.app))return Promise.reject(Zg(e));const i="signIn",s=await U_(e,i,t),r=await O_._fromIdTokenResponse(e,i,s);return n||await e._updateCurrentUser(r.user),r}async function q_(e,t){return V_(i_(e),t)}async function j_(e,t){const n=Q(e);return await async function(e,t,n){var i;await Pm(t),tm((i=t.providerData,new Set(i.map(({providerId:e})=>e).filter(e=>!!e))).has(n)===e,t.auth,"provider-already-linked")}
/**
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
 */(!1,n,t.providerId),F_(n,t)}
/**
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
 */async function B_(e){const t=i_(e);t._getPasswordPolicyInternal()&&await t._updatePasswordPolicy()}async function z_(e,t,n){const i=i_(e),s={requestType:"PASSWORD_RESET",email:t,clientType:"CLIENT_TYPE_WEB"};await d_(i,s,"getOobCode",w_)}async function $_(e,t,n){if(at(e.app))return Promise.reject(Zg(e));const i=i_(e),s=d_(i,{returnSecureToken:!0,email:t,password:n,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",D_),r=await s.catch(t=>{throw"auth/password-does-not-meet-requirements"===t.code&&B_(e),t}),o=await O_._fromIdTokenResponse(i,"signIn",r);return await i._updateCurrentUser(o.user),o}function H_(e,t,n){return at(e.app)?Promise.reject(Zg(e)):q_(Q(e),C_.credential(t,n)).catch(async t=>{throw"auth/password-does-not-meet-requirements"===t.code&&B_(e),t})}
/**
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
 */
/**
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
 */
async function W_(e,{displayName:t,photoURL:n}){if(void 0===t&&void 0===n)return;const i=Q(e),s={idToken:await i.getIdToken(),displayName:t,photoUrl:n,returnSecureToken:!0},r=await Nm(i,async function(e,t){return fm(e,"POST","/v1/accounts:update",t)}(i.auth,s));i.displayName=r.displayName||null,i.photoURL=r.photoUrl||null;const o=i.providerData.find(({providerId:e})=>"password"===e);o&&(o.displayName=i.displayName,o.photoURL=i.photoURL),await i._updateTokensIfNecessary(r)}function K_(e,t,n,i){return Q(e).onIdTokenChanged(t,n,i)}function G_(e,t,n){return Q(e).beforeAuthStateChanged(t,n)}function Q_(e){return Q(e).signOut()}const Y_="__sak";
/**
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
 */class X_{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Y_,"1"),this.storage.removeItem(Y_),Promise.resolve(!0)):Promise.resolve(!1)}catch(e){return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}
/**
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
 */class J_ extends X_{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Jm(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),i=this.localCache[t];n!==i&&e(t,i,n)}}onStorageEvent(e,t=!1){if(!e.key)return void this.forAllChangedKeys((e,t,n)=>{this.notifyListeners(e,n)});const n=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const e=this.storage.getItem(n);(t||this.localCache[n]!==e)&&this.notifyListeners(n,e)},s=this.storage.getItem(n);!function(){const e=S();return e.indexOf("MSIE ")>=0||e.indexOf("Trident/")>=0}()||10!==document.documentMode||s===e.newValue||e.newValue===e.oldValue?i():setTimeout(i,10)}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const i of Array.from(n))i(t?JSON.parse(t):t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},1e3)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){0===Object.keys(this.listeners).length&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),0===this.listeners[e].size&&delete this.listeners[e]),0===Object.keys(this.listeners).length&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}J_.type="LOCAL";const Z_=J_;
/**
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
 */class ey extends X_{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}ey.type="SESSION";const ty=ey;
/**
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
 */
/**
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
 */
class ny{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(t=>t.isListeningto(e));if(t)return t;const n=new ny(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:i,data:s}=t.data,r=this.handlersMap[i];if(!(null==r?void 0:r.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:i});const o=Array.from(r).map(async e=>e(t.origin,s)),a=await function(e){return Promise.all(e.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}(o);t.ports[0].postMessage({status:"done",eventId:n,eventType:i,response:a})}_subscribe(e,t){0===Object.keys(this.handlersMap).length&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),t&&0!==this.handlersMap[e].size||delete this.handlersMap[e],0===Object.keys(this.handlersMap).length&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}
/**
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
 */
function iy(e="",t=10){let n="";for(let i=0;i<t;i++)n+=Math.floor(10*Math.random());return e+n}
/**
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
 */ny.receivers=[];class sy{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const i="undefined"!=typeof MessageChannel?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let s,r;return new Promise((o,a)=>{const c=iy("",20);i.port1.start();const h=setTimeout(()=>{a(new Error("unsupported_event"))},n);r={messageChannel:i,onMessage(e){const t=e;if(t.data.eventId===c)switch(t.data.status){case"ack":clearTimeout(h),s=setTimeout(()=>{a(new Error("timeout"))},3e3);break;case"done":clearTimeout(s),o(t.data.response);break;default:clearTimeout(h),clearTimeout(s),a(new Error("invalid_response"))}}},this.handlers.add(r),i.port1.addEventListener("message",r.onMessage),this.target.postMessage({eventType:e,eventId:c,data:t},[i.port2])}).finally(()=>{r&&this.removeMessageHandler(r)})}}
/**
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
 */function ry(){return window}
/**
 * @license
 * Copyright 2020 Google LLC.
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
 */
function oy(){return void 0!==ry().WorkerGlobalScope&&"function"==typeof ry().importScripts}
/**
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
 */
const ay="firebaseLocalStorageDb",cy="firebaseLocalStorage",hy="fbase_key";class ly{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function uy(e,t){return e.transaction([cy],t?"readwrite":"readonly").objectStore(cy)}function dy(){const t=indexedDB.open(ay,1);return new Promise((n,i)=>{t.addEventListener("error",()=>{i(t.error)}),t.addEventListener("upgradeneeded",()=>{const n=t.result;try{n.createObjectStore(cy,{keyPath:hy})}catch(e){i(e)}}),t.addEventListener("success",async()=>{const e=t.result;e.objectStoreNames.contains(cy)?n(e):(e.close(),await function(){const e=indexedDB.deleteDatabase(ay);return new ly(e).toPromise()}(),n(await dy()))})})}async function fy(e,t,n){const i=uy(e,!0).put({[hy]:t,value:n});return new ly(i).toPromise()}function py(e,t){const n=uy(e,!0).delete(t);return new ly(n).toPromise()}class gy{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db||(this.db=await dy()),this.db}async _withRetries(t){let n=0;for(;;)try{const e=await this._openDb();return await t(e)}catch(e){if(n++>3)throw e;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return oy()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=ny._getInstance(oy()?self:null),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await async function(){if(!(null==navigator?void 0:navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch(e){return null}}(),!this.activeServiceWorker)return;this.sender=new sy(this.activeServiceWorker);const i=await this.sender._send("ping",{},800);i&&(null==(t=i[0])?void 0:t.fulfilled)&&(null==(n=i[0])?void 0:n.value.includes("keyChanged"))&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(t){var n;if(this.sender&&this.activeServiceWorker&&((null==(n=null==navigator?void 0:navigator.serviceWorker)?void 0:n.controller)||null)===this.activeServiceWorker)try{await this.sender._send("keyChanged",{key:t},this.serviceWorkerReceiverAvailable?800:50)}catch(e){}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await dy();return await fy(e,Y_,"1"),await py(e,Y_),!0}catch(e){}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>fy(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(t=>async function(e,t){const n=uy(e,!1).get(t),i=await new ly(n).toPromise();return void 0===i?null:i.value}(t,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>py(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(e=>{const t=uy(e,!1).getAll();return new ly(t).toPromise()});if(!e)return[];if(0!==this.pendingWrites)return[];const t=[],n=new Set;if(0!==e.length)for(const{fbase_key:i,value:s}of e)n.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(s)&&(this.notifyListeners(i,s),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!n.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const i of Array.from(n))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),800)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){0===Object.keys(this.listeners).length&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),0===this.listeners[e].size&&delete this.listeners[e]),0===Object.keys(this.listeners).length&&this.stopPolling()}}gy.type="LOCAL";const my=gy;
/**
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
 */
function _y(e,t){return t?Fm(t):(tm(e._popupRedirectResolver,e,"argument-error"),e._popupRedirectResolver)}
/**
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
 */new om(3e4,6e4);class yy extends __{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return I_(e,this._buildIdpRequest())}_linkToIdToken(e,t){return I_(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return I_(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function vy(e){return V_(e.auth,new yy(e),e.bypassAuthState)}function wy(t){const{auth:n,user:i}=t;return tm(i,n,"internal-error"),async function(t,n,i=!1){const{auth:s}=t;if(at(s.app))return Promise.reject(Zg(s));const r="reauthenticate";try{const e=await Nm(t,U_(s,r,n,t),i);tm(e.idToken,s,"internal-error");const o=Sm(e.idToken);tm(o,s,"internal-error");const{sub:a}=o;return tm(t.uid===a,s,"user-mismatch"),O_._forOperation(t,r,e)}catch(e){throw"auth/user-not-found"===(null==e?void 0:e.code)&&Yg(s,"user-mismatch"),e}}(i,new yy(t),t.bypassAuthState)}async function Ty(e){const{auth:t,user:n}=e;return tm(n,t,"internal-error"),F_(n,new yy(e),e.bypassAuthState)}
/**
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
 */class Iy{constructor(e,t,n,i,s=!1){this.auth=e,this.resolver=n,this.user=i,this.bypassAuthState=s,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(t,n)=>{this.pendingPromise={resolve:t,reject:n};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(e){this.reject(e)}})}async onAuthEvent(t){const{urlResponse:n,sessionId:i,postBody:s,tenantId:r,error:o,type:a}=t;if(o)return void this.reject(o);const c={auth:this.auth,requestUri:n,sessionId:i,tenantId:r||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(c))}catch(e){this.reject(e)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return vy;case"linkViaPopup":case"linkViaRedirect":return Ty;case"reauthViaPopup":case"reauthViaRedirect":return wy;default:Yg(this.auth,"internal-error")}}resolve(e){im(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){im(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}
/**
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
 */const Ey=new om(2e3,1e4);async function by(e,t,n){if(at(e.app))return Promise.reject(Xg(e,"operation-not-supported-in-this-environment"));const i=i_(e);!function(e,t){if(!(t instanceof S_))throw S_.name!==t.constructor.name&&Yg(e,"argument-error"),Jg(e,"argument-error",`Type of ${t.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}(e,t);const s=_y(i,n);return new Cy(i,"signInViaPopup",t,s).executeNotNull()}class Cy extends Iy{constructor(e,t,n,i,s){super(e,t,i,s),this.provider=n,this.authWindow=null,this.pollId=null,Cy.currentPopupAction&&Cy.currentPopupAction.cancel(),Cy.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return tm(e,this.auth,"internal-error"),e}async onExecution(){im(1===this.filter.length,"Popup operations only handle one event");const e=iy();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(e=>{this.reject(e)}),this.resolver._isIframeWebStorageSupported(this.auth,e=>{e||this.reject(Xg(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return(null==(e=this.authWindow)?void 0:e.associatedEvent)||null}cancel(){this.reject(Xg(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,Cy.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;(null==(n=null==(t=this.authWindow)?void 0:t.window)?void 0:n.closed)?this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Xg(this.auth,"popup-closed-by-user"))},8e3):this.pollId=window.setTimeout(e,Ey.get())};e()}}Cy.currentPopupAction=null;
/**
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
 */
const Sy=new Map;class ky extends Iy{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let t=Sy.get(this.auth._key());if(!t){try{const e=await async function(e,t){const n=function(e){return jm("pendingRedirect",e.config.apiKey,e.name)}(t),i=function(e){return Fm(e._redirectPersistence)}(e);if(!(await i._isAvailable()))return!1;const s="true"===await i._get(n);return await i._remove(n),s}(this.resolver,this.auth)?await super.execute():null;t=()=>Promise.resolve(e)}catch(e){t=()=>Promise.reject(e)}Sy.set(this.auth._key(),t)}return this.bypassAuthState||Sy.set(this.auth._key(),()=>Promise.resolve(null)),t()}async onAuthEvent(e){if("signInViaRedirect"===e.type)return super.onAuthEvent(e);if("unknown"!==e.type){if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}else this.resolve(null)}async onExecution(){}cleanUp(){}}function Ny(e,t){Sy.set(e._key(),t)}async function Ay(e,t,n=!1){if(at(e.app))return Promise.reject(Zg(e));const i=i_(e),s=_y(i,t),r=new ky(i,s,n),o=await r.execute();return o&&!n&&(delete o.user._redirectEventId,await i._persistUserIfCurrent(o.user),await i._setRedirectUser(null,t)),o}
/**
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
 */class Ry{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!function(e){switch(e.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Dy(e);default:return!1}}
/**
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
 */(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!Dy(e)){const i=(null==(n=e.error.code)?void 0:n.split("auth/")[1])||"internal-error";t.onError(Xg(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=null===t.eventId||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=6e5&&this.cachedEventUids.clear(),this.cachedEventUids.has(Py(e))}saveEventToCache(e){this.cachedEventUids.add(Py(e)),this.lastProcessedEventTime=Date.now()}}function Py(e){return[e.type,e.eventId,e.sessionId,e.tenantId].filter(e=>e).join("-")}function Dy({type:e,error:t}){return"unknown"===e&&"auth/no-auth-event"===(null==t?void 0:t.code)}
/**
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
 */
const Oy=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,xy=/^https?/;function Ly(e){const t=sm(),{protocol:n,hostname:i}=new URL(t);if(e.startsWith("chrome-extension://")){const s=new URL(e);return""===s.hostname&&""===i?"chrome-extension:"===n&&e.replace("chrome-extension://","")===t.replace("chrome-extension://",""):"chrome-extension:"===n&&s.hostname===i}if(!xy.test(n))return!1;if(Oy.test(e))return i===e;const s=e.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(i)}
/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const My=new om(3e4,6e4);function Uy(){const e=ry().___jsl;if(null==e?void 0:e.H)for(const t of Object.keys(e.H))if(e.H[t].r=e.H[t].r||[],e.H[t].L=e.H[t].L||[],e.H[t].r=[...e.H[t].L],e.CP)for(let n=0;n<e.CP.length;n++)e.CP[n]=null}let Fy=null;
/**
 * @license
 * Copyright 2020 Google LLC.
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
 */
const Vy=new om(5e3,15e3),qy={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},jy=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function By(e){const t=e.config;tm(t.authDomain,e,"auth-domain-config-required");const n=t.emulator?am(t,"emulator/auth/iframe"):`https://${e.config.authDomain}/__/auth/iframe`,i={apiKey:t.apiKey,appName:e.name,v:lt},s=jy.get(e.config.apiHost);s&&(i.eid=s);const r=e._getFrameworks();return r.length&&(i.fw=r.join(",")),`${n}?${j(i).slice(1)}`}async function zy(e){const t=await function(e){return Fy=Fy||function(e){return new Promise((t,n)=>{var i,s,r;function o(){Uy(),gapi.load("gapi.iframes",{callback:()=>{t(gapi.iframes.getContext())},ontimeout:()=>{Uy(),n(Xg(e,"network-request-failed"))},timeout:My.get()})}if(null==(s=null==(i=ry().gapi)?void 0:i.iframes)?void 0:s.Iframe)t(gapi.iframes.getContext());else{if(!(null==(r=ry().gapi)?void 0:r.load)){const t=`__iframefcb${Math.floor(1e6*Math.random())}`;return ry()[t]=()=>{gapi.load?o():n(Xg(e,"network-request-failed"))},o_(`${r_.gapiScript}?onload=${t}`).catch(e=>n(e))}o()}}).catch(e=>{throw Fy=null,e})}(e),Fy}(e),n=ry().gapi;return tm(n,e,"internal-error"),t.open({where:document.body,url:By(e),messageHandlersFilter:n.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:qy,dontclear:!0},t=>new Promise(async(n,i)=>{await t.restyle({setHideOnLeave:!1});const s=Xg(e,"network-request-failed"),r=ry().setTimeout(()=>{i(s)},Vy.get());function o(){ry().clearTimeout(r),n(t)}t.ping(o).then(o,()=>{i(s)})}))}
/**
 * @license
 * Copyright 2020 Google LLC.
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
 */const $y={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"};class Hy{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch(e){}}}
/**
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
 */
const Wy=encodeURIComponent("fac");async function Ky(e,t,n,i,s,r){tm(e.config.authDomain,e,"auth-domain-config-required"),tm(e.config.apiKey,e,"invalid-api-key");const o={apiKey:e.config.apiKey,appName:e.name,authType:n,redirectUrl:i,v:lt,eventId:s};if(t instanceof S_){t.setDefaultLanguage(e.languageCode),o.providerId=t.providerId||"",U(t.getCustomParameters())||(o.customParameters=JSON.stringify(t.getCustomParameters()));for(const[e,t]of Object.entries({}))o[e]=t}if(t instanceof k_){const e=t.getScopes().filter(e=>""!==e);e.length>0&&(o.scopes=e.join(","))}e.tenantId&&(o.tid=e.tenantId);const a=o;for(const l of Object.keys(a))void 0===a[l]&&delete a[l];const c=await e._getAppCheckToken(),h=c?`#${Wy}=${encodeURIComponent(c)}`:"";return`${function({config:e}){return e.emulator?am(e,"emulator/auth/handler"):`https://${e.authDomain}/__/auth/handler`}
/**
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
 */(e)}?${j(a).slice(1)}${h}`}const Gy="webStorageSupport",Qy=class{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=ty,this._completeRedirectFn=Ay,this._overrideRedirectResult=Ny}async _openPopup(t,n,i,s){var r;return im(null==(r=this.eventManagers[t._key()])?void 0:r.manager,"_initialize() not called before _openPopup()"),function(t,n,i,s=500,r=600){const o=Math.max((window.screen.availHeight-r)/2,0).toString(),a=Math.max((window.screen.availWidth-s)/2,0).toString();let c="";const h={...$y,width:s.toString(),height:r.toString(),top:o,left:a},l=S().toLowerCase();i&&(c=Wm(l)?"_blank":i),$m(l)&&(n=n||"http://localhost",h.scrollbars="yes");const u=Object.entries(h).reduce((e,[t,n])=>`${e}${t}=${n},`,"");if(function(e=S()){var t;return Xm(e)&&!!(null==(t=window.navigator)?void 0:t.standalone)}(l)&&"_self"!==c)return function(e,t){const n=document.createElement("a");n.href=e,n.target=t;const i=document.createEvent("MouseEvent");i.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),n.dispatchEvent(i)}(n||"",c),new Hy(null);const d=window.open(n||"",c,u);tm(d,t,"popup-blocked");try{d.focus()}catch(e){}return new Hy(d)}(t,await Ky(t,n,i,sm(),s),iy())}async _openRedirect(e,t,n,i){return await this._originValidation(e),s=await Ky(e,t,n,sm(),i),ry().location.href=s,new Promise(()=>{});var s}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:e,promise:n}=this.eventManagers[t];return e?Promise.resolve(e):(im(n,"If manager is not set, promise should be"),n)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await zy(e),n=new Ry(e);return t.register("authEvent",t=>(tm(null==t?void 0:t.authEvent,e,"invalid-auth-event"),{status:n.onEvent(t.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Gy,{type:Gy},n=>{var i;const s=null==(i=null==n?void 0:n[0])?void 0:i[Gy];void 0!==s&&t(!!s),Yg(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(t){const n=t._key();return this.originValidationPromises[n]||(this.originValidationPromises[n]=async function(t){if(t.config.emulator)return;const{authorizedDomains:n}=await async function(e,t={}){return fm(e,"GET","/v1/projects",t)}(t);for(const i of n)try{if(Ly(i))return}catch(e){}Yg(t,"unauthorized-domain")}(t)),this.originValidationPromises[n]}get _shouldInitProactively(){return Jm()||Hm()||Xm()}};var Yy="@firebase/auth",Xy="1.11.0";
/**
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
 */
class Jy{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),(null==(e=this.auth.currentUser)?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(t=>{e((null==t?void 0:t.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){tm(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}
/**
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
 */
/**
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
 */
const Zy=y("authIdTokenMaxAge")||300;let ev=null;function tv(e=dt()){const t=ot(e,"auth");if(t.isInitialized())return t.getImmediate();const n=f_(e,{popupRedirectResolver:Qy,persistence:[my,Z_,ty]}),i=y("authTokenSyncURL");if(i&&"boolean"==typeof isSecureContext&&isSecureContext){const e=new URL(i,location.origin);if(location.origin===e.origin){const t=(s=e.toString(),async e=>{const t=e&&await e.getIdTokenResult(),n=t&&((new Date).getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>Zy)return;const i=null==t?void 0:t.token;ev!==i&&(ev=i,await fetch(s,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))});G_(n,t,()=>t(n.currentUser)),K_(n,e=>t(e))}}var s;const r=g("auth");return r&&p_(n,`http://${r}`),n}var nv,iv;nv={loadJS:e=>new Promise((t,n)=>{const i=document.createElement("script");var s,r;i.setAttribute("src",e),i.onload=t,i.onerror=e=>{const t=Xg("internal-error");t.customData=e,n(t)},i.type="text/javascript",i.charset="UTF-8",(null!=(r=null==(s=document.getElementsByTagName("head"))?void 0:s[0])?r:document).appendChild(i)}),gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="},r_=nv,iv="Browser",rt(new Y("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),s=e.getProvider("app-check-internal"),{apiKey:r,authDomain:o}=n.options;tm(r&&!r.includes(":"),"invalid-api-key",{appName:n.name});const a={apiKey:r,authDomain:o,clientPlatform:iv,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Zm(iv)},c=new n_(n,i,s,a);return function(e,t){const n=(null==t?void 0:t.persistence)||[],i=(Array.isArray(n)?n:[n]).map(Fm);(null==t?void 0:t.errorMap)&&e._updateErrorMap(t.errorMap),e._initializeWithPersistence(i,null==t?void 0:t.popupRedirectResolver)}(c,t),c},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),rt(new Y("auth-internal",e=>{const t=i_(e.getProvider("auth").getImmediate());return new Jy(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ft(Yy,Xy,function(e){switch(e){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}(iv)),ft(Yy,Xy,"esm2020");const sv=Object.freeze({__proto__:null,ActionCodeURL:b_,AuthCredential:__,EmailAuthCredential:T_,EmailAuthProvider:C_,FacebookAuthProvider:N_,GithubAuthProvider:R_,GoogleAuthProvider:A_,OAuthCredential:E_,TwitterAuthProvider:P_,beforeAuthStateChanged:G_,browserLocalPersistence:Z_,browserPopupRedirectResolver:Qy,browserSessionPersistence:ty,connectAuthEmulator:p_,createUserWithEmailAndPassword:$_,getAuth:tv,getIdTokenResult:bm,inMemoryPersistence:qm,indexedDBLocalPersistence:my,initializeAuth:f_,linkWithCredential:j_,onIdTokenChanged:K_,prodErrorMap:Wg,reload:Dm,sendPasswordResetEmail:z_,signInAnonymously:L_,signInWithCredential:q_,signInWithEmailAndPassword:H_,signInWithPopup:by,signOut:Q_,updateProfile:W_}),rv="firebasestorage.googleapis.com",ov="storageBucket";
/**
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
 */
/**
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
 */
class av extends A{constructor(e,t,n=0){super(dv(e),`Firebase Storage: ${t} (${dv(e)})`),this.status_=n,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,av.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return dv(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}\n${this.customData.serverResponse}`:this.message=this._baseMessage}}var cv,hv,lv,uv;function dv(e){return"storage/"+e}function fv(){return new av(cv.UNKNOWN,"An unknown error occurred, please check the error payload for server response.")}function pv(e){return new av(cv.INVALID_ARGUMENT,e)}function gv(){return new av(cv.APP_DELETED,"The Firebase app was deleted.")}function mv(e,t){return new av(cv.INVALID_FORMAT,"String does not match format '"+e+"': "+t)}function _v(e){throw new av(cv.INTERNAL_ERROR,"Internal error: "+e)}
/**
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
 */(hv=cv||(cv={})).UNKNOWN="unknown",hv.OBJECT_NOT_FOUND="object-not-found",hv.BUCKET_NOT_FOUND="bucket-not-found",hv.PROJECT_NOT_FOUND="project-not-found",hv.QUOTA_EXCEEDED="quota-exceeded",hv.UNAUTHENTICATED="unauthenticated",hv.UNAUTHORIZED="unauthorized",hv.UNAUTHORIZED_APP="unauthorized-app",hv.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",hv.INVALID_CHECKSUM="invalid-checksum",hv.CANCELED="canceled",hv.INVALID_EVENT_NAME="invalid-event-name",hv.INVALID_URL="invalid-url",hv.INVALID_DEFAULT_BUCKET="invalid-default-bucket",hv.NO_DEFAULT_BUCKET="no-default-bucket",hv.CANNOT_SLICE_BLOB="cannot-slice-blob",hv.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",hv.NO_DOWNLOAD_URL="no-download-url",hv.INVALID_ARGUMENT="invalid-argument",hv.INVALID_ARGUMENT_COUNT="invalid-argument-count",hv.APP_DELETED="app-deleted",hv.INVALID_ROOT_OPERATION="invalid-root-operation",hv.INVALID_FORMAT="invalid-format",hv.INTERNAL_ERROR="internal-error",hv.UNSUPPORTED_ENVIRONMENT="unsupported-environment";class yv{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return 0===this.path.length}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(t,n){let i;try{i=yv.makeFromUrl(t,n)}catch(e){return new yv(t,"")}if(""===i.path)return i;throw s=t,new av(cv.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+s+"'.");var s}static makeFromUrl(e,t){let n=null;const i="([A-Za-z0-9.\\-_]+)",s=new RegExp("^gs://"+i+"(/(.*))?$","i");function r(e){e.path_=decodeURIComponent(e.path)}const o=t.replace(/[.]/g,"\\."),a=[{regex:s,indices:{bucket:1,path:3},postModify:function(e){"/"===e.path.charAt(e.path.length-1)&&(e.path_=e.path_.slice(0,-1))}},{regex:new RegExp(`^https?://${o}/v[A-Za-z0-9_]+/b/${i}/o(/([^?#]*).*)?$`,"i"),indices:{bucket:1,path:3},postModify:r},{regex:new RegExp(`^https?://${t===rv?"(?:storage.googleapis.com|storage.cloud.google.com)":t}/${i}/([^?#]*)`,"i"),indices:{bucket:1,path:2},postModify:r}];for(let c=0;c<a.length;c++){const t=a[c],i=t.regex.exec(e);if(i){const e=i[t.indices.bucket];let s=i[t.indices.path];s||(s=""),n=new yv(e,s),t.postModify(n);break}}if(null==n)throw function(e){return new av(cv.INVALID_URL,"Invalid URL '"+e+"'.")}(e);return n}}class vv{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}
/**
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
 */function wv(e){return"string"==typeof e||e instanceof String}function Tv(e){return Iv()&&e instanceof Blob}function Iv(){return"undefined"!=typeof Blob}function Ev(e,t,n,i){if(i<t)throw pv(`Invalid value for '${e}'. Expected ${t} or greater.`);if(i>n)throw pv(`Invalid value for '${e}'. Expected ${n} or less.`)}
/**
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
 */function bv(e,t,n){let i=t;return null==n&&(i=`https://${t}`),`${n}://${i}/v0${e}`}function Cv(e){const t=encodeURIComponent;let n="?";for(const i in e)e.hasOwnProperty(i)&&(n=n+(t(i)+"=")+t(e[i])+"&");return n=n.slice(0,-1),n}(uv=lv||(lv={}))[uv.NO_ERROR=0]="NO_ERROR",uv[uv.NETWORK_ERROR=1]="NETWORK_ERROR",uv[uv.ABORT=2]="ABORT";
/**
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
 */
class Sv{constructor(e,t,n,i,s,r,o,a,c,h,l,u=!0,d=!1){this.url_=e,this.method_=t,this.headers_=n,this.body_=i,this.successCodes_=s,this.additionalRetryCodes_=r,this.callback_=o,this.errorCallback_=a,this.timeout_=c,this.progressCallback_=h,this.connectionFactory_=l,this.retry=u,this.isUsingEmulator=d,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((e,t)=>{this.resolve_=e,this.reject_=t,this.start_()})}start_(){const t=(t,n)=>{const i=this.resolve_,s=this.reject_,r=n.connection;if(n.wasSuccessCode)try{const e=this.callback_(r,r.getResponse());!
/**
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
 */
function(e){return void 0!==e}(e)?i():i(e)}catch(e){s(e)}else if(null!==r){const e=fv();e.serverResponse=r.getErrorText(),this.errorCallback_?s(this.errorCallback_(r,e)):s(e)}else n.canceled?s(this.appDelete_?gv():new av(cv.CANCELED,"User canceled the upload/download.")):s(new av(cv.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again."))};this.canceled_?t(0,new kv(!1,null,!0)):this.backoffId_=function(e,t,n){let i=1,s=null,r=null,o=!1,a=0;function c(){return 2===a}let h=!1;function l(...e){h||(h=!0,t.apply(null,e))}function u(t){s=setTimeout(()=>{s=null,e(f,c())},t)}function d(){r&&clearTimeout(r)}function f(e,...t){if(h)return void d();if(e)return d(),void l.call(null,e,...t);if(c()||o)return d(),void l.call(null,e,...t);let n;i<64&&(i*=2),1===a?(a=2,n=0):n=1e3*(i+Math.random()),u(n)}let p=!1;function g(e){p||(p=!0,d(),h||(null!==s?(e||(a=2),clearTimeout(s),u(0)):e||(a=1)))}return u(0),r=setTimeout(()=>{o=!0,g(!0)},n),g}((e,t)=>{if(t)return void e(!1,new kv(!1,null,!0));const n=this.connectionFactory_();this.pendingConnection_=n;const i=e=>{const t=e.loaded,n=e.lengthComputable?e.total:-1;null!==this.progressCallback_&&this.progressCallback_(t,n)};null!==this.progressCallback_&&n.addUploadProgressListener(i),n.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{null!==this.progressCallback_&&n.removeUploadProgressListener(i),this.pendingConnection_=null;const t=n.getErrorCode()===lv.NO_ERROR,s=n.getStatus();if(!t||
/**
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
 */
function(e,t){const n=e>=500&&e<600,i=-1!==[408,429].indexOf(e),s=-1!==t.indexOf(e);return n||i||s}(s,this.additionalRetryCodes_)&&this.retry){const t=n.getErrorCode()===lv.ABORT;return void e(!1,new kv(!1,null,t))}const r=-1!==this.successCodes_.indexOf(s);e(!0,new kv(r,n))})},t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,null!==this.backoffId_&&(0,this.backoffId_)(!1),null!==this.pendingConnection_&&this.pendingConnection_.abort()}}class kv{constructor(e,t,n){this.wasSuccessCode=e,this.connection=t,this.canceled=!!n}}function Nv(...e){const t="undefined"!=typeof BlobBuilder?BlobBuilder:"undefined"!=typeof WebKitBlobBuilder?WebKitBlobBuilder:void 0;if(void 0!==t){const n=new t;for(let t=0;t<e.length;t++)n.append(e[t]);return n.getBlob()}if(Iv())return new Blob(e);throw new av(cv.UNSUPPORTED_ENVIRONMENT,"This browser doesn't seem to support creating Blobs")}
/**
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
 */
const Av="raw",Rv="base64",Pv="base64url",Dv="data_url";class Ov{constructor(e,t){this.data=e,this.contentType=t||null}}function xv(t,n){switch(t){case Av:return new Ov(Lv(n));case Rv:case Pv:return new Ov(Mv(t,n));case Dv:return new Ov(function(t){const n=new Uv(t);return n.base64?Mv(Rv,n.rest):function(t){let n;try{n=decodeURIComponent(t)}catch(e){throw mv(Dv,"Malformed data URL.")}return Lv(n)}(n.rest)}(n),new Uv(n).contentType)}throw fv()}function Lv(e){const t=[];for(let n=0;n<e.length;n++){let i=e.charCodeAt(n);i<=127?t.push(i):i<=2047?t.push(192|i>>6,128|63&i):55296==(64512&i)?n<e.length-1&&56320==(64512&e.charCodeAt(n+1))?(i=65536|(1023&i)<<10|1023&e.charCodeAt(++n),t.push(240|i>>18,128|i>>12&63,128|i>>6&63,128|63&i)):t.push(239,191,189):56320==(64512&i)?t.push(239,191,189):t.push(224|i>>12,128|i>>6&63,128|63&i)}return new Uint8Array(t)}function Mv(t,n){switch(t){case Rv:{const e=-1!==n.indexOf("-"),i=-1!==n.indexOf("_");if(e||i)throw mv(t,"Invalid character '"+(e?"-":"_")+"' found: is it base64url encoded?");break}case Pv:{const e=-1!==n.indexOf("+"),i=-1!==n.indexOf("/");if(e||i)throw mv(t,"Invalid character '"+(e?"+":"/")+"' found: is it base64 encoded?");n=n.replace(/-/g,"+").replace(/_/g,"/");break}}let i;try{i=
/**
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
 */
function(e){if("undefined"==typeof atob)throw new av(cv.UNSUPPORTED_ENVIRONMENT,"base-64 is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.");return atob(e)}(n)}catch(e){if(e.message.includes("polyfill"))throw e;throw mv(t,"Invalid character found")}const s=new Uint8Array(i.length);for(let e=0;e<i.length;e++)s[e]=i.charCodeAt(e);return s}class Uv{constructor(e){this.base64=!1,this.contentType=null;const t=e.match(/^data:([^,]+)?,/);if(null===t)throw mv(Dv,"Must be formatted 'data:[<mediatype>][;base64],<data>");const n=t[1]||null;var i,s;
/**
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
 */null!=n&&(this.base64=(s=";base64",(i=n).length>=7&&i.substring(i.length-7)===s),this.contentType=this.base64?n.substring(0,n.length-7):n),this.rest=e.substring(e.indexOf(",")+1)}}class Fv{constructor(e,t){let n=0,i="";Tv(e)?(this.data_=e,n=e.size,i=e.type):e instanceof ArrayBuffer?(t?this.data_=new Uint8Array(e):(this.data_=new Uint8Array(e.byteLength),this.data_.set(new Uint8Array(e))),n=this.data_.length):e instanceof Uint8Array&&(t?this.data_=e:(this.data_=new Uint8Array(e.length),this.data_.set(e)),n=e.length),this.size_=n,this.type_=i}size(){return this.size_}type(){return this.type_}slice(e,t){if(Tv(this.data_)){const r=(i=e,s=t,(n=this.data_).webkitSlice?n.webkitSlice(i,s):n.mozSlice?n.mozSlice(i,s):n.slice?n.slice(i,s):null);return null===r?null:new Fv(r)}{const n=new Uint8Array(this.data_.buffer,e,t-e);return new Fv(n,!0)}var n,i,s}static getBlob(...e){if(Iv()){const t=e.map(e=>e instanceof Fv?e.data_:e);return new Fv(Nv.apply(null,t))}{const t=e.map(e=>wv(e)?xv(Av,e).data:e.data_);let n=0;t.forEach(e=>{n+=e.byteLength});const i=new Uint8Array(n);let s=0;return t.forEach(e=>{for(let t=0;t<e.length;t++)i[s++]=e[t]}),new Fv(i,!0)}}uploadData(){return this.data_}}
/**
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
 */function Vv(t){let n;try{n=JSON.parse(t)}catch(e){return null}return function(e){return"object"==typeof e&&!Array.isArray(e)}(n)?n:null}
/**
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
 */function qv(e){const t=e.lastIndexOf("/",e.length-2);return-1===t?e:e.slice(t+1)}
/**
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
 */function jv(e,t){return t}class Bv{constructor(e,t,n,i){this.server=e,this.local=t||e,this.writable=!!n,this.xform=i||jv}}let zv=null;function $v(){if(zv)return zv;const e=[];e.push(new Bv("bucket")),e.push(new Bv("generation")),e.push(new Bv("metageneration")),e.push(new Bv("name","fullPath",!0));const t=new Bv("name");t.xform=function(e,t){return function(e){return!wv(e)||e.length<2?e:qv(e)}(t)},e.push(t);const n=new Bv("size");return n.xform=function(e,t){return void 0!==t?Number(t):t},e.push(n),e.push(new Bv("timeCreated")),e.push(new Bv("updated")),e.push(new Bv("md5Hash",null,!0)),e.push(new Bv("cacheControl",null,!0)),e.push(new Bv("contentDisposition",null,!0)),e.push(new Bv("contentEncoding",null,!0)),e.push(new Bv("contentLanguage",null,!0)),e.push(new Bv("contentType",null,!0)),e.push(new Bv("metadata","customMetadata",!0)),zv=e,zv}function Hv(e,t,n){const i=Vv(t);return null===i?null:function(e,t,n){const i={type:"file"},s=n.length;for(let r=0;r<s;r++){const e=n[r];i[e.local]=e.xform(i,t[e.server])}return function(e,t){Object.defineProperty(e,"ref",{get:function(){const n=e.bucket,i=e.fullPath,s=new yv(n,i);return t._makeStorageReference(s)}})}(i,e),i}(e,i,n)}class Wv{constructor(e,t,n,i){this.url=e,this.method=t,this.handler=n,this.timeout=i,this.urlParams={},this.headers={},this.body=null,this.errorHandler=null,this.progressCallback=null,this.successCodes=[200],this.additionalRetryCodes=[]}}
/**
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
 */function Kv(e){if(!e)throw fv()}function Gv(e){return function(t,n){let i;var s,r;return 401===t.getStatus()?i=t.getErrorText().includes("Firebase App Check token is invalid")?new av(cv.UNAUTHORIZED_APP,"This app does not have permission to access Firebase Storage on this project."):new av(cv.UNAUTHENTICATED,"User is not authenticated, please authenticate using Firebase Authentication and try again."):402===t.getStatus()?(r=e.bucket,i=new av(cv.QUOTA_EXCEEDED,"Quota for bucket '"+r+"' exceeded, please view quota on https://firebase.google.com/pricing/.")):403===t.getStatus()?(s=e.path,i=new av(cv.UNAUTHORIZED,"User does not have permission to access '"+s+"'.")):i=n,i.status=t.getStatus(),i.serverResponse=n.serverResponse,i}}class Qv{constructor(){this.sent_=!1,this.xhr_=new XMLHttpRequest,this.initXhr(),this.errorCode_=lv.NO_ERROR,this.sendPromise_=new Promise(e=>{this.xhr_.addEventListener("abort",()=>{this.errorCode_=lv.ABORT,e()}),this.xhr_.addEventListener("error",()=>{this.errorCode_=lv.NETWORK_ERROR,e()}),this.xhr_.addEventListener("load",()=>{e()})})}send(e,t,n,i,s){if(this.sent_)throw _v("cannot .send() more than once");if(w(e)&&n&&(this.xhr_.withCredentials=!0),this.sent_=!0,this.xhr_.open(t,e,!0),void 0!==s)for(const r in s)s.hasOwnProperty(r)&&this.xhr_.setRequestHeader(r,s[r].toString());return void 0!==i?this.xhr_.send(i):this.xhr_.send(),this.sendPromise_}getErrorCode(){if(!this.sent_)throw _v("cannot .getErrorCode() before sending");return this.errorCode_}getStatus(){if(!this.sent_)throw _v("cannot .getStatus() before sending");try{return this.xhr_.status}catch(e){return-1}}getResponse(){if(!this.sent_)throw _v("cannot .getResponse() before sending");return this.xhr_.response}getErrorText(){if(!this.sent_)throw _v("cannot .getErrorText() before sending");return this.xhr_.statusText}abort(){this.xhr_.abort()}getResponseHeader(e){return this.xhr_.getResponseHeader(e)}addUploadProgressListener(e){null!=this.xhr_.upload&&this.xhr_.upload.addEventListener("progress",e)}removeUploadProgressListener(e){null!=this.xhr_.upload&&this.xhr_.upload.removeEventListener("progress",e)}}class Yv extends Qv{initXhr(){this.xhr_.responseType="text"}}function Xv(){return new Yv}
/**
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
 */class Jv{constructor(e,t){this._service=e,this._location=t instanceof yv?t:yv.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new Jv(e,t)}get root(){const e=new yv(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return qv(this._location.path)}get storage(){return this._service}get parent(){const e=function(e){if(0===e.length)return null;const t=e.lastIndexOf("/");return-1===t?"":e.slice(0,t)}(this._location.path);if(null===e)return null;const t=new yv(this._location.bucket,e);return new Jv(this._service,t)}_throwIfRoot(e){if(""===this._location.path)throw function(e){return new av(cv.INVALID_ROOT_OPERATION,"The operation '"+e+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}(e)}}function Zv(e,t,n=Av,i){e._throwIfRoot("uploadString");const s=xv(n,t),r={...i};return null==r.contentType&&null!=s.contentType&&(r.contentType=s.contentType),function(e,t,n){e._throwIfRoot("uploadBytes");const i=function(e,t,n,i,s){const r=t.bucketOnlyServerUrl(),o={"X-Goog-Upload-Protocol":"multipart"},a=function(){let e="";for(let t=0;t<2;t++)e+=Math.random().toString().slice(2);return e}();o["Content-Type"]="multipart/related; boundary="+a;const c=function(e,t,n){const i=Object.assign({},n);return i.fullPath=e.path,i.size=t.size(),i.contentType||(i.contentType=function(e,t){return t&&t.type()||"application/octet-stream"}(0,t)),i}(t,i,s),h=function(e,t){const n={},i=t.length;for(let s=0;s<i;s++){const i=t[s];i.writable&&(n[i.server]=e[i.local])}return JSON.stringify(n)}(c,n),l="--"+a+"\r\nContent-Type: application/json; charset=utf-8\r\n\r\n"+h+"\r\n--"+a+"\r\nContent-Type: "+c.contentType+"\r\n\r\n",u="\r\n--"+a+"--",d=Fv.getBlob(l,i,u);if(null===d)throw new av(cv.CANNOT_SLICE_BLOB,"Cannot slice blob for upload. Please retry the upload.");const f={name:c.fullPath},p=bv(r,e.host,e._protocol),g=e.maxUploadRetryTime,m=new Wv(p,"POST",function(e,t){return function(n,i){const s=Hv(e,i,t);return Kv(null!==s),s}}(e,n),g);return m.urlParams=f,m.headers=o,m.body=d.uploadData(),m.errorHandler=Gv(t),m}(e.storage,e._location,$v(),new Fv(t,!0),n);return e.storage.makeRequestWithTokens(i,Xv).then(t=>({metadata:t,ref:e}))}(e,s.data,r)}function ew(e){e._throwIfRoot("getDownloadURL");const t=function(e,t,n){const i=bv(t.fullServerUrl(),e.host,e._protocol),s=e.maxOperationRetryTime,r=new Wv(i,"GET",function(e,t){return function(n,i){const s=Hv(e,i,t);return Kv(null!==s),function(e,t,n,i){const s=Vv(t);if(null===s)return null;if(!wv(s.downloadTokens))return null;const r=s.downloadTokens;if(0===r.length)return null;const o=encodeURIComponent;return r.split(",").map(t=>{const s=e.bucket,r=e.fullPath;return bv("/b/"+o(s)+"/o/"+o(r),n,i)+Cv({alt:"media",token:t})})[0]}(s,i,e.host,e._protocol)}}(e,n),s);return r.errorHandler=function(e){const t=Gv(e);return function(n,i){let s=t(n,i);var r;return 404===n.getStatus()&&(r=e.path,s=new av(cv.OBJECT_NOT_FOUND,"Object '"+r+"' does not exist.")),s.serverResponse=i.serverResponse,s}}(t),r}(e.storage,e._location,$v());return e.storage.makeRequestWithTokens(t,Xv).then(e=>{if(null===e)throw new av(cv.NO_DOWNLOAD_URL,"The given file does not have any download URLs.");return e})}function tw(e,t){if(e instanceof sw){const n=e;if(null==n._bucket)throw new av(cv.NO_DEFAULT_BUCKET,"No default bucket found. Did you set the '"+ov+"' property when initializing the app?");const i=new Jv(n,n._bucket);return null!=t?tw(i,t):i}return void 0!==t?function(e,t){const n=function(e,t){const n=t.split("/").filter(e=>e.length>0).join("/");return 0===e.length?n:e+"/"+n}(e._location.path,t),i=new yv(e._location.bucket,n);return new Jv(e.storage,i)}
/**
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
 */(e,t):e}function nw(e,t){if(t&&/^[A-Za-z]+:\/\//.test(t)){if(e instanceof sw)return new Jv(e,t);throw pv("To use ref(service, url), the first argument must be a Storage instance.")}return tw(e,t)}function iw(e,t){const n=null==t?void 0:t[ov];return null==n?null:yv.makeFromBucketSpec(n,e)}class sw{constructor(e,t,n,i,s,r=!1){this.app=e,this._authProvider=t,this._appCheckProvider=n,this._url=i,this._firebaseVersion=s,this._isUsingEmulator=r,this._bucket=null,this._host=rv,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=12e4,this._maxUploadRetryTime=6e5,this._requests=new Set,this._bucket=null!=i?yv.makeFromBucketSpec(i,this._host):iw(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,null!=this._url?this._bucket=yv.makeFromBucketSpec(this._url,e):this._bucket=iw(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){Ev("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){Ev("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(null!==t)return t.accessToken}return null}async _getAppCheckToken(){if(at(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Jv(this,e)}_makeRequest(e,t,n,i,s=!0){if(this._deleted)return new vv(gv());{const r=function(e,t,n,i,s,r,o=!0,a=!1){const c=Cv(e.urlParams),h=e.url+c,l=Object.assign({},e.headers);return function(e,t){t&&(e["X-Firebase-GMPID"]=t)}(l,t),function(e,t){null!==t&&t.length>0&&(e.Authorization="Firebase "+t)}(l,n),function(e,t){e["X-Firebase-Storage-Version"]="webjs/"+(null!=t?t:"AppManager")}(l,r),function(e,t){null!==t&&(e["X-Firebase-AppCheck"]=t)}(l,i),new Sv(h,e.method,l,e.body,e.successCodes,e.additionalRetryCodes,e.handler,e.errorHandler,e.timeout,e.progressCallback,s,o,a)}
/**
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
 */(e,this._appId,n,i,t,this._firebaseVersion,s,this._isUsingEmulator);return this._requests.add(r),r.getPromise().then(()=>this._requests.delete(r),()=>this._requests.delete(r)),r}}async makeRequestWithTokens(e,t){const[n,i]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,n,i).getPromise()}}const rw="@firebase/storage",ow="0.14.0",aw="storage";function cw(e,t,n,i){return Zv(e=Q(e),t,n,i)}function hw(e){return ew(e=Q(e))}function lw(e,t){return nw(e=Q(e),t)}function uw(e=dt(),t){const n=ot(e=Q(e),aw).getImmediate({identifier:t}),i=m("storage");return i&&function(e,t,n,i={}){!function(e,t,n,i={}){e.host=`${t}:${n}`;const s=w(t);s&&(T(`https://${e.host}/b`),C("Storage",!0)),e._isUsingEmulator=!0,e._protocol=s?"https":"http";const{mockUserToken:r}=i;r&&(e._overrideAuthToken="string"==typeof r?r:I(r,e.app.options.projectId))}(e,t,n,i)}(n,...i),n}rt(new Y(aw,function(e,{instanceIdentifier:t}){const n=e.getProvider("app").getImmediate(),i=e.getProvider("auth-internal"),s=e.getProvider("app-check-internal");return new sw(n,i,s,t,lt)},"PUBLIC").setMultipleInstances(!0)),ft(rw,ow,""),ft(rw,ow,"esm2020"),
/**
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
 */
ft("firebase","12.2.1","app");export{_g as A,wg as B,Ig as C,bg as D,C_ as E,Bg as F,A_ as G,Ug as H,xo as I,Lo as J,Oo as K,Mo as L,Uo as M,Fg as N,sv as O,Ja as T,jg as a,Lg as b,Ap as c,Rp as d,qg as e,tv as f,Mp as g,L_ as h,ut as i,W_ as j,$_ as k,H_ as l,by as m,z_ as n,j_ as o,Q_ as p,$o as q,Po as r,Hg as s,Vo as t,Vg as u,uw as v,lw as w,cw as x,hw as y,gg as z};
//# sourceMappingURL=chunk-CROz7lcG.js.map
