import{j as e,f as g,h as m,B as f,ay as F,l as E,az as P,aA as T,aB as W,aC as G,R as B,aD as V,ab as U,aE as Y,aF as z,U as q,V as H,a2 as $,aG as X,aH as _,aI as J,D as Q,o as Z,q as D,p as ee}from"./mui-tA4JU52E.js";import{u as ne,C as se}from"./index-BN0F8ja_.js";import{r as b,u as te,k as ie}from"./vendor-poSPCy8P.js";import{b as re,R as le,Y as k,S as oe,I as A,c as M,d as ce,G as ae}from"./index-DY_NMGpq.js";import{i as C,d as S}from"./strings-estwTbV4.js";import{T as a,t as I}from"./translations-C_O5cPfK.js";import{u as de,a as ue}from"./useActionList-DiR86A_u.js";import"./index-BBTQNlID.js";import"./firebase-Bq5WjqAs.js";import"./index-EIdLQve3.js";import"./index-BMFOtw6J.js";import"./urls-BP4ggioV.js";function v({children:n,justifyContent:s="space-evenly"}){return e.jsx(g,{sx:{mt:3,display:"flex",flexDirection:"row",justifyContent:s,alignItems:"center"},children:n})}function xe({formData:n,setFormData:s,nextStep:r}){const i=re();function t(){i(n.room),r(C(n.room)?2:1)}return e.jsxs(g,{sx:{m:1},children:[e.jsx(m,{variant:"h6",children:e.jsx(a,{i18nKey:"publicOrPrivate"})}),e.jsx(g,{sx:{margin:"0.5rem"},children:e.jsx(le,{formData:n,setFormData:s})}),e.jsx(v,{children:e.jsx(f,{variant:"contained",onClick:t,children:e.jsx(a,{i18nKey:C(n.room)?"nextSkip":"next"})})})]})}function he({formData:n,setFormData:s,nextStep:r,prevStep:i}){const[t,o]=b.useState(!S(n==null?void 0:n.gameMode));return b.useEffect(()=>{o(!S(n==null?void 0:n.gameMode))},[n==null?void 0:n.gameMode]),e.jsxs(g,{sx:{minHeight:"200px",display:"flex",flexDirection:"column"},children:[e.jsx(m,{variant:"h6",children:e.jsx(a,{i18nKey:"playingWithPeople"})}),e.jsx(k,{trueCondition:!S(n==null?void 0:n.gameMode),onChange:l=>s({...n,gameMode:l.target.checked?"local":"online",roomRealtime:!l.target.checked}),yesLabel:"yesInteracting"}),e.jsx(F,{in:t,timeout:500,sx:{mt:t?2:0},children:e.jsxs(g,{children:[e.jsx(m,{variant:"h6",children:e.jsx(a,{i18nKey:"yourRole"})}),e.jsx(g,{sx:{display:"flex",justifyContent:"center"},children:e.jsx(oe,{value:n.role,onChange:l=>s({...n,role:l.target.value}),label:"mainRole",options:["dom","vers","sub"],defaultValue:"sub",fullWidth:!1})}),e.jsx(m,{variant:"h6",sx:{mt:1},children:e.jsx(a,{i18nKey:"areYouNaked"})}),e.jsx(m,{variant:"body2",sx:{mt:1},children:e.jsx(a,{i18nKey:"nakedDisclaimer"})}),e.jsx(k,{onChange:l=>s({...n,isNaked:l.target.checked}),trueCondition:n.isNaked,yesLabel:"yesNaked"})]})}),e.jsx(g,{sx:{flexGrow:1}}),e.jsxs(v,{children:[e.jsx(f,{onClick:i,children:e.jsx(a,{i18nKey:"previous"})}),e.jsx(f,{variant:"contained",onClick:r,children:e.jsx(a,{i18nKey:"next"})})]})]})}function R(){return e.jsxs(m,{variant:"h6",sx:{mt:2},children:[e.jsx(a,{i18nKey:"setIntensityLevel"}),e.jsx(E,{title:e.jsx(m,{variant:"body1",children:e.jsx(a,{i18nKey:"intensityTooltip"})}),arrow:!0,sx:{ml:1},children:e.jsx(P,{sx:{ml:.5,fontSize:15}})})]})}const je=(n,s)=>{const{gameMode:r,isNaked:i}=n,t=S(r);return t&&["foreplay","sex"].includes(s.type)||!t&&i&&["solo","foreplay"].includes(s.type)||!t&&!i&&["solo","sex"].includes(s.type)},pe=n=>Object.entries(n).reduce((s,[r,i])=>(je(n,i)||(s[r]=i),s),{}),L=(n,s,r)=>Object.entries(n).map(([i,t])=>{const o=s.find(l=>l.value===i);return t.type!==r||!o?null:i}).filter(i=>!!i),ge=(n,s,r)=>{const i={...n};return Object.keys(i).forEach(t=>{i[t].type===s&&!r.includes(t)&&delete i[t]}),i},w=(n,s,r)=>{r(i=>{const t=ge(i,s,n);return n.forEach(o=>{if(t[o])return;let l={type:s,level:1};s==="consumption"&&(l={...l,variation:t.isAppend?"appendMost":"standalone"}),t[o]=l}),t})},N=(n,s,r,i,t,o=null)=>{var d;const l=(d=n==null?void 0:n.target)==null?void 0:d.value;if(l===0)return t(c=>c.filter(u=>u!==s)),i(c=>{const u={...c};return delete u[s],u});i(c=>({...c,[s]:{...c[s]||{},type:r,level:l,...!!o&&{variation:o}}}))};function O({onChange:n,values:s,options:r,label:i}){function t(o){var l;return(l=r==null?void 0:r.find(d=>d.value===o))==null?void 0:l.label}return e.jsxs(T,{fullWidth:!0,children:[e.jsx(W,{id:`${i}-label`,children:i}),e.jsx(G,{labelId:`${i}-label`,id:`${i}`,multiple:!0,value:s,onChange:n,fullWidth:!0,input:e.jsx(z,{label:e.jsx(a,{i18nKey:"actionsLabel"})}),renderValue:o=>e.jsx(g,{sx:{display:"flex",flexWrap:"wrap",gap:.5},children:o==null?void 0:o.map(l=>e.jsx(Y,{label:t(l)},l))}),children:r==null?void 0:r.map(({label:o,value:l})=>e.jsxs(B,{value:l,children:[e.jsx(V,{checked:s.includes(l)}),e.jsx(U,{primary:o})]},l))})]})}const me=2;function ye({formData:n,setFormData:s,options:r,actionsList:i}){const t="consumption",o=r(t),l=L(n,o,t),[d,c]=b.useState(l),u=x=>{const{value:j}=x.target,p=typeof j=="string"?j.split(","):j;p.length<=me&&(c(p),w(p,t,s))},h=(x,j)=>{const p=j.reduce((y,K)=>(y[K]={...y[K]||{},type:t,variation:x.target.checked?"appendMost":"standalone"},y),{...n,isAppend:x.target.checked});s(p)};return e.jsxs(e.Fragment,{children:[e.jsx(m,{variant:"h6",sx:{my:2},children:e.jsx(a,{i18nKey:"pickConsumptions"})}),e.jsx(O,{onChange:u,values:d,options:o,label:I("consumables")}),!!d.length&&e.jsxs(e.Fragment,{children:[e.jsx(R,{}),d.map(x=>e.jsx(A,{actionsFolder:i,settings:n,option:x,initValue:1,onChange:j=>N(j,x,t,s,c,n.isAppend?"appendMost":"standalone")},x)),e.jsx(m,{variant:"h6",sx:{mt:2},children:e.jsx(a,{i18nKey:"standaloneOrCombine"})}),e.jsx(k,{trueCondition:n.isAppend,onChange:x=>h(x,d),yesLabel:"combineWithActions"})]})]})}const be=4,fe=n=>S(n==null?void 0:n.gameMode)?"solo":n.isNaked?"sex":"foreplay";function Se({formData:n,setFormData:s,options:r,actionsList:i}){const t=fe(n),o=r(t),l=L(n,o,t),[d,c]=b.useState(l||[]),u=h=>{const{value:x}=h.target,j=typeof x=="string"?x.split(","):x;j.length<=be&&(c(j),w(j,t,s))};return e.jsxs(e.Fragment,{children:[e.jsx(m,{variant:"h6",sx:{my:2},children:e.jsx(a,{i18nKey:"pickActions"})}),e.jsx(O,{onChange:u,values:d,options:o,label:I("actionsLabel")}),!!d.length&&e.jsxs(e.Fragment,{children:[e.jsx(R,{}),d.map(h=>e.jsx(A,{actionsFolder:i,settings:n,option:h,initValue:1,onChange:x=>N(x,h,t,s,c)},h))]})]})}function Ce({formData:n,setFormData:s,nextStep:r,prevStep:i,actionsList:t}){function o(c){return Object.keys(t).filter(u=>{var h;return((h=t[u])==null?void 0:h.type)===c})}b.useEffect(()=>{const c=pe(n);s(c)},[]);const l=c=>o(c).map(u=>{var h;return{value:u,label:(h=t[u])==null?void 0:h.label}}),d=!Object.keys(n).some(c=>n[c].level>0&&n[c].variation!=="appendMost");return e.jsxs(g,{children:[e.jsx(m,{variant:"body1",sx:{my:2},children:e.jsx(a,{i18nKey:"actionsDisclaimer"})}),e.jsx(Se,{formData:n,setFormData:s,options:l,actionsList:t}),e.jsx(ye,{formData:n,setFormData:s,options:l,actionsList:t}),e.jsxs(v,{children:[e.jsx(f,{onClick:()=>i(C(n.room)?2:1),children:e.jsx(a,{i18nKey:"previous"})}),e.jsx(f,{variant:"contained",disabled:d,onClick:r,children:e.jsx(a,{i18nKey:"next"})})]})]})}function ve({formData:n,setFormData:s,prevStep:r,actionsList:i,close:t}){const o=[100,100],l=[0,0],[d,c]=b.useState(M((n==null?void 0:n.finishRange)||[],l)),[u,h]=b.useState(!1),x=ce();function j(y){s({...n,finishRange:y.target.checked?l:o}),c(y.target.checked)}b.useEffect(()=>{let y={...n,boardUpdated:!0};(!d||!M(n.finishRange||[],o))&&(y.finishRange=o),s(y)},[]);async function p(){h(!0);try{await x(n,i)}catch(y){console.error("Error submitting settings:",y)}finally{h(!1)}typeof t=="function"&&t()}return e.jsxs(g,{children:[e.jsx(m,{variant:"h6",sx:{my:2},children:e.jsx(a,{i18nKey:"WillYouOrgasm"})}),e.jsx(m,{variant:"body2",children:e.jsx(a,{i18nKey:"orgasmDisclaimer"})}),e.jsx(g,{sx:{display:"flex",justifyContent:"center",my:1},children:e.jsx(q,{control:e.jsx(H,{checked:d,onChange:j}),label:e.jsx(a,{i18nKey:"yesOrgasm"})})}),e.jsxs(v,{children:[e.jsx(f,{onClick:r,disabled:u,children:e.jsx(a,{i18nKey:"previous"})}),e.jsx(f,{variant:"contained",onClick:p,disabled:u,startIcon:u?e.jsx($,{size:20,color:"inherit"}):null,children:e.jsx(a,{i18nKey:"buildGame"})})]})]})}function ke({close:n}){const{id:s}=te(),[r,i]=b.useState(1),t={room:s};C(s)&&(t.gameMode="online",t.roomRealtime=!0);const[o,l]=de({gameMode:"online",roomRealtime:!0,actions:[],consumption:[],role:"sub",boardUpdated:!1,room:s||"PUBLIC"},t),d=b.useRef(!0),{actionsList:c}=ue(o.gameMode);b.useEffect(()=>{if(d.current){if(d.current=!1,o.advancedSettings){x();return}if(typeof n=="function"){if(C(s)){i(3);return}i(2)}}},[o]);const u=p=>{if(!Number.isInteger(p))return i(r+1);i(r+(p||1))},h=p=>{if(!Number.isInteger(p))return i(r-1);i(r-(p||1))},x=()=>i(0),j=()=>{switch(r){case 1:return e.jsx(xe,{formData:o,setFormData:l,nextStep:u});case 2:return e.jsx(he,{formData:o,setFormData:l,nextStep:u,prevStep:h});case 3:return e.jsx(Ce,{formData:o,setFormData:l,nextStep:u,prevStep:h,actionsList:c});case 4:return e.jsx(ve,{formData:o,setFormData:l,prevStep:h,actionsList:c,close:n});default:return null}};return r===0?e.jsx(ae,{closeDialog:n}):e.jsxs(g,{children:[e.jsx(g,{sx:{width:"100%",mt:2,mb:4},children:e.jsx(X,{activeStep:r-1,alternativeLabel:!0,children:[1,2,3,4].map(p=>e.jsx(_,{children:e.jsx(J,{})},p))})}),j(),e.jsx(Q,{sx:{mt:3}}),e.jsx(f,{onClick:x,children:e.jsx(a,{i18nKey:"advancedSetup"})})]})}function Te({open:n,close:s}){const r=ne(),[i]=ie();return i.get("importBoard")?null:e.jsxs(Z,{fullScreen:r,open:n,maxWidth:"md",children:[e.jsxs(D,{children:[e.jsx(a,{i18nKey:"gameSettings"}),typeof s=="function"&&e.jsx(se,{close:s})]}),e.jsx(ee,{children:e.jsx(ke,{close:typeof s=="function"?s:void 0})})]})}export{Te as default};
