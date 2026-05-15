import { useState, useEffect, useRef, Fragment } from "react"
import api from "./api"


/* ═══════════════════════════════════════════
   STYLES
═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --w:264px;
  --bg:#F0F4F8;
  --sur:#FFFFFF;
  --sur2:#F7F9FC;
  --brd:#E3E8EF;
  --brd2:#C8D3DF;
  --blue:#1E6FE5;
  --blue-h:#1558C0;
  --blue-bg:#EEF4FF;
  --blue-mid:#BDD3FF;
  --green:#0D9C6B;
  --green-bg:#EDFAF4;
  --green-brd:#A7EDD2;
  --amber:#C07000;
  --amber-bg:#FFFAEB;
  --amber-brd:#FBDC87;
  --red:#D93025;
  --red-bg:#FEF2F1;
  --red-brd:#FDCCC9;
  --t1:#0F172A;
  --t2:#475569;
  --t3:#94A3B8;
  --sh0:0 1px 3px rgba(15,23,42,.06);
  --sh1:0 2px 6px rgba(15,23,42,.09),0 1px 2px rgba(15,23,42,.05);
  --sh2:0 4px 12px rgba(15,23,42,.10),0 2px 4px rgba(15,23,42,.06);
  --sh3:0 20px 50px rgba(15,23,42,.20),0 4px 12px rgba(15,23,42,.08);
  --r:10px;
}
body.dark{
  --bg:#0F172A;--sur:#1E293B;--sur2:#162032;
  --brd:#2D3F55;--brd2:#3D5166;
  --t1:#F1F5F9;--t2:#94A3B8;--t3:#64748B;
  --sh0:0 1px 3px rgba(0,0,0,.25);
  --sh1:0 2px 6px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.2);
  --sh2:0 4px 12px rgba(0,0,0,.4),0 2px 4px rgba(0,0,0,.2);
  --sh3:0 20px 50px rgba(0,0,0,.55),0 4px 12px rgba(0,0,0,.3);
  --blue-bg:rgba(30,111,229,.15);--blue-mid:rgba(30,111,229,.35);
  --green-bg:rgba(13,156,107,.12);--green-brd:rgba(13,156,107,.3);
  --amber-bg:rgba(192,112,0,.12);--amber-brd:rgba(192,112,0,.3);
  --red-bg:rgba(217,48,37,.12);--red-brd:rgba(217,48,37,.3);
}
body{font-family:'Sarabun','Noto Sans Thai',sans-serif;font-size:15px;background:var(--bg);color:var(--t1);-webkit-font-smoothing:antialiased;line-height:1.5}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#C8D3DF;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}

/* ── LAYOUT ── */
.app{display:flex;flex-direction:column;min-height:100vh}

/* ── TOPNAV ── */
.sb{
  width:100%;background:var(--sur);
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;
  border-bottom:1px solid var(--brd);
  box-shadow:var(--sh0);padding:0 20px;height:56px;gap:0;
}
.sb-overlay{display:none}
/* ── THEME TOGGLE ── */
.theme-btn{
  width:34px;height:34px;border-radius:8px;
  background:none;border:1.5px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .12s;
}
.theme-btn:hover{background:var(--sur2);color:var(--t1)}
/* ── HAMBURGER ── */
.ham{
  width:34px;height:34px;border-radius:8px;
  background:none;border:1.5px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:none;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .12s;
}
.ham:hover{background:var(--sur2);color:var(--t1)}
/* ── MOBILE MENU ── */
.mob-menu{
  display:none;position:absolute;top:56px;left:0;right:0;
  background:var(--sur);border-bottom:2px solid var(--brd);
  box-shadow:var(--sh2);z-index:99;
  flex-direction:column;padding:8px 12px 12px;
}
.mob-menu.open{display:flex;animation:slideDown .18s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.mob-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 14px;border-radius:10px;cursor:pointer;
  color:var(--t2);font-size:15px;font-weight:500;
  transition:all .12s;
}
.mob-item:hover{background:var(--sur2);color:var(--t1)}
.mob-item.on{background:var(--blue-bg);color:var(--blue);font-weight:600}
.mob-divider{height:1px;background:var(--brd);margin:6px 0}
.mob-search{padding:8px 2px 4px;position:relative}
.mob-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
.mob-search input{
  width:100%;padding:10px 14px 10px 36px;
  border:1.5px solid var(--brd);border-radius:10px;
  font-size:15px;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:var(--sur2);outline:none;transition:all .15s;
}
.mob-search input:focus{border-color:var(--blue);background:var(--blue-bg)}
.mob-search input::placeholder{color:var(--t3)}
.sb-logo{
  display:flex;align-items:center;gap:10px;
  padding:0 16px 0 0;border-right:1px solid var(--brd);
  margin-right:8px;height:100%;flex-shrink:0;
}
.sb-mark{
  width:32px;height:32px;
  background:linear-gradient(135deg,#1E6FE5 0%,#0F4FC9 100%);
  border-radius:8px;display:flex;align-items:center;
  justify-content:center;flex-shrink:0;
  box-shadow:0 2px 6px rgba(30,111,229,.30);
}
.sb-brand{font-size:14px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.2}
.sb-tagline{display:none}

.sb-nav{
  display:flex;align-items:center;flex:1;gap:2px;
  padding:0;overflow:visible;
}
.sb-grp{display:none}
.sb-item{
  display:flex;align-items:center;gap:7px;
  padding:7px 13px;border-radius:8px;
  cursor:pointer;color:var(--t2);font-size:13.5px;
  font-weight:500;transition:all .13s;
  position:relative;height:36px;
}
.sb-item:hover{background:var(--sur2);color:var(--t1)}
.sb-item.on{background:var(--blue-bg);color:var(--blue);font-weight:600}
.sb-item.on::before{
  content:'';position:absolute;left:8px;right:8px;bottom:-10px;
  height:2px;border-radius:2px 2px 0 0;
  background:var(--blue);
}
.sb-item.on svg{stroke:var(--blue)}
.sb-chip{
  background:#FECDCA;color:#D93025;
  border-radius:99px;padding:1px 7px;
  font-size:11px;font-weight:700;line-height:1.5;
}
.sb-item.on .sb-chip{background:var(--blue-mid);color:var(--blue-h)}

.sb-divider{width:1px;height:24px;background:var(--brd);margin:0 8px;flex-shrink:0}

.sb-foot{display:none}
.sb-dot{width:7px;height:7px;border-radius:50%;background:#10B981;flex-shrink:0;box-shadow:0 0 0 2px rgba(16,185,129,.2)}
.sb-status-txt{font-size:12px;color:var(--t3)}

/* ── MAIN ── */
.main{flex:1;display:flex;flex-direction:column;min-width:0}

/* ── PAGE SUBTITLE BAR (แทน topbar เดิม) ── */
.top{
  height:52px;background:var(--sur);border-bottom:1px solid var(--brd);
  display:flex;align-items:center;padding:0 24px;gap:12px;
}
.ham{display:none}
.top-l{flex:1;min-width:0}
.top-title{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
.top-sub{font-size:12px;color:var(--t3);margin-top:1px;font-weight:400}

.srch{position:relative;flex-shrink:0}
.srch svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none}
.srch input{
  padding:6px 11px 6px 30px;background:var(--sur2);
  border:1.5px solid var(--brd);border-radius:9px;
  font-size:13px;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);outline:none;width:190px;transition:all .15s;
}
.srch input:focus{border-color:var(--blue);background:var(--blue-bg);box-shadow:0 0 0 3px rgba(30,111,229,.10)}
.srch input::placeholder{color:var(--t3)}

/* ── list + preview layout ── */
.list-layout{display:flex;align-items:flex-start;flex:1}
.list-layout .body{flex:1;min-width:0;transition:all .25s}

/* ── preview panel ── */
.pvp{
  width:340px;flex-shrink:0;
  background:var(--sur);border-left:1px solid var(--brd);
  position:sticky;top:108px;height:calc(100vh - 108px);
  display:flex;flex-direction:column;overflow:hidden;
  animation:pvp-in .2s ease;
}
@keyframes pvp-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.pvp-hd{
  padding:14px 16px 12px;border-bottom:1px solid var(--brd);
  display:flex;align-items:flex-start;gap:10px;flex-shrink:0;
}
.pvp-title{font-size:15px;font-weight:700;color:var(--t1);line-height:1.3}
.pvp-close{
  background:none;border:1px solid var(--brd);border-radius:8px;
  width:30px;height:30px;cursor:pointer;display:flex;
  align-items:center;justify-content:center;
  color:var(--t3);flex-shrink:0;transition:all .15s;
}
.pvp-close:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}
.pvp-body{flex:1;overflow-y:auto;padding:10px 14px}
.pvp-sec{margin-bottom:12px}
.pvp-sec-title{
  font-size:10px;font-weight:700;color:var(--t3);
  text-transform:uppercase;letter-spacing:.5px;
  padding:6px 0 4px;border-bottom:1px solid var(--brd);margin-bottom:4px;
}
.pvp-row{display:flex;flex-direction:column;padding:5px 0;border-bottom:1px solid var(--sur2)}
.pvp-row:last-child{border-bottom:none}
.pvp-lbl{font-size:11px;font-weight:600;color:var(--t3);letter-spacing:.3px}
.pvp-val{font-size:13px;color:var(--t1);margin-top:1px;word-break:break-word;font-weight:500}
.pvp-foot{padding:12px 14px;border-top:1px solid var(--brd);flex-shrink:0}
.pvp-val{font-size:13.5px;color:var(--t1);margin-top:2px;word-break:break-word}
.pvp-foot{padding:12px 16px;border-top:1px solid var(--brd);flex-shrink:0}

/* highlight active row */
tr.tr-active td{background:var(--blue-bg) !important}

/* ── big search bar ── */
.big-srch-wrap{margin-bottom:20px}
.big-srch{
  display:flex;align-items:center;gap:12px;
  background:var(--sur);border:2px solid var(--brd);
  border-radius:12px;padding:11px 18px;
  box-shadow:var(--sh1);transition:all .2s;
}
.big-srch:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(30,111,229,.10)}
.big-srch svg{color:var(--t3);flex-shrink:0;transition:color .2s}
.big-srch:focus-within svg{color:var(--blue)}
.big-srch input{
  flex:1;border:none;outline:none;font-size:15px;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:transparent;
}
.big-srch input::placeholder{color:var(--t3)}
.big-srch-clr{
  background:var(--sur2);border:1px solid var(--brd);
  border-radius:6px;padding:3px 7px;cursor:pointer;
  display:flex;align-items:center;color:var(--t3);
  transition:all .15s;flex-shrink:0;
}
.big-srch-clr:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:9px 17px;border-radius:9px;border:none;
  cursor:pointer;font-size:14px;font-weight:600;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  transition:all .13s;white-space:nowrap;line-height:1;flex-shrink:0;
}
.btn-b{background:var(--blue);color:#fff;box-shadow:0 1px 3px rgba(30,111,229,.30)}
.btn-b:hover{background:var(--blue-h);box-shadow:0 2px 6px rgba(30,111,229,.35)}
.btn-b:active{transform:scale(.97)}
.btn-b:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.btn-w{background:var(--sur);color:var(--t2);border:1.5px solid var(--brd)}
.btn-w:hover{background:var(--sur2);border-color:var(--brd2);color:var(--t1)}
.btn-w:disabled{opacity:.5;cursor:not-allowed}

/* ── BODY ── */
.body{padding:22px 24px}

/* ── STATS ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.sc{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:14px;padding:18px 20px;
  box-shadow:var(--sh0);display:flex;
  align-items:flex-start;gap:14px;
  transition:box-shadow .15s,transform .15s;
}
.sc:hover{box-shadow:var(--sh2);transform:translateY(-1px)}
.sc-ico{
  width:44px;height:44px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.sc-ico.bl{background:#E8F0FE;color:#1E6FE5}
.sc-ico.gr{background:#E6F9F0;color:#0D9C6B}
.sc-ico.am{background:#FFF7E0;color:#C07000}
.sc-ico.pu{background:#F2EEFF;color:#6C3CE0}
.sc-bd{min-width:0}
.sc-lbl{font-size:12.5px;font-weight:500;color:var(--t3);margin-bottom:5px;line-height:1.3}
.sc-val{font-size:28px;font-weight:700;color:var(--t1);letter-spacing:-.5px;line-height:1;font-family:'Sarabun',sans-serif}
.sc-sub{font-size:12px;color:var(--t3);margin-top:5px;font-weight:400}

/* ── CARD ── */
.card{background:var(--sur);border:1px solid var(--brd);border-radius:14px;overflow:hidden;box-shadow:var(--sh0)}
.card-hd{padding:15px 20px;border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:15px;font-weight:600;color:var(--t1)}
.card-sub{font-size:12.5px;color:var(--t3);margin-top:2px;font-weight:400}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse}
thead{background:var(--sur2)}
th{padding:11px 16px;text-align:left;font-size:11.5px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--brd);white-space:nowrap;font-family:'Sarabun',sans-serif}
tbody tr{border-bottom:1px solid var(--brd);transition:background .1s;cursor:pointer}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:#EEF4FF}
td{padding:13px 16px;font-size:14px;color:var(--t2);line-height:1.4}
td.tw{color:var(--t1);font-weight:600}
td.tm{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:13px;color:var(--t1);font-weight:500;letter-spacing:.3px}
td.tr{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:var(--t1)}

/* ── BADGE / PLATE ── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-size:12.5px;font-weight:600;white-space:nowrap}
.bdot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.b-on{background:var(--green-bg);color:var(--green);border:1px solid var(--green-brd)}
.b-on .bdot{background:var(--green)}
.b-soon{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-brd)}
.b-soon .bdot{background:#F59E0B}
.b-off{background:var(--red-bg);color:var(--red);border:1px solid var(--red-brd)}
.b-off .bdot{background:var(--red)}
.plate{
  display:inline-block;background:#F1F5F9;
  border:1.5px solid var(--brd2);border-radius:6px;
  padding:3px 9px;font-size:13px;font-weight:700;
  color:var(--t1);letter-spacing:.5px;
  font-family:'SF Mono','Fira Code','Consolas',monospace;
}

/* ── PAGINATION ── */
.pg{padding:13px 20px;border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;background:var(--sur2);flex-wrap:wrap;gap:8px}
.pg-info{font-size:13px;color:var(--t3)}
.pg-btns{display:flex;gap:4px}
.pg-btn{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1.5px solid var(--brd);background:var(--sur);color:var(--t2);transition:all .12s;font-family:'Sarabun',sans-serif;font-size:13.5px}
.pg-btn:hover:not(:disabled){background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.pg-btn.cur{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700}
.pg-btn:disabled{opacity:.3;cursor:default}

/* ── MODAL ── */
.ov{position:fixed;inset:0;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(5px);padding:16px}
.modal{background:var(--sur);border:1px solid var(--brd);border-radius:18px;max-height:90vh;overflow-y:auto;box-shadow:var(--sh3);width:100%}
.modal-hd{padding:22px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;position:sticky;top:0;background:var(--sur);border-bottom:1px solid var(--brd);padding-bottom:16px;z-index:10}
.modal-title{font-size:17px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.modal-sub{font-size:13px;color:var(--t3);margin-top:3px;font-weight:400}
.modal-bd{padding:22px}
.xbtn{width:32px;height:32px;border-radius:8px;background:var(--sur2);border:1.5px solid var(--brd);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.xbtn:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}

/* ── SECTION HEADER ── */
.shd{display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:9px;background:var(--blue-bg);border:1px solid var(--blue-mid);margin-bottom:12px}
.shd svg{color:var(--blue);flex-shrink:0}
.shd-lbl{font-size:12.5px;font-weight:600;color:var(--blue)}

/* ── FORM GRID ── */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fi{background:var(--sur2);border:1.5px solid var(--brd);border-radius:9px;padding:10px 13px}
.fi.fw{grid-column:1/-1}
.fi label{display:block;font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.fi-v{font-size:14px;color:var(--t1);font-weight:500;line-height:1.4}
.fi-v.hi{font-size:18px;font-weight:700;color:var(--blue)}
.fi input{width:100%;border:1.5px solid var(--brd2);border-radius:8px;padding:8px 11px;font-size:14px;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:var(--t1);background:var(--sur);outline:none;transition:all .15s;margin-top:2px}
.fi input:focus{border-color:var(--blue);background:var(--blue-bg);box-shadow:0 0 0 3px rgba(30,111,229,.09)}

/* ── DROP ZONE ── */
.drop{border:2px dashed var(--brd2);border-radius:14px;padding:36px 24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--sur2);margin-bottom:16px}
.drop:hover,.drop.drag{border-color:var(--blue);background:var(--blue-bg)}
.drop-ic{width:52px;height:52px;border-radius:14px;background:#DDE5EF;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;transition:all .2s}
.drop:hover .drop-ic,.drop.drag .drop-ic{background:var(--blue-mid)}
.drop:hover .drop-ic svg,.drop.drag .drop-ic svg{stroke:var(--blue)}
.drop-main{font-size:14.5px;font-weight:600;color:var(--t1);margin-bottom:5px}
.drop-hint{font-size:13px;color:var(--t3)}
.drop-fname{font-size:13.5px;font-weight:600;color:var(--blue);margin-top:8px}

/* ── BANNERS ── */
.bnr{border-radius:11px;padding:13px 16px;display:flex;align-items:center;gap:13px;margin-bottom:20px}
.bnr.am{background:var(--amber-bg);border:1px solid var(--amber-brd)}
.bnr.er{background:var(--red-bg);border:1px solid var(--red-brd)}
.bnr-body{flex:1;min-width:0}
.bnr-t{font-size:14px;font-weight:600}
.bnr-s{font-size:13px;margin-top:3px}
.am .bnr-t{color:#7C4A00}.am .bnr-s{color:var(--amber)}.am svg{color:var(--amber)}
.er .bnr-t{color:var(--red)}.er svg{color:var(--red)}

/* ── LOADING / EMPTY ── */
.ldg{text-align:center;padding:64px 20px}
.spin{width:32px;height:32px;border-radius:50%;border:2.5px solid var(--brd);border-top-color:var(--blue);animation:spin .65s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.ldg-t{font-size:14px;font-weight:500;color:var(--t2)}
.ldg-s{font-size:13px;color:var(--t3);margin-top:4px}
.empty{text-align:center;padding:64px 20px}
.empty svg{margin:0 auto 16px;display:block;stroke:var(--t3)}
.empty-t{font-size:15px;font-weight:600;color:var(--t2);margin-bottom:5px}
.empty-s{font-size:13px;color:var(--t3)}

/* ── TOAST ── */
.toast{position:fixed;bottom:26px;right:26px;background:var(--sur);border:1.5px solid var(--brd);border-radius:12px;padding:13px 17px;font-size:14px;font-weight:500;z-index:400;box-shadow:var(--sh3);display:flex;align-items:center;gap:10px;max-width:340px;animation:tIn .22s ease;color:var(--t1)}
.toast.ok{border-left:4px solid var(--green)}
.toast.er{border-left:4px solid var(--red)}
@keyframes tIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}

/* ── PDF PREVIEW ── */
.pdf-preview-wrap{
  display:flex;flex-direction:column;
  border:1.5px solid var(--brd);border-radius:12px;
  overflow:hidden;background:var(--sur2);
}
.pdf-preview-bar{
  padding:9px 13px;background:var(--sur);
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:8px;
  font-size:12.5px;font-weight:600;color:var(--t2);
  flex-shrink:0;
}
.pdf-preview-bar > svg:first-child{color:var(--blue)}
.pdf-preview-bar .pdf-fname{
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.pdf-preview-bar .pdf-size{
  font-size:11.5px;font-weight:400;color:var(--t3);flex-shrink:0;
}
.pdf-zoom-btn{
  width:30px;height:30px;border-radius:7px;
  background:var(--sur2);border:1.5px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .12s;
}
.pdf-zoom-btn:hover{background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.pdf-zoom-btn:disabled{opacity:.35;cursor:not-allowed}

/* ── PDF LIGHTBOX (full screen viewer) ── */
.pdf-lb-ov{
  position:fixed;inset:0;background:rgba(10,18,36,.90);
  display:flex;flex-direction:column;
  z-index:500;backdrop-filter:blur(10px);
  animation:fadeIn .18s ease;
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.pdf-lb-bar{
  height:58px;background:rgba(255,255,255,.05);
  border-bottom:1px solid rgba(255,255,255,.09);
  display:flex;align-items:center;gap:10px;padding:0 20px;
  color:#E2E8F0;flex-shrink:0;
}
.pdf-lb-bar .pdf-lb-name{
  flex:1;font-size:14px;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.pdf-lb-bar .pdf-lb-size{font-size:12px;color:#94A3B8;font-weight:400}
.pdf-lb-btn{
  height:36px;padding:0 13px;border-radius:8px;
  background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);
  color:#fff;font-size:13px;font-weight:600;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  transition:all .12s;font-family:'Sarabun','Noto Sans Thai',sans-serif;
}
.pdf-lb-btn:hover{background:rgba(255,255,255,.18)}
.pdf-lb-btn.close{background:rgba(217,48,37,.18);border-color:rgba(217,48,37,.30)}
.pdf-lb-btn.close:hover{background:rgba(217,48,37,.32)}
.pdf-lb-zoom{
  font-size:12.5px;font-variant-numeric:tabular-nums;
  color:#E2E8F0;min-width:48px;text-align:center;
  padding:0 6px;
}
.pdf-lb-body{
  flex:1;overflow:auto;padding:18px;
  display:flex;align-items:flex-start;justify-content:center;
  background:transparent;
}
.pdf-lb-frame-wrap{
  background:#fff;border-radius:8px;
  box-shadow:0 30px 60px rgba(0,0,0,.5);
  transition:width .15s ease;
}
.pdf-lb-frame{display:block;border:none;width:100%;height:100%}
.pdf-iframe{width:100%;border:none;display:block}
.pdf-placeholder{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:12px;padding:48px 20px;
  color:var(--t3);text-align:center;
}
.pdf-placeholder .ph-title{font-size:14px;font-weight:600;color:var(--t2)}
.pdf-placeholder .ph-hint{font-size:13px}

/* ── 2-COL MODAL LAYOUT ── */
.modal-split{display:flex;gap:18px;align-items:flex-start}
.modal-split .split-form{flex:1;min-width:0}
.modal-split .split-preview{
  width:370px;flex-shrink:0;
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
  .sb-nav{display:none}
  .srch{display:none}
  .ham{display:flex}
  .stats{grid-template-columns:1fr 1fr}
  .top{padding:0 16px}
  .body{padding:16px}
  .sb-status-txt{display:none}
}
@media(max-width:639px){
  .stats{grid-template-columns:1fr 1fr;gap:10px}
  .sc{padding:14px;gap:10px}
  .sc-ico{width:38px;height:38px;border-radius:10px}
  .sc-val{font-size:23px}
  .sc-sub{display:none}
  .srch{display:none}
  .body{padding:12px}
  .top-sub{display:none}
  .btn-b .btn-txt{display:none}
  .btn-b{padding:9px 11px}
  .card-hd{padding:12px 14px}
  th,td{padding:10px 12px;font-size:13.5px}
  .pg{padding:10px 14px}
  .modal-bd{padding:16px}
  .modal-hd{padding:16px 16px 0;padding-bottom:14px}
  .fg{grid-template-columns:1fr}
  .fi.fw{grid-column:unset}
  .drop{padding:26px 16px}
}

/* ════════════════════════════════════════
   PAGE VIEWS  (แทน popup modal)
════════════════════════════════════════ */
.page-wrap{display:flex;flex-direction:column;min-height:calc(100vh - 62px)}
.page-hd{
  padding:14px 24px;background:var(--sur);
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:14px;
  position:sticky;top:56px;z-index:40;box-shadow:var(--sh0);
  flex-wrap:wrap;
}
.page-back{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:9px;
  border:1.5px solid var(--brd);background:var(--sur);
  color:var(--t2);cursor:pointer;font-size:14px;font-weight:500;
  transition:all .13s;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  flex-shrink:0;
}
.page-back:hover{background:var(--sur2);color:var(--t1);border-color:var(--brd2)}
.page-hd-div{width:1px;height:26px;background:var(--brd);flex-shrink:0}
.page-hd-info{min-width:0}
.page-title{font-size:17px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.3}
.page-sub{font-size:13px;color:var(--t3);margin-top:1px;font-weight:400}
.page-hd-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.page-body{padding:24px;flex:1}

/* ── DETAIL PAGE ── */
.detail-split{display:grid;grid-template-columns:1fr 380px;gap:20px;align-items:flex-start}
.detail-aside{position:sticky;top:calc(62px + 55px + 12px)}
.info-card{background:var(--sur);border:1px solid var(--brd);border-radius:14px;box-shadow:var(--sh0);margin-bottom:16px;overflow:hidden}
.info-card-hd{display:flex;align-items:center;gap:10px;padding:13px 18px;background:var(--sur2);border-bottom:1px solid var(--brd)}
.info-card-hd svg{color:var(--blue)}
.info-card-title{font-size:13.5px;font-weight:600;color:var(--t1)}
.info-card-bd{padding:16px 18px}
.info-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.info-row.fw{grid-template-columns:1fr}
.info-field{padding:0;margin-bottom:0}
.info-label{font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.info-val{font-size:14.5px;color:var(--t1);font-weight:500;line-height:1.4;word-break:break-word}
.info-val.hi{font-size:20px;font-weight:700;color:var(--blue)}
.info-val.mono{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:13.5px;letter-spacing:.3px}

/* ── UPLOAD PAGE ── */
.upload-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start}
.upload-aside{position:sticky;top:calc(56px + 52px + 12px)}
.upload-aside .pdf-preview-wrap{box-shadow:var(--sh1)}

/* compact horizontal drop zone */
.drop-h{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  padding:0 32px;border:2px dashed var(--brd2);
  border-radius:14px;cursor:pointer;
  transition:height .3s ease, min-height .3s ease, padding .3s ease, background .2s, border-color .2s;
  background:var(--sur2);height:calc(50vh - 80px);min-height:220px;
  text-align:center;overflow:hidden;
}
.drop-h:hover,.drop-h.drag{border-color:var(--blue);background:var(--blue-bg)}
.drop-h-ic{
  width:64px;height:64px;border-radius:16px;background:#DDE5EF;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;
}
.drop-h:hover .drop-h-ic,.drop-h.drag .drop-h-ic{background:var(--blue-mid)}
.drop-h:hover .drop-h-ic svg,.drop-h.drag .drop-h-ic svg{stroke:var(--blue)}
.drop-h-info{flex:1;min-width:0;display:flex;flex-direction:column}
.drop-h-main,.drop-h-name{font-size:16px;font-weight:600;color:var(--t1)}
.drop-h-hint{font-size:13.5px;color:var(--t3);margin-top:4px}
.drop-h-info{display:flex;flex-direction:column;align-items:center}
.drop-h.has-file{
  border-style:solid;border-color:var(--green-brd);background:var(--green-bg);
  height:auto !important;min-height:unset !important;flex-direction:row;
  padding:13px 18px;text-align:left;gap:14px;
}
.drop-h.has-file .drop-h-ic{
  width:44px;height:44px;border-radius:11px;background:rgba(13,156,107,.12);flex-shrink:0;
}
.drop-h.has-file .drop-h-ic svg{stroke:var(--green)}
.drop-h.has-file .drop-h-name{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.drop-h.has-file .drop-h-hint{font-size:12.5px}
.drop-h-badge{
  background:var(--sur2);color:var(--t3);border:1px solid var(--brd2);
  border-radius:7px;padding:3px 10px;font-size:12px;font-weight:600;flex-shrink:0;
}
.drop-h-badge.ok{background:var(--green-bg);color:var(--green);border-color:var(--green-brd)}

/* ── drop wrapper ── */
.drop-wrap{
  border:2px dashed var(--brd2);border-radius:14px;
  background:var(--sur2);overflow:hidden;transition:border-color .2s,background .2s;
}
.drop-wrap.has-file{border-style:solid;border-color:var(--green-brd);background:var(--green-bg)}
.drop-bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px;cursor:pointer;user-select:none;gap:12px;
}
.drop-bar:hover{background:rgba(15,23,42,.03)}
.drop-wrap.has-file .drop-bar:hover{background:rgba(13,156,107,.06)}
.drop-bar-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.drop-bar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.drop-toggle{
  background:none;border:none;cursor:pointer;display:flex;
  align-items:center;justify-content:center;
  width:28px;height:28px;border-radius:7px;color:var(--t3);transition:all .15s;
}
.drop-toggle:hover{background:var(--brd);color:var(--t1)}
.drop-body{
  border-top:1px dashed var(--brd2);
  display:flex;align-items:center;justify-content:center;
  min-height:240px;cursor:pointer;
}
.drop-body-inner{
  display:flex;flex-direction:column;align-items:center;
  gap:12px;padding:36px 32px;text-align:center;pointer-events:none;
}
.drop-body-inner button{pointer-events:all}
.drop-wrap:not(.has-file) .drop-body:hover,.drop-wrap:not(.has-file) .drop-body.drag{
  background:var(--blue-bg);
}
.drop-wrap:not(.has-file) .drop-body:hover .drop-h-ic,
.drop-wrap:not(.has-file) .drop-body.drag .drop-h-ic{background:var(--blue-mid)}
.drop-wrap:not(.has-file) .drop-body:hover .drop-h-ic svg,
.drop-wrap:not(.has-file) .drop-body.drag .drop-h-ic svg{stroke:var(--blue)}

/* ── notes card ── */
.notes-card{
  border:1.5px solid var(--brd);border-radius:12px;
  overflow:hidden;background:var(--sur);
}
.notes-card-hd{
  display:flex;align-items:center;gap:7px;
  padding:9px 14px;border-bottom:1px solid var(--brd);
  background:var(--sur2);
  font-size:12px;font-weight:600;color:var(--t2);
}
.notes-ta{
  width:100%;border:none;outline:none;resize:vertical;
  padding:12px 14px;font-size:14px;min-height:90px;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:var(--sur);line-height:1.6;
}
.notes-ta::placeholder{color:var(--t3)}

/* ── form panel (collapsible) ── */
.form-panel{
  border:1.5px solid var(--brd);border-radius:14px;
  background:var(--sur);overflow:hidden;
}
.form-panel-bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px;cursor:pointer;user-select:none;gap:12px;
  transition:background .15s;
}
.form-panel-bar:hover{background:var(--sur2)}
.form-panel-body{
  border-top:1px solid var(--brd);
  padding:18px 16px;position:relative;
}

/* form loading overlay */
.form-loading-wrap{position:relative}
.form-overlay{
  position:absolute;inset:0;
  background:rgba(247,249,252,.82);
  backdrop-filter:blur(3px);
  border-radius:12px;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:14px;z-index:20;
}
.form-overlay-t{font-size:14.5px;font-weight:600;color:var(--t2)}
.form-overlay-s{font-size:13px;color:var(--t3)}

/* filename inline input */
.fname-row{
  display:flex;align-items:center;gap:8px;
  background:var(--sur);border:1.5px solid var(--brd);
  border-radius:10px;padding:9px 13px;
}
.fname-row label{font-size:12px;font-weight:600;color:var(--t3);white-space:nowrap;flex-shrink:0}
.fname-row input{
  flex:1;border:none;outline:none;font-size:14px;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:transparent;min-width:0;
}
.fname-row input::placeholder{color:var(--t3)}
.fname-row button{
  background:none;border:none;cursor:pointer;font-size:12px;
  color:var(--blue);padding:0;white-space:nowrap;flex-shrink:0;
}
.fname-row button:hover{text-decoration:underline}

@media(max-width:1100px){
  .upload-split{grid-template-columns:320px 1fr}
}
@media(max-width:860px){
  .detail-split,.upload-split{grid-template-columns:1fr}
  .detail-aside,.upload-aside{position:static}
  .upload-aside .pdf-iframe{height:400px !important}
}
@media(max-width:639px){
  .page-hd{padding:10px 14px;gap:10px}
  .page-body{padding:14px}
  .page-title{font-size:15.5px}
  .info-row{grid-template-columns:1fr}
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
  chevU:    "M4.5 15.75l7.5-7.5 7.5 7.5",
  chevD:    "M19.5 8.25l-7.5 7.5-7.5-7.5",
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
  sun:      "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z",
  moon:     "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z",
  expand:   "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
  zoomIn:   "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0zM10.5 7.5v6m3-3h-6",
  zoomOut:  "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0zM13.5 10.5h-6",
  open:     "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
  pen:      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  refresh:  "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  bell:     "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
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
  { label: "ผู้เอาประกัน",      ico: "person",   keys: ["insured_name", "phone", "insured_address"] },
  { label: "ข้อมูลรถ",          ico: "car",      keys: ["license_plate", "chassis_no", "car_make", "car_model", "car_year"] },
  { label: "ระยะเวลาคุ้มครอง",  ico: "cal",      keys: ["coverage_start", "coverage_end"] },
  { label: "เบี้ยประกัน",       ico: "banknote", keys: ["net_premium", "stamp_duty", "vat", "total_premium"] },
]
const F_LBL = {
  policy_number: "เลขกรมธรรม์",       broker_name:    "ชื่อตัวแทน",
  insured_name:  "ชื่อผู้เอาประกัน",  insured_address: "ที่อยู่",
  phone:         "เบอร์โทรศัพท์",
  license_plate: "ทะเบียนรถ",         chassis_no:     "เลขตัวถัง",
  car_make:      "ยี่ห้อรถ",          car_model:      "รุ่นรถ",          car_year: "ปีรถ",
  coverage_start:"วันเริ่มคุ้มครอง",  coverage_end:   "วันสิ้นสุดคุ้มครอง",
  net_premium:   "เบี้ยสุทธิ",        stamp_duty:     "อากรแสตมป์",
  vat:           "ภาษีมูลค่าเพิ่ม",   total_premium:  "รวมเบี้ยประกัน",
  notes:         "หมายเหตุ",
}

/* ═══════════════════════════════════════════
   PDF LIGHTBOX (Full-screen PDF viewer พร้อม zoom)
═══════════════════════════════════════════ */
function PdfLightbox({ src, filename, sizeKB, onClose }) {
  const [zoom, setZoom] = useState(100)   // % ของขนาด iframe
  const ZOOMS = [50, 75, 100, 125, 150, 175, 200, 250, 300]

  // ESC = ปิด, +/− = zoom in/out, 0 = reset
  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") onClose()
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(300, z + 25))
      else if (e.key === "-" || e.key === "_") setZoom(z => Math.max(50, z - 25))
      else if (e.key === "0") setZoom(100)
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  const stepZoom = (dir) => {
    const idx = ZOOMS.findIndex(z => z >= zoom)
    if (dir > 0) setZoom(ZOOMS[Math.min(ZOOMS.length - 1, idx + 1)] ?? 300)
    else         setZoom(ZOOMS[Math.max(0, idx - 1)] ?? 50)
  }

  return (
    <div className="pdf-lb-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pdf-lb-bar">
        <Ico n="doc" s={16} />
        <div className="pdf-lb-name">
          {filename || "PDF Preview"}
          {sizeKB && <span className="pdf-lb-size">  ·  {sizeKB} KB</span>}
        </div>

        <button className="pdf-lb-btn" onClick={() => stepZoom(-1)} title="ย่อ (−)">
          <Ico n="zoomOut" s={15} />
        </button>
        <span className="pdf-lb-zoom">{zoom}%</span>
        <button className="pdf-lb-btn" onClick={() => stepZoom(+1)} title="ขยาย (+)">
          <Ico n="zoomIn" s={15} />
        </button>
        <button className="pdf-lb-btn" onClick={() => setZoom(100)} title="รีเซ็ต (0)">100%</button>

        <a className="pdf-lb-btn" href={src} target="_blank" rel="noreferrer" title="เปิดในแท็บใหม่">
          <Ico n="open" s={15} /> แท็บใหม่
        </a>
        <button className="pdf-lb-btn close" onClick={onClose} title="ปิด (Esc)">
          <Ico n="x" s={15} /> ปิด
        </button>
      </div>

      <div className="pdf-lb-body">
        <div className="pdf-lb-frame-wrap"
          style={{ width: `${zoom * 8}px`, height: `calc(100vh - 88px)` }}>
          {src ? (
            <iframe className="pdf-lb-frame" src={src} title="PDF Fullscreen" />
          ) : (
            <div className="pdf-placeholder" style={{ height: "100%" }}>
              <Ico n="doc" s={40} sw={1} />
              <div className="ph-title">ยังไม่มีไฟล์</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ฟอร์มกรอกข้อมูลกรมธรรม์ (ใช้ซ้ำทั้ง upload + manual) ── */
function PolicyForm({ values, onChange }) {
  return (
    <>
      {F_SECS.map(sec => (
        <div key={sec.label} style={{ marginBottom: 18 }}>
          <div className="shd">
            <Ico n={sec.ico} s={13} />
            <span className="shd-lbl">{sec.label}</span>
          </div>
          <div className="fg">
            {sec.keys.map(k => {
              const isDate = k === "coverage_start" || k === "coverage_end"
              const isWide = k === "insured_address"
              return (
                <div key={k} className={`fi${isWide ? " fw" : ""}`}>
                  <label>{F_LBL[k]}</label>
                  <input
                    placeholder={
                      isDate ? "YYYY-MM-DD หรือ DD/MM/YYYY"
                      : k === "policy_number" ? "เช่น 10-72-69/006797"
                      : k === "license_plate" ? "เช่น 1กก 1234"
                      : k === "phone" ? "เช่น 081-234-5678"
                      : ""
                    }
                    value={values[k] ?? ""}
                    onChange={e => onChange({ ...values, [k]: e.target.value })}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ── หมายเหตุ card ── */}
      <div className="notes-card">
        <div className="notes-card-hd">
          <Ico n="doc" s={13} />
          <span>หมายเหตุ</span>
        </div>
        <textarea
          className="notes-ta"
          rows={4}
          placeholder="บันทึกข้อความเพิ่มเติม เช่น รายละเอียดพิเศษ, ข้อตกลง, หรือข้อมูลอื่น…"
          value={values.notes ?? ""}
          onChange={e => onChange({ ...values, notes: e.target.value })}
        />
      </div>
    </>
  )
}

/* ── กรอกข้อมูลเอง (page) ── */
function ManualPage({ onBack, onSuccess }) {
  const [data, setData]     = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState("")

  const doSave = async () => {
    if (!data.policy_number?.toString().trim()) {
      setErr("กรุณากรอก 'เลขกรมธรรม์' ก่อน")
      return
    }
    setSaving(true); setErr("")
    try {
      await api.post("/save-policy", data)
      onSuccess({ ok: true })
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  const filled = Object.values(data).filter(v => v != null && v !== "").length

  return (
    <div className="page-wrap">
      {/* ── PAGE HEADER ── */}
      <div className="page-hd">
        <button className="page-back" onClick={onBack}>
          <Ico n="chevL" s={15} /> กลับ
        </button>
        <div className="page-hd-div" />
        <div className="page-hd-info">
          <div className="page-title">กรอกข้อมูลกรมธรรม์ด้วยตนเอง</div>
          <div className="page-sub">กรอกเฉพาะช่องที่ทราบ · กรอกแล้ว {filled} ช่อง</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-b" onClick={doSave} disabled={saving}>
            <Ico n="save" s={14} />
            {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 720 }}>
        {err && (
          <div className="bnr er" style={{ marginBottom: 18 }}>
            <Ico n="warn" s={18} />
            <div className="bnr-body"><div className="bnr-t">{err}</div></div>
            <button onClick={() => setErr("")}
              style={{ background:"none",border:"none",cursor:"pointer",color:"var(--red)",display:"flex" }}>
              <Ico n="x" s={14} />
            </button>
          </div>
        )}
        <PolicyForm values={data} onChange={setData} />
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-w" onClick={onBack}>ยกเลิก</button>
          <button className="btn btn-b" onClick={doSave} disabled={saving}>
            <Ico n="save" s={14} />
            {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  )
}

const PDF_H = "calc(100vh - 230px)"

function PdfPreview({ fileUrl, file, filename, onFullscreen }) {
  return (
    <div className="pdf-preview-wrap">
      <div className="pdf-preview-bar">
        <Ico n="doc" s={13} />
        <span className="pdf-fname">{file ? (filename || file.name) : "ยังไม่เลือกไฟล์"}</span>
        {file && <span className="pdf-size">{(file.size / 1024).toFixed(0)} KB</span>}
        <button className="pdf-zoom-btn" onClick={onFullscreen}
          disabled={!fileUrl} title="เต็มจอ">
          <Ico n="expand" s={14} />
        </button>
      </div>
      {fileUrl ? (
        <iframe className="pdf-iframe" src={fileUrl} title="PDF Preview"
          style={{ height: PDF_H }} />
      ) : (
        <div className="pdf-placeholder" style={{ height: PDF_H, minHeight: 320 }}>
          <Ico n="doc" s={44} sw={1} />
          <div className="ph-title">ยังไม่มีไฟล์</div>
          <div className="ph-hint">วาง PDF เพื่อดูตัวอย่าง</div>
        </div>
      )}
    </div>
  )
}

function FormPanel({ open, onToggle, loading, parsed, setParsed, file, filename, setFilename }) {
  return (
    <div className="form-panel">
      {/* หัวแผง */}
      <div className="form-panel-bar" onClick={onToggle}>
        <div className="drop-bar-left">
          <div className="drop-h-ic" style={{ width:36,height:36,borderRadius:9,background:"var(--blue-bg)" }}>
            <Ico n="doc" s={17} sw={1.8} style={{ stroke:"var(--blue)" }} />
          </div>
          <div>
            <div className="drop-h-name" style={{ fontSize:14 }}>ข้อมูลกรมธรรม์</div>
            <div className="drop-h-hint" style={{ fontSize:12.5 }}>
              {loading ? "กำลังดึงข้อมูลจาก PDF…" : open ? "คลิกเพื่อย่อ" : "คลิกเพื่อขยาย"}
            </div>
          </div>
        </div>
        <div className="drop-bar-right" onClick={e => e.stopPropagation()}>
          {loading && <div className="spin" style={{ width:18,height:18,borderWidth:2 }} />}
          <button className="drop-toggle" title={open ? "ย่อ" : "ขยาย"}
            onClick={e => { e.stopPropagation(); onToggle() }}>
            <Ico n={open ? "chevU" : "chevD"} s={16} />
          </button>
        </div>
      </div>

      {/* เนื้อหา */}
      {open && (
        <div className="form-panel-body">
          {loading && (
            <div className="form-overlay">
              <div style={{ textAlign:"center" }}>
                <div className="spin" style={{ margin:"0 auto 10px" }} />
                <div style={{ fontWeight:600, color:"var(--t1)" }}>AI กำลังอ่าน PDF…</div>
                <div style={{ fontSize:13, color:"var(--t3)", marginTop:4 }}>อาจใช้เวลา 5–10 วินาที</div>
              </div>
            </div>
          )}
          {parsed.pdf_size != null && (
            <div className="fi fw" style={{ background:"var(--blue-bg)", borderColor:"var(--blue-mid)", marginBottom:14 }}>
              <label>ขนาดไฟล์</label>
              <span className="fi-v">{(parsed.pdf_size / 1024).toFixed(0)} KB</span>
            </div>
          )}
          <PolicyForm values={parsed} onChange={setParsed} />
        </div>
      )}
    </div>
  )
}

function UploadPage({ onBack, onSuccess }) {
  const [file, setFile]         = useState(null)
  const [fileUrl, setFileUrl]   = useState(null)
  const [filename, setFilename] = useState("")
  const [drag, setDrag]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [parsed, setParsed]     = useState({})
  const [hasData, setHasData]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState("")
  const [aiWarn, setAiWarn]     = useState(null)  // "rate_limit" | "error" | null
  const [pdfFull, setPdfFull]   = useState(false)
  const [dropOpen, setDropOpen] = useState(true)   // ย่อ/ขยาย drop zone
  const [formOpen, setFormOpen] = useState(true)   // ย่อ/ขยาย form panel
  const ref = useRef()

  useEffect(() => {
    if (!file) { setFileUrl(null); return }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // เลือก / drop ไฟล์ → วิเคราะห์ทันที
  const pick = async f => {
    if (!f) return
    if (!(f.type === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf"))) {
      setErr("กรุณาเลือกไฟล์ PDF เท่านั้น"); return
    }
    setFile(f); setErr(""); setHasData(false)
    setFilename(f.name); setDropOpen(false)
    // วิเคราะห์อัตโนมัติ
    setLoading(true)
    const form = new FormData()
    form.append("file", f)
    try {
      const res = await api.post("/upload-pdf", form)
      if (!res.data?.parsed) throw new Error("ไม่พบข้อมูลใน PDF")
      setParsed({ ...res.data.parsed, pdf_filename: f.name })
      setHasData(true)
      setAiWarn(res.data.used_ai === false ? (res.data.ai_error || "error") : null)
    } catch (e) {
      setErr("อ่าน PDF ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const doSave = async () => {
    setSaving(true); setErr("")
    try {
      await api.post("/save-policy", { ...parsed, pdf_filename: filename || parsed.pdf_filename })
      onSuccess({ ok: true })
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
      setSaving(false)
    }
  }

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={fileUrl} filename={file?.name}
          sizeKB={file ? (file.size/1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}
      <div className="page-wrap">
        {/* ── PAGE HEADER ── */}
        <div className="page-hd">
          <button className="page-back" onClick={onBack}>
            <Ico n="chevL" s={15} /> กลับ
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div className="page-title">อัปโหลด PDF กรมธรรม์</div>
            <div className="page-sub">
              {loading ? "กำลังวิเคราะห์ด้วย AI…"
                : hasData ? "ตรวจสอบและแก้ไขข้อมูลก่อนบันทึก"
                : "วาง PDF แล้วระบบจะดึงข้อมูลอัตโนมัติ"}
            </div>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-b" onClick={doSave} disabled={!hasData || saving}>
              <Ico n="save" s={14} />
              {saving ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
            </button>
          </div>
        </div>

        <div className="page-body">
          {err && (
            <div className="bnr er" style={{ marginBottom: 16 }}>
              <Ico n="warn" s={18} />
              <div className="bnr-body"><div className="bnr-t">{err}</div></div>
              <button onClick={() => setErr("")}
                style={{ background:"none",border:"none",cursor:"pointer",color:"var(--red)",display:"flex" }}>
                <Ico n="x" s={14} />
              </button>
            </div>
          )}

          <div className="upload-split">
            {/* ── ซ้าย: drop zone กะทัดรัด + form ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* ── ชื่อไฟล์ (บนสุด — แสดงเมื่อมีไฟล์) ── */}
              {file && (
                <div className="fname-row">
                  <label>ชื่อไฟล์</label>
                  <input value={filename} onChange={e => setFilename(e.target.value)} placeholder={file.name} />
                  {filename !== file.name && (
                    <button onClick={() => setFilename(file.name)}>รีเซ็ต</button>
                  )}
                </div>
              )}

              {/* ── แผง 1: Drop zone ── */}
              <div className={`drop-wrap${file ? " has-file" : ""}`}>
                {file ? (
                  <div className="drop-bar" onClick={() => ref.current.click()} style={{ cursor:"pointer" }}>
                    <div className="drop-bar-left">
                      <div className="drop-h-ic" style={{ width:36,height:36,borderRadius:9 }}>
                        <Ico n="doc" s={17} />
                      </div>
                      <div>
                        <div className="drop-h-name" style={{ fontSize:14 }}>{filename || file.name}</div>
                        <div className="drop-h-hint" style={{ fontSize:12.5 }}>
                          {loading ? "กำลังวิเคราะห์…" : `${(file.size/1024).toFixed(0)} KB · คลิกเพื่อเปลี่ยนไฟล์`}
                        </div>
                      </div>
                    </div>
                    <div className="drop-bar-right">
                      {loading
                        ? <div className="spin" style={{ width:18,height:18,borderWidth:2 }} />
                        : <span className="drop-h-badge ok">✓</span>}
                    </div>
                  </div>
                ) : (
                  <div className="drop-body"
                    onDragOver={e => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]) }}
                    onClick={() => !loading && ref.current.click()}
                  >
                    <div className={`drop-body-inner${drag ? " drag" : ""}`}>
                      <div className="drop-h-ic" style={{ width:64,height:64,borderRadius:16 }}>
                        <Ico n="upload" s={28} />
                      </div>
                      <span className="drop-h-name" style={{ fontSize:16 }}>ลากไฟล์ PDF มาวางที่นี่</span>
                      <span className="drop-h-hint" style={{ fontSize:13.5 }}>หรือคลิกเพื่อเลือกไฟล์ · รองรับ PDF เท่านั้น</span>
                    </div>
                  </div>
                )}
                <input ref={ref} type="file" accept=".pdf" style={{ display:"none" }}
                  onChange={e => pick(e.target.files[0])} />
              </div>

              {/* ── แจ้งเตือน AI ไม่ทำงาน ── */}
              {aiWarn && (
                <div className="bnr er" style={{ marginBottom: 16 }}>
                  <Ico n="bell" s={18} />
                  <div className="bnr-body">
                    <div className="bnr-t">
                      {aiWarn === "rate_limit"
                        ? "AI ถึง limit รายวันแล้ว — ข้อมูลนี้อ่านด้วย OCR (ไม่ใช่ AI)"
                        : "AI ทำงานไม่ได้ — ข้อมูลนี้อ่านด้วย OCR (ไม่ใช่ AI)"}
                    </div>
                    <div className="bnr-s" style={{ color:"var(--red)" }}>
                      กรุณาตรวจสอบและแก้ไขข้อมูลด้านล่างก่อนบันทึก
                    </div>
                  </div>
                </div>
              )}

              {/* ── แผง 2: กรอกข้อมูล (collapsible) ── */}
              <FormPanel
                open={formOpen} onToggle={() => setFormOpen(o => !o)}
                loading={loading} parsed={parsed} setParsed={setParsed}
                file={file} filename={filename} setFilename={setFilename}
              />
            </div>

            {/* ── ขวา: PDF preview ── */}
            <div className="upload-aside">
              <PdfPreview fileUrl={fileUrl} file={file} filename={filename} onFullscreen={() => setPdfFull(true)} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   DETAIL PAGE  (full-page, ไม่ใช้ popup)
═══════════════════════════════════════════ */
function DetailPage({ p, onBack, onUpdated }) {
  const [pdfFull, setPdfFull]   = useState(false)
  const [editName, setEditName] = useState(false)
  const [name, setName]         = useState(p.pdf_filename || "")
  const [savingName, setSavingName] = useState(false)
  const st = getStatus(p.coverage_end)

  const saveName = async () => {
    setSavingName(true)
    try {
      await api.put(`/policies/${p.id}`, { pdf_filename: name.trim() || null })
      p.pdf_filename = name.trim()
      setEditName(false)
      onUpdated?.()
    } catch (e) {
      alert("เปลี่ยนชื่อไฟล์ไม่สำเร็จ: " + (e.response?.data?.detail || e.message))
    } finally { setSavingName(false) }
  }

  const pdfBase        = `${api.defaults.baseURL}/policies/${p.id}/pdf`
  const pdfViewUrl     = pdfBase
  const pdfDownloadUrl = `${pdfBase}?download=1`
  const hasPdfInDb     = !!p.pdf_filename || !!p.pdf_size

  const F = ({ label, value, hi, mono }) => (
    <div className="info-field">
      <div className="info-label">{label}</div>
      <div className={`info-val${hi ? " hi" : ""}${mono ? " mono" : ""}`}>{value || "—"}</div>
    </div>
  )

  return (
    <>
      {pdfFull && (
        <PdfLightbox src={pdfViewUrl} filename={p.pdf_filename}
          sizeKB={p.pdf_size ? (p.pdf_size/1024).toFixed(0) : null}
          onClose={() => setPdfFull(false)} />
      )}

      <div className="page-wrap">
        {/* ── PAGE HEADER ── */}
        <div className="page-hd">
          <button className="page-back" onClick={onBack}>
            <Ico n="chevL" s={15} /> กลับ
          </button>
          <div className="page-hd-div" />
          <div className="page-hd-info">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div className="page-title">{p.policy_number || "—"}</div>
              <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
            </div>
            <div className="page-sub">
              {p.insured_name || ""}{p.insured_name && p.license_plate ? "  ·  " : ""}
              {p.license_plate || ""}
            </div>
          </div>
          {hasPdfInDb && (
            <div className="page-hd-right">
              <button className="btn btn-w" onClick={() => setPdfFull(true)}>
                <Ico n="expand" s={14} /> ดู PDF
              </button>
              <a className="btn btn-b" href={pdfDownloadUrl}>
                <Ico n="download" s={14} /> ดาวน์โหลด
              </a>
            </div>
          )}
        </div>

        <div className="page-body">
          <div className="detail-split">

            {/* ── ซ้าย: ข้อมูล ── */}
            <div>
              {/* ผู้เอาประกัน */}
              <div className="info-card">
                <div className="info-card-hd">
                  <Ico n="person" s={16} />
                  <span className="info-card-title">ผู้เอาประกัน</span>
                </div>
                <div className="info-card-bd">
                  <div className="info-row" style={{ marginBottom:12 }}>
                    <F label="ชื่อ-นามสกุล"   value={p.insured_name} />
                    <F label="ชื่อตัวแทน / นายหน้า" value={p.broker_name} />
                  </div>
                  <div className="info-row fw">
                    <F label="ที่อยู่"          value={p.insured_address} />
                  </div>
                </div>
              </div>

              {/* รถยนต์ */}
              <div className="info-card">
                <div className="info-card-hd">
                  <Ico n="car" s={16} />
                  <span className="info-card-title">ข้อมูลรถยนต์</span>
                </div>
                <div className="info-card-bd">
                  <div className="info-row" style={{ marginBottom:12 }}>
                    <F label="ยี่ห้อ / รุ่น"
                      value={[p.car_make, p.car_model].filter(Boolean).join("  ")} />
                    <F label="ปีรถ" value={p.car_year} />
                  </div>
                  <div className="info-row">
                    <div className="info-field">
                      <div className="info-label">ทะเบียนรถ</div>
                      <div className="info-val">
                        {p.license_plate
                          ? <span className="plate">{p.license_plate}</span>
                          : "—"}
                      </div>
                    </div>
                    <F label="เลขตัวถัง" value={p.chassis_no} mono />
                  </div>
                </div>
              </div>

              {/* ระยะเวลาคุ้มครอง */}
              <div className="info-card">
                <div className="info-card-hd">
                  <Ico n="cal" s={16} />
                  <span className="info-card-title">ระยะเวลาคุ้มครอง</span>
                </div>
                <div className="info-card-bd">
                  <div className="info-row">
                    <F label="วันเริ่มต้น"  value={p.coverage_start} />
                    <F label="วันสิ้นสุด"   value={p.coverage_end} />
                  </div>
                </div>
              </div>

              {/* เบี้ยประกัน */}
              <div className="info-card">
                <div className="info-card-hd">
                  <Ico n="banknote" s={16} />
                  <span className="info-card-title">เบี้ยประกัน</span>
                </div>
                <div className="info-card-bd">
                  <div className="info-row" style={{ marginBottom:12 }}>
                    <F label="เบี้ยสุทธิ"            value={`${baht(p.net_premium)} ฿`} />
                    <F label="อากรแสตมป์"            value={`${baht(p.stamp_duty)} ฿`} />
                  </div>
                  <div className="info-row">
                    <F label="ภาษีมูลค่าเพิ่ม (VAT)" value={`${baht(p.vat)} ฿`} />
                    <div className="info-field" style={{ background:"var(--blue-bg)",border:"1px solid var(--blue-mid)",borderRadius:9,padding:"10px 13px" }}>
                      <div className="info-label">รวมเบี้ยประกัน</div>
                      <div className="info-val hi">{baht(p.total_premium)} ฿</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF metadata */}
              {hasPdfInDb && (
                <div className="info-card">
                  <div className="info-card-hd">
                    <Ico n="doc" s={16} />
                    <span className="info-card-title">ไฟล์ PDF กรมธรรม์</span>
                  </div>
                  <div className="info-card-bd">
                    <div className="info-label" style={{ marginBottom:6 }}>ชื่อไฟล์</div>
                    {editName ? (
                      <div style={{ display:"flex",gap:7,alignItems:"center",marginBottom:10 }}>
                        <input value={name} onChange={e => setName(e.target.value)} autoFocus
                          placeholder="policy.pdf"
                          style={{ flex:1,border:"1.5px solid var(--brd2)",borderRadius:8,padding:"7px 11px",fontSize:14,fontFamily:"inherit",color:"var(--t1)",outline:"none" }}
                          onFocus={e => e.target.style.borderColor="var(--blue)"}
                          onBlur={e => e.target.style.borderColor="var(--brd2)"}
                        />
                        <button className="btn btn-b" onClick={saveName} disabled={savingName}
                          style={{ padding:"7px 13px",fontSize:13 }}>
                          <Ico n="check" s={13} /> {savingName ? "..." : "บันทึก"}
                        </button>
                        <button className="btn btn-w"
                          onClick={() => { setEditName(false); setName(p.pdf_filename||"") }}
                          style={{ padding:"7px 11px",fontSize:13 }}>
                          <Ico n="x" s={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:10 }}>
                        <span className="info-val" style={{ flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          {p.pdf_filename || "—"}
                        </span>
                        <button className="btn btn-w" onClick={() => setEditName(true)}
                          style={{ padding:"6px 12px",fontSize:13 }}>
                          <Ico n="pen" s={13} /> แก้ไขชื่อ
                        </button>
                      </div>
                    )}
                    {p.pdf_size && (
                      <div style={{ fontSize:12,color:"var(--t3)" }}>
                        {(p.pdf_size/1024).toFixed(0)} KB · เก็บในฐานข้อมูล
                      </div>
                    )}
                    <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:14 }}>
                      <button className="btn btn-w" onClick={() => setPdfFull(true)}>
                        <Ico n="expand" s={14} /> เต็มจอ
                      </button>
                      <a className="btn btn-w" href={pdfViewUrl} target="_blank" rel="noreferrer">
                        <Ico n="open" s={14} /> แท็บใหม่
                      </a>
                      <a className="btn btn-b" href={pdfDownloadUrl}>
                        <Ico n="download" s={14} /> ดาวน์โหลด
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── ขวา: PDF preview (sticky) ── */}
            <div className="detail-aside">
              {hasPdfInDb ? (
                <div className="pdf-preview-wrap">
                  <div className="pdf-preview-bar">
                    <Ico n="doc" s={13} />
                    <span className="pdf-fname">{p.pdf_filename || "PDF"}</span>
                    {p.pdf_size && <span className="pdf-size">{(p.pdf_size/1024).toFixed(0)} KB</span>}
                    <button className="pdf-zoom-btn" onClick={() => setPdfFull(true)} title="เต็มจอ">
                      <Ico n="expand" s={14} />
                    </button>
                  </div>
                  <iframe className="pdf-iframe" src={pdfViewUrl} title="PDF Preview"
                    style={{ height: 560 }} />
                </div>
              ) : (
                <div className="info-card" style={{ marginBottom:0 }}>
                  <div className="info-card-bd">
                    <div className="pdf-placeholder" style={{ height:220 }}>
                      <Ico n="doc" s={36} sw={1} />
                      <div className="ph-title">ไม่มีไฟล์ PDF</div>
                      <div className="ph-hint">ยังไม่ได้เก็บ PDF ในฐานข้อมูล</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════
   POLICY TABLE
═══════════════════════════════════════════ */
function PolicyTable({ rows, loading, total, page, pages, setPage, onRow, activeId, pageOffset }) {
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
              <th style={{ width:40, textAlign:"center", color:"var(--t3)" }}>#</th>
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
            {rows.map((r, idx) => {
              const st = getStatus(r.coverage_end)
              return (
                <tr key={r.id} onClick={() => onRow(r)} className={activeId === r.id ? "tr-active" : ""}>
                  <td style={{ textAlign:"center", color:"var(--t3)", fontSize:12, fontVariantNumeric:"tabular-nums" }}>{pageOffset + idx + 1}</td>
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
   PREVIEW PANEL
═══════════════════════════════════════════ */
function PreviewPanel({ p, onClose, onOpen }) {
  const st = getStatus(p.coverage_end)
  const fmtNum = v => v != null ? Number(v).toLocaleString("th-TH") : null
  const rows = [
    // ── ข้อมูลกรมธรรม์ ──
    ["ใบคำขอ",            p.app_number],
    ["เลขกรมธรรม์",       p.policy_number],
    ["บริษัทประกัน",      p.company_code],
    ["ประเภท",            p.policy_type],
    ["ใหม่ / ต่ออายุ",    p.new_renew === "N" ? "ใหม่" : p.new_renew === "R" ? "ต่ออายุ" : p.new_renew],
    // ── ผู้เอาประกัน ──
    ["ผู้เอาประกัน",      p.insured_name],
    ["เบอร์โทร",          p.phone],
    ["ที่อยู่",            p.insured_address],
    // ── ยานพาหนะ ──
    ["ทะเบียนรถ",         p.license_plate ? `${p.license_plate}${p.license_province ? " " + p.license_province : ""}` : null],
    ["ยี่ห้อ / รุ่น",     [p.car_make, p.car_model].filter(Boolean).join(" ")],
    ["ปีรถ",              p.car_year],
    ["เลขตัวถัง",         p.chassis_no],
    // ── ระยะเวลาคุ้มครอง ──
    ["แจ้งงาน",           p.date_notify],
    ["คุ้มครองเริ่ม",     p.coverage_start],
    ["คุ้มครองสิ้นสุด",   p.coverage_end],
    ["วันรับกรมธรรม์",    p.date_policy_receive],
    ["วันยกเลิก",         p.date_cancel],
    // ── เบี้ยประกัน ──
    ["ทุนเอาประกัน",      fmtNum(p.sum_insured)],
    ["เบี้ยสุทธิ",        fmtNum(p.net_premium)],
    ["อากร",              fmtNum(p.stamp_duty)],
    ["ภาษี",              fmtNum(p.vat)],
    ["รวมเบี้ย",          fmtNum(p.total_premium)],
    // ── ตัวแทน ──
    ["รหัสตัวแทน",        p.agent_code],
    ["ชื่อตัวแทน",        p.broker_name],
    ["หมายเหตุ",          p.notes],
  ]
  const secs = [
    { title:"กรมธรรม์", fields:[
      ["ใบคำขอ", p.app_number], ["เลขกรมธรรม์", p.policy_number],
      ["บ.ประกัน", p.company_code], ["ประเภท", p.policy_type],
      ["N/R", p.new_renew === "N" ? "ใหม่" : p.new_renew === "R" ? "ต่ออายุ" : p.new_renew],
    ]},
    { title:"ผู้เอาประกัน", fields:[
      ["ชื่อ", p.insured_name], ["เบอร์โทร", p.phone], ["ที่อยู่", p.insured_address],
    ]},
    { title:"ยานพาหนะ", fields:[
      ["ทะเบียน", p.license_plate ? `${p.license_plate}${p.license_province ? " "+p.license_province : ""}` : null],
      ["ยี่ห้อ/รุ่น", [p.car_make, p.car_model].filter(Boolean).join(" ")],
      ["ปีรถ", p.car_year], ["เลขตัวถัง", p.chassis_no],
    ]},
    { title:"ระยะเวลา", fields:[
      ["แจ้งงาน", p.date_notify], ["คุ้มครองเริ่ม", p.coverage_start],
      ["คุ้มครองสิ้นสุด", p.coverage_end], ["วันรับกรมธรรม์", p.date_policy_receive],
      ["วันยกเลิก", p.date_cancel],
    ]},
    { title:"เบี้ยประกัน", fields:[
      ["ทุนเอาประกัน", fmtNum(p.sum_insured)], ["เบี้ยสุทธิ", fmtNum(p.net_premium)],
      ["อากร", fmtNum(p.stamp_duty)], ["ภาษี", fmtNum(p.vat)], ["รวมเบี้ย", fmtNum(p.total_premium)],
    ]},
    { title:"ตัวแทน", fields:[
      ["รหัส", p.agent_code], ["ชื่อ", p.broker_name],
    ]},
  ]
  return (
    <div className="pvp">
      <div className="pvp-hd">
        <div style={{ flex:1, minWidth:0 }}>
          <div className="pvp-title">{p.insured_name || "ไม่ระบุชื่อ"}</div>
          <div style={{ marginTop:4 }}>
            <span className={`badge ${st.cls}`}><span className="bdot" />{st.label}</span>
          </div>
        </div>
        <button className="pvp-close" onClick={onClose}><Ico n="x" s={16} /></button>
      </div>
      <div className="pvp-body">
        {secs.map(sec => {
          const visible = sec.fields.filter(([,v]) => v != null && v !== "")
          if (!visible.length) return null
          return (
            <div key={sec.title} className="pvp-sec">
              <div className="pvp-sec-title">{sec.title}</div>
              {visible.map(([lbl, val]) => (
                <div key={lbl} className="pvp-row">
                  <span className="pvp-lbl">{lbl}</span>
                  <span className="pvp-val">{val}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="pvp-foot">
        <button className="btn btn-b" style={{ width:"100%", justifyContent:"center" }} onClick={onOpen}>
          <Ico n="expand" s={14} /> ดูข้อมูลทั้งหมด
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   APP
═══════════════════════════════════════════ */
const LIMIT = 10

export default function App() {
  const [tab, setTab]               = useState("dashboard")
  const [sbOpen, setSbOpen]         = useState(false)
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem("theme") === "dark")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [rows, setRows]             = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState("")
  const [page, setPage]             = useState(1)
  // view: "list" | "upload" | "manual" | "detail"
  const [view, setView]             = useState("list")
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [previewPolicy, setPreviewPolicy]   = useState(null)  // preview panel
  const [toast, setToast]           = useState(null)

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("theme", darkMode ? "dark" : "light")
  }, [darkMode])

  const notify = (msg, type = "success") => setToast({ msg, type })

  const goBack = () => { setView("list"); setSelectedPolicy(null) }

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
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

  const nav = (id) => { setTab(id); setSbOpen(false); setMobileMenu(false); setView("list") }

  const expiring = rows.filter(r => {
    if (!r.coverage_end) return false
    const d = (new Date(r.coverage_end) - new Date()) / 86400000
    return d >= 0 && d < 30
  })
  const active     = rows.filter(r => r.coverage_end && new Date(r.coverage_end) > new Date()).length
  const sumPremium = rows.reduce((s, r) => s + (Number(r.total_premium) || 0), 0)
  const pages      = Math.ceil(total / LIMIT)

  const TAB = {
    dashboard: { title: "ภาพรวมระบบ",        sub: "สรุปสถานะกรมธรรม์ประกันภัยรถยนต์" },
    policies:  { title: "กรมธรรม์ทั้งหมด",   sub: `${total.toLocaleString()} รายการในระบบ` },
    expiring:  { title: "กรมธรรม์ใกล้หมดอายุ", sub: `${expiring.length} รายการ · ต้องต่ออายุภายใน 30 วัน` },
  }

  const NAV = [
    { id: "dashboard", ico: "grid",   label: "ภาพรวม" },
    { id: "policies",  ico: "doc",    label: "กรมธรรม์ทั้งหมด" },
    { id: "expiring",  ico: "bell",   label: "ใกล้หมดอายุ", badge: expiring.length },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── TOPNAV ── */}
        <header className="sb" style={{position:"relative"}}>
          {/* โลโก้ */}
          <div className="sb-logo">
            <div className="sb-mark"><Ico n="shield" s={16} /></div>
            <div className="sb-brand">ประกันคุ้มภัย</div>
          </div>

          {/* เมนูหลัก (desktop) */}
          <nav className="sb-nav">
            {NAV.map(it => (
              <div key={it.id} className={`sb-item${tab === it.id && view==="list" ? " on" : ""}`}
                onClick={() => nav(it.id)}>
                <Ico n={it.ico} s={15} />
                <span>{it.label}</span>
                {it.badge > 0 && <span className="sb-chip">{it.badge}</span>}
              </div>
            ))}
            <div className="sb-divider" />
            <div className={`sb-item${view==="upload" ? " on" : ""}`}
              onClick={() => { setView("upload"); setMobileMenu(false) }}>
              <Ico n="upload" s={15} />
              <span>อัปโหลด PDF</span>
            </div>
          </nav>

          {/* Right: Search + status + theme + hamburger */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexShrink:0 }}>
            <div className="srch">
              <Ico n="search" s={14} />
              <input placeholder="ค้นหา เลขกรมธรรม์ / ชื่อ / ทะเบียน..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <div className="sb-dot" />
              <span className="sb-status-txt">ระบบพร้อมใช้งาน</span>
            </div>
            <button className="theme-btn" onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "โหมดสว่าง" : "โหมดมืด"}>
              <Ico n={darkMode ? "sun" : "moon"} s={16} />
            </button>
            <button className="ham" onClick={() => setMobileMenu(m => !m)}>
              <Ico n="menu" s={18} />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenu && (
            <div className="mob-menu open">
              {NAV.map(it => (
                <div key={it.id} className={`mob-item${tab === it.id && view==="list" ? " on" : ""}`}
                  onClick={() => nav(it.id)}>
                  <Ico n={it.ico} s={18} />
                  <span>{it.label}</span>
                  {it.badge > 0 && <span className="sb-chip">{it.badge}</span>}
                </div>
              ))}
              <div className={`mob-item${view==="upload" ? " on" : ""}`}
                onClick={() => { setView("upload"); setMobileMenu(false) }}>
                <Ico n="upload" s={18} />
                <span>อัปโหลด PDF</span>
              </div>
              <div className="mob-divider" />
              <div className="mob-search">
                <Ico n="search" s={15} />
                <input placeholder="ค้นหา เลขกรมธรรม์ / ชื่อ / ทะเบียน..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); setMobileMenu(false) }} />
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN ── */}
        <main className="main">
          <div className="top">
            <div className="top-l">
              <div className="top-title">{TAB[tab]?.title || ""}</div>
              <div className="top-sub">{TAB[tab]?.sub || ""}</div>
            </div>
          </div>

          {/* ══ LIST VIEW ══ */}
          {view === "list" && (
            <div className={`list-layout${previewPolicy ? " has-pvp" : ""}`}>
            <div className="body">

              {tab === "dashboard" && (
                <>
                  <div className="stats">
                    {[
                      { ico: "doc",      cls: "bl", lbl: "กรมธรรม์ทั้งหมด",   val: total.toLocaleString(),  sub: "รายการในระบบ" },
                      { ico: "shield",   cls: "gr", lbl: "คุ้มครองอยู่",       val: active,                  sub: "ยังไม่หมดอายุ" },
                      { ico: "bell",     cls: "am", lbl: "ใกล้หมดอายุ",        val: expiring.length,         sub: "ภายใน 30 วัน" },
                      { ico: "banknote", cls: "pu", lbl: "เบี้ยรวม (หน้านี้)", val: sumPremium.toLocaleString("th-TH", { maximumFractionDigits: 0 }), sub: "บาท" },
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
                      <Ico n="bell" s={18} />
                      <div className="bnr-body">
                        <div className="bnr-t">มี {expiring.length} กรมธรรม์ใกล้หมดอายุภายใน 30 วัน</div>
                        <div className="bnr-s">กรุณาติดต่อลูกค้าเพื่อต่ออายุกรมธรรม์</div>
                      </div>
                      <button className="btn btn-w"
                        style={{ fontSize: 13, padding: "7px 13px", flexShrink: 0 }}
                        onClick={() => setTab("expiring")}>
                        ดูรายการ <Ico n="arrowR" s={13} />
                      </button>
                    </div>
                  )}

                  {/* ── ช่องค้นหาใหญ่ (ใต้แดชบอร์ด) ── */}
                  <div className="big-srch-wrap">
                    <div className="big-srch">
                      <Ico n="search" s={18} />
                      <input
                        placeholder="ค้นหา เลขกรมธรรม์, ชื่อผู้เอาประกัน, ทะเบียนรถ..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                      />
                      {search && (
                        <button className="big-srch-clr" onClick={() => { setSearch(""); setPage(1) }}>
                          <Ico n="x" s={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <PolicyTable rows={rows} loading={loading} total={total}
                    page={page} pages={pages} setPage={setPage}
                    onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
                    activeId={previewPolicy?.id} pageOffset={(page-1)*LIMIT} />
                </>
              )}

              {tab === "policies" && (
                <PolicyTable rows={rows} loading={loading} total={total}
                  page={page} pages={pages} setPage={setPage}
                  onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
                  activeId={previewPolicy?.id} pageOffset={(page-1)*LIMIT} />
              )}

              {tab === "expiring" && (
                <PolicyTable rows={expiring} loading={false} total={expiring.length}
                  page={1} pages={1} setPage={() => {}}
                  onRow={r => setPreviewPolicy(prev => prev?.id === r.id ? null : r)}
                  activeId={previewPolicy?.id} pageOffset={0} />
              )}
            </div>

            {previewPolicy && (
              <PreviewPanel
                p={previewPolicy}
                onClose={() => setPreviewPolicy(null)}
                onOpen={() => { setSelectedPolicy(previewPolicy); setView("detail") }}
              />
            )}
            </div>
          )}

          {/* ══ UPLOAD PAGE ══ */}
          {view === "upload" && (
            <UploadPage
              onBack={goBack}
              onSuccess={r => {
                if (r.ok) { notify("บันทึกกรมธรรม์เรียบร้อยแล้ว"); load(); goBack() }
              }}
            />
          )}

          {/* ══ MANUAL PAGE ══ */}
          {view === "manual" && (
            <ManualPage
              onBack={goBack}
              onSuccess={r => {
                if (r.ok) { notify("บันทึกกรมธรรม์เรียบร้อยแล้ว"); load(); goBack() }
              }}
            />
          )}

          {/* ══ DETAIL PAGE ══ */}
          {view === "detail" && selectedPolicy && (
            <DetailPage p={selectedPolicy} onBack={goBack} onUpdated={load} />
          )}

        </main>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
