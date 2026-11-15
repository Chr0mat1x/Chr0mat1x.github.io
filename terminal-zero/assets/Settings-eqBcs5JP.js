import{c as a,u as h,r as d,h as x,m as j,j as s,V as m,i as p,k as v,s as b,l as u}from"./index-PgwJy6VI.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=a("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=a("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=a("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=a("ZapOff",[["path",{d:"M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317",key:"193nxd"}],["path",{d:"M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773",key:"27a7lr"}],["path",{d:"M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643",key:"1e0qe9"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=a("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);function f(){const t=h(),[i,n]=d.useState(x),[l,o]=d.useState(j),r=()=>{const e=!i;n(e),v(e),e&&b.message()},c=()=>{const e=!l;o(e),u(e)};return s.jsx("div",{className:"app-root",children:s.jsxs("div",{className:"app-content",children:[s.jsxs("div",{className:"settings-row",children:[s.jsxs("div",{children:[s.jsx("label",{children:"Звуковые эффекты"}),s.jsx("div",{className:"desc",children:"тихие системные сигналы: уведомления, оповещения, ввод"})]}),s.jsx("button",{className:"wm-btn",onClick:r,title:"переключить звук",style:{border:"1px solid var(--border)",width:34,height:34},children:i?s.jsx(m,{size:16}):s.jsx(p,{size:16})})]}),s.jsxs("div",{className:"settings-row",children:[s.jsxs("div",{children:[s.jsx("label",{children:"Анимации интерфейса"}),s.jsx("div",{className:"desc",children:"появление окон, мигание курсора, плавные переходы"})]}),s.jsx("button",{className:"wm-btn",onClick:c,title:"переключить анимации",style:{border:"1px solid var(--border)",width:34,height:34},children:l?s.jsx(M,{size:15}):s.jsx(N,{size:15})})]}),s.jsxs("div",{className:"settings-row",children:[s.jsxs("div",{children:[s.jsx("label",{children:"Автосохранение"}),s.jsx("div",{className:"desc",children:"прогресс сохраняется после каждого действия автоматически"})]}),s.jsx(k,{size:14,className:"ok"})]}),s.jsxs("div",{className:"settings-row",children:[s.jsxs("div",{children:[s.jsx("label",{children:"Ручное сохранение"}),s.jsx("div",{className:"desc",children:"сохранить текущий прогресс прямо сейчас"})]}),s.jsx("button",{className:"wm-btn",onClick:()=>t.manualSave(),style:{border:"1px solid var(--border)",width:34,height:34},children:s.jsx(g,{size:14})})]}),s.jsxs("div",{className:"settings-row",children:[s.jsxs("div",{children:[s.jsx("label",{children:"Обучение"}),s.jsx("div",{className:"desc",children:"показать вводные карточки: интерфейс, команды, где искать файлы"})]}),s.jsx("button",{className:"wm-btn",onClick:()=>t.openTutorial(),title:"показать обучение",style:{border:"1px solid var(--border)",width:34,height:34},children:s.jsx(y,{size:15})})]}),s.jsxs("div",{style:{marginTop:18,color:"var(--text-faint)",fontSize:11,lineHeight:1.8},children:["TERMINAL ZERO v1.0",s.jsx("br",{}),"Все игровые данные хранятся локально в вашем браузере.",s.jsx("br",{}),"Ничего не отправляется в сеть. Одиночная кампания."]})]})})}export{f as Settings};
