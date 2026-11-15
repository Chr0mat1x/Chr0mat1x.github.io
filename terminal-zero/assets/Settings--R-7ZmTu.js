import{c as s,u as r,r as c,j as e}from"./index-Dp6iFKuQ.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=s("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=s("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=s("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=s("Volume2",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=s("VolumeX",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["line",{x1:"22",x2:"16",y1:"9",y2:"15",key:"1ewh16"}],["line",{x1:"16",x2:"22",y1:"9",y2:"15",key:"5ykzw1"}]]),l="terminal-zero:sound";function u(){const t=r(),[i,n]=c.useState(()=>{try{return localStorage.getItem(l)!=="off"}catch{return!0}}),d=()=>{const a=!i;n(a);try{localStorage.setItem(l,a?"on":"off")}catch{}};return e.jsx("div",{className:"app-root",children:e.jsxs("div",{className:"app-content",children:[e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{children:[e.jsx("label",{children:"Звуковые эффекты"}),e.jsx("div",{className:"desc",children:"тихие системные сигналы: уведомления, оповещения, ввод"})]}),e.jsx("button",{className:"wm-btn",onClick:d,title:"переключить звук",style:{border:"1px solid var(--border)",width:34,height:34},children:i?e.jsx(j,{size:16}):e.jsx(v,{size:16})})]}),e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{children:[e.jsx("label",{children:"Автосохранение"}),e.jsx("div",{className:"desc",children:"прогресс сохраняется после каждого действия автоматически"})]}),e.jsx(h,{size:14,className:"ok"})]}),e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{children:[e.jsx("label",{children:"Ручное сохранение"}),e.jsx("div",{className:"desc",children:"сохранить текущий прогресс прямо сейчас"})]}),e.jsx("button",{className:"wm-btn",onClick:()=>t.manualSave(),style:{border:"1px solid var(--border)",width:34,height:34},children:e.jsx(x,{size:14})})]}),e.jsxs("div",{className:"settings-row",children:[e.jsxs("div",{children:[e.jsx("label",{children:"Обучение"}),e.jsx("div",{className:"desc",children:"показать вводные карточки: интерфейс, команды, где искать файлы"})]}),e.jsx("button",{className:"wm-btn",onClick:()=>t.openTutorial(),title:"показать обучение",style:{border:"1px solid var(--border)",width:34,height:34},children:e.jsx(o,{size:15})})]}),e.jsxs("div",{style:{marginTop:18,color:"var(--text-faint)",fontSize:11,lineHeight:1.8},children:["TERMINAL ZERO v1.0",e.jsx("br",{}),"Все игровые данные хранятся локально в вашем браузере.",e.jsx("br",{}),"Ничего не отправляется в сеть. Одиночная кампания."]})]})})}export{u as Settings};
