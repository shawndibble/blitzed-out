function n(e){const t=e==null?void 0:e.split(".");return!t||(t==null?void 0:t.length)<2?!1:t==null?void 0:t[t.length-1]}function o(e){const t=n(e);return["mp4","webm","mkv","flv","avi","mov","wmv","mpg","mv4"].includes(t)}function u(e){return e?e!=null&&e.startsWith("http")?e:o(e)?`/videos/${e}`:`/images/${e}`:!1}function c(e){return new URL(e).hostname.replace("www.","").replace(".com","").replace(".net","").replace(".gg","")}function r(e){return/^https?:\/\/.+\/.+$/.test(e)}export{c as a,u as g,r as i};
