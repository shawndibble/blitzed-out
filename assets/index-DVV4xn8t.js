import{j as e,B as r,b as P,G as t,d as m,e as x,f as y,g as E,D as G,h as f,L as I,i as R}from"./mui-7PmIKoQ0.js";import{u as U,l as F}from"./index-BPTilIU-.js";import{u as M,a as V,N as W,A as q}from"./index-C880uJyK.js";import{u as z}from"./strings-J-FU9DP5.js";import{r as n,u as H,k as J}from"./vendor-poSPCy8P.js";import Q from"./index-__RSncQ6.js";import{u as X,T as s}from"./translations-C_O5cPfK.js";import"./firebase-Bq5WjqAs.js";function te(){const{i18n:l,t:b}=X(),{login:h,user:c}=U(),[N,u]=n.useState(!1),[D,g]=n.useState("login"),C=()=>{g("login"),u(!0)},L=()=>{g("register"),u(!0)},S=H(),[v]=J(),K=!!v.get("importBoard"),i=S.id??"PUBLIC",k=z(),A=M("sm"),[o,w]=n.useState((c==null?void 0:c.displayName)||""),[p,j]=V("gameSettings",{boardUpdated:!1,roomUpdated:!1,playerDialog:!0,othersDialog:!1,mySound:!0,chatSound:!0,hideBoardActions:!1,locale:"en",gameMode:"online",background:"color",finishRange:[30,70],roomTileCount:40,roomDice:"1d6",room:i}),d=n.useCallback(async a=>{a.preventDefault(),await j({...p,displayName:o,room:i}),await h(o)},[o,h,i,p,j]),B=n.useCallback(async a=>{a.key==="Enter"&&await d(a)},[d]),O=n.useMemo(()=>Object.entries(F).map(([a,T])=>e.jsx(r,{onClick:()=>l.changeLanguage(a),disabled:l.resolvedLanguage===a,children:T.label},a)),[l]);return e.jsxs(e.Fragment,{children:[e.jsx(W,{room:i,playerList:k}),e.jsxs(P,{maxWidth:"sm",sx:{mt:8},children:[e.jsx(t,{container:!0,flexDirection:"column",children:e.jsx(m,{className:"unauthenticated-card",children:e.jsxs(x,{children:[e.jsx("h2",{className:"setup",children:e.jsx(s,{i18nKey:"setup"})}),e.jsxs(y,{component:"form",method:"post",onSubmit:d,className:"settings-box",children:[e.jsx(E,{fullWidth:!0,id:"displayName",label:b("displayName"),value:o,onChange:a=>w(a.target.value),required:!0,autoFocus:!0,onKeyDown:a=>B(a),margin:"normal"}),e.jsx(r,{variant:"contained",type:"submit",sx:{mr:1},fullWidth:!0,children:K?e.jsx(s,{i18nKey:"import"}):e.jsx(s,{i18nKey:"anonymousLogin"})}),e.jsx(G,{sx:{my:2},children:e.jsx(f,{variant:"body2",color:"text.secondary",children:e.jsx(s,{i18nKey:"or",children:"OR"})})}),e.jsxs(y,{sx:{display:"flex",justifyContent:"space-evenly"},children:[e.jsx(r,{variant:"outlined",startIcon:e.jsx(I,{}),onClick:C,sx:{mr:1},children:e.jsx(s,{i18nKey:"signIn"})}),e.jsx(r,{variant:"outlined",onClick:L,children:e.jsx(s,{i18nKey:"createAccount"})})]})]})]})})}),e.jsx(t,{container:!0,sx:{mt:1},children:e.jsx(t,{className:"language",children:e.jsx(m,{className:"unauthenticated-card",children:e.jsxs(x,{className:"translation-card-content",children:[!A&&e.jsx(R,{sx:{mr:1}}),e.jsxs(f,{sx:{mr:1},children:[e.jsx(s,{i18nKey:"language"}),":"]}),O]})})})}),e.jsx(t,{container:!0,sx:{mt:1},children:e.jsx(t,{className:"language",children:e.jsx(m,{className:"unauthenticated-card",children:e.jsx(x,{children:e.jsx(Q,{})})})})})]}),e.jsx(q,{open:N,close:()=>u(!1),initialView:D})]})}export{te as default};
