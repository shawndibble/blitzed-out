import{j as e,B as r,b as E,G as t,d as x,e as h,f as y,g as G,D as I,h as f,L as R,i as U}from"./mui-CFdxPsB0.js";import{u as F}from"./index-BoYCg6nK.js";import{u as M,a as V,N as W,A as q}from"./index-B4J9anXZ.js";import{u as z}from"./strings-BIn62cSG.js";import H from"./languages-KK0t13AM.js";import{a as n,u as J,k as Q}from"./vendor-Bf6wU4zJ.js";import X from"./index-D6ZNd2Py.js";import{u as Y,T as s}from"./translations-CairTNs2.js";import"./firebase-C4LKcFbe.js";function oe(){const{i18n:l,t:b}=Y(),{login:g,user:c}=F(),[N,i]=n.useState(!1),[C,u]=n.useState("login"),D=()=>{u("login"),i(!0)},L=()=>{u("register"),i(!0)},S=()=>{u("login"),i(!0)},k=J(),[v]=Q(),A=!!v.get("importBoard"),d=k.id??"PUBLIC",K=z(),w=M("sm"),[o,B]=n.useState((c==null?void 0:c.displayName)||""),[p,j]=V("gameSettings",{boardUpdated:!1,roomUpdated:!1,playerDialog:!0,othersDialog:!1,mySound:!0,chatSound:!0,hideBoardActions:!1,locale:"en",gameMode:"online",background:"color",finishRange:[30,70],roomTileCount:40,roomDice:"1d6"}),m=n.useCallback(async a=>{a.preventDefault(),await j({...p,displayName:o,room:d}),await g(o)},[o,g,d,p,j]),O=n.useCallback(async a=>{a.key==="Enter"&&await m(a)},[m]),T=n.useMemo(()=>Object.entries(H).map(([a,P])=>e.jsx(r,{onClick:()=>l.changeLanguage(a),disabled:l.resolvedLanguage===a,children:P.label},a)),[l]);return e.jsxs(e.Fragment,{children:[e.jsx(W,{room:d,playerList:K,onLinkAccount:S}),e.jsxs(E,{maxWidth:"sm",sx:{mt:8},children:[e.jsx(t,{container:!0,flexDirection:"column",children:e.jsx(x,{className:"unauthenticated-card",children:e.jsxs(h,{children:[e.jsx("h2",{className:"setup",children:e.jsx(s,{i18nKey:"setup"})}),e.jsxs(y,{component:"form",method:"post",onSubmit:m,className:"settings-box",children:[e.jsx(G,{fullWidth:!0,id:"displayName",label:b("displayName"),value:o,onChange:a=>B(a.target.value),required:!0,autoFocus:!0,onKeyDown:a=>O(a),margin:"normal"}),e.jsx(r,{variant:"contained",type:"submit",sx:{mr:1},fullWidth:!0,children:A?e.jsx(s,{i18nKey:"import"}):e.jsx(s,{i18nKey:"anonymousLogin"})}),e.jsx(I,{sx:{my:2},children:e.jsx(f,{variant:"body2",color:"text.secondary",children:e.jsx(s,{i18nKey:"or",children:"OR"})})}),e.jsxs(y,{sx:{display:"flex",justifyContent:"space-evenly"},children:[e.jsx(r,{variant:"outlined",startIcon:e.jsx(R,{}),onClick:D,sx:{mr:1},children:e.jsx(s,{i18nKey:"signIn"})}),e.jsx(r,{variant:"outlined",onClick:L,children:e.jsx(s,{i18nKey:"createAccount"})})]})]})]})})}),e.jsx(t,{container:!0,sx:{mt:1},children:e.jsx(t,{className:"language",children:e.jsx(x,{className:"unauthenticated-card",children:e.jsxs(h,{className:"translation-card-content",children:[!w&&e.jsx(U,{sx:{mr:1}}),e.jsxs(f,{sx:{mr:1},children:[e.jsx(s,{i18nKey:"language"}),":"]}),T]})})})}),e.jsx(t,{container:!0,sx:{mt:1},children:e.jsx(t,{className:"language",children:e.jsx(x,{className:"unauthenticated-card",children:e.jsx(h,{children:e.jsx(X,{})})})})})]}),e.jsx(q,{open:N,onClose:()=>i(!1),initialView:C})]})}export{oe as default};
