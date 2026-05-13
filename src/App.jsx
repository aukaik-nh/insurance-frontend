import { useState, useEffect, useRef } from "react"
import api from "./api"


/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --w:240px;
  --bg:#F1F5F9;
  --sur:#fff;
  --sur2:#F8FAFC;
  --brd:#E2E8F0;
  --brd2:#CBD5E1;
  --blue:#2563EB;
  --blue-h:#1D4ED8;
  --blue-bg:#EFF6FF;
  --blue-mid:#BFDBFE;
  --green:#059669;
  --green-bg:#F0FDF4;
  --green-brd:#BBF7D0;
  --amber:#B45309;
  --amber-bg:#FFFBEB;
  --amber-brd:#FDE68A;
  --red:#DC2626;
  --red-bg:#FEF2F2;
  --red-brd:#FECACA;
  --t1:#111827;
  --t2:#4B5563;
  --t3:#9CA3AF;
  --sh0:0 1px 2px rgba(0,0,0,.05);
  --sh1:0 1px 3px rgba(0,0,0,.10),0 1px 2px rgba(0,0,0,.06);
  --sh2:0 4px 6px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.05);
  --sh3:0 20px 40px rgba(0,0,0,.18);
}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--t1);-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}

/* ── LAYOUT ── */
.app{display:flex;min-height:100vh}

/* ── SIDEBAR ── */
.sb{
  width:var(--w);background:var(--sur);
  position:fixed;inset:0 auto 0 0;
  display:flex;flex-direction:column;
  border-right:1px solid var(--brd);
  z-index:100;transition:transform .25s cubic-bezier(.4,0,.2,1);
}
.sb-overlay{
  display:none;position:fixed;inset:0;
  background:rgba(17,24,39,.45);z-index:99;
  backdrop-filter:blur(2px);
}
.sb-overlay.show{display:block}

.sb-logo{
  padding:16px 16px;border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:10px;
}
.sb-mark{
  width:32px;height:32px;background:var(--blue);
  border-radius:8px;display:flex;align-items:center;
  justify-content:center;flex-shrink:0;
}
.sb-brand{font-size:14.5px;font-weight:700;color:var(--t1);letter-spacing:-.3px}
.sb-tagline{font-size:10px;color:var(--t3);margin-top:1px}

.sb-nav{padding:10px 8px;flex:1;overflow-y:auto}
.sb-grp{
  font-size:10px;font-weight:600;letter-spacing:.9px;
  text-transform:uppercase;color:var(--t3);
  padding:12px 10px 5px;
}
.sb-item{
  display:flex;align-items:center;gap:9px;
  padding:8px 10px;border-radius:7px;
  cursor:pointer;color:var(--t2);font-size:13.5px;
  font-weight:500;transition:all .12s;margin-bottom:1px;
}
.sb-item:hover{background:var(--sur2);color:var(--t1)}
.sb-item.on{background:var(--blue-bg);color:var(--blue);font-weight:600}
.sb-item.on svg{stroke:var(--blue)}
.sb-chip{
  margin-left:auto;background:#FEE2E2;color:#DC2626;
  border-radius:99px;padding:1px 7px;
  font-size:11px;font-weight:700;line-height:1.6;
}
.sb-item.on .sb-chip{background:var(--blue-mid);color:var(--blue-h)}

.sb-foot{
  padding:14px 16px;border-top:1px solid var(--brd);
  display:flex;align-items:center;gap:7px;
}
.sb-dot{width:6px;height:6px;border-radius:50%;background:#10B981;flex-shrink:0}
.sb-status-txt{font-size:11.5px;color:var(--t3)}

/* ── MAIN ── */
.main{margin-left:var(--w);flex:1;display:flex;flex-direction:column;min-width:0}

/* ── TOPBAR ── */
.top{
  height:60px;background:var(--sur);border-bottom:1px solid var(--brd);
  position:sticky;top:0;z-index:50;
  display:flex;align-items:center;padding:0 24px;gap:12px;
  box-shadow:var(--sh0);
}
.ham{
  display:none;width:36px;height:36px;border-radius:8px;
  background:none;border:1px solid var(--brd);
  cursor:pointer;align-items:center;justify-content:center;
  color:var(--t2);flex-shrink:0;transition:all .12s;
}
.ham:hover{background:var(--sur2);color:var(--t1)}
.top-l{flex:1;min-width:0}
.top-title{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top-sub{font-size:12px;color:var(--t3);margin-top:1px}

.srch{position:relative;flex-shrink:0}
.srch svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
.srch input{
  padding:8px 12px 8px 34px;background:var(--sur2);
  border:1px solid var(--brd);border-radius:8px;
  font-size:13.5px;font-family:'Inter',sans-serif;
  color:var(--t1);outline:none;width:256px;transition:all .15s;
}
.srch input:focus{border-color:var(--blue);background:var(--blue-bg);box-shadow:0 0 0 3px rgba(37,99,235,.09)}
.srch input::placeholder{color:var(--t3)}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:8px 16px;border-radius:8px;border:none;
  cursor:pointer;font-size:13.5px;font-weight:600;
  font-family:'Inter',sans-serif;transition:all .12s;
  white-space:nowrap;line-height:1;flex-shrink:0;
}
.btn-b{background:var(--blue);color:#fff}
.btn-b:hover{background:var(--blue-h)}
.btn-b:active{transform:scale(.98)}
.btn-b:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-w{background:var(--sur);color:var(--t2);border:1px solid var(--brd)}
.btn-w:hover{background:var(--sur2);border-color:var(--brd2)}
.btn-w:disabled{opacity:.5;cursor:not-allowed}

/* ── BODY ── */
.body{padding:22px 24px}

/* ── STATS ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.sc{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:12px;padding:18px 20px;
  box-shadow:var(--sh0);display:flex;
  align-items:flex-start;gap:14px;transition:box-shadow .15s;
}
.sc:hover{box-shadow:var(--sh1)}
.sc-ico{
  width:40px;height:40px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.sc-ico.bl{background:#EFF6FF;color:#2563EB}
.sc-ico.gr{background:#F0FDF4;color:#059669}
.sc-ico.am{background:#FFFBEB;color:#B45309}
.sc-ico.pu{background:#F5F3FF;color:#7C3AED}
.sc-bd{min-width:0}
.sc-lbl{font-size:12px;font-weight:500;color:var(--t3);margin-bottom:6px}
.sc-val{font-size:26px;font-weight:700;color:var(--t1);letter-spacing:-.5px;line-height:1}
.sc-sub{font-size:12px;color:var(--t3);margin-top:4px}

/* ── CARD ── */
.card{background:var(--sur);border:1px solid var(--brd);border-radius:12px;overflow:hidden;box-shadow:var(--sh0)}
.card-hd{padding:14px 20px;border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:14px;font-weight:600;color:var(--t1)}
.card-sub{font-size:12px;color:var(--t3);margin-top:2px}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse}
thead{background:var(--sur2)}
th{padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid var(--brd);white-space:nowrap}
tbody tr{border-bottom:1px solid var(--brd);transition:background .1s;cursor:pointer}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:#F5F9FF}
td{padding:12px 16px;font-size:13.5px;color:var(--t2)}
td.tw{color:var(--t1);font-weight:600}
td.tm{font-family:'SF Mono','Fira Code',monospace;font-size:12.5px;color:var(--t1);font-weight:500;letter-spacing:.2px}
td.tr{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:var(--t1)}

/* ── BADGE / PLATE ── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap}
.bdot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.b-on{background:var(--green-bg);color:var(--green);border:1px solid var(--green-brd)}
.b-on .bdot{background:var(--green)}
.b-soon{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-brd)}
.b-soon .bdot{background:#F59E0B}
.b-off{background:var(--red-bg);color:var(--red);border:1px solid var(--red-brd)}
.b-off .bdot{background:var(--red)}
.plate{
  display:inline-block;background:var(--sur2);
  border:1px solid var(--brd2);border-radius:5px;
  padding:2px 8px;font-size:12.5px;font-weight:600;
  color:var(--t1);letter-spacing:.4px;
  font-family:'SF Mono','Fira Code',monospace;
}

/* ── PAGINATION ── */
.pg{padding:12px 20px;border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;background:var(--sur2);flex-wrap:wrap;gap:8px}
.pg-info{font-size:12.5px;color:var(--t3)}
.pg-btns{display:flex;gap:4px}
.pg-btn{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid var(--brd);background:var(--sur);color:var(--t2);transition:all .12s;font-family:'Inter',sans-serif;font-size:13px}
.pg-btn:hover:not(:disabled){background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.pg-btn.cur{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700}
.pg-btn:disabled{opacity:.3;cursor:default}

/* ── MODAL ── */
.ov{position:fixed;inset:0;background:rgba(17,24,39,.55);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px);padding:16px}
.modal{background:var(--sur);border:1px solid var(--brd);border-radius:16px;max-height:90vh;overflow-y:auto;box-shadow:var(--sh3);width:100%}
.modal-hd{padding:20px 20px 0;display:flex;align-items:flex-start;justify-content:space-between;position:sticky;top:0;background:var(--sur);border-bottom:1px solid var(--brd);padding-bottom:16px;z-index:10}
.modal-title{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.modal-sub{font-size:12.5px;color:var(--t3);margin-top:3px}
.modal-bd{padding:20px}
.xbtn{width:30px;height:30px;border-radius:7px;background:var(--sur2);border:1px solid var(--brd);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.xbtn:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}

/* ── SECTION HEADER ── */
.shd{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:var(--blue-bg);border:1px solid var(--blue-mid);margin-bottom:12px}
.shd svg{color:var(--blue);flex-shrink:0}
.shd-lbl{font-size:12px;font-weight:600;color:var(--blue)}

/* ── FORM GRID ── */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fi{background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:10px 12px}
.fi.fw{grid-column:1/-1}
.fi label{display:block;font-size:10.5px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.fi-v{font-size:13.5px;color:var(--t1);font-weight:500}
.fi-v.hi{font-size:17px;font-weight:700;color:var(--blue)}
.fi input{width:100%;border:1.5px solid var(--brd2);border-radius:7px;padding:7px 10px;font-size:13px;font-family:'Inter',sans-serif;color:var(--t1);background:var(--sur);outline:none;transition:all .15s;margin-top:2px}
.fi input:focus{border-color:var(--blue);background:var(--blue-bg);box-shadow:0 0 0 3px rgba(37,99,235,.08)}

/* ── DROP ZONE ── */
.drop{border:2px dashed var(--brd2);border-radius:12px;padding:32px 24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--sur2);margin-bottom:16px}
.drop:hover,.drop.drag{border-color:var(--blue);background:var(--blue-bg)}
.drop-ic{width:48px;height:48px;border-radius:14px;background:#E2E8F0;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;transition:all .2s}
.drop:hover .drop-ic,.drop.drag .drop-ic{background:var(--blue-mid)}
.drop:hover .drop-ic svg,.drop.drag .drop-ic svg{stroke:var(--blue)}
.drop-main{font-size:14px;font-weight:600;color:var(--t1);margin-bottom:4px}
.drop-hint{font-size:12.5px;color:var(--t3)}
.drop-fname{font-size:13px;font-weight:600;color:var(--blue);margin-top:6px}

/* ── BANNERS ── */
.bnr{border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-bottom:20px}
.bnr.am{background:var(--amber-bg);border:1px solid var(--amber-brd)}
.bnr.er{background:var(--red-bg);border:1px solid var(--red-brd)}
.bnr-body{flex:1;min-width:0}
.bnr-t{font-size:13.5px;font-weight:600}
.bnr-s{font-size:12.5px;margin-top:2px}
.am .bnr-t{color:#92400E}.am .bnr-s{color:var(--amber)}.am svg{color:var(--amber)}
.er .bnr-t{color:var(--red)}.er svg{color:var(--red)}

/* ── LOADING / EMPTY ── */
.ldg{text-align:center;padding:60px 20px}
.spin{width:30px;height:30px;border-radius:50%;border:2.5px solid var(--brd);border-top-color:var(--blue);animation:spin .65s linear infinite;margin:0 auto 14px}
@keyframes spin{to{transform:rotate(360deg)}}
.ldg-t{font-size:13.5px;font-weight:500;color:var(--t2)}
.ldg-s{font-size:12px;color:var(--t3);margin-top:4px}
.empty{text-align:center;padding:60px 20px}
.empty svg{margin:0 auto 14px;display:block;stroke:var(--t3)}
.empty-t{font-size:14.5px;font-weight:600;color:var(--t2);margin-bottom:4px}
.empty-s{font-size:12.5px;color:var(--t3)}

/* ── TOAST ── */
.toast{position:fixed;bottom:24px;right:24px;background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:12px 16px;font-size:13.5px;font-weight:500;z-index:400;box-shadow:var(--sh3);display:flex;align-items:center;gap:10px;max-width:320px;animation:tIn .2s ease;color:var(--t1)}
.toast.ok{border-left:3px solid var(--green)}
.toast.er{border-left:3px solid var(--red)}
@keyframes tIn{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}

/* ── PDF PREVIEW ── */
.pdf-preview-wrap{
  display:flex;flex-direction:column;
  border:1px solid var(--brd);border-radius:10px;
  overflow:hidden;background:var(--sur2);
}
.pdf-preview-bar{
  padding:8px 12px;background:var(--sur);
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:8px;
  font-size:12px;font-weight:600;color:var(--t2);
  flex-shrink:0;
}
.pdf-preview-bar svg{color:var(--blue)}
.pdf-preview-bar .pdf-fname{
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.pdf-preview-bar .pdf-size{
  font-size:11px;font-weight:400;color:var(--t3);flex-shrink:0;
}
.pdf-iframe{width:100%;border:none;display:block}
.pdf-placeholder{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:10px;padding:40px 20px;
  color:var(--t3);text-align:center;
}
.pdf-placeholder .ph-title{font-size:13px;font-weight:600;color:var(--t2)}
.pdf-placeholder .ph-hint{font-size:12px}

/* ── 2-COL MODAL LAYOUT ── */
.modal-split{display:flex;gap:18px;align-items:flex-start}
.modal-split .split-form{flex:1;min-width:0}
.modal-split .split-preview{
  width:360px;flex-shrink:0;
  position:sticky;top:0;
}
@media(max-width:860px){
  .modal-split{flex-direction:column}
  .modal-split .split-preview{width:100%;position:static}
}

/* ════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════ */
@media(max-width:1023px){
  .sb{transform:translateX(-100%)}
  .sb.open{transform:translateX(0);box-shadow:var(--sh3)}
  .main{margin-left:0}
  .ham{display:flex}
  .stats{grid-template-columns:1fr 1fr}
  .top{padding:0 16px}
  .body{padding:16px}
  .srch input{width:200px}
}
@media(max-width:639px){
  .stats{grid-template-columns:1fr 1fr;gap:10px}
  .sc{padding:14px;gap:10px}
  .sc-ico{width:36px;height:36px;border-radius:9px}
  .sc-val{font-size:22px}
  .sc-sub{display:none}
  .srch{display:none}
  .body{padding:12px}
  .top-sub{display:none}
  .btn-b .btn-txt{display:none}
  .btn-b{padding:8px 10px}
  .card-hd{padding:12px 14px}
  th,td{padding:10px 12px;font-size:13px}
  .pg{padding:10px 14px}
  .modal-bd{padding:16px}
  .modal-hd{padding:16px 16px 0;padding-bottom:14px}
  .fg{grid-template-columns:1fr}
  .fi.fw{grid-column:unset}
  .drop{padding:24px 16px}
}
`

/* ═══════════════════════════════════════════
   ICONS  (Heroicons 2 outline)
═══════════════════════════════════════════ */
const P = {
  shield:   "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  grid:     "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  doc:      "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  clock:    "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  upload:   "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  search:   "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z",
  x:        "M6 18L18 6M6 6l12 12",
  chevL:    "M15.75 19.5L8.25 12l7.5-7.5",
  chevR:    "M8.25 4.5l7.5 7.5-7.5 7.5",
  chevLL:   "M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5",
  chevRR:   "M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5",
  warn:     "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  cash:     "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
  check:    "M4.5 12.75l6 6 9-13.5",
  checkc:   "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  xc:       "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  person:   "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  car:      "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  cal:      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  banknote: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  inbox:    "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
  arrowR:   "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
  save:     "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
  menu:     "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
}

function Ico({ n, s = 16, sw = 1.75 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block" }}>
      <path d={P[n]} />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function getStatus(end) {
  if (!end) return { cls: "b-off", label: "ไม่ทราบ" }
  const d = new Date(end), diff = (d - new Date()) / 86400000
  if (isNaN(d)) return { cls: "b-off", label: "ไม่ทราบ" }
  if (diff < 0)  return { cls: "b-off",  label: "หมดอายุแล้ว" }
  if (diff < 30) return { cls: "b-soon", label: `หมดใน ${Math.floor(diff)} วัน` }
  return { cls: "b-on", label: "คุ้มครองอยู่" }
}
const baht = n => n
  ? Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : "—"

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  return (
    <div className={`toast ${type === "success" ? "ok" : "er"}`}>
      <Ico n={type === "success" ? "checkc" : "xc"} s={17} />
      <span>{msg}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════
   UPLOAD MODAL
═══════════════════════════════════════════ */
const F_SECS = [
  { label: "ข้อมูลกรมธรรม์",    ico: "doc",      keys: ["policy_number", "broker_name"] },
  { label: "ผู้เอาประกัน",      ico: "person",   keys: ["insured_name", "insured_address"] },
  { label: "ข้อมูลรถ",          ico: "car",      keys: ["license_plate", "chassis_no", "car_make", "car_model", "car_year"] },
  { label: "ระยะเวลาคุ้มครอง",  ico: "cal",      keys: ["coverage_start", "coverage_end"] },
  { label: "เบี้ยประกัน",       ico: "banknote", keys: ["net_premium", "stamp_duty", "vat", "total_premium"] },
]
const F_LBL = {
  policy_number: "เลขกรมธรรม์",       broker_name:    "ชื่อตัวแทน",
  insured_name:  "ชื่อผู้เอาประกัน",  insured_address: "ที่อยู่",
  license_plate: "ทะเบียนรถ",         chassis_no:     "เลขตัวถัง",
  car_make:      "ยี่ห้อรถ",          car_model:      "รุ่นรถ",          car_year: "ปีรถ",
  coverage_start:"วันเริ่มคุ้มครอง",  coverage_end:   "วันสิ้นสุดคุ้มครอง",
  net_premium:   "เบี้ยสุทธิ",        stamp_duty:     "อากรแสตมป์",
  vat:           "ภาษีมูลค่าเพิ่ม",   total_premium:  "รวมเบี้ยประกัน",
}

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [fileUrl, setFileUrl] = useState(null)   // object URL สำหรับ PDF preview
  const [drag, setDrag]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed]   = useState(null)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState("")
  const ref = useRef()

  // สร้าง / revoke object URL เมื่อ file เปลี่ยน
  useEffect(() => {
    if (!file) { setFileUrl(null); return }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = f => {
    if (!f) return
    if (f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))
      { setFile(f); setErr(""); setParsed(null) }
    else setErr("กรุณาเลือกไฟล์ PDF เท่านั้น")
  }

  const doRead = async () => {
    if (!file) return
    setLoading(true); setErr("")
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await api.post("/upload-pdf", form)
      if (!res.data?.parsed) throw new Error("ไม่พบข้อมูลใน PDF")
      setParsed(res.data.parsed)   // ← auto-fill ฟอร์มทันที
    } catch (e) {
      setErr("อ่าน PDF ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const doSave = async () => {
    setSaving(true); setErr("")
    try {
      await api.post("/save-policy", parsed)
      onSuccess({ ok: true }); onClose()
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  // ── PDF Preview panel (ใช้ซ้ำทั้ง step 1 และ 2)
  const PdfPreview = ({ height = 420 }) => (
    <div className="pdf-preview-wrap">
      <div className="pdf-preview-bar">
        <Ico n="doc" s={13} />
        <span className="pdf-fname">{file ? file.name : "ยังไม่เลือกไฟล์"}</span>
        {file && (
          <span className="pdf-size">{(file.size / 1024).toFixed(0)} KB</span>
        )}
      </div>
      {fileUrl ? (
        <iframe
          className="pdf-iframe"
          src={fileUrl}
          title="PDF Preview"
          style={{ height }}
        />
      ) : (
        <div className="pdf-placeholder" style={{ height }}>
          <Ico n="doc" s={36} sw={1} />
          <div className="ph-title">PDF Preview</div>
          <div className="ph-hint">เลือกไฟล์ PDF เพื่อดูตัวอย่าง</div>
        </div>
      )}
    </div>
  )

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: parsed ? 980 : 760 }}>
        <div className="modal-hd">
          <div>
            <div className="modal-title">อัปโหลด PDF กรมธรรม์</div>
            <div className="modal-sub">
              {parsed
                ? "ตรวจสอบและแก้ไขข้อมูลที่สแกนได้ก่อนบันทึก"
                : "ระบบจะดึงข้อมูลจากไฟล์ PDF อัตโนมัติ"}
            </div>
          </div>
          <button className="xbtn" onClick={onClose}><Ico n="x" s={14} /></button>
        </div>

        <div className="modal-bd">
          {err && (
            <div className="bnr er" style={{ marginBottom: 16 }}>
              <Ico n="warn" s={18} />
              <div className="bnr-body"><div className="bnr-t">{err}</div></div>
              <button onClick={() => setErr("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", display: "flex" }}>
                <Ico n="x" s={14} />
              </button>
            </div>
          )}

          {/* ══ STEP 1: เลือกไฟล์ + PDF preview ══ */}
          {!parsed && !loading && (
            <div className="modal-split">
              {/* ซ้าย: drop zone + ปุ่ม */}
              <div className="split-form">
                <div
                  className={`drop${drag ? " drag" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
                  onClick={() => ref.current.click()}
                >
                  <div className="drop-ic"><Ico n="upload" s={22} /></div>
                  {file ? (
                    <>
                      <div className="drop-main">เลือกไฟล์แล้ว</div>
                      <div className="drop-fname">{file.name}</div>
                      <div className="drop-hint" style={{ marginTop: 4 }}>คลิกเพื่อเปลี่ยนไฟล์</div>
                    </>
                  ) : (
                    <>
                      <div className="drop-main">ลากไฟล์มาวางที่นี่</div>
                      <div className="drop-hint">หรือคลิกเพื่อเลือกไฟล์ PDF</div>
                    </>
                  )}
                  <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }}
                    onChange={e => pick(e.target.files[0])} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-w" onClick={onClose}>ยกเลิก</button>
                  <button className="btn btn-b" onClick={doRead} disabled={!file}>
                    <Ico n="upload" s={14} />อ่านและวิเคราะห์ PDF
                  </button>
                </div>
              </div>

              {/* ขวา: PDF preview */}
              <div className="split-preview">
                <PdfPreview height={340} />
              </div>
            </div>
          )}

          {/* ══ LOADING ══ */}
          {loading && (
            <div className="ldg" style={{ padding: "56px 0" }}>
              <div className="spin" />
              <div className="ldg-t">กำลังวิเคราะห์ไฟล์ PDF</div>
              <div className="ldg-s">อาจใช้เวลาสักครู่...</div>
            </div>
          )}

          {/* ══ STEP 2: ฟอร์ม auto-fill + PDF preview ══ */}
          {parsed && (
            <div className="modal-split">
              {/* ซ้าย: ฟอร์ม */}
              <div className="split-form">
                {F_SECS.map(sec => (
                  <div key={sec.label} style={{ marginBottom: 18 }}>
                    <div className="shd">
                      <Ico n={sec.ico} s={13} />
                      <span className="shd-lbl">{sec.label}</span>
                    </div>
                    <div className="fg">
                      {sec.keys.map(k => (
                        <div key={k} className={`fi${k === "insured_address" ? " fw" : ""}`}>
                          <label>{F_LBL[k]}</label>
                          <input
                            value={parsed[k] ?? ""}
                            onChange={e => setParsed({ ...parsed, [k]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-b" onClick={doSave} disabled={saving}>
                    <Ico n="save" s={14} />
                    {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
                  </button>
                  <button className="btn btn-w" onClick={() => setParsed(null)}>เลือกไฟล์ใหม่</button>
                </div>
              </div>

              {/* ขวา: PDF preview (sticky ระหว่าง scroll ฟอร์ม) */}
              <div className="split-preview">
                <PdfPreview height={560} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════ */
function DetailModal({ p, onClose }) {
  const st = getStatus(p.coverage_end)
  const Row = ({ label, value, hi }) => (
    <div className="fi">
      <label>{label}</label>
      <span className={`fi-v${hi ? " hi" : ""}`}>{value || "—"}</span>
    </div>
  )
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-hd">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div className="modal-title">{p.policy_number || "—"}</div>
              <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
            </div>
            <div className="modal-sub">รายละเอียดกรมธรรม์ประกันภัยรถยนต์</div>
          </div>
          <button className="xbtn" onClick={onClose}><Ico n="x" s={14} /></button>
        </div>
        <div className="modal-bd">

          <div className="shd"><Ico n="person" s={13} /><span className="shd-lbl">ผู้เอาประกัน</span></div>
          <div className="fg" style={{ marginBottom: 18 }}>
            <Row label="ชื่อ-นามสกุล"  value={p.insured_name} />
            <Row label="ชื่อตัวแทน"    value={p.broker_name} />
            <div className="fi fw"><label>ที่อยู่</label><span className="fi-v">{p.insured_address || "—"}</span></div>
          </div>

          <div className="shd"><Ico n="car" s={13} /><span className="shd-lbl">ข้อมูลรถยนต์</span></div>
          <div className="fg" style={{ marginBottom: 18 }}>
            <Row label="ยี่ห้อ / รุ่น" value={[p.car_make, p.car_model].filter(Boolean).join(" ")} />
            <Row label="ปีรถ"          value={p.car_year} />
            <Row label="ทะเบียนรถ"     value={p.license_plate} />
            <Row label="เลขตัวถัง"     value={p.chassis_no} />
          </div>

          <div className="shd"><Ico n="cal" s={13} /><span className="shd-lbl">ระยะเวลาคุ้มครอง</span></div>
          <div className="fg" style={{ marginBottom: 18 }}>
            <Row label="วันเริ่มต้น"   value={p.coverage_start} />
            <Row label="วันสิ้นสุด"    value={p.coverage_end} />
          </div>

          <div className="shd"><Ico n="banknote" s={13} /><span className="shd-lbl">เบี้ยประกัน</span></div>
          <div className="fg" style={{ marginBottom: 20 }}>
            <Row label="เบี้ยสุทธิ"             value={`${baht(p.net_premium)} ฿`} />
            <Row label="อากรแสตมป์"             value={`${baht(p.stamp_duty)} ฿`} />
            <Row label="ภาษีมูลค่าเพิ่ม (VAT)"  value={`${baht(p.vat)} ฿`} />
            <div className="fi" style={{ background: "var(--blue-bg)", borderColor: "var(--blue-mid)" }}>
              <label>รวมเบี้ยประกัน</label>
              <span className="fi-v hi">{baht(p.total_premium)} ฿</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-w" onClick={onClose}>ปิดหน้าต่าง</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   POLICY TABLE
═══════════════════════════════════════════ */
function PolicyTable({ rows, loading, total, page, pages, setPage, onRow }) {
  if (loading) return (
    <div className="card">
      <div className="ldg"><div className="spin" /><div className="ldg-t">กำลังโหลดข้อมูล</div></div>
    </div>
  )
  if (!rows.length) return (
    <div className="card">
      <div className="empty">
        <Ico n="inbox" s={40} />
        <div className="empty-t">ไม่พบข้อมูลกรมธรรม์</div>
        <div className="empty-s">ลองเปลี่ยนคำค้นหา หรืออัปโหลดข้อมูลใหม่</div>
      </div>
    </div>
  )
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <div className="card-title">รายการกรมธรรม์</div>
          <div className="card-sub">{total.toLocaleString()} รายการ · คลิกแถวเพื่อดูรายละเอียด</div>
        </div>
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table>
          <thead>
            <tr>
              <th>เลขกรมธรรม์</th>
              <th>ผู้เอาประกัน</th>
              <th>ทะเบียน</th>
              <th>ยี่ห้อ / รุ่น</th>
              <th>วันหมดอายุ</th>
              <th style={{ textAlign: "right" }}>เบี้ยรวม (฿)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const st = getStatus(r.coverage_end)
              return (
                <tr key={r.id} onClick={() => onRow(r)}>
                  <td className="tm">{r.policy_number || "—"}</td>
                  <td className="tw">{r.insured_name || "—"}</td>
                  <td><span className="plate">{r.license_plate || "—"}</span></td>
                  <td>{[r.car_make, r.car_model].filter(Boolean).join(" ") || "—"}</td>
                  <td style={{ color: "var(--t3)", fontSize: 13 }}>{r.coverage_end || "—"}</td>
                  <td className="tr">{r.total_premium ? Number(r.total_premium).toLocaleString("th-TH") : "—"}</td>
                  <td><span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="pg">
        <span className="pg-info">หน้า {page} / {pages || 1} · {total.toLocaleString()} รายการ</span>
        <div className="pg-btns">
          <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1}><Ico n="chevLL" s={13} /></button>
          <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><Ico n="chevL" s={13} /></button>
          <div className="pg-btn cur">{page}</div>
          <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={page >= (pages || 1)}><Ico n="chevR" s={13} /></button>
          <button className="pg-btn" onClick={() => setPage(pages || 1)} disabled={page >= (pages || 1)}><Ico n="chevRR" s={13} /></button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   APP
═══════════════════════════════════════════ */
const LIMIT = 15

export default function App() {
  const [tab, setTab]         = useState("dashboard")
  const [sbOpen, setSbOpen]   = useState(false)
  const [rows, setRows]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState("")
  const [page, setPage]       = useState(1)
  const [detail, setDetail]   = useState(null)
  const [upload, setUpload]   = useState(false)
  const [toast, setToast]     = useState(null)

  const notify = (msg, type = "success") => setToast({ msg, type })

  const load = async () => {
    setLoading(true)
    try {
      const params = { page }
      if (search) params.search = search
      const res = await api.get("/policies", { params })
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch (e) {
      notify("โหลดข้อมูลไม่สำเร็จ: " + (e.response?.data?.detail || e.message), "error")
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, search])

  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setSbOpen(false) }
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  const nav = (id) => { setTab(id); setSbOpen(false) }

  const expiring = rows.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    return d >= 0 && d < 30
  })
  const active     = rows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const sumPremium = rows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  const TAB = {
    dashboard: { title: "แดชบอร์ด",         sub: "ภาพรวมกรมธรรม์ทั้งหมด" },
    policies:  { title: "กรมธรรม์ทั้งหมด",  sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "ใกล้หมดอายุ",       sub: `${expiring.length} รายการต้องดำเนินการ` },
  }

  const NAV = [
    { id: "dashboard", ico: "grid",  label: "แดชบอร์ด" },
    { id: "policies",  ico: "doc",   label: "กรมธรรม์ทั้งหมด" },
    { id: "expiring",  ico: "clock", label: "ใกล้หมดอายุ", badge: expiring.length },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        <div className={`sb-overlay${sbOpen ? " show" : ""}`} onClick={() => setSbOpen(false)} />

        {/* ── SIDEBAR ── */}
        <aside className={`sb${sbOpen ? " open" : ""}`}>
          <div className="sb-logo">
            <div className="sb-mark"><Ico n="shield" s={17} /></div>
            <div>
              <div className="sb-brand">InsureManager</div>
              <div className="sb-tagline">ระบบจัดการประกันภัยรถยนต์</div>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="sb-grp">เมนูหลัก</div>
            {NAV.map(it => (
              <div key={it.id} className={`sb-item${tab === it.id ? " on" : ""}`} onClick={() => nav(it.id)}>
                <Ico n={it.ico} s={16} />
                <span>{it.label}</span>
                {it.badge > 0 && <span className="sb-chip">{it.badge}</span>}
              </div>
            ))}
            <div className="sb-grp" style={{ marginTop: 12 }}>จัดการข้อมูล</div>
            <div className="sb-item" onClick={() => { setUpload(true); setSbOpen(false) }}>
              <Ico n="upload" s={16} />
              <span>อัปโหลด PDF</span>
            </div>
          </nav>

          <div className="sb-foot">
            <div className="sb-dot" />
            <span className="sb-status-txt">ระบบทำงานปกติ</span>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          <div className="top">
            <button className="ham" onClick={() => setSbOpen(o => !o)}>
              <Ico n={sbOpen ? "x" : "menu"} s={18} />
            </button>

            <div className="top-l">
              <div className="top-title">{TAB[tab].title}</div>
              <div className="top-sub">{TAB[tab].sub}</div>
            </div>

            <div className="srch">
              <Ico n="search" s={15} />
              <input placeholder="ค้นหา เลขกรมธรรม์ / ชื่อ / ทะเบียน..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>

            <button className="btn btn-b" onClick={() => setUpload(true)}>
              <Ico n="upload" s={14} />
              <span className="btn-txt">อัปโหลด PDF</span>
            </button>
          </div>

          <div className="body">

            {tab === "dashboard" && (
              <>
                <div className="stats">
                  {[
                    { ico: "doc",    cls: "bl", lbl: "กรมธรรม์ทั้งหมด",   val: total.toLocaleString(),  sub: "รายการในระบบ" },
                    { ico: "shield", cls: "gr", lbl: "คุ้มครองอยู่",       val: active,                  sub: "ยังไม่หมดอายุ" },
                    { ico: "clock",  cls: "am", lbl: "ใกล้หมดอายุ",        val: expiring.length,         sub: "ภายใน 30 วัน" },
                    { ico: "cash",   cls: "pu", lbl: "เบี้ยรวม (หน้านี้)", val: sumPremium.toLocaleString("th-TH", { maximumFractionDigits: 0 }), sub: "บาท" },
                  ].map(c => (
                    <div key={c.lbl} className="sc">
                      <div className={`sc-ico ${c.cls}`}><Ico n={c.ico} s={20} /></div>
                      <div className="sc-bd">
                        <div className="sc-lbl">{c.lbl}</div>
                        <div className="sc-val">{c.val}</div>
                        <div className="sc-sub">{c.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {expiring.length > 0 && (
                  <div className="bnr am">
                    <Ico n="warn" s={18} />
                    <div className="bnr-body">
                      <div className="bnr-t">มี {expiring.length} กรมธรรม์ใกล้หมดอายุภายใน 30 วัน</div>
                      <div className="bnr-s">กรุณาติดต่อลูกค้าเพื่อต่ออายุกรมธรรม์</div>
                    </div>
                    <button className="btn btn-w"
                      style={{ fontSize: 12.5, padding: "6px 12px", flexShrink: 0 }}
                      onClick={() => setTab("expiring")}>
                      ดูรายการ <Ico n="arrowR" s={13} />
                    </button>
                  </div>
                )}

                <PolicyTable rows={rows} loading={loading} total={total}
                  page={page} pages={pages} setPage={setPage} onRow={setDetail} />
              </>
            )}

            {tab === "policies" && (
              <PolicyTable rows={rows} loading={loading} total={total}
                page={page} pages={pages} setPage={setPage} onRow={setDetail} />
            )}

            {tab === "expiring" && (
              <PolicyTable rows={expiring} loading={false} total={expiring.length}
                page={1} pages={1} setPage={() => {}} onRow={setDetail} />
            )}

          </div>
        </main>
      </div>

      {upload && (
        <UploadModal onClose={() => setUpload(false)} onSuccess={r => {
          if (r.ok) { notify("บันทึกกรมธรรม์เรียบร้อยแล้ว"); load() }
          else notify(r.error || "เกิดข้อผิดพลาด", "error")
        }} />
      )}
      {detail && <DetailModal p={detail} onClose={() => setDetail(null)} />}
      {toast  && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
