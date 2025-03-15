const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-C6riAZX4.js","assets/mui-BMKXmDCw.js","assets/vendor-Bf6wU4zJ.js","assets/strings-B4l6rhBW.js","assets/translations-CairTNs2.js","assets/index-BxY1z800.js","assets/firebase-C4LKcFbe.js","assets/index-BLb_hXVt.css","assets/index-DUM-WrH6.js","assets/index-BB-q-kK8.js","assets/urls-bwAPA7IR.js","assets/useActionList-5Plj0Nl1.js","assets/languages-KK0t13AM.js","assets/index-CignLajt.css","assets/index-TwxX51uR.js","assets/index-0XjfPz8-.css","assets/index-BNyHQfwg.js","assets/index-CdXxuvCK.js","assets/index-CyI790wY.js"])))=>i.map(i=>d[i]);
import{a as t,b as M,u as W}from"./vendor-Bf6wU4zJ.js";import{S as F,A as V,j as q,r as $,k as J,_ as A}from"./index-BxY1z800.js";import{E as H,a0 as U,j as e,k as _,a1 as Q,o as Y,q as X,p as Z,f,a2 as E,g as v,B as S,a3 as T,h as L,D as ee,a4 as se,a5 as te,a6 as ne,a7 as ae,a8 as oe,a9 as ie,aa as re,ab as le,ac as ce,ad as ue,ae as de,af as me,ag as ge,ah as xe,ai as he,aj as z,ak as fe,al as pe,l as G,am as je,an as Ce,w as ye,ao as be,ap as we,aq as Se,ar as P,as as ve,at as ke,au as Ae,av as Ie}from"./mui-BMKXmDCw.js";import{u as I,T as d}from"./translations-CairTNs2.js";import{i as Ee}from"./strings-B4l6rhBW.js";function O(s="sm"){const n=H();return U(n.breakpoints.down(s))}function Le(s,n){const i=localStorage.getItem(s);if(!i)return n;const a=JSON.parse(i);return typeof n=="object"&&Object.keys(n).length?{...n,...a}:a}function Ze(s,n={}){const i=`${s}Storage`,[a,o]=t.useState(()=>Le(s,n));t.useEffect(()=>{const l=m=>o(m.newValue);return window.addEventListener(i,l),()=>window.removeEventListener(i,l)},[i]);const r=t.useCallback(l=>{localStorage.setItem(s,JSON.stringify(l));const m=new Event(i);m.newValue=l,window.dispatchEvent(m)},[s,i]);return[a,r]}function _e(){const s=M.useContext(F);if(!s)throw new Error("ScheduleContext's value is undefined.");return s}const Te="/assets/blitzed-out-DGhYHOgx.png";function N(){const s=t.useContext(V);if(s===void 0)throw new Error("useAuth must be used within an AuthProvider");return s}function De({close:s}){return e.jsx(_,{"aria-label":"close",onClick:s,sx:{position:"absolute",right:8,top:8},children:e.jsx(Q,{})})}function K({children:s,open:n,close:i=null,isMobile:a=null,title:o=null,isLoading:r=!1}){const l=a||O();return r?null:e.jsxs(Y,{fullScreen:l,open:n,maxWidth:"md",children:[e.jsxs(X,{children:[o,typeof i=="function"&&e.jsx(De,{close:i})]}),e.jsx(Z,{children:s})]})}function Pe({onSuccess:s,onSwitchToRegister:n,onSwitchToForgotPassword:i,isLinking:a=!1}){const{t:o}=I(),[r,l]=t.useState(""),[m,c]=t.useState(""),[u,h]=t.useState(""),[g,C]=t.useState(!1),b=async j=>{j.preventDefault(),h(""),C(!0);try{await q(r,m),s&&s()}catch(y){console.error("Login error:",y),h(y.message||"Failed to sign in")}finally{C(!1)}};return e.jsxs(f,{component:"form",onSubmit:b,sx:{mt:1},children:[u&&e.jsx(E,{severity:"error",sx:{mb:2},children:u}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,id:"email",label:o("email"),name:"email",autoComplete:"email",autoFocus:!0,value:r,onChange:j=>l(j.target.value)}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,name:"password",label:o("password"),type:"password",id:"password",autoComplete:"current-password",value:m,onChange:j=>c(j.target.value)}),e.jsx(S,{type:"submit",fullWidth:!0,variant:"contained",sx:{mt:3,mb:2},disabled:g,children:g?e.jsx(T,{size:24}):a?e.jsx(d,{i18nKey:"linkAccount",children:"Link Account"}):e.jsx(d,{i18nKey:"signIn"})}),e.jsxs(L,{align:"center",children:[e.jsx(S,{onClick:n,variant:"text",children:e.jsx(d,{i18nKey:"needAccount"})})," | ",e.jsx(S,{onClick:i,variant:"text",children:e.jsx(d,{i18nKey:"forgotPassword"})})]})]})}function Oe({onSuccess:s,onSwitchToLogin:n,isAnonymous:i=!1}){const{t:a}=I(),[o,r]=t.useState(""),[l,m]=t.useState(""),[c,u]=t.useState(""),[h,g]=t.useState(""),[C,b]=t.useState(""),[j,y]=t.useState(!1),B=async p=>{if(p.preventDefault(),b(""),c!==h){b(a("passwordsDoNotMatch")||"Passwords do not match");return}y(!0);try{await $(l==null?void 0:l.trim(),c,o==null?void 0:o.trim()),s&&s()}catch(w){console.error("Registration error:",w),b(w.message||"Failed to create account")}finally{y(!1)}};return e.jsxs(f,{component:"form",onSubmit:B,sx:{mt:1},children:[C&&e.jsx(E,{severity:"error",sx:{mb:2},children:C}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,id:"displayName",label:a("displayName"),name:"displayName",autoComplete:"name",autoFocus:!0,value:o,onChange:p=>r(p.target.value)}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,id:"email",label:a("email"),name:"email",autoComplete:"email",value:l,onChange:p=>m(p.target.value)}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,name:"password",label:a("password"),type:"password",id:"password",autoComplete:"new-password",value:c,onChange:p=>u(p.target.value)}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,name:"confirmPassword",label:a("confirmPassword"),type:"password",id:"confirmPassword",autoComplete:"new-password",value:h,onChange:p=>g(p.target.value)}),e.jsx(S,{type:"submit",fullWidth:!0,variant:"contained",sx:{mt:3,mb:2},disabled:j,children:j?e.jsx(T,{size:24}):i?e.jsx(d,{i18nKey:"linkAccount"}):e.jsx(d,{i18nKey:"createAccount"})}),e.jsx(L,{align:"center",children:e.jsx(S,{onClick:n,variant:"text",children:e.jsx(d,{i18nKey:"alreadyHaveAccount"})})})]})}function Ne({onSuccess:s,isLinking:n=!1}){const[i,a]=t.useState(""),[o,r]=t.useState(!1),l=async()=>{a(""),r(!0);try{await J(),s&&s()}catch(m){a(m.message||"Failed to sign in with Google")}finally{r(!1)}};return e.jsxs(f,{sx:{mt:2,mb:2},children:[i&&e.jsx(E,{severity:"error",sx:{mb:2},children:i}),e.jsx(ee,{sx:{mb:2},children:e.jsx(L,{variant:"body2",color:"text.secondary",children:e.jsx(d,{i18nKey:"or",children:"OR"})})}),e.jsx(S,{fullWidth:!0,variant:"outlined",startIcon:e.jsx(se,{}),onClick:l,disabled:o,sx:{mb:1},"aria-busy":o,"aria-live":"polite",children:o?e.jsx(T,{size:24}):n?e.jsx(d,{i18nKey:"linkWithGoogle",children:"Link with Google"}):e.jsx(d,{i18nKey:"signInWithGoogle",children:"Sign in with Google"})})]})}function Be({onToggleForm:s}){const[n,i]=t.useState(""),[a,o]=t.useState(""),[r,l]=t.useState(!1),[m,c]=t.useState(!1),{forgotPassword:u}=N(),h=async g=>{g.preventDefault(),o(""),l(!1),c(!0);try{await u(n),l(!0)}catch(C){o(C.message||"Failed to send reset email")}finally{c(!1)}};return e.jsxs(f,{component:"form",onSubmit:h,sx:{mt:1},children:[a&&e.jsx(E,{severity:"error",sx:{mb:2},children:a}),r&&e.jsx(E,{severity:"success",sx:{mb:2},children:e.jsx(d,{i18nKey:"resetEmailSent"})}),e.jsx(v,{margin:"normal",required:!0,fullWidth:!0,id:"email",label:e.jsx(d,{i18nKey:"email"}),name:"email",autoComplete:"email",autoFocus:!0,value:n,onChange:g=>i(g.target.value)}),e.jsx(S,{type:"submit",fullWidth:!0,variant:"contained",sx:{mt:3,mb:2},disabled:m,children:m?e.jsx(T,{size:24}):e.jsx(d,{i18nKey:"sendResetLink"})}),e.jsx(f,{sx:{textAlign:"center"},children:e.jsx(S,{variant:"text",onClick:()=>s("login"),children:e.jsx(d,{i18nKey:"backToLogin"})})})]})}function We({open:s,close:n,initialView:i="login"}){const[a,o]=t.useState(i),{isAnonymous:r}=N(),{t:l}=I(),m=()=>{switch(a){case"login":return l(r?"linkAccount":"signIn");case"register":return l("createAccount");case"reset":return l("resetPassword");default:return l("Authentication")}};return e.jsxs(K,{title:m(),open:s,close:n,children:[a==="login"&&e.jsxs(e.Fragment,{children:[e.jsx(Pe,{onSwitchToRegister:()=>o("register"),onSwitchToForgotPassword:()=>o("reset"),onSuccess:n,isLinking:r}),e.jsx(Ne,{onSuccess:n,isLinking:r})]}),a==="reset"&&e.jsx(Be,{onToggleForm:o}),a==="register"&&e.jsx(Oe,{onSwitchToLogin:()=>o("login"),onSuccess:n,isAnonymous:r})]})}const ze=t.lazy(()=>A(()=>import("./index-C6riAZX4.js").then(s=>s.i),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]))),Ge=t.lazy(()=>A(()=>import("./index-TwxX51uR.js"),__vite__mapDeps([14,1,2,4,5,6,7,3,15]))),Ke=t.lazy(()=>A(()=>import("./index-BNyHQfwg.js"),__vite__mapDeps([16,1,2,8,5,6,4,7,9,3]))),Re=t.lazy(()=>A(()=>import("./index-CdXxuvCK.js"),__vite__mapDeps([17,1,2,9,4,5,6,7,10,3]))),Me=t.lazy(()=>A(()=>import("./index-CyI790wY.js"),__vite__mapDeps([18,1,2,11,8,5,6,4,7,9,3])));function Fe(){const{id:s}=W(),{user:n,logout:i,isAnonymous:a}=N(),o=O(),{i18n:r}=I(),[l,m]=t.useState(!1),c=x=>m(x),[u,h]=t.useState({settings:!1,gameBoard:!1,about:!1,schedule:!1,customTiles:!1,linkAccount:!1}),g=(x,k)=>h({...u,[x]:k}),C=async()=>{await i(),c(!1)},b=x=>window.open(x,"_blank","noreferrer"),j=e.jsx(me,{children:e.jsx("path",{d:"M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z"})}),y=x=>{r.changeLanguage(x),localStorage.setItem("gameSettings",JSON.stringify({...JSON.parse(localStorage.getItem("gameSettings")||"{}"),locale:x}))},p=t.useMemo(()=>{const x=[{key:"gameBoard",title:e.jsx(d,{i18nKey:"gameBoards"}),icon:e.jsx(ge,{}),onClick:()=>g("gameBoard",!0)},{key:"customTiles",title:e.jsx(d,{i18nKey:"customTilesLabel"}),icon:e.jsx(xe,{}),onClick:()=>g("customTiles",!0)},{key:"cast",title:e.jsx(d,{i18nKey:"cast"}),icon:e.jsx(he,{}),onClick:()=>b(`/${s.toUpperCase()}/cast`)},{key:"schedule",title:e.jsx(d,{i18nKey:"schedule"}),icon:e.jsx(z,{}),onClick:()=>g("schedule",!0)},{key:"discord",title:"Discord",icon:j,onClick:()=>b("https://discord.gg/mSPBE2hFef")},{key:"about",title:e.jsx(d,{i18nKey:"about"}),icon:e.jsx(fe,{}),onClick:()=>g("about",!0)}];return n&&(x.unshift({key:"settings",title:e.jsx(d,{i18nKey:"settings"}),icon:e.jsx(te,{}),onClick:()=>g("settings",!0)}),a&&x.push({key:"linkAccount",title:e.jsx(d,{i18nKey:"linkAccount"}),icon:e.jsx(ne,{}),onClick:()=>g("linkAccount",!0)}),x.push({key:"logout",title:e.jsx(d,{i18nKey:"logout"}),icon:e.jsx(ae,{}),onClick:()=>C()})),x},[n,s,a]).map(({key:x,title:k,icon:D,onClick:R})=>e.jsx(oe,{disablePadding:!0,onClick:R,children:e.jsxs(ie,{children:[e.jsx(re,{children:D}),e.jsx(le,{primary:k})]})},x)),w=(x,k,D={})=>e.jsx(t.Suspense,{fallback:e.jsx("div",{children:"Loading..."}),children:e.jsx(x,{open:u[k],close:()=>g(k,!1),isMobile:o,...D})});return e.jsxs(e.Fragment,{children:[e.jsx(_,{onClick:()=>c(!0),"aria-label":"open menu",children:e.jsx(ce,{})}),e.jsx(ue,{anchor:"right",open:l,onClose:()=>c(!1),children:e.jsxs(f,{role:"presentation",onClick:()=>c(!1),sx:{width:250,display:"flex",flexDirection:"column",height:"100%"},children:[e.jsx(de,{sx:{flexGrow:1},children:p}),e.jsxs(f,{sx:{borderTop:"1px solid rgba(0, 0, 0, 0.12)",p:2,display:"flex",justifyContent:"center",gap:1},children:[e.jsx(f,{component:"span",onClick:()=>y("en"),sx:{cursor:"pointer",fontWeight:r.language==="en"?"bold":"normal",color:r.language==="en"?"primary.main":"inherit"},children:"English"}),e.jsx(f,{component:"span",children:"|"}),e.jsx(f,{component:"span",onClick:()=>y("fr"),sx:{cursor:"pointer",fontWeight:r.language==="fr"?"bold":"normal",color:r.language==="fr"?"primary.main":"inherit"},children:"Français"}),e.jsx(f,{component:"span",children:"|"}),e.jsx(f,{component:"span",onClick:()=>y("es"),sx:{cursor:"pointer",fontWeight:r.language==="es"?"bold":"normal",color:r.language==="es"?"primary.main":"inherit"},children:"Español"})]})]})}),u.settings&&w(ze,"settings"),u.about&&e.jsx(t.Suspense,{fallback:e.jsx("div",{children:"Loading..."}),children:e.jsx(K,{open:u.about,close:()=>g("about",!1),fullScreen:o,children:e.jsx(Ge,{close:()=>g("about",!1),isMobile:o})})}),u.gameBoard&&w(Ke,"gameBoard"),u.schedule&&w(Re,"schedule"),u.customTiles&&w(Me,"customTiles"),u.linkAccount&&w(We,"linkAccount")]})}function Ve({playerList:s,innerRef:n,...i}){return e.jsxs("div",{...i,ref:n,children:[e.jsx(pe,{color:"success",sx:{fontSize:8,marginRight:"0.2rem"}}),s.length]})}function qe(){const[s,n]=t.useState(!1),[i,a]=t.useState(!1),{t:o}=I(),{id:r}=W(),l="CC1AD845";t.useEffect(()=>{const c=()=>{const u=cast.framework.CastContext.getInstance();u.setOptions({receiverApplicationId:l,autoJoinPolicy:chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED}),u.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED,h=>{switch(h.castState){case cast.framework.CastState.NO_DEVICES_AVAILABLE:n(!1),a(!1);break;case cast.framework.CastState.NOT_CONNECTED:n(!0),a(!1);break;case cast.framework.CastState.CONNECTED:n(!0),a(!0);break}})};window.cast&&window.chrome&&(window.cast.framework?c():window.__onGCastApiAvailable=u=>{u&&c()})},[]);const m=()=>{if(r)if(i){const c=cast.framework.CastContext.getInstance().getCurrentSession();c&&c.endSession(!0)}else{const c=cast.framework.CastContext.getInstance().getCurrentSession();if(c){const h={type:"LOAD",url:`${window.location.origin}/${r}/cast`};c.sendMessage("urn:x-cast:com.blitzedout.cast",h)}else cast.framework.CastContext.getInstance().requestSession()}};return s?e.jsx(G,{title:o(i?"stopCasting":"startCasting"),children:e.jsx(_,{color:"inherit",onClick:m,"aria-label":o(i?"stopCasting":"startCasting"),children:i?e.jsx(je,{}):e.jsx(Ce,{})})}):null}const $e=t.lazy(()=>A(()=>import("./index-CdXxuvCK.js"),__vite__mapDeps([17,1,2,9,4,5,6,7,10,3])));function es({room:s,playerList:n=[]}){const{t:i}=I(),[a,o]=t.useState(!1),[r,l]=t.useState(!1),{schedule:m}=_e(),{isMobile:c}=O(),u=()=>{o(!0),l(!0)},h=e.jsxs(e.Fragment,{children:[e.jsx(L,{variant:"h6",children:e.jsx(d,{i18nKey:"online"})}),e.jsx("ul",{children:n.map(g=>e.jsx("li",{children:e.jsx(L,{variant:"body1",children:g.displayName})},g.uid))})]});return e.jsx(ye,{position:"fixed",children:e.jsxs(be,{disableGutters:!0,variant:"dense",component:"nav",className:"nav",children:[e.jsxs("div",{className:"site-name",children:[e.jsx(f,{component:"img",sx:{height:32},alt:"Blitzed Out Logo",src:Te}),e.jsx("h1",{children:"Blitzed Out"})]}),e.jsx("div",{children:e.jsxs("div",{className:"nav-room-name",children:[e.jsx("h2",{children:Ee(s)||s===void 0?i("public"):s}),e.jsx(G,{title:h,children:e.jsx(Je,{playerList:n})}),e.jsx(_,{onClick:u,"aria-label":"schedule game",sx:{ml:2},children:e.jsx(we,{color:"primary",badgeContent:r?null:m.length,children:e.jsx(z,{})})}),a&&e.jsx(Se,{children:e.jsx(t.Suspense,{fallback:e.jsx("div",{children:"Loading..."}),children:e.jsx($e,{open:a,close:()=>o(!1),isMobile:c})})})]})}),e.jsxs("div",{className:"menu-drawer",children:[e.jsx(qe,{}),e.jsx(Fe,{})]})]})})}const Je=t.forwardRef((s,n)=>e.jsx(Ve,{...s,innerRef:n})),ss=P(s=>e.jsx(ve,{disableGutters:!0,elevation:0,square:!0,...s}))(({theme:s})=>({border:`1px solid ${s.palette.divider}`,"&:not(:last-child)":{borderBottom:0},"&:before":{display:"none"}})),ts=P(s=>e.jsx(ke,{expandIcon:e.jsx(Ae,{sx:{fontSize:"0.9rem"}}),...s}))(({theme:s})=>({backgroundColor:s.palette.mode==="dark"?"rgba(255, 255, 255, .05)":"rgba(0, 0, 0, .03)",flexDirection:"row-reverse","& .MuiAccordionSummary-expandIconWrapper.Mui-expanded":{transform:"rotate(90deg)"},"& .MuiAccordionSummary-content":{marginLeft:s.spacing(1)}})),ns=P(Ie)(({theme:s})=>({padding:s.spacing(2),borderTop:"1px solid rgba(0, 0, 0, .125)"}));export{We as A,De as C,es as N,Ze as a,ss as b,ts as c,ns as d,_e as e,O as u};
