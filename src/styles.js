const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
/* hide number input spinner arrows — กรอกเอง ไม่ต้องการลูกศร */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type="number"]{-moz-appearance:textfield;appearance:textfield}
:root{
  --w:264px;
  --bg:#F4F8F7;
  --bg2:#E6F4F1;
  --sur:#FFFFFF;
  --sur2:#F5FAF9;
  --brd:#DEE9E6;
  --brd2:#BAD0CB;
  /* Primary = Chakra Purity teal/cyan */
  --blue:#319795;
  --blue-h:#234E52;
  --blue-bg:#E6FFFA;
  --blue-mid:#9DECF9;
  --accent:#4FD1C5;
  --g1:#319795;
  --g2:#4FD1C5;
  --g3:#81E6D9;
  --green:#0D9C6B;
  --green-bg:#E8F8F0;
  --green-brd:#9FE8CB;
  --amber:#B45309;
  --amber-bg:#FFF6E0;
  --amber-brd:#FCD688;
  --red:#DC2626;
  --red-bg:#FEF2F1;
  --red-brd:#FDCCC9;
  --t1:#0B1020;
  --t2:#3A4253;
  --t3:#6B7383;
  --sh0:0 1px 2px rgba(11,16,32,.05);
  --sh1:0 2px 6px rgba(11,16,32,.07),0 1px 2px rgba(11,16,32,.04);
  --sh2:0 8px 20px rgba(11,16,32,.08),0 2px 6px rgba(11,16,32,.05);
  --sh3:0 24px 60px rgba(11,16,32,.22),0 6px 14px rgba(11,16,32,.08);
  --shB:0 10px 24px rgba(49,151,149,.28),0 2px 6px rgba(49,151,149,.18);
  --ez:cubic-bezier(.22,.61,.36,1);
  --ez-out:cubic-bezier(.16,1,.3,1);
  --r:12px;
  --rL:18px;
  --rXL:24px;
}
body.dark{
  --bg:#0B1020;--bg2:#0F1530;--sur:#171C32;--sur2:#1B2138;
  --brd:#2B3252;--brd2:#3D466A;
  --blue:#7C7FF7;--blue-h:#A8AAFF;
  --t1:#F1F5F9;--t2:#A8B0C0;--t3:#727A8C;
  --sh0:0 1px 2px rgba(0,0,0,.25);
  --sh1:0 2px 6px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.2);
  --sh2:0 8px 20px rgba(0,0,0,.42),0 2px 6px rgba(0,0,0,.22);
  --sh3:0 24px 60px rgba(0,0,0,.55),0 6px 14px rgba(0,0,0,.3);
  --shB:0 10px 28px rgba(99,102,241,.32),0 2px 8px rgba(99,102,241,.18);
  --blue-bg:rgba(124,127,247,.16);--blue-mid:rgba(124,127,247,.38);
  --green-bg:rgba(13,156,107,.14);--green-brd:rgba(13,156,107,.32);
  --amber-bg:rgba(180,83,9,.14);--amber-brd:rgba(180,83,9,.32);
  --red-bg:rgba(220,38,38,.14);--red-brd:rgba(220,38,38,.32);
}
body{
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  font-size:16px;color:var(--t1);-webkit-font-smoothing:antialiased;line-height:1.55;
  background:var(--bg);
  background-image:
    radial-gradient(at 8% -10%, rgba(79,209,197,.14) 0, transparent 45%),
    radial-gradient(at 95% 0%, rgba(49,151,149,.10) 0, transparent 40%);
  background-attachment:fixed;
  min-height:100vh;
}
body.dark{
  background-image:
    radial-gradient(at 10% -10%, rgba(99,102,241,.22) 0, transparent 50%),
    radial-gradient(at 95% 5%, rgba(34,211,238,.10) 0, transparent 45%);
}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,var(--brd2),#94A3B8);border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#94A3B8,#64748B)}
::-webkit-scrollbar-track{background:transparent}
::selection{background:rgba(99,102,241,.22);color:inherit}

.app{display:flex;flex-direction:column;min-height:100vh}

.sb{
  width:100%;
  background:rgba(255,255,255,.78);
  -webkit-backdrop-filter:saturate(180%) blur(14px);
  backdrop-filter:saturate(180%) blur(14px);
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;
  border-bottom:1px solid rgba(226,229,238,.85);
  padding:0 24px;height:76px;gap:0;
}
body.dark .sb{background:rgba(23,28,50,.78);border-bottom-color:rgba(43,50,82,.85)}
.theme-btn{
  width:42px;height:42px;border-radius:12px;
  background:var(--sur);border:1px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:transform .15s var(--ez-out),background .15s,color .15s,border-color .15s,box-shadow .15s;
  box-shadow:var(--sh0);
}
.theme-btn:hover{background:var(--blue-bg);color:var(--blue);border-color:var(--blue-mid);transform:translateY(-1px)}
.ham{
  width:42px;height:42px;border-radius:12px;
  background:var(--sur);border:1px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:none;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .15s;box-shadow:var(--sh0);
}
.ham:hover{background:var(--blue-bg);color:var(--blue);border-color:var(--blue-mid)}
.mob-menu{
  display:none;position:absolute;top:76px;left:0;right:0;
  background:var(--sur);border-bottom:1px solid var(--brd);
  box-shadow:var(--sh2);z-index:99;
  flex-direction:column;padding:12px 14px 16px;
}
.mob-menu.open{display:flex;animation:slideDown .18s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
.mob-item{
  display:flex;align-items:center;gap:12px;
  padding:14px 14px;border-radius:10px;cursor:pointer;
  color:var(--t2);font-size:17px;font-weight:500;
  transition:all .12s;
}
.mob-item:hover{background:var(--sur2);color:var(--t1)}
.mob-item.on{background:var(--blue-bg);color:var(--blue);font-weight:700}
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
  display:flex;align-items:center;gap:12px;
  padding:0 22px 0 0;margin-right:14px;
  height:100%;flex-shrink:0;position:relative;
}
.sb-logo::after{
  content:"";position:absolute;right:0;top:50%;transform:translateY(-50%);
  width:1px;height:36px;background:var(--brd);
}
.sb-logo img:first-child{
  filter:drop-shadow(0 4px 10px rgba(99,102,241,.18));
  transition:transform .35s var(--ez-out);
}
.sb-logo:hover img:first-child{transform:scale(1.05) rotate(-3deg)}
.sb-mark{
  width:42px;height:42px;
  background:linear-gradient(135deg,var(--g1),var(--g2));
  border-radius:13px;display:flex;align-items:center;
  justify-content:center;flex-shrink:0;color:#fff;
  box-shadow:0 4px 12px rgba(99,102,241,.32);
}
.sb-brand-wrap{display:flex;flex-direction:column;gap:1px;min-width:0}
.sb-brand{font-size:18px;font-weight:700;color:var(--t1);letter-spacing:-.3px;line-height:1.2;white-space:nowrap}
.sb-brand-sub{font-size:12.5px;color:var(--t3);font-weight:500;letter-spacing:.1px;white-space:nowrap}
@media(max-width:639px){.sb-brand-sub{display:none}}
.sb-nav{
  display:flex;align-items:center;flex:1;gap:2px;
  padding:0;overflow:visible;
}
.sb-item{
  display:flex;align-items:center;gap:9px;
  padding:9px 16px;border-radius:10px;
  cursor:pointer;color:var(--t2);font-size:15.5px;
  font-weight:500;transition:all .13s;
  position:relative;height:42px;
}
.sb-item:hover{background:var(--sur2);color:var(--t1)}
.sb-item.on{background:var(--blue-bg);color:var(--blue);font-weight:700}
.sb-item.on svg{stroke:var(--blue)}
.sb-chip{
  background:var(--blue-mid);color:var(--blue);
  border-radius:99px;padding:1px 8px;
  font-size:11.5px;font-weight:700;line-height:1.5;
}
.sb-item.on .sb-chip{background:#FEF3C7;color:#D97706}
.sb-divider{width:1px;height:20px;background:var(--brd);margin:0 6px;flex-shrink:0}
.sb-dot{width:6px;height:6px;border-radius:50%;background:#34D399;flex-shrink:0;box-shadow:0 0 0 2px rgba(52,211,153,.3)}
.sb-status-txt{font-size:14px;color:var(--t3);white-space:nowrap}
@keyframes sb-dot-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.85)}}


.main{flex:1;display:flex;flex-direction:column;min-width:0}

.top{
  min-height:68px;
  background:transparent;
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;padding:14px 28px;gap:14px;
}
.top-l{flex:1;min-width:0}
.top-title{font-size:24px;font-weight:700;color:var(--t1);letter-spacing:-.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.top-sub{font-size:14.5px;color:var(--t3);margin-top:4px;font-weight:400;letter-spacing:.1px}
.top-srch{
  display:flex;align-items:center;gap:10px;
  background:var(--sur2);border:1.5px solid var(--brd);
  border-radius:10px;padding:0 14px;height:44px;
  width:320px;flex-shrink:0;transition:border-color .15s;
}
.top-srch:focus-within{border-color:var(--blue);background:var(--sur)}
.top-srch svg{color:var(--t3);flex-shrink:0}
.top-srch input{flex:1;border:none;background:transparent;outline:none;font-size:15px;font-family:inherit;color:var(--t1);min-width:0}
.top-srch input::placeholder{color:var(--t3)}
.top-srch-clr{background:none;border:none;cursor:pointer;padding:2px;color:var(--t3);display:flex;align-items:center;border-radius:4px}
.top-srch-clr:hover{color:var(--t1);background:var(--brd)}

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

.list-layout{display:flex;align-items:flex-start;flex:1}
.list-layout .body{flex:1;min-width:0;transition:all .25s}

.pvp{
  width:46%;min-width:460px;max-width:720px;flex-shrink:0;
  background:var(--sur);border-left:1px solid var(--brd);
  position:sticky;top:88px;height:calc(100vh - 104px);
  display:flex;flex-direction:column;overflow:hidden;
  animation:pvp-in .2s ease;
}
@keyframes pvp-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:767px){
  .pvp{
    position:fixed;inset:0;top:auto;bottom:0;
    width:100%;height:88vh;border-left:none;
    border-top:2px solid var(--brd);border-radius:16px 16px 0 0;
    z-index:150;box-shadow:0 -8px 32px rgba(0,0,0,.18);
    animation:pvp-up .22s ease;
  }
  @keyframes pvp-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .list-layout{position:relative}
}
@media(max-width:639px){
  .card{overflow-x:auto}
  table{min-width:520px}
}
.pvp-hd{
  padding:14px 18px;border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.pvp-title{font-size:18px;font-weight:700;color:var(--t1);line-height:1.3}
/* X close button — เรียบๆ แต่เห็นชัดด้วย border ที่เข้มขึ้น */
.pvp-close{
  background:var(--sur);border:1.5px solid var(--t3);border-radius:8px;
  width:36px;height:36px;cursor:pointer;display:flex;
  align-items:center;justify-content:center;
  color:var(--t1);flex-shrink:0;transition:all .15s;margin-left:auto;
}
.pvp-close:hover{background:var(--red-bg);border-color:var(--red);color:var(--red)}
.pvp-backdrop{display:none}
/* pill ที่กดได้ — ปิด sheet (desktop ซ่อน, mobile โชว์) */
.pvp-pill{display:none}
@media(max-width:767px){
  .pvp-backdrop{display:block;position:fixed;inset:0;z-index:149;background:rgba(0,0,0,.4)}
  /* mobile: ใหญ่ขึ้นเพื่อกดง่าย */
  .pvp-close{width:42px;height:42px}
  /* drag handle = ปุ่มจริง คลิกแล้วปิด */
  .pvp-pill{
    display:block;flex-shrink:0;
    width:100%;padding:10px 0 6px;
    background:transparent;border:none;cursor:pointer;
    position:relative;
  }
  .pvp-pill::after{
    content:"";display:block;margin:0 auto;
    width:48px;height:5px;border-radius:99px;
    background:#94a3b8;transition:all .15s;
  }
  .pvp-pill:hover::after,.pvp-pill:active::after{
    background:var(--t1);width:64px;
  }
}
.pvp-body{overflow-y:auto;padding:14px 18px;flex:1 1 auto;min-height:0}
.pvp-sec{margin-bottom:10px}
.pvp-sec-title{
  font-size:13px;font-weight:700;color:var(--t2);
  text-transform:none;letter-spacing:.2px;
  padding:10px 0 8px;border-bottom:1px solid var(--brd);margin-bottom:8px;
}
.pvp-row{display:flex;align-items:baseline;gap:10px;padding:7px 0;border-bottom:1px solid var(--sur2)}
.pvp-row:last-child{border-bottom:none}
.pvp-lbl{font-size:14px;font-weight:600;color:var(--t3);letter-spacing:.2px;flex-shrink:0;width:104px}
.pvp-val{font-size:15.5px;color:var(--t1);word-break:break-word}
.pvp-foot{padding:14px 18px;border-top:1px solid var(--brd);flex-shrink:0}

tr.tr-active td{background:var(--blue-bg) !important}

.filter-wrap{margin-bottom:12px;display:flex;flex-direction:column;gap:8px}

/* Search row with toggle button */
.srch-row{display:flex;gap:10px;align-items:stretch}
.srch-row .big-srch{flex:1}
.ftoggle{
  display:inline-flex;align-items:center;gap:9px;
  padding:0 22px;border-radius:14px;border:1.5px solid var(--brd);
  background:var(--sur);color:var(--t2);cursor:pointer;
  font-size:17px;font-weight:600;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  transition:all .14s;white-space:nowrap;flex-shrink:0;box-shadow:var(--sh0);
}
.ftoggle:hover{background:var(--sur2);border-color:var(--brd2);color:var(--t1)}
.ftoggle.open{background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.ftoggle.has-active{border-color:var(--blue-mid);color:var(--blue)}
.ftoggle-badge{
  background:var(--blue);color:#fff;
  border-radius:99px;padding:1px 7px;font-size:11.5px;font-weight:700;line-height:1.5;
}

/* ═══════════════════════════════════════════════════════════
   Charts — donut + line (pure SVG)
   ═══════════════════════════════════════════════════════════ */
.charts-grid{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:18px;margin-bottom:22px;
}
.charts-grid-row1{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)}
.charts-grid-row2{grid-template-columns:1fr}
.list-layout.has-pvp .charts-grid{grid-template-columns:1fr}
@media(max-width:900px){.charts-grid{grid-template-columns:1fr;gap:14px}}

.chart-card{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--rL);padding:20px 22px 18px;
  box-shadow:var(--sh1);
  display:flex;flex-direction:column;gap:14px;
  transition:box-shadow .25s var(--ez-out);
  animation:scIn .55s var(--ez-out) backwards;
}
.chart-card:hover{box-shadow:var(--sh2)}
.chart-card:nth-child(1){animation-delay:60ms}
.chart-card:nth-child(2){animation-delay:140ms}

.chart-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.chart-ttl{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.3}
.chart-sub{font-size:13px;color:var(--t3);margin-top:3px;font-weight:400}
.chart-tag{
  font-size:12px;font-weight:700;color:var(--blue);
  background:var(--blue-bg);border:1px solid var(--blue-mid);
  padding:3px 10px;border-radius:99px;
}
.chart-period{
  font-family:inherit;font-size:13px;font-weight:600;color:var(--t1);
  background:var(--sur2);border:1.5px solid var(--brd);
  padding:6px 30px 6px 12px;border-radius:9px;cursor:pointer;outline:none;
  appearance:none;-webkit-appearance:none;-moz-appearance:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat:no-repeat;background-position:right 9px center;background-size:11px;
  transition:border-color .15s ease,background-color .15s ease;
}
.chart-period:hover{border-color:var(--blue);background-color:var(--blue-bg)}
.chart-period:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(99,102,241,.14)}
.chart-bd{flex:1;min-height:0}

/* chart bottom legend */
.chart-legend{
  display:flex;gap:18px;flex-wrap:wrap;justify-content:center;
  padding-top:6px;margin-top:-4px;
}
.cl-item{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--t2)}
.cl-line{width:18px;height:3px;border-radius:99px;flex-shrink:0;display:inline-block}
.cl-name{font-weight:500}
.cl-sum{
  font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;
  background:var(--sur2);padding:1px 8px;border-radius:99px;font-size:12px;
}

/* Donut */
.donut-row{display:flex;align-items:center;gap:24px}
.donut-wrap{position:relative;width:160px;height:160px;flex-shrink:0}
.donut-svg{transform:rotate(-90deg);display:block}
.donut-center{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;pointer-events:none;
}
.donut-num{
  font-size:30px;font-weight:700;color:var(--t1);letter-spacing:-1px;line-height:1;
  font-variant-numeric:tabular-nums;
}
.donut-lbl{font-size:12.5px;color:var(--t3);margin-top:4px;font-weight:500;letter-spacing:.3px}
.donut-legend{flex:1;display:flex;flex-direction:column;gap:11px;min-width:0}
.lg-row{
  display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;
  font-size:13.5px;
}
.lg-dot{
  width:11px;height:11px;border-radius:50%;flex-shrink:0;
  box-shadow:0 0 0 2px rgba(255,255,255,.6),0 2px 4px rgba(0,0,0,.08);
}
.lg-lbl{color:var(--t2);font-weight:500;overflow:hidden;text-overflow:ellipsis}
.lg-val{color:var(--t1);font-weight:700;font-variant-numeric:tabular-nums}
.lg-pct{
  color:var(--t3);font-weight:600;font-size:12px;font-variant-numeric:tabular-nums;
  background:var(--sur2);padding:2px 8px;border-radius:99px;
  min-width:42px;text-align:center;
}

/* Line chart — ใช้ aspect-ratio ตรงกับ viewBox (720x220) กัน text บิดเบี้ยว */
.line-svg{width:100%;display:block;aspect-ratio:720/220;max-height:260px}
@media(max-width:639px){
  .donut-row{flex-direction:column;gap:18px;align-items:stretch}
  .donut-wrap{align-self:center}
  .donut-legend{align-self:stretch}
  .line-svg{aspect-ratio:auto;height:200px}
  .chart-card{padding:16px 16px 14px}
}

.chart-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;padding:48px 20px;color:var(--t3);font-size:14px;
}
.chart-empty svg{opacity:.5}

/* Expiry Forecast — top meta strip (expired + unknown) */
.fc-meta{
  display:flex;gap:8px;flex-wrap:wrap;
  padding:10px 14px;
  background:linear-gradient(180deg,var(--sur2),transparent);
  border-bottom:1px solid var(--brd);
  margin:0 -22px;
}
.fc-meta-pill{
  display:inline-flex;align-items:center;gap:8px;
  font-size:13px;color:var(--t2);font-weight:500;
  background:var(--sur);border:1px solid var(--brd);
  padding:5px 11px;border-radius:99px;
  box-shadow:var(--sh0);
  transition:background .15s,border-color .15s,transform .2s var(--ez-out);
}
.fc-meta-pill b{color:var(--t1);font-weight:700;font-variant-numeric:tabular-nums}
.fc-meta-pill.fc-meta-expired{cursor:pointer;border-color:var(--red-brd);background:var(--red-bg)}
.fc-meta-pill.fc-meta-expired b{color:#DC2626}
.fc-meta-pill.fc-meta-expired:hover{transform:translateY(-1px);border-color:#DC2626}

/* Expiry Forecast — donut variant */
.fc-donut-wrap{width:180px;height:180px;flex-shrink:0;position:relative}
.fc-donut-wrap .donut-svg{animation:fcDonutIn .6s var(--ez-out) both}
@keyframes fcDonutIn{from{opacity:0;transform:rotate(-90deg) scale(.9)}to{opacity:1;transform:rotate(-90deg) scale(1)}}
.fc-donut-wrap::before{
  content:"";position:absolute;inset:14px;border-radius:50%;
  background:radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 70%);
  pointer-events:none;
}
.fc-legend{flex:1;display:flex;flex-direction:column;gap:9px;min-width:0;padding-left:6px}
.fc-lg-row{
  display:grid;grid-template-columns:14px 1fr auto auto;align-items:center;gap:12px;
  padding:6px 10px;border-radius:9px;font-size:13.5px;
  transition:background .15s ease;position:relative;
}
.fc-lg-row.fc-urgent .lg-lbl{color:#B45309;font-weight:700}
.fc-lg-row.fc-urgent::before{
  content:"";position:absolute;left:-2px;top:8px;bottom:8px;width:3px;
  background:linear-gradient(180deg,#F59E0B,#FBBF24);border-radius:2px;
}
.fc-lg-row.fc-clickable{cursor:pointer}
.fc-lg-row.fc-clickable:hover{background:var(--sur2)}
.fc-lg-row .lg-lbl{color:var(--t2);font-weight:500;text-align:left}
.fc-lg-row .lg-val{color:var(--t1);font-weight:700;font-variant-numeric:tabular-nums;text-align:right;min-width:32px}
.fc-lg-row .lg-pct{
  color:var(--t3);font-weight:600;font-size:12px;font-variant-numeric:tabular-nums;
  background:var(--sur2);padding:2px 9px;border-radius:99px;min-width:44px;text-align:center;
}
@media(max-width:639px){
  .fc-donut-wrap{width:150px;height:150px}
  .fc-lg-row{font-size:12.5px;grid-template-columns:12px 1fr auto auto;gap:10px}
}

/* Expiry Forecast horizontal bars (legacy — unused, kept for reference) */
.forecast-bars{display:flex;flex-direction:column;gap:10px;padding:4px 0}
.fc-row{
  display:grid;grid-template-columns:108px 1fr 40px;align-items:center;gap:12px;
  padding:7px 8px;border-radius:9px;
  background:transparent;border:none;font-family:inherit;cursor:pointer;color:var(--t2);
  text-align:left;
  transition:background .15s ease;position:relative;
}
.fc-row:hover:not(:disabled){background:var(--sur2)}
.fc-row:disabled{cursor:default;opacity:.55}
.fc-row.fc-urgent .fc-lbl{color:#B45309;font-weight:700}
.fc-row.fc-urgent::before{
  content:"";position:absolute;left:-2px;top:8px;bottom:8px;width:3px;
  background:linear-gradient(180deg,#F59E0B,#FBBF24);border-radius:2px;
}
.fc-lbl{font-size:13px;font-weight:500;color:var(--t2);text-align:right;line-height:1.3}
.fc-bar-wrap{
  height:18px;background:var(--sur2);border-radius:9px;overflow:hidden;
  position:relative;border:1px solid var(--brd);
}
.fc-bar{
  height:100%;border-radius:9px;min-width:0;
  transition:width .6s var(--ez-out);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22);
}
.fc-row:hover .fc-bar{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 8px currentColor}
.fc-count{
  font-size:14px;font-weight:700;color:var(--t1);
  font-variant-numeric:tabular-nums;text-align:right;
}
@media(max-width:639px){
  .fc-row{grid-template-columns:84px 1fr 32px;gap:8px}
  .fc-lbl{font-size:12px}
  .fc-count{font-size:13px}
}

/* ═══════════════════════════════════════════════════════════
   Menu grid — ปุ่มเมนูสากล (icon-left + title + arrow)
   ═══════════════════════════════════════════════════════════ */
.menu-grid{
  display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;
}
.list-layout.has-pvp .menu-grid{grid-template-columns:1fr 1fr}
@media(max-width:1023px){.menu-grid{grid-template-columns:1fr 1fr;gap:12px}}
@media(max-width:480px){.menu-grid{grid-template-columns:1fr}}

.menu-card{
  position:relative;overflow:hidden;cursor:pointer;
  display:flex;align-items:center;gap:14px;
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--rL);padding:16px 18px;
  font-family:inherit;text-align:left;color:var(--t1);
  box-shadow:var(--sh0);
  transition:transform .25s var(--ez-out),box-shadow .25s var(--ez-out),border-color .2s ease,background .2s ease;
  animation:scIn .5s var(--ez-out) backwards;
}
.menu-card:nth-child(1){animation-delay:40ms}
.menu-card:nth-child(2){animation-delay:100ms}
.menu-card:nth-child(3){animation-delay:160ms}
.menu-card:nth-child(4){animation-delay:220ms}

/* per-color theme */
.menu-card.menu-bl{--mc:#4F46E5;--mc2:#6366F1;--mc-glow:rgba(99,102,241,.18);--mc-tint:rgba(99,102,241,.04)}
.menu-card.menu-gr{--mc:#0D9C6B;--mc2:#10B981;--mc-glow:rgba(16,185,129,.18);--mc-tint:rgba(16,185,129,.04)}
.menu-card.menu-pu{--mc:#A855F7;--mc2:#C084FC;--mc-glow:rgba(168,85,247,.18);--mc-tint:rgba(168,85,247,.04)}
.menu-card.menu-am{--mc:#D97706;--mc2:#F59E0B;--mc-glow:rgba(245,158,11,.20);--mc-tint:rgba(245,158,11,.05)}

.menu-card:hover{
  transform:translateY(-2px);
  border-color:var(--mc);
  background:var(--mc-tint);
  box-shadow:0 12px 24px var(--mc-glow),0 2px 6px rgba(11,16,32,.04);
}

/* icon container — gradient, rounded square */
.menu-ico{
  width:48px;height:48px;border-radius:13px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(135deg,var(--mc),var(--mc2));
  box-shadow:0 4px 12px var(--mc-glow),inset 0 1px 0 rgba(255,255,255,.22);
  transition:transform .3s var(--ez-out);
}
.menu-card:hover .menu-ico{transform:scale(1.06) rotate(-4deg)}

/* text */
.menu-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.menu-ttl{
  display:flex;align-items:center;gap:8px;
  font-size:15.5px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.3;
  transition:color .2s ease;
}
.menu-card:hover .menu-ttl{color:var(--mc)}
.menu-desc{
  font-size:13px;color:var(--t3);font-weight:400;line-height:1.4;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.menu-dot{
  width:7px;height:7px;border-radius:50%;background:#DC2626;flex-shrink:0;
  box-shadow:0 0 0 0 rgba(220,38,38,.5);
  animation:menuDot 1.6s var(--ez) infinite;
}
@keyframes menuDot{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}60%{box-shadow:0 0 0 6px transparent}}

/* arrow */
.menu-arrow{
  width:32px;height:32px;border-radius:10px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  color:var(--t3);background:var(--sur2);border:1px solid var(--brd);
  transition:transform .3s var(--ez-out),background .2s ease,color .2s ease,border-color .2s ease;
}
.menu-card:hover .menu-arrow{
  color:#fff;background:linear-gradient(135deg,var(--mc),var(--mc2));border-color:transparent;
  transform:translateX(3px);
  box-shadow:0 4px 10px var(--mc-glow);
}
.menu-arrow svg{transition:transform .25s var(--ez-out)}
.menu-card:hover .menu-arrow svg{transform:translateX(2px)}

@media(max-width:639px){
  .menu-card{padding:14px;gap:12px}
  .menu-ico{width:42px;height:42px;border-radius:11px}
  .menu-ttl{font-size:14.5px}
  .menu-desc{font-size:12.5px}
  .menu-arrow{width:28px;height:28px}
}

/* ═══════════════════════════════════════════════════════════
   sc-menu — เมนู 4 ปุ่ม (ใช้ stat-card layout ตรงๆ + accent line บน)
   ═══════════════════════════════════════════════════════════ */
.sc.sc-menu{
  cursor:pointer;font-family:inherit;text-align:left;
}
/* per-color theme variables (used by accent line) */
.sc.sc-m-bl{--mc:#4F46E5;--mc2:#7C3AED}
.sc.sc-m-gr{--mc:#0D9C6B;--mc2:#10B981}
.sc.sc-m-pu{--mc:#A855F7;--mc2:#EC4899}
.sc.sc-m-am{--mc:#D97706;--mc2:#F59E0B}

/* override base .sc::before — เปลี่ยนจากแถบซ้ายเป็นแถบบน สีเด่นตลอด */
.sc.sc-menu::before{
  left:0;right:0;top:0;width:auto;bottom:auto;height:3px;
  background:linear-gradient(90deg,var(--mc),var(--mc2));
  opacity:1;
}
.sc.sc-menu:hover::before{opacity:1}

/* override base .sc::after — corner glow ตามสี (subtle, hover เข้มขึ้น) */
.sc.sc-menu::after{
  background:radial-gradient(circle,var(--mc) 0%,transparent 60%);
  opacity:.05;
}
.sc.sc-menu:hover::after{opacity:.12}

/* val ถ้าเป็นตัวอักษร (ไม่ใช่ตัวเลข) — ลด font-size ให้พอดี */
.sc.sc-menu .sc-val{font-size:30px}

/* arrow pill มุมขวาล่าง — บ่งบอกชัดว่าเป็นเมนูคลิกได้ */
.sc-menu-go{
  position:absolute;right:16px;bottom:14px;z-index:2;
  width:30px;height:30px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(135deg,var(--mc),var(--mc2));
  opacity:.75;
  transition:opacity .25s ease,transform .3s var(--ez-out),box-shadow .25s ease;
  box-shadow:0 4px 10px rgba(0,0,0,.10);
}
.sc.sc-menu:hover .sc-menu-go{opacity:1;transform:translateX(3px) scale(1.08);box-shadow:0 6px 14px rgba(0,0,0,.16)}
@media(max-width:639px){
  .sc.sc-menu .sc-val{font-size:22px}
  .sc-menu-go{width:26px;height:26px;right:12px;bottom:12px}
}

/* Section header — แบ่ง dashboard เป็นกลุ่มชัดเจน */
.sec-hd{
  display:flex;align-items:center;gap:10px;
  margin:24px 0 12px;padding:0 4px;
  font-size:12.5px;font-weight:700;color:var(--t2);
  letter-spacing:.8px;text-transform:uppercase;
}
.sec-hd:first-child{margin-top:0}
.sec-hd > svg{color:var(--blue);flex-shrink:0}
.sec-hd small{
  font-size:12px;font-weight:400;color:var(--t3);
  letter-spacing:.1px;text-transform:none;
  padding-left:4px;
}
.sec-hd::after{
  content:"";flex:1;height:1px;
  background:linear-gradient(90deg,var(--brd),transparent);
  margin-left:6px;
}
@media(max-width:639px){
  .sec-hd{margin:18px 0 10px}
  .sec-hd small{display:none}
}

/* ═══════════════════════════════════════════════════════════
   Service cards — เมนูใหญ่ 4 ใบ สีสด (ตาม ref Services)
   ═══════════════════════════════════════════════════════════ */
.svc-grid{
  display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;
}
.list-layout.has-pvp .svc-grid{grid-template-columns:repeat(2,1fr)}
@media(max-width:1024px){.svc-grid{grid-template-columns:repeat(2,1fr);gap:14px}}
@media(max-width:420px){.svc-grid{grid-template-columns:1fr}}

.svc-card{
  position:relative;overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;justify-content:space-between;
  min-height:200px;padding:28px 22px 22px;
  border-radius:22px;border:none;color:#fff;font-family:inherit;text-align:left;
  box-shadow:0 8px 22px rgba(11,16,32,.10);
  transition:transform .35s var(--ez-out),box-shadow .35s var(--ez-out);
  animation:scIn .55s var(--ez-out) backwards;
  isolation:isolate;
}
.svc-card:nth-child(1){animation-delay:40ms}
.svc-card:nth-child(2){animation-delay:100ms}
.svc-card:nth-child(3){animation-delay:160ms}
.svc-card:nth-child(4){animation-delay:220ms}
.svc-card:hover{transform:translateY(-6px);box-shadow:0 24px 44px rgba(11,16,32,.18)}

/* Per-color gradients — teal-led palette (Chakra Purity) */
.svc-card.svc-green {background:linear-gradient(135deg,#234E52 0%,#319795 55%,#4FD1C5 100%)}
.svc-card.svc-blue  {background:linear-gradient(135deg,#0369A1 0%,#0EA5E9 55%,#38BDF8 100%)}
.svc-card.svc-purple{background:linear-gradient(135deg,#7C3AED 0%,#A855F7 55%,#C084FC 100%)}
.svc-card.svc-amber {background:linear-gradient(135deg,#BE185D 0%,#EC4899 55%,#F472B6 100%)}

/* Decorative SVG wave overlay — flowing organic shapes */
.svc-wave{
  position:absolute;inset:0;z-index:0;pointer-events:none;
  width:100%;height:100%;display:block;
  transition:transform .5s var(--ez-out),opacity .35s ease;
}
.svc-card:hover .svc-wave{transform:scale(1.05) rotate(2deg);opacity:1}

/* Big white icon circle */
.svc-icon{
  position:relative;z-index:1;
  width:84px;height:84px;border-radius:50%;
  background:rgba(255,255,255,.96);
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 0;
  box-shadow:
    0 10px 24px rgba(0,0,0,.14),
    inset 0 -3px 6px rgba(0,0,0,.04),
    inset 0 2px 4px rgba(255,255,255,.5);
  transition:transform .4s var(--ez-out);
}
.svc-card:hover .svc-icon{transform:scale(1.08) rotate(-6deg)}
.svc-card.svc-green  .svc-icon svg{color:#234E52}  /* deep teal */
.svc-card.svc-blue   .svc-icon svg{color:#0284C7}  /* sky */
.svc-card.svc-purple .svc-icon svg{color:#7C3AED}  /* purple */
.svc-card.svc-amber  .svc-icon svg{color:#BE185D}  /* hot pink */

/* Footer with title + badge */
.svc-foot{
  position:relative;z-index:1;margin-top:18px;
  display:flex;align-items:flex-end;justify-content:space-between;gap:12px;
}
.svc-title{
  font-size:17px;font-weight:700;color:#fff;letter-spacing:-.2px;line-height:1.3;
  text-shadow:0 1px 2px rgba(0,0,0,.10);
  flex:1;min-width:0;
}
.svc-badge{
  display:inline-flex;align-items:center;gap:6px;
  font-size:14px;font-weight:700;color:#fff;
  background:rgba(255,255,255,.22);
  border:1px solid rgba(255,255,255,.35);
  padding:5px 12px;border-radius:99px;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  font-variant-numeric:tabular-nums;flex-shrink:0;
  transition:transform .2s var(--ez-out),background .2s ease;
}
.svc-card:hover .svc-badge{background:rgba(255,255,255,.32);transform:scale(1.05)}
.svc-badge svg{opacity:.95}
.svc-badge.svc-badge-pulse{animation:svcPulse 1.8s var(--ez) infinite}
@keyframes svcPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.5)}
  60%{box-shadow:0 0 0 8px transparent}
}

@media(max-width:639px){
  .svc-card{padding:22px 18px 18px;min-height:170px;border-radius:18px}
  .svc-icon{width:70px;height:70px}
  .svc-icon svg{width:30px;height:30px}
  .svc-title{font-size:15.5px}
  .svc-badge{font-size:13px;padding:4px 10px}
}

/* ═══════════════════════════════════════════════════════════
   Expiring page — stat strip + filter cards
   ═══════════════════════════════════════════════════════════ */
.exp-stats{
  display:grid;grid-template-columns:repeat(6,1fr);gap:12px;
  margin-bottom:18px;
}
.list-layout.has-pvp .exp-stats{grid-template-columns:repeat(3,1fr)}
@media(max-width:1024px){.exp-stats{grid-template-columns:repeat(3,1fr)}}
@media(max-width:639px){.exp-stats{grid-template-columns:repeat(2,1fr);gap:9px}}

.exp-stat{
  position:relative;overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;gap:8px;
  background:var(--sur);border:1.5px solid var(--brd);
  border-radius:14px;padding:14px 16px;
  font-family:inherit;text-align:left;color:var(--t1);
  box-shadow:var(--sh0);
  transition:transform .25s var(--ez-out),box-shadow .25s var(--ez-out),border-color .2s ease,background .2s ease;
  animation:scIn .5s var(--ez-out) backwards;
}
.exp-stat:nth-child(1){animation-delay:30ms}
.exp-stat:nth-child(2){animation-delay:80ms}
.exp-stat:nth-child(3){animation-delay:130ms}
.exp-stat:nth-child(4){animation-delay:180ms}
.exp-stat:nth-child(5){animation-delay:230ms}
.exp-stat:nth-child(6){animation-delay:280ms}

/* Original urgency-spectrum palette */
.exp-stat-urg1{--ec:#DC2626;--ec2:#EF4444;--ec-bg:rgba(220,38,38,.07)}     /* red — critical */
.exp-stat-urg7{--ec:#F97316;--ec2:#FB923C;--ec-bg:rgba(249,115,22,.07)}    /* orange */
.exp-stat-urg30{--ec:#F59E0B;--ec2:#FBBF24;--ec-bg:rgba(245,158,11,.07)}   /* amber */
.exp-stat-urg60{--ec:#06B6D4;--ec2:#22D3EE;--ec-bg:rgba(6,182,212,.07)}    /* cyan */
.exp-stat-urg90{--ec:#10B981;--ec2:#34D399;--ec-bg:rgba(16,185,129,.06)}   /* green */
.exp-stat-expired{--ec:#64748B;--ec2:#94A3B8;--ec-bg:rgba(100,116,139,.06)} /* gray */

.exp-stat::before{
  content:"";position:absolute;left:0;right:0;top:0;height:3px;
  background:linear-gradient(90deg,var(--ec),var(--ec2));
  opacity:.5;transition:opacity .2s ease;
}
.exp-stat:hover{
  transform:translateY(-3px);
  border-color:var(--ec);
  box-shadow:0 10px 22px var(--ec-bg);
}
.exp-stat:hover::before{opacity:1}
.exp-stat-on{
  background:var(--ec-bg);border-color:var(--ec);
  box-shadow:0 10px 22px var(--ec-bg);
}
.exp-stat-on::before{opacity:1;height:4px}

.exp-stat-hd{display:flex;align-items:center;gap:10px}
.exp-stat-icn{
  width:30px;height:30px;border-radius:9px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(135deg,var(--ec),var(--ec2));
  box-shadow:0 4px 10px var(--ec-bg);
  transition:transform .25s var(--ez-out);
}
.exp-stat:hover .exp-stat-icn{transform:scale(1.08) rotate(-6deg)}
.exp-stat-lbl{font-size:12px;font-weight:700;color:var(--t3);letter-spacing:.4px;text-transform:uppercase;line-height:1.2;flex:1;min-width:0}
.exp-stat-on .exp-stat-lbl{color:var(--ec)}
.exp-stat-num{
  font-size:26px;font-weight:700;letter-spacing:-.8px;line-height:1;
  color:var(--t1);font-variant-numeric:tabular-nums;
}
.exp-stat-on .exp-stat-num{color:var(--ec)}
@media(max-width:639px){
  .exp-stat{padding:11px 12px}
  .exp-stat-lbl{font-size:11px;letter-spacing:.2px}
  .exp-stat-num{font-size:22px;letter-spacing:-.5px}
}

/* ═══════════════════════════════════════════════════════════
   Daily Upload Report — กิจกรรมอัปโหลดวันนี้
   ═══════════════════════════════════════════════════════════ */
.report-card{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--rL);padding:20px 22px;
  box-shadow:var(--sh1);margin-bottom:22px;
  display:flex;flex-direction:column;gap:18px;
  animation:scIn .55s var(--ez-out) backwards;
}
.report-hd{display:flex;align-items:center;gap:14px}
.report-hd-ico{
  width:44px;height:44px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(135deg,#6366F1,#A855F7);
  box-shadow:0 6px 14px rgba(99,102,241,.30);
}
.report-hd-l{flex:1;min-width:0}
.report-hd-ttl{font-size:16.5px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.25}
.report-hd-sub{font-size:13px;color:var(--t3);margin-top:3px;font-weight:400}
.report-hd-r{
  display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;
}
.report-hd-num{
  font-size:30px;font-weight:700;color:#4F46E5;line-height:1;letter-spacing:-1px;
  font-variant-numeric:tabular-nums;
}
.report-hd-lbl{font-size:11.5px;color:var(--t3);margin-top:3px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}

.report-body{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:900px){.report-body{grid-template-columns:1fr;gap:16px}}

/* Activity feed (left) */
.report-feed-hd{
  display:flex;align-items:center;justify-content:space-between;
  font-size:12.5px;font-weight:700;color:var(--t3);
  text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;
}
.report-feed{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;padding-right:2px}
.report-feed::-webkit-scrollbar{width:5px}
.report-feed::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:99px}
.feed-item{
  display:flex;align-items:center;gap:11px;
  padding:10px 12px;border-radius:11px;
  border:1px solid var(--brd);background:var(--sur2);
  transition:border-color .15s ease,background .15s ease;
}
.feed-item:hover{border-color:var(--blue-mid);background:var(--blue-bg)}
.feed-item-ico{
  width:32px;height:32px;border-radius:9px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:var(--blue-bg);color:var(--blue);
}
.feed-item-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.feed-item-name{
  font-size:14px;font-weight:600;color:var(--t1);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.feed-item-meta{
  font-size:12px;color:var(--t3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.feed-item-time{
  font-size:11.5px;color:var(--t3);font-variant-numeric:tabular-nums;flex-shrink:0;
}
.feed-empty{
  padding:32px 16px;text-align:center;color:var(--t3);font-size:13.5px;
  background:var(--sur2);border:1px dashed var(--brd2);border-radius:11px;
}

/* ── Work breakdown (new daily report) ── */
.work-body{
  display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:24px;
  padding-top:4px;
}
@media(max-width:900px){.work-body{grid-template-columns:1fr;gap:18px}}

/* Left: bigger donut + category list with polish */
.work-breakdown{
  display:flex;flex-direction:column;align-items:center;gap:20px;
  padding:22px 18px;
  background:linear-gradient(180deg,var(--sur2) 0%,var(--sur) 100%);
  border:1px solid var(--brd);border-radius:16px;
  position:relative;overflow:hidden;
}
.work-breakdown::before{
  content:"";position:absolute;right:-40px;top:-40px;
  width:160px;height:160px;border-radius:50%;
  background:radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%);
  pointer-events:none;
}
.work-donut-wrap{position:relative;width:150px;height:150px;flex-shrink:0;z-index:1}
.work-donut{
  width:150px;height:150px;display:block;transform:rotate(-90deg);
  animation:fcDonutIn .7s var(--ez-out) both;
  filter:drop-shadow(0 6px 16px rgba(99,102,241,.18));
}
.work-donut-center{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;pointer-events:none;
}
.wd-num{font-size:28px;font-weight:700;color:var(--t1);letter-spacing:-.8px;line-height:1;font-variant-numeric:tabular-nums}
.wd-lbl{font-size:11.5px;color:var(--t3);margin-top:3px;font-weight:600;letter-spacing:.4px;text-transform:uppercase}

.work-cat-list{display:flex;flex-direction:column;gap:8px;width:100%}
.wc-row{
  display:grid;grid-template-columns:12px 1fr auto auto;align-items:center;gap:10px;
  padding:7px 10px;border-radius:9px;background:var(--sur);
  border:1px solid var(--brd);font-size:13px;
  transition:border-color .15s ease,transform .2s var(--ez-out);
}
.wc-row:hover{border-color:var(--brd2);transform:translateX(2px)}
.wc-row.wc-zero{opacity:.5}
.wc-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,.10)}
.wc-lbl{color:var(--t2);font-weight:500;text-align:left}
.wc-val{color:var(--t1);font-weight:700;font-variant-numeric:tabular-nums;min-width:24px;text-align:right}
.wc-pct{
  color:var(--t3);font-weight:600;font-size:11.5px;font-variant-numeric:tabular-nums;
  background:var(--sur2);padding:2px 8px;border-radius:99px;min-width:36px;text-align:center;
}

/* Right: 7-day stacked bar */
.work-bars-wrap{display:flex;flex-direction:column;gap:14px;min-width:0}
.work-bars-hd{
  display:flex;align-items:center;justify-content:space-between;
  font-size:12.5px;font-weight:700;color:var(--t3);
  text-transform:uppercase;letter-spacing:.5px;
}
.work-bars-hd b{color:var(--t1);font-weight:700}
.work-bars{
  display:flex;align-items:flex-end;justify-content:space-between;
  gap:12px;height:200px;padding:12px 10px 8px;
  background:
    linear-gradient(180deg,transparent 0%,rgba(99,102,241,.025) 100%),
    repeating-linear-gradient(180deg, transparent 0px, transparent 39px, var(--brd) 39px, var(--brd) 40px);
  border-radius:14px;
  border:1px solid var(--brd);
  position:relative;
}
.wb-col{
  flex:1;display:flex;flex-direction:column;align-items:center;
  gap:10px;height:100%;min-width:0;justify-content:flex-end;
  position:relative;
}
.wb-bar-wrap{
  width:100%;max-width:42px;border-radius:9px 9px 0 0;
  display:flex;flex-direction:column;overflow:hidden;
  background:var(--brd);min-height:6px;position:relative;
  box-shadow:0 -4px 10px rgba(99,102,241,.10);
  transition:transform .3s var(--ez-out),box-shadow .3s ease;
  animation:wbBarIn .55s var(--ez-out) both;
}
@keyframes wbBarIn{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
.wb-col:nth-child(1) .wb-bar-wrap{animation-delay:40ms}
.wb-col:nth-child(2) .wb-bar-wrap{animation-delay:90ms}
.wb-col:nth-child(3) .wb-bar-wrap{animation-delay:140ms}
.wb-col:nth-child(4) .wb-bar-wrap{animation-delay:190ms}
.wb-col:nth-child(5) .wb-bar-wrap{animation-delay:240ms}
.wb-col:nth-child(6) .wb-bar-wrap{animation-delay:290ms}
.wb-col:nth-child(7) .wb-bar-wrap{animation-delay:340ms}
.wb-col:hover .wb-bar-wrap{transform:scaleY(1.05) translateY(-2px);transform-origin:bottom;box-shadow:0 -8px 16px rgba(99,102,241,.22)}
.wb-col.wb-zero .wb-bar-wrap{background:var(--brd);opacity:.4;box-shadow:none}
.wb-col.wb-today .wb-bar-wrap{
  box-shadow:0 -8px 18px rgba(16,185,129,.40);
  outline:2.5px solid #10B981;outline-offset:2px;
  border-radius:11px 11px 0 0;
}
.wb-col.wb-today::before{
  content:"วันนี้";position:absolute;top:-22px;left:50%;transform:translateX(-50%);
  font-size:10.5px;font-weight:700;color:#10B981;letter-spacing:.5px;
  background:#fff;padding:2px 8px;border-radius:99px;
  border:1.5px solid #10B981;
  white-space:nowrap;
  animation:wbBadgeIn .5s var(--ez-out) .6s both;
}
@keyframes wbBadgeIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.wb-seg{
  width:100%;transition:flex .6s var(--ez-out);
  background-clip:padding-box;
}
.wb-val{
  position:absolute;top:-22px;left:50%;transform:translateX(-50%);
  font-size:12px;font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;
  opacity:0;transition:opacity .2s ease;
}
.wb-col:hover .wb-val,.wb-col.wb-today .wb-val{opacity:1}
.wb-day{font-size:11.5px;color:var(--t3);font-weight:600;letter-spacing:.2px}
.wb-col.wb-today .wb-day{color:#10B981;font-weight:700}

.work-legend{
  display:flex;gap:16px;flex-wrap:wrap;justify-content:flex-start;
  padding-top:2px;
}
.wl-item{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--t2)}
.wl-dot{width:10px;height:10px;border-radius:3px}

@media(max-width:639px){
  .work-bars{height:140px}
  .wd-num{font-size:24px}
  .work-donut-wrap{width:110px;height:110px}
  .work-donut{width:110px;height:110px}
}

/* Bar chart (right — legacy, unused) */
.report-bar-hd{
  display:flex;align-items:center;justify-content:space-between;
  font-size:12.5px;font-weight:700;color:var(--t3);
  text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;
}
.report-bar-wrap{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;height:170px;padding:0 4px}
.bar-col{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;
  cursor:default;
}
.bar-bar{
  width:100%;max-width:42px;border-radius:8px 8px 0 0;
  background:linear-gradient(180deg,#6366F1,#A855F7);
  position:relative;min-height:4px;
  transition:transform .25s var(--ez-out),opacity .25s ease;
  box-shadow:0 -3px 8px rgba(99,102,241,.15);
}
.bar-col.bar-today .bar-bar{
  background:linear-gradient(180deg,#10B981,#06B6D4);
  box-shadow:0 -3px 10px rgba(16,185,129,.32);
}
.bar-col.bar-zero .bar-bar{
  background:var(--brd);box-shadow:none;opacity:.55;
}
.bar-col:hover .bar-bar{transform:scaleY(1.04);transform-origin:bottom}
.bar-val{
  font-size:12.5px;font-weight:700;color:var(--t1);
  position:absolute;top:-22px;left:50%;transform:translateX(-50%);
  font-variant-numeric:tabular-nums;
  opacity:0;transition:opacity .2s ease;
}
.bar-col:hover .bar-val,
.bar-col.bar-today .bar-val{opacity:1}
.bar-day{
  font-size:11.5px;font-weight:600;color:var(--t3);letter-spacing:.2px;
}
.bar-col.bar-today .bar-day{color:#10B981;font-weight:700}

/* ═══════════════════════════════════════════════════════════
   Menu3 — dashboard main menu (3-column equal grid)
   ═══════════════════════════════════════════════════════════ */
.menu3{
  display:grid;grid-template-columns:repeat(3,1fr);gap:18px;
  margin-bottom:24px;
}
.list-layout.has-pvp .menu3{grid-template-columns:1fr;gap:12px}
@media(max-width:1023px){.menu3{grid-template-columns:1fr 1fr;gap:14px}}
@media(max-width:639px){.menu3{grid-template-columns:1fr;gap:12px}}

.menu3-card{
  position:relative;overflow:hidden;cursor:pointer;
  display:flex;align-items:center;gap:18px;
  background:var(--sur);border:1.5px solid var(--brd);
  border-radius:var(--rL);padding:22px 22px;
  box-shadow:var(--sh1);
  font-family:inherit;text-align:left;color:var(--t1);
  min-height:102px;
  transition:transform .35s var(--ez-out),box-shadow .35s var(--ez-out),border-color .25s ease,background .25s ease;
  animation:scIn .55s var(--ez-out) backwards;
}
.menu3-card:nth-child(1){animation-delay:60ms}
.menu3-card:nth-child(2){animation-delay:120ms}
.menu3-card:nth-child(3){animation-delay:180ms}

/* Per-color theme — tinted idle, gradient-fill hover */
.menu3-blue{background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(99,102,241,.04));border-color:rgba(99,102,241,.28)}
.menu3-blue .menu3-ico{background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 8px 20px rgba(99,102,241,.34)}
.menu3-blue:hover{transform:translateY(-4px);background:linear-gradient(135deg,#6366F1,#4338CA);border-color:transparent;color:#fff;box-shadow:0 20px 40px rgba(99,102,241,.40)}

.menu3-purple{background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(168,85,247,.04));border-color:rgba(168,85,247,.28)}
.menu3-purple .menu3-ico{background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;box-shadow:0 8px 20px rgba(168,85,247,.34)}
.menu3-purple:hover{transform:translateY(-4px);background:linear-gradient(135deg,#A855F7,#7C3AED);border-color:transparent;color:#fff;box-shadow:0 20px 40px rgba(168,85,247,.40)}

.menu3-amber{background:linear-gradient(135deg,rgba(245,158,11,.10),rgba(245,158,11,.05));border-color:rgba(245,158,11,.32)}
.menu3-amber .menu3-ico{background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;box-shadow:0 8px 20px rgba(245,158,11,.34)}
.menu3-amber:hover{transform:translateY(-4px);background:linear-gradient(135deg,#F59E0B,#D97706);border-color:transparent;color:#fff;box-shadow:0 20px 40px rgba(245,158,11,.40)}

/* Hover: text/icon turn to white + icon goes translucent */
.menu3-card:hover .menu3-ttl,
.menu3-card:hover .menu3-desc,
.menu3-card:hover > svg:last-child{color:#fff}
.menu3-card:hover .menu3-ico{background:rgba(255,255,255,.22) !important;box-shadow:none}
.menu3-card:hover .menu3-desc{color:rgba(255,255,255,.85)}

.menu3-ico{
  width:54px;height:54px;border-radius:14px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  transition:transform .35s var(--ez-out),background .25s ease,box-shadow .25s ease;
}
.menu3-card:hover .menu3-ico{transform:scale(1.06) rotate(-4deg)}

.menu3-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.menu3-ttl{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  font-size:18px;font-weight:700;color:var(--t1);letter-spacing:-.3px;line-height:1.25;
  transition:color .25s ease;
}
.menu3-desc{font-size:14px;color:var(--t3);line-height:1.45;font-weight:500;transition:color .25s ease}
.menu3-badge{
  background:#fff;color:var(--red);
  padding:2px 10px;border-radius:99px;font-size:12.5px;font-weight:700;line-height:1.5;
  box-shadow:0 3px 8px rgba(0,0,0,.12);
  border:1.5px solid var(--red);
}
.menu3-card.menu3-amber .menu3-badge{color:#B45309;border-color:#D97706}
.menu3-card.menu3-amber:hover .menu3-badge{background:rgba(255,255,255,.95);color:#B45309;border-color:transparent}

.menu3-card > svg:last-child{
  color:var(--t3);flex-shrink:0;
  transition:transform .3s var(--ez-out),color .25s ease;
}
.menu3-card:hover > svg:last-child{transform:translateX(6px)}

@media(max-width:639px){
  .menu3-card{padding:18px;gap:14px;min-height:88px}
  .menu3-ico{width:46px;height:46px;border-radius:12px}
  .menu3-ttl{font-size:16.5px}
  .menu3-desc{font-size:13.5px}
}

/* ═══════════════════════════════════════════════════════════
   Menu cards — big-box style (mirror of .sc stat card)
   ═══════════════════════════════════════════════════════════ */
.mcards{
  display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;
}
.list-layout.has-pvp .mcards{grid-template-columns:1fr 1fr}
@media(max-width:1023px){.mcards{grid-template-columns:1fr 1fr}}
@media(max-width:639px){.mcards{grid-template-columns:1fr 1fr;gap:10px}}
@media(max-width:480px){.mcards{grid-template-columns:1fr}}

.mcard{
  position:relative;overflow:hidden;cursor:pointer;isolation:isolate;
  background:var(--sur);border:1.5px solid var(--brd);
  border-radius:var(--rL);padding:22px 22px 18px;
  box-shadow:var(--sh1);
  display:flex;flex-direction:column;gap:14px;
  font-family:inherit;text-align:left;color:var(--t1);
  transition:transform .4s var(--ez-out),box-shadow .4s var(--ez-out),border-color .3s ease;
  animation:scIn .55s var(--ez-out) backwards;
}
.mcard:nth-child(1){animation-delay:60ms}
.mcard:nth-child(2){animation-delay:120ms}
.mcard:nth-child(3){animation-delay:180ms}
.mcard:nth-child(4){animation-delay:240ms}

/* layer 1: tinted gradient backdrop — โผล่บางๆ idle, เข้มขึ้นตอน hover */
.mcard::before{
  content:"";position:absolute;inset:0;z-index:-2;
  background:linear-gradient(135deg,var(--mc-tint,rgba(99,102,241,.06)) 0%,transparent 70%);
  transition:opacity .35s var(--ez-out);
}
/* layer 2: glow ring บนขอบ (gradient conic-like) — โผล่ตอน hover */
.mcard::after{
  content:"";position:absolute;inset:-1px;z-index:-1;border-radius:inherit;
  padding:1.5px;
  background:linear-gradient(135deg,var(--mc-c1,#6366F1),var(--mc-c2,#A855F7),var(--mc-c1,#6366F1));
  background-size:200% 200%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  opacity:0;transition:opacity .35s var(--ez-out);
  animation:mcShimmer 6s linear infinite;
}
.mcard:hover{
  transform:translateY(-6px);
  box-shadow:0 24px 50px rgba(11,16,32,.14),0 6px 14px rgba(11,16,32,.08),0 0 0 1px var(--mc-c1,#6366F1)20;
  border-color:transparent;
}
.mcard:hover::before{
  background:linear-gradient(135deg,var(--mc-tint-hover,rgba(99,102,241,.14)) 0%,transparent 65%);
}
.mcard:hover::after{opacity:1}
@keyframes mcShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}

/* Color theme variables per variant */
.mcard.mcard-bl{--mc-c1:#6366F1;--mc-c2:#22D3EE;--mc-tint:rgba(99,102,241,.07);--mc-tint-hover:rgba(99,102,241,.14)}
.mcard.mcard-in{--mc-c1:#4338CA;--mc-c2:#7C3AED;--mc-tint:rgba(67,56,202,.07);--mc-tint-hover:rgba(67,56,202,.14)}
.mcard.mcard-pu{--mc-c1:#A855F7;--mc-c2:#EC4899;--mc-tint:rgba(168,85,247,.07);--mc-tint-hover:rgba(168,85,247,.14)}
.mcard.mcard-am{--mc-c1:#F59E0B;--mc-c2:#EF4444;--mc-tint:rgba(245,158,11,.10);--mc-tint-hover:rgba(245,158,11,.18)}

.mcard.mcard-bl{color:#4F46E5}
.mcard.mcard-in{color:#4338CA}
.mcard.mcard-pu{color:#A855F7}
.mcard.mcard-am{color:#B45309}

.mcard-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.mcard-lbl{
  font-size:11.5px;font-weight:700;color:var(--mc-c1);letter-spacing:1.2px;
  text-transform:uppercase;line-height:1.4;padding:4px 10px;
  background:var(--mc-tint);border-radius:99px;
  display:inline-block;margin-top:2px;
}
/* boost icon: gradient = theme c1→c2, rotate-bounce on hover */
.mcard .sc-ico{
  background:linear-gradient(135deg,var(--mc-c1),var(--mc-c2)) !important;
  box-shadow:0 8px 20px color-mix(in srgb,var(--mc-c1) 38%,transparent),
             inset 0 1px 0 rgba(255,255,255,.25);
  transition:transform .45s var(--ez-out),box-shadow .35s var(--ez-out);
}
.mcard:hover .sc-ico{
  transform:scale(1.12) rotate(-8deg);
  box-shadow:0 14px 28px color-mix(in srgb,var(--mc-c1) 48%,transparent),
             inset 0 1px 0 rgba(255,255,255,.32);
}
.mcard-bd{display:flex;flex-direction:column;gap:6px;flex:1}
.mcard-ttl{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.6px;line-height:1.18;
  transition:color .3s ease;
}
.mcard:hover .mcard-ttl{color:var(--mc-c1)}
.mcard-desc{font-size:14px;color:var(--t3);line-height:1.45;font-weight:500}
.mcard-badge{
  background:linear-gradient(135deg,var(--mc-c1),var(--mc-c2));color:#fff;
  padding:3px 11px;border-radius:99px;font-size:12.5px;font-weight:700;line-height:1.5;
  box-shadow:0 4px 12px color-mix(in srgb,var(--mc-c1) 42%,transparent);
  animation:mcBadgePulse 2.4s var(--ez) infinite;
}
@keyframes mcBadgePulse{
  0%,100%{transform:scale(1);box-shadow:0 4px 12px color-mix(in srgb,var(--mc-c1) 42%,transparent)}
  50%{transform:scale(1.05);box-shadow:0 4px 12px color-mix(in srgb,var(--mc-c1) 42%,transparent),0 0 0 6px color-mix(in srgb,var(--mc-c1) 14%,transparent)}
}
.mcard-cta{
  display:inline-flex;align-items:center;gap:6px;
  font-size:13px;font-weight:700;color:var(--mc-c1);letter-spacing:.2px;
  padding-top:10px;border-top:1px dashed var(--brd);
  margin-top:2px;
  transition:gap .25s var(--ez-out),letter-spacing .25s var(--ez-out);
  position:relative;
}
.mcard-cta::before{
  content:"";position:absolute;left:0;top:-1px;width:0;height:1.5px;
  background:linear-gradient(90deg,var(--mc-c1),var(--mc-c2));
  transition:width .45s var(--ez-out);
}
.mcard:hover .mcard-cta{gap:11px;letter-spacing:.6px}
.mcard:hover .mcard-cta::before{width:100%}
.mcard-cta svg{transition:transform .3s var(--ez-out);color:var(--mc-c1)}
.mcard:hover .mcard-cta svg{transform:translateX(5px)}

/* floating sparkle decoration — เริส subtle idle */
.mcard-spark{
  position:absolute;top:18px;right:18px;width:8px;height:8px;border-radius:50%;
  background:var(--mc-c2);opacity:.55;
  box-shadow:0 0 12px var(--mc-c2);
  animation:mcSpark 3.5s var(--ez) infinite;pointer-events:none;
}
@keyframes mcSpark{
  0%,100%{transform:translate(0,0) scale(.6);opacity:.3}
  50%{transform:translate(-4px,4px) scale(1);opacity:.8}
}

@media(max-width:639px){
  .mcard{padding:16px 16px 14px;gap:10px}
  .mcard-lbl{font-size:11.5px;padding-top:4px}
  .mcard-ttl{font-size:17px;letter-spacing:-.3px}
  .mcard-desc{font-size:13px}
  .mcard-cta{font-size:12.5px}
}

/* Quick nav cards (horizontal scroll cards on dashboard) */
.navcards-wrap{
  margin:18px 0 22px;
  padding:0;
  background:transparent;border:none;border-radius:0;
}
.navcards-hd{
  display:flex;align-items:center;gap:10px;
  margin-bottom:14px;padding:0 2px;
}
.navcards-hd svg{color:var(--blue)}
.navcards-ttl{font-size:15px;font-weight:700;color:var(--t1);letter-spacing:-.1px}
.navcards-sub{font-size:13px;color:var(--t3);margin-left:6px;font-weight:400}

.navcards{
  display:flex;flex-direction:row;gap:14px;
  overflow-x:auto;overflow-y:hidden;
  scroll-snap-type:x mandatory;
  scroll-padding:4px;
  padding:4px 4px 10px;margin:0 -4px;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:thin;scrollbar-color:var(--brd2) transparent;
}
/* 2x2 grid variant — main dashboard menu */
.navcards.navcards-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:16px;
  overflow:visible;margin:0;padding:4px 0 4px;
  scroll-snap-type:none;
}
.navcards.navcards-grid .navcard{flex:none;min-width:0;scroll-snap-align:none}
.list-layout.has-pvp .navcards.navcards-grid{grid-template-columns:1fr}
@media(max-width:639px){
  .navcards.navcards-grid{grid-template-columns:1fr;gap:12px}
}
.navcards::-webkit-scrollbar{height:6px}
.navcards::-webkit-scrollbar-track{background:transparent}
.navcards::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}

.navcard{
  flex:1 1 0;min-width:260px;scroll-snap-align:start;
  display:flex;align-items:center;gap:14px;
  border:1.5px solid;border-radius:var(--rL);
  padding:20px 22px;cursor:pointer;text-align:left;
  font-family:inherit;
  box-shadow:var(--sh1);transition:transform .3s var(--ez-out),box-shadow .3s var(--ez-out),background .25s ease,border-color .25s ease,color .25s ease;
  color:var(--t1);
  min-height:92px;position:relative;overflow:hidden;
  animation:scIn .55s var(--ez-out) backwards;
}
/* tinted button-like backgrounds — clearly clickable menu items */
.navcard.fcard-indigo{background:linear-gradient(135deg,rgba(67,56,202,.10),rgba(67,56,202,.06));border-color:rgba(67,56,202,.32)}
.navcard.fcard-indigo:hover{background:linear-gradient(135deg,#4338CA,#312E81);border-color:transparent;color:#fff;transform:translateY(-3px);box-shadow:0 18px 36px rgba(67,56,202,.36)}
.navcard.fcard-indigo:hover .navcard-ttl,.navcard.fcard-indigo:hover .navcard-desc,.navcard.fcard-indigo:hover > svg:last-child{color:#fff}
.navcard.fcard-indigo .fcard-ico{background:linear-gradient(135deg,#4338CA,#312E81);color:#fff;box-shadow:0 6px 16px rgba(67,56,202,.32)}
.navcard.fcard-indigo:hover .fcard-ico{background:rgba(255,255,255,.22);box-shadow:none}

.navcard.fcard-blue{background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(99,102,241,.06));border-color:rgba(99,102,241,.32)}
.navcard.fcard-blue:hover{background:linear-gradient(135deg,#6366F1,#4338CA);border-color:transparent;color:#fff;transform:translateY(-3px);box-shadow:0 18px 36px rgba(99,102,241,.36)}
.navcard.fcard-blue:hover .navcard-ttl,.navcard.fcard-blue:hover .navcard-desc,.navcard.fcard-blue:hover > svg:last-child{color:#fff}
.navcard.fcard-blue .fcard-ico{background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 6px 16px rgba(99,102,241,.32)}
.navcard.fcard-blue:hover .fcard-ico{background:rgba(255,255,255,.22);box-shadow:none}

.navcard.fcard-purple{background:linear-gradient(135deg,rgba(168,85,247,.10),rgba(168,85,247,.06));border-color:rgba(168,85,247,.32)}
.navcard.fcard-purple:hover{background:linear-gradient(135deg,#A855F7,#7C3AED);border-color:transparent;color:#fff;transform:translateY(-3px);box-shadow:0 18px 36px rgba(168,85,247,.36)}
.navcard.fcard-purple:hover .navcard-ttl,.navcard.fcard-purple:hover .navcard-desc,.navcard.fcard-purple:hover > svg:last-child{color:#fff}
.navcard.fcard-purple .fcard-ico{background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;box-shadow:0 6px 16px rgba(168,85,247,.32)}
.navcard.fcard-purple:hover .fcard-ico{background:rgba(255,255,255,.22);box-shadow:none}

.navcard.fcard-amber{background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.06));border-color:rgba(245,158,11,.36)}
.navcard.fcard-amber:hover{background:linear-gradient(135deg,#F59E0B,#D97706);border-color:transparent;color:#fff;transform:translateY(-3px);box-shadow:0 18px 36px rgba(245,158,11,.36)}
.navcard.fcard-amber:hover .navcard-ttl,.navcard.fcard-amber:hover .navcard-desc,.navcard.fcard-amber:hover > svg:last-child{color:#fff}
.navcard.fcard-amber .fcard-ico{background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;box-shadow:0 6px 16px rgba(245,158,11,.32)}
.navcard.fcard-amber:hover .fcard-ico{background:rgba(255,255,255,.22);box-shadow:none}

.navcard .fcard-ico{width:48px;height:48px;border-radius:14px;transition:transform .3s var(--ez-out),background .25s ease,box-shadow .25s ease;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.navcard .fcard-ico svg{width:24px;height:24px}
.navcard:hover .fcard-ico{transform:scale(1.08) rotate(-6deg)}

.navcard-body{flex:1;min-width:0}
.navcard-ttl{
  display:flex;align-items:center;gap:10px;
  font-size:16.5px;font-weight:700;color:var(--t1);letter-spacing:-.2px;
}
.navcard-desc{font-size:13.5px;color:var(--t3);margin-top:3px}
.navcard-badge{
  background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;
  padding:2px 11px;border-radius:99px;font-size:12.5px;font-weight:700;line-height:1.5;
  box-shadow:0 3px 8px rgba(245,158,11,.32);
}
.navcard > svg:last-child{color:var(--t3);flex-shrink:0;transition:transform .25s var(--ez-out),color .25s ease}
.navcard:hover > svg:last-child{transform:translateX(6px);color:currentColor}

@media(max-width:900px){
  .navcards-wrap{padding:14px 12px 6px;margin:14px 0 18px}
  .navcard{
    flex:0 0 88%;min-width:0;
    padding:22px 22px;min-height:120px;gap:18px;
    border-radius:16px;
  }
  .navcard .fcard-ico{width:58px;height:58px;border-radius:14px}
  .navcard .fcard-ico svg{width:30px;height:30px}
  .navcard-ttl{font-size:19px;gap:10px}
  .navcard-desc{font-size:14.5px;margin-top:5px}
  .navcard-badge{font-size:13px;padding:2px 12px}
  .navcard > svg:last-child{width:22px;height:22px}
}

/* Filter bar — horizontal scroll cards (snap, swipe) */
.filter-bar{
  display:flex;flex-direction:row;gap:12px;
  overflow-x:auto;overflow-y:hidden;
  scroll-snap-type:x mandatory;
  scroll-padding:4px;
  padding:4px 4px 10px;
  margin:0 -4px;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:thin;scrollbar-color:var(--brd2) transparent;
  animation:fbar-in .15s ease;
}
.filter-bar::-webkit-scrollbar{height:6px}
.filter-bar::-webkit-scrollbar-track{background:transparent}
.filter-bar::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}
.filter-bar::-webkit-scrollbar-thumb:hover{background:var(--t3)}
@keyframes fbar-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

/* แต่ละกลุ่มเป็น card — flex-basis คงที่เพื่อ snap */
.fcard{
  background:var(--sur);border:1.5px solid var(--brd);border-radius:14px;
  padding:14px 16px;display:flex;flex-direction:column;gap:10px;
  box-shadow:var(--sh0);transition:border-color .15s;
  flex:0 0 280px;scroll-snap-align:start;min-width:0;
}
.fcard:hover{border-color:var(--brd2)}
.fcard-hd{display:flex;align-items:center;gap:10px}
.fcard-ico{
  display:inline-flex;align-items:center;justify-content:center;
  width:30px;height:30px;border-radius:9px;flex-shrink:0;
}
.fcard-ttl{font-size:13px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.5px}
.fcard-bd{display:flex;flex-wrap:wrap;gap:7px}
.fcard-sub{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding-top:10px;margin-top:2px;border-top:1px dashed var(--brd);
}
.fcard-sub-lbl{font-size:12.5px;color:var(--t3);white-space:nowrap;font-weight:500}

/* สีประจำการ์ด — แค่ไอคอน, ไม่ทำให้ทั้งการ์ดสีฉูดฉาด */
.fcard-blue .fcard-ico{background:var(--blue-bg);color:var(--blue)}
.fcard-amber .fcard-ico{background:#FEF3C7;color:#D97706}
.fcard-purple .fcard-ico{background:#EDE9FE;color:#7C3AED}

.fbar-clear-block{
  width:100%;justify-content:center;margin-top:10px;
  background:transparent;border-style:dashed;
}
.fbar-clear-block:hover{background:var(--red);color:#fff;border-style:solid}

@media(max-width:700px){
  .fcard{flex:0 0 78%;padding:13px 14px}      /* ~1.3 cards visible */
  .fcard-bd{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .fcard-bd .fopt{padding:10px 12px;font-size:14px;justify-content:center}
  .fcard-sub{flex-direction:column;align-items:stretch;gap:6px}
  .fbar-dates{display:flex;gap:8px;flex-wrap:nowrap}
  .fbar-date{flex:1;min-width:0}
  .fbar-date input{width:100%}
}
.fbar-dates{display:flex;align-items:center;gap:8px}
.fbar-date{
  display:flex;align-items:center;gap:9px;
  background:var(--sur2);border:1.5px solid var(--brd);border-radius:10px;
  padding:9px 14px;transition:border-color .15s;
}
.fbar-date:focus-within{border-color:var(--blue);background:var(--blue-bg)}
.fbar-date svg{color:var(--t3);flex-shrink:0}
.fbar-date input{
  border:none;background:transparent;outline:none;
  font-size:15.5px;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);width:130px;cursor:pointer;
}
.fbar-date input::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
.fbar-dash{color:var(--t3);font-size:13px;flex-shrink:0}
.fbar-clear{
  display:inline-flex;align-items:center;gap:8px;
  padding:9px 16px;border-radius:10px;border:1.5px solid var(--red-brd);
  background:var(--red-bg);color:var(--red);cursor:pointer;
  font-size:15px;font-weight:600;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  transition:all .12s;white-space:nowrap;
}
.fbar-clear:hover{background:var(--red);color:#fff}

/* Filter option buttons */
.fopt{
  display:inline-flex;align-items:center;gap:8px;
  padding:9px 18px;border-radius:10px;cursor:pointer;
  font-size:15.5px;font-weight:500;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  background:var(--sur2);border:1.5px solid var(--brd);color:var(--t2);
  transition:all .12s;white-space:nowrap;
}
.fopt:hover{background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.fopt.active{background:var(--blue);border-color:var(--blue);color:#fff;font-weight:600}
.fopt.fopt-green.active{background:var(--green);border-color:var(--green)}
.fopt.fopt-amber.active{background:#D97706;border-color:#D97706}
.fopt.fopt-red.active{background:var(--red);border-color:var(--red)}
.fopt-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}

/* Active filter chips */
.filter-chips{display:flex;flex-wrap:wrap;gap:7px}
.fchip{
  display:inline-flex;align-items:center;gap:8px;
  padding:7px 16px;border-radius:99px;font-size:15px;font-weight:500;
  background:var(--sur);border:1.5px solid var(--brd2);color:var(--t1);
}
.fchip.b-on{background:var(--green-bg);border-color:var(--green-brd);color:var(--green)}
.fchip.b-soon{background:var(--amber-bg);border-color:var(--amber-brd);color:var(--amber)}
.fchip.b-off{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}
.fchip button{
  background:none;border:none;cursor:pointer;padding:0;margin-left:2px;
  display:flex;align-items:center;color:inherit;opacity:.55;
  border-radius:99px;transition:opacity .12s;
}
.fchip button:hover{opacity:1}
.big-srch-wrap{margin-bottom:20px;position:relative}
.big-srch{
  display:flex;align-items:center;gap:14px;
  background:var(--sur);border:1.5px solid var(--brd);
  border-radius:var(--rL);padding:14px 18px 14px 22px;
  box-shadow:var(--sh1);
  transition:border-color .25s var(--ez-out),box-shadow .25s var(--ez-out),transform .2s ease;
  position:relative;
}
.big-srch:hover{border-color:var(--brd2);box-shadow:var(--sh2)}
.big-srch:focus-within{
  border-color:var(--blue);
  box-shadow:0 0 0 4px rgba(99,102,241,.16),0 8px 22px rgba(99,102,241,.12);
  transform:translateY(-1px);
}
.big-srch > svg:first-child{color:var(--t3);flex-shrink:0;transition:color .2s,transform .25s var(--ez-out)}
.big-srch:focus-within > svg:first-child{color:var(--blue);transform:scale(1.1)}
.big-srch input{
  flex:1;border:none;outline:none;font-size:16.5px;
  font-family:inherit;
  color:var(--t1);background:transparent;
}
.big-srch input::placeholder{color:var(--t3)}
.big-srch-clr{
  background:var(--sur2);border:1px solid var(--brd);
  border-radius:8px;padding:4px 8px;cursor:pointer;
  display:flex;align-items:center;color:var(--t3);
  transition:all .18s ease;flex-shrink:0;
}
.big-srch-clr:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red);transform:scale(1.05)}

.btn{
  display:inline-flex;align-items:center;gap:9px;
  padding:13px 22px;border-radius:12px;border:none;
  cursor:pointer;font-size:16px;font-weight:600;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  transition:transform .15s cubic-bezier(.4,0,.2,1),box-shadow .2s ease,background .2s ease,color .2s ease,border-color .2s ease;
  white-space:nowrap;line-height:1;flex-shrink:0;position:relative;overflow:hidden;
}
.btn::after{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.25) 50%,transparent 60%);
  background-size:220% 100%;background-position:100% 0;
  opacity:0;transition:opacity .25s ease,background-position .6s cubic-bezier(.4,0,.2,1);
  pointer-events:none;
}
.btn:hover::after{opacity:1;background-position:0 0}
.btn-b{background:linear-gradient(135deg,#234E52 0%,#319795 50%,#4FD1C5 100%);color:#fff;box-shadow:var(--shB)}
.btn-b:hover{box-shadow:0 14px 30px rgba(49,151,149,.42),0 4px 10px rgba(79,209,197,.24);transform:translateY(-2px)}
.btn-b:active{transform:translateY(0) scale(.98);box-shadow:0 2px 6px rgba(49,151,149,.28)}
.btn-b:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none;background:linear-gradient(135deg,#9DECF9,#B2F5EA)}
.btn-w{background:var(--sur);color:var(--t2);border:1.5px solid var(--brd);box-shadow:0 1px 2px rgba(15,23,42,.04)}
.btn-w:hover{background:var(--sur2);border-color:var(--brd2);color:var(--t1);transform:translateY(-1px);box-shadow:0 4px 10px rgba(15,23,42,.08)}
.btn-w:active{transform:translateY(0)}
.btn-w:disabled{opacity:.5;cursor:not-allowed;transform:none}

/* ปุ่ม "เพิ่ม พ.ร.บ." — pulse subtle เรียก attention */
.btn-prb.btn-b{position:relative;animation:prb-pulse 2.4s ease-in-out infinite}
.btn-prb.btn-b:hover{animation:none;transform:translateY(-1px);box-shadow:0 6px 16px rgba(30,111,229,.42)}
@keyframes prb-pulse{
  0%,100%{box-shadow:0 4px 12px rgba(30,111,229,.32)}
  50%    {box-shadow:0 4px 12px rgba(30,111,229,.32),0 0 0 6px rgba(30,111,229,.10)}
}

.body{padding:20px 28px}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD HERO — gradient backdrop, big greeting
   ═══════════════════════════════════════════════════════════ */
.hero{
  position:relative;overflow:hidden;
  border-radius:var(--rXL);
  padding:28px 36px 30px;margin-bottom:22px;
  color:#fff;isolation:isolate;
  background:
    radial-gradient(at 100% 0%, rgba(34,211,238,.50) 0, transparent 55%),
    radial-gradient(at 0% 100%, rgba(168,85,247,.40) 0, transparent 50%),
    radial-gradient(at 50% 50%, rgba(99,102,241,.20) 0, transparent 70%),
    linear-gradient(135deg,#4338CA 0%,#6366F1 50%,#7C3AED 100%);
  box-shadow:0 18px 40px rgba(67,56,202,.30),0 6px 14px rgba(67,56,202,.18);
  animation:heroIn .55s var(--ez-out) backwards;
}
.hero-compact{padding:26px 32px 24px}

/* ── Dashboard compact bar (no gradient, ใส่กลับมาแก้โล่ง) ── */
.dash-bar{
  display:flex;align-items:flex-end;justify-content:space-between;
  gap:18px;padding:18px 4px 22px;
  border-bottom:1px solid var(--brd);margin-bottom:18px;flex-wrap:wrap;
}
.dash-bar-l{min-width:0;flex:1 1 280px}
.dash-bar-ttl{
  font-size:24px;font-weight:700;color:var(--t1);letter-spacing:-.5px;line-height:1.2;
}
.dash-bar-sub{font-size:14px;color:var(--t3);margin-top:4px;line-height:1.45}
.dash-bar-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dash-chip{
  display:inline-flex;align-items:center;gap:7px;
  font-size:13px;font-weight:500;color:var(--t2);
  background:var(--sur);border:1px solid var(--brd);
  padding:7px 13px;border-radius:99px;
  box-shadow:var(--sh0);
  font-variant-numeric:tabular-nums;
  transition:border-color .15s ease,background .15s ease;
}
.dash-chip:hover{border-color:var(--brd2);background:var(--sur2)}
.dash-chip b{color:var(--t1);font-weight:700}
.dash-chip-dot{
  width:7px;height:7px;border-radius:50%;background:#10B981;
  box-shadow:0 0 0 2px rgba(16,185,129,.22);flex-shrink:0;
}
.dash-chip-data{color:var(--blue);border-color:var(--blue-mid);background:var(--blue-bg)}
.dash-chip-data svg{color:var(--blue)}
.dash-chip-money{color:#0D9C6B;border-color:rgba(16,185,129,.32);background:rgba(16,185,129,.08)}
.dash-chip-money svg{color:#0D9C6B}
@media(max-width:639px){
  .dash-bar{padding:12px 2px 14px;margin-bottom:12px;gap:10px;flex-direction:column;align-items:flex-start}
  .dash-bar-l{flex:initial;width:100%}
  .dash-bar-r{width:100%;justify-content:flex-start}
  .dash-bar-ttl{font-size:19px;letter-spacing:-.3px}
  .dash-bar-sub{font-size:13px;line-height:1.4}
  .dash-chip{font-size:12px;padding:5px 10px}
}
.hero-compact .hero-l{position:relative;z-index:1}
.hero-compact .hero-title{margin-bottom:6px}
.hero-compact .hero-sub{margin-bottom:0}
.hero-compact .hero-stats{margin-top:20px}
@keyframes heroIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
.hero::before{
  content:"";position:absolute;inset:0;z-index:-1;
  background-image:
    radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.18) 50%, transparent 51%),
    radial-gradient(2px 2px at 75% 70%, rgba(255,255,255,.16) 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 50% 20%, rgba(255,255,255,.14) 50%, transparent 51%);
  background-size:240px 240px,300px 300px,180px 180px;
  opacity:.55;
}
.hero::after{
  content:"";position:absolute;right:-80px;top:-80px;width:280px;height:280px;
  border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22) 0%,transparent 65%);
  pointer-events:none;
}
.hero-row{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;position:relative;z-index:1}
.hero-l{min-width:0;flex:1}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:13.5px;font-weight:500;color:rgba(255,255,255,.86);
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.22);
  padding:6px 12px;border-radius:99px;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  margin-bottom:14px;
}
.hero-eyebrow .ico-pulse{width:7px;height:7px;border-radius:50%;background:#34D399;box-shadow:0 0 0 3px rgba(52,211,153,.35);animation:sb-dot-pulse 1.6s var(--ez) infinite}
.hero-title{
  font-size:32px;font-weight:700;letter-spacing:-.6px;line-height:1.22;
  color:#fff;margin-bottom:8px;
}
.hero-sub{font-size:16px;color:rgba(255,255,255,.86);line-height:1.55;max-width:560px;font-weight:400}
.hero-r{
  display:flex;align-items:center;gap:14px;flex-shrink:0;
  background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.20);
  border-radius:18px;padding:16px 22px;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
}
.hero-r-num{
  font-size:38px;font-weight:700;letter-spacing:-1.2px;line-height:1;
  color:#fff;font-variant-numeric:tabular-nums;
}
.hero-r-lbl{font-size:13px;color:rgba(255,255,255,.78);margin-top:4px;font-weight:500;letter-spacing:.2px}

/* decorative grid pattern overlay */
.hero-decor{
  position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.55;
  background-image:
    linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
  background-size:32px 32px;
  -webkit-mask:radial-gradient(ellipse 70% 70% at 50% 50%,#000 30%,transparent 75%);
  mask:radial-gradient(ellipse 70% 70% at 50% 50%,#000 30%,transparent 75%);
}

/* inline mini stats under hero sub */
.hero-stats{
  display:flex;align-items:center;gap:18px;margin-top:18px;flex-wrap:wrap;
}
.hero-stat{display:flex;flex-direction:column;gap:2px;min-width:0}
.hero-stat-num{
  font-size:22px;font-weight:700;letter-spacing:-.5px;line-height:1.1;
  color:#fff;font-variant-numeric:tabular-nums;
}
.hero-stat-lbl{font-size:12.5px;color:rgba(255,255,255,.75);font-weight:500;letter-spacing:.2px}
.hero-stat-div{
  width:1px;height:32px;flex-shrink:0;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.28),transparent);
}
@media(max-width:767px){
  .hero-stats{gap:14px;margin-top:14px}
  .hero-stat-num{font-size:18px}
  .hero-stat-lbl{font-size:11.5px}
  .hero-stat-div{height:26px}
}
@media(max-width:480px){
  .hero-stat-div{display:none}
  .hero-stats{gap:14px 22px}
}
@media(max-width:767px){
  .hero{padding:24px 22px 26px;border-radius:20px;margin-bottom:18px}
  .hero-row{flex-direction:column;align-items:stretch;gap:18px}
  .hero-title{font-size:26px;letter-spacing:-.6px}
  .hero-sub{font-size:14.5px}
  .hero-r{align-self:flex-start;padding:14px 18px}
  .hero-r-num{font-size:30px}
}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
/* เมื่อ preview panel เปิด พื้นที่หดลง → stats เป็น 2 cols + ขนาดเล็กลง */
.list-layout.has-pvp .stats{grid-template-columns:1fr 1fr;gap:12px}
.list-layout.has-pvp .sc{padding:18px}
.list-layout.has-pvp .sc-ico{width:38px;height:38px;border-radius:11px}
.list-layout.has-pvp .sc-ico svg{width:20px;height:20px}
.list-layout.has-pvp .sc-val{font-size:24px}
.list-layout.has-pvp .sc-lbl{font-size:12.5px;margin-bottom:4px}
.list-layout.has-pvp .sc-sub{font-size:12.5px}
/* ทางลัด nav cards ก็ stack ได้ */
.list-layout.has-pvp .navcards{grid-template-columns:1fr !important}
.sc{
  position:relative;overflow:hidden;
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--rL);padding:22px 22px 20px;
  box-shadow:var(--sh1);
  display:flex;flex-direction:column;gap:14px;
  transition:transform .35s var(--ez-out),box-shadow .35s var(--ez-out),border-color .25s ease;
  animation:scIn .55s var(--ez-out) backwards;
}
.sc:nth-child(1){animation-delay:60ms}
.sc:nth-child(2){animation-delay:120ms}
.sc:nth-child(3){animation-delay:180ms}
.sc:nth-child(4){animation-delay:240ms}
@keyframes scIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.sc::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg,currentColor,transparent);opacity:0;transition:opacity .3s var(--ez-out);
}
.sc::after{
  content:"";position:absolute;right:-40px;top:-40px;
  width:140px;height:140px;border-radius:50%;
  background:radial-gradient(circle,currentColor 0%,transparent 60%);
  opacity:0;transition:opacity .35s var(--ez-out);pointer-events:none;
}
.sc:hover{
  transform:translateY(-4px);
  box-shadow:0 20px 44px rgba(11,16,32,.10),0 4px 10px rgba(11,16,32,.06);
  border-color:transparent;
}
.sc:hover::before{opacity:1}
.sc:hover::after{opacity:.08}
.sc-hd{display:flex;align-items:center;justify-content:space-between;gap:12px}
.sc-ico{
  width:42px;height:42px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:transform .35s var(--ez-out);
}
.sc:hover .sc-ico{transform:scale(1.1) rotate(-6deg)}
.sc-ico.bl{background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;box-shadow:0 6px 14px rgba(99,102,241,.35)}
.sc-ico.gr{background:linear-gradient(135deg,#10B981,#0D9C6B);color:#fff;box-shadow:0 6px 14px rgba(13,156,107,.32)}
.sc-ico.am{background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;box-shadow:0 6px 14px rgba(245,158,11,.32)}
.sc-ico.pu{background:linear-gradient(135deg,#A855F7,#7C3AED);color:#fff;box-shadow:0 6px 14px rgba(168,85,247,.32)}
.sc:has(.sc-ico.bl){color:#6366F1}
.sc:has(.sc-ico.gr){color:#0D9C6B}
.sc:has(.sc-ico.am){color:#B45309}
.sc:has(.sc-ico.pu){color:#A855F7}
.sc-bd{min-width:0;flex:1;display:flex;flex-direction:column}
.sc-lbl{font-size:13px;font-weight:600;color:var(--t3);margin-bottom:6px;line-height:1.3;letter-spacing:.4px;text-transform:uppercase}
.sc-val{
  font-size:34px;font-weight:700;color:var(--t1);letter-spacing:-1.2px;line-height:1;
  font-variant-numeric:tabular-nums;
}
.sc-sub{font-size:13px;color:var(--t3);margin-top:8px;font-weight:500;display:flex;align-items:center;gap:6px;letter-spacing:.1px}

.card{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--rL);overflow:hidden;
  box-shadow:var(--sh1);
  transition:box-shadow .3s var(--ez-out);
}
.card:hover{box-shadow:var(--sh2)}
.card-hd{
  padding:20px 24px;border-bottom:1px solid var(--brd);
  display:flex;align-items:center;justify-content:space-between;
  background:var(--sur);
  position:relative;
}
.card-title{font-size:19px;font-weight:700;color:var(--t1);letter-spacing:-.3px}
.card-sub{font-size:14px;color:var(--t3);margin-top:4px;font-weight:400}

table{width:100%;border-collapse:separate;border-spacing:0}
thead{background:linear-gradient(180deg,var(--sur2),var(--sur))}
th{
  padding:13px 20px;text-align:left;font-size:12px;font-weight:700;
  color:var(--t3);text-transform:uppercase;letter-spacing:.8px;
  border-bottom:1px solid var(--brd);white-space:nowrap;
}
tbody tr{cursor:pointer;transition:background .2s var(--ez-out),box-shadow .2s var(--ez-out)}
tbody tr:hover{background:var(--blue-bg);box-shadow:inset 3px 0 0 var(--blue)}
td{
  padding:15px 20px;font-size:15px;color:var(--t2);line-height:1.45;
  border-bottom:1px solid var(--brd);
}
tbody tr:last-child td{border-bottom:none}
td.tw{color:var(--t1);font-weight:600}
td.tm{font-family:'JetBrains Mono','SF Mono','Fira Code','Consolas',monospace;font-size:14px;color:var(--t1);font-weight:600;letter-spacing:.2px}
td.tr{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:var(--t1)}

.badge{
  display:inline-flex;align-items:center;gap:7px;
  padding:6px 13px;border-radius:999px;
  font-size:13px;font-weight:600;white-space:nowrap;
  transition:transform .15s ease,box-shadow .15s ease;
}
.badge:hover{transform:translateY(-1px)}
.bdot{width:7px;height:7px;border-radius:50%;flex-shrink:0;position:relative}
.bdot::after{content:"";position:absolute;inset:-3px;border-radius:50%;background:inherit;opacity:.35;animation:bdot-pulse 2s var(--ez) infinite}
@keyframes bdot-pulse{0%,100%{transform:scale(.6);opacity:.35}50%{transform:scale(1.2);opacity:0}}
.b-on{background:var(--green-bg);color:var(--green);border:1px solid var(--green-brd)}
.b-on .bdot{background:var(--green)}
.b-soon{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-brd)}
.b-soon .bdot{background:#F59E0B}
.b-off{background:var(--red-bg);color:var(--red);border:1px solid var(--red-brd)}
.b-off .bdot{background:var(--red)}
.b-off .bdot::after{animation:none}
.plate{
  display:inline-block;background:linear-gradient(180deg,var(--sur),var(--sur2));
  border:1.5px solid var(--brd2);border-radius:8px;
  padding:6px 13px;font-size:14.5px;font-weight:700;
  color:var(--t1);letter-spacing:.4px;
  font-family:'JetBrains Mono','SF Mono','Fira Code','Consolas',monospace;
  transition:transform .15s ease,box-shadow .15s ease,border-color .18s ease;
  box-shadow:inset 0 -1px 0 rgba(11,16,32,.06),0 1px 2px rgba(11,16,32,.04);
}
tr:hover .plate{border-color:var(--blue);transform:scale(1.02);box-shadow:inset 0 -1px 0 rgba(11,16,32,.06),0 4px 10px rgba(79,70,229,.15)}

.pg{
  padding:16px 24px;border-top:1px solid var(--brd);
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(180deg,transparent,var(--sur2));
  flex-wrap:wrap;gap:10px;
}
.pg-info{font-size:14.5px;color:var(--t2);font-weight:500}
.pg-btns{display:flex;gap:6px}
.pg-btn{
  min-width:40px;height:40px;padding:0 12px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  border:1px solid var(--brd);background:var(--sur);color:var(--t2);
  transition:transform .15s var(--ez-out),background .15s,border-color .15s,color .15s,box-shadow .15s;
  font-family:inherit;font-size:15px;font-weight:600;
}
.pg-btn:hover:not(:disabled){
  background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue);
  transform:translateY(-1px);box-shadow:0 6px 14px rgba(99,102,241,.16);
}
.pg-btn.cur{
  background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;
  border-color:transparent;font-weight:700;
  box-shadow:0 6px 14px rgba(99,102,241,.36);
}
.pg-btn:disabled{opacity:.35;cursor:default}
.pg-dots{width:32px;height:40px;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--t3);user-select:none}

.ov{
  position:fixed;inset:0;background:rgba(11,16,32,.55);
  display:flex;align-items:center;justify-content:center;z-index:200;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:16px;
  animation:ovIn .25s ease-out;
}
@keyframes ovIn{from{opacity:0}to{opacity:1}}
.modal{
  background:var(--sur);border:1px solid var(--brd);border-radius:var(--rXL);
  max-height:90vh;overflow-y:auto;width:100%;
  box-shadow:var(--sh3);
  animation:modalIn .45s var(--ez-out);
}
@keyframes modalIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.modal-hd{
  padding:22px 22px 16px;display:flex;align-items:flex-start;justify-content:space-between;
  position:sticky;top:0;background:var(--sur);border-bottom:1px solid var(--brd);
  z-index:10;border-radius:20px 20px 0 0;
}
.modal-title{font-size:20px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.modal-sub{font-size:14.5px;color:var(--t3);margin-top:4px;font-weight:400}
.modal-bd{padding:22px}
.xbtn{
  width:34px;height:34px;border-radius:10px;
  background:var(--sur2);border:1.5px solid var(--brd);color:var(--t3);
  cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .15s cubic-bezier(.4,0,.2,1);
}
.xbtn:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red);transform:rotate(90deg) scale(1.05)}

.shd{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;background:var(--blue-bg);border:1px solid var(--blue-mid);margin-bottom:16px}
.shd svg{color:var(--blue);flex-shrink:0}
.shd-lbl{font-size:14px;font-weight:600;color:var(--blue)}

.fg{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fi{
  background:var(--sur2);border:1.5px solid var(--brd);border-radius:12px;
  padding:14px 16px;transition:border-color .2s ease,box-shadow .2s ease;
}
.fi:focus-within{border-color:var(--blue-mid);box-shadow:0 0 0 4px rgba(30,111,229,.06)}
.fi.fw{grid-column:1/-1}
.fi label{display:block;font-size:13px;font-weight:600;color:var(--t2);text-transform:none;letter-spacing:.2px;margin-bottom:8px}
.fi-v{font-size:17px;color:var(--t1);font-weight:500;line-height:1.4}
.fi-v.hi{font-size:22px;font-weight:700;color:var(--blue)}
.fi input{
  width:100%;border:1.5px solid var(--brd2);border-radius:10px;
  padding:13px 16px;font-size:16px;
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:var(--sur);outline:none;margin-top:2px;
  transition:border-color .2s ease,box-shadow .2s ease,background .2s ease;
}
.fi input:hover{border-color:var(--brd2)}
.fi input:focus{
  border-color:var(--blue);background:var(--sur);
  box-shadow:0 0 0 4px rgba(30,111,229,.12),0 2px 8px rgba(30,111,229,.05);
}

.drop{
  border:2px dashed var(--brd2);border-radius:16px;
  padding:40px 24px;text-align:center;cursor:pointer;
  background:var(--sur2);margin-bottom:16px;
  transition:border-color .25s ease,background .25s ease,transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s ease;
  position:relative;overflow:hidden;
}
.drop:hover{
  border-color:var(--blue);background:var(--blue-bg);
  transform:translateY(-2px);box-shadow:0 8px 22px rgba(30,111,229,.08);
}
.drop.drag{
  border-color:var(--blue);background:var(--blue-bg);
  transform:scale(1.01);box-shadow:0 12px 30px rgba(30,111,229,.14);
}
.drop-ic{
  width:56px;height:56px;border-radius:16px;
  background:linear-gradient(135deg,#E0E7EF 0%,#CBD5E1 100%);
  display:flex;align-items:center;justify-content:center;margin:0 auto 14px;
  transition:transform .3s cubic-bezier(.4,0,.2,1),background .25s ease;
  box-shadow:0 4px 12px rgba(15,23,42,.06);
}
.drop:hover .drop-ic,.drop.drag .drop-ic{
  background:linear-gradient(135deg,var(--blue-mid) 0%,#93C5FD 100%);
  transform:scale(1.08) translateY(-2px);
}
.drop:hover .drop-ic svg,.drop.drag .drop-ic svg{stroke:var(--blue)}
.drop-main{font-size:17px;font-weight:600;color:var(--t1);margin-bottom:6px}
.drop-hint{font-size:14.5px;color:var(--t3)}

.bnr{
  border-radius:14px;padding:16px 20px;
  display:flex;align-items:center;gap:14px;margin-bottom:20px;
  position:relative;overflow:hidden;
  animation:bnrIn .35s cubic-bezier(.4,0,.2,1);
}
@keyframes bnrIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.bnr::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:4px;
  background:currentColor;opacity:.7;
}
.bnr.am{background:var(--amber-bg);border:1px solid var(--amber-brd);color:var(--amber)}
.bnr.er{background:var(--red-bg);border:1px solid var(--red-brd);color:var(--red)}
.bnr-body{flex:1;min-width:0}
.bnr-t{font-size:16.5px;font-weight:600}
.bnr-s{font-size:14.5px;margin-top:4px}
.am .bnr-t{color:#7C4A00}.am .bnr-s{color:var(--amber)}.am svg{color:var(--amber);flex-shrink:0}
.er .bnr-t{color:var(--red)}.er svg{color:var(--red);flex-shrink:0}

.ldg{text-align:center;padding:64px 20px}
.spin{width:32px;height:32px;border-radius:50%;border:2.5px solid var(--brd);border-top-color:var(--blue);border-right-color:var(--blue);animation:spin .7s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.ldg-t{font-size:14px;font-weight:500;color:var(--t2)}
.ldg-s{font-size:13px;color:var(--t3);margin-top:4px}
.empty{text-align:center;padding:72px 20px;position:relative}
.empty::before{
  content:"";position:absolute;left:50%;top:42px;
  width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,var(--blue-bg) 0%,transparent 70%);
  transform:translateX(-50%);pointer-events:none;
}
.empty > *{position:relative}
.empty svg{
  margin:0 auto 18px;display:block;color:var(--blue);
  padding:14px;background:var(--blue-bg);border-radius:18px;
  width:64px;height:64px;
  box-shadow:0 8px 22px rgba(16,185,129,.18);
  animation:emptyFloat 3.6s var(--ez) infinite;
}
@keyframes emptyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.empty-t{font-size:17px;font-weight:700;color:var(--t1);margin-bottom:6px;letter-spacing:-.2px}
.empty-s{font-size:14px;color:var(--t3);max-width:320px;margin:0 auto;line-height:1.5}

/* Scroll-to-top floating button — teal theme (Chakra) */
.scroll-top{
  position:fixed;bottom:30px;right:30px;z-index:300;
  width:52px;height:52px;border-radius:50%;
  background:linear-gradient(135deg,#234E52 0%,#319795 50%,#4FD1C5 100%);
  border:none;color:#fff;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:
    0 0 0 2.5px #234E52 inset,
    0 10px 26px rgba(49,151,149,.50),
    0 4px 10px rgba(35,78,82,.28);
  animation:stIn .4s var(--ez-out) backwards;
  transition:transform .25s var(--ez-out),box-shadow .25s ease;
}
.scroll-top:hover{
  transform:translateY(-4px) scale(1.05);
  box-shadow:
    0 0 0 2.5px #234E52 inset,
    0 16px 34px rgba(49,151,149,.62),
    0 6px 14px rgba(35,78,82,.32);
}
.scroll-top:active{transform:translateY(-1px) scale(.96)}
.scroll-top svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,.18));position:relative;z-index:2}
/* concentric rings */
.scroll-top::before{
  content:"";position:absolute;inset:-14px;border-radius:50%;
  border:1.5px solid rgba(49,151,149,.28);
  animation:stPulse 2.2s var(--ez) infinite;
  pointer-events:none;
}
.scroll-top::after{
  content:"";position:absolute;inset:-28px;border-radius:50%;
  border:1.5px solid rgba(49,151,149,.16);
  animation:stPulse 2.2s var(--ez) .4s infinite;
  pointer-events:none;
}
@keyframes stIn{
  from{opacity:0;transform:translateY(20px) scale(.8)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes stPulse{
  0%,100%{transform:scale(.96);opacity:.9}
  50%{transform:scale(1.12);opacity:.4}
}
@media(max-width:767px){
  .scroll-top{width:44px;height:44px;bottom:14px;right:14px;box-shadow:0 0 0 2px #234E52 inset,0 6px 16px rgba(49,151,149,.45)}
  .scroll-top svg{width:18px;height:18px}
  .scroll-top::before{inset:-8px;border-width:1px}
  .scroll-top::after{inset:-16px;border-width:1px}
}

.toast{
  position:fixed;bottom:26px;right:26px;
  background:rgba(255,255,255,.92);
  -webkit-backdrop-filter:saturate(180%) blur(16px);
  backdrop-filter:saturate(180%) blur(16px);
  border:1px solid var(--brd);border-radius:16px;
  padding:14px 20px;font-size:15.5px;font-weight:500;z-index:400;
  box-shadow:var(--sh3);
  display:flex;align-items:center;gap:12px;max-width:400px;
  animation:tIn .35s var(--ez-out);color:var(--t1);
}
body.dark .toast{background:rgba(23,28,50,.92)}
.toast.ok{border-left:4px solid var(--green)}
.toast.ok svg{color:var(--green)}
.toast.er{border-left:4px solid var(--red)}
.toast.er svg{color:var(--red)}
@keyframes tIn{from{transform:translateY(16px) scale(.96);opacity:0}to{transform:none;opacity:1}}

.pdf-preview-wrap{display:flex;flex-direction:column;border:1.5px solid var(--brd);border-radius:12px;overflow:hidden;background:var(--sur2);}
.pdf-preview-bar{padding:13px 18px;background:var(--sur);border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:var(--t2);flex-shrink:0;}
.pdf-preview-bar > svg:first-child{color:var(--blue)}
.pdf-preview-bar .pdf-fname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pdf-preview-bar .pdf-size{font-size:13.5px;font-weight:400;color:var(--t3);flex-shrink:0;}
.pdf-zoom-btn{width:38px;height:38px;border-radius:9px;background:var(--sur2);border:1.5px solid var(--brd);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s;}
.pdf-zoom-btn:hover{background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.pdf-zoom-btn:disabled{opacity:.35;cursor:not-allowed}

.pdf-lb-ov{position:fixed;inset:0;background:rgba(10,18,36,.90);display:flex;flex-direction:column;z-index:500;backdrop-filter:blur(10px);animation:fadeIn .18s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.pdf-lb-bar{height:70px;background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;gap:12px;padding:0 26px;color:#E2E8F0;flex-shrink:0;}
.pdf-lb-bar .pdf-lb-name{flex:1;font-size:17px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pdf-lb-bar .pdf-lb-size{font-size:14px;color:#94A3B8;font-weight:400}
.pdf-lb-btn{height:44px;padding:0 16px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:15.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .12s;font-family:'Sarabun','Noto Sans Thai',sans-serif;}
.pdf-lb-btn:hover{background:rgba(255,255,255,.18)}
.pdf-lb-btn.close{background:rgba(217,48,37,.18);border-color:rgba(217,48,37,.30)}
.pdf-lb-btn.close:hover{background:rgba(217,48,37,.32)}
.pdf-lb-zoom{font-size:15px;font-variant-numeric:tabular-nums;color:#E2E8F0;min-width:58px;text-align:center;padding:0 8px;font-weight:600;}
.pdf-lb-body{flex:1;overflow:auto;padding:18px;display:flex;align-items:flex-start;justify-content:center;background:transparent;}
.pdf-lb-frame-wrap{background:#fff;border-radius:8px;box-shadow:0 30px 60px rgba(0,0,0,.5);transition:width .15s ease;}
.pdf-lb-frame{display:block;border:none;width:100%;height:100%}
.pdf-iframe{width:100%;border:none;display:block}
.pdf-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:56px 24px;color:var(--t3);text-align:center;}
.pdf-placeholder .ph-title{font-size:17px;font-weight:600;color:var(--t2)}
.pdf-placeholder .ph-hint{font-size:15px}

.modal-split{display:flex;gap:18px;align-items:flex-start}
.modal-split .split-form{flex:1;min-width:0}
.modal-split .split-preview{width:370px;flex-shrink:0;position:sticky;top:0;}
@media(max-width:860px){
  .modal-split{flex-direction:column}
  .modal-split .split-preview{width:100%;position:static}
}

@media(max-width:1023px){
  .sb-nav{display:none}
  .srch{display:none}
  .ham{display:flex}
  .stats{grid-template-columns:1fr 1fr}
  .top{padding:8px 18px}
  .body{padding:22px}
  .sb-status-txt{display:none}
  /* topnav: shrink chrome to fit mobile */
  .sb{height:64px;padding:0 14px;gap:0}
  .sb-logo{padding:0 12px 0 0;margin-right:8px;gap:8px}
  .sb-logo::after{height:28px}
  .sb-logo img:first-child{height:42px !important;width:42px !important}
  .sb-logo img:nth-child(2){height:30px !important;width:30px !important}
  .sb-brand{font-size:15px}
  .sb-brand-sub{display:none}
  .sb-dot{margin-right:2px}
  .theme-btn,.ham{width:38px;height:38px;border-radius:10px}
  .theme-btn svg,.ham svg{width:18px;height:18px}
}
@media(max-width:480px){
  .sb{padding:0 10px}
  .sb-logo{padding:0 8px 0 0;margin-right:6px;gap:6px}
  .sb-logo::after{display:none}  /* hide divider on tiny */
  .sb-logo img:first-child{height:36px !important;width:36px !important}
  .sb-logo img:nth-child(2){display:none}  /* hide avatar on tiny screens */
  .sb-brand{font-size:14px}
  /* right area: ensure visible spacing between buttons */
  .sb > div:last-child{gap:6px !important}
  .theme-btn,.ham{width:36px;height:36px}
  .theme-btn svg,.ham svg{width:17px;height:17px}
  .sb-dot{margin:0 4px 0 2px}
}
@media(max-width:639px){
  .stats{grid-template-columns:1fr 1fr;gap:10px}
  .sc{padding:16px 14px;gap:10px}
  .sc-hd{align-items:flex-start}
  .sc-ico{width:34px;height:34px;border-radius:10px;flex-shrink:0}
  .sc-ico svg{width:18px;height:18px}
  .sc-bd{min-width:0;flex:1}
  .sc-lbl{
    font-size:12px;
    line-height:1.3;
    margin-bottom:4px;
    /* 2 บรรทัดสูงสุดแล้ว ellipsis — กัน label ยาวไม่พัง layout */
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .sc-val{font-size:24px;letter-spacing:-.6px}
  .sc-sub{display:none}
  .srch{display:none}
  .body{padding:16px}
  .top-sub{display:none}
  .btn-b .btn-txt{display:none}
  .btn-b{padding:13px 14px}
  .card-hd{padding:14px 16px}
  th,td{padding:14px 14px;font-size:16px}
  .pg{padding:12px 16px}
  .modal-bd{padding:20px}
  .modal-hd{padding:20px 20px 0;padding-bottom:16px}
  .fg{grid-template-columns:1fr;gap:14px}
  .fi{padding:14px 16px}
  .fi.fw{grid-column:unset}
  .drop{padding:30px 18px}
}
@media(max-width:380px){
  .sc{padding:14px 12px;gap:8px}
  .sc-ico{width:30px;height:30px;border-radius:9px}
  .sc-ico svg{width:16px;height:16px}
  .sc-lbl{font-size:11.5px}
  .sc-val{font-size:22px}
}

.page-wrap{display:block;min-height:calc(100vh - 76px);overflow-x:hidden}
.page-hd{
  padding:14px 28px;background:var(--sur);
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:18px;
  flex-wrap:nowrap;min-width:0;
}
.page-back{
  display:inline-flex;align-items:center;gap:8px;
  padding:11px 18px;border-radius:12px;
  border:1px solid var(--brd);background:var(--sur);
  color:var(--t2);cursor:pointer;font-size:15.5px;font-weight:500;
  transition:transform .15s var(--ez-out),background .15s,color .15s,border-color .15s,box-shadow .15s;
  font-family:inherit;flex-shrink:0;box-shadow:var(--sh0);
}
.page-back:hover{background:var(--blue-bg);color:var(--blue);border-color:var(--blue-mid);transform:translateX(-2px)}
.page-hd-div{width:1px;height:26px;background:var(--brd);flex-shrink:0}
.page-hd-info{flex:1 1 0;min-width:0;overflow:hidden}
.page-title{font-size:20px;font-weight:700;color:var(--t1);letter-spacing:-.3px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.page-sub{font-size:14px;color:var(--t3);margin-top:3px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.page-hd-right{display:flex;gap:8px;align-items:center;flex-shrink:0}
.page-body{padding:18px 28px 22px;flex:1}      /* header เป็น static แล้ว ไม่ต้องชดเชยความสูง */

.detail-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start}
.detail-aside{position:sticky;top:80px}
.info-card{background:var(--sur);border:1px solid var(--brd);border-radius:var(--rL);box-shadow:var(--sh1);margin-bottom:22px;overflow:hidden;transition:box-shadow .25s var(--ez-out)}
.info-card:hover{box-shadow:var(--sh2)}
.info-card-hd{
  display:flex;align-items:center;gap:12px;padding:16px 22px;
  background:linear-gradient(180deg,var(--sur2),transparent);
  border-bottom:1px solid var(--brd);
}
.info-card-hd svg{color:var(--blue)}
.info-card-title{font-size:16.5px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.info-card-bd{padding:22px}
.info-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.info-row.fw{grid-template-columns:1fr}
.info-field{padding:0;margin-bottom:0}
.info-label{font-size:14px;font-weight:600;color:var(--t2);margin-bottom:7px}
.info-val{font-size:17px;color:var(--t1);font-weight:500;line-height:1.4;word-break:break-word}
.info-val.hi{font-size:24px;font-weight:700;color:var(--blue)}
.info-val.mono{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:15.5px;letter-spacing:.3px}

.upload-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start}
.upload-aside{position:sticky;top:80px}
.upload-aside .pdf-preview-wrap{box-shadow:var(--sh1)}

.drop-h{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  padding:0 32px;border:2px dashed var(--brd2);
  border-radius:14px;cursor:pointer;
  transition:height .3s ease,min-height .3s ease,padding .3s ease,background .2s,border-color .2s;
  background:var(--sur2);height:calc(50vh - 80px);min-height:220px;
  text-align:center;overflow:hidden;
}
.drop-h:hover,.drop-h.drag{border-color:var(--blue);background:var(--blue-bg)}
.drop-h-ic{
  width:64px;height:64px;border-radius:16px;background:var(--brd);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;
}
.drop-h:hover .drop-h-ic,.drop-h.drag .drop-h-ic{background:var(--blue-mid)}
.drop-h:hover .drop-h-ic svg,.drop-h.drag .drop-h-ic svg{stroke:var(--blue)}
.drop-h-main,.drop-h-name{font-size:19px;font-weight:600;color:var(--t1)}
.drop-h-hint{font-size:15.5px;color:var(--t3);margin-top:6px}
.drop-h-info{display:flex;flex-direction:column;align-items:center}
.drop-h.has-file{
  border-style:solid;border-color:var(--green-brd);background:var(--green-bg);
  height:auto !important;min-height:unset !important;flex-direction:row;
  padding:13px 18px;text-align:left;gap:14px;
}
.drop-h.has-file .drop-h-ic{width:44px;height:44px;border-radius:11px;background:rgba(13,156,107,.12);flex-shrink:0;}
.drop-h.has-file .drop-h-ic svg{stroke:var(--green)}
.drop-h.has-file .drop-h-name{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.drop-h.has-file .drop-h-hint{font-size:12.5px}
.drop-h-badge{background:var(--sur2);color:var(--t3);border:1px solid var(--brd2);border-radius:7px;padding:3px 10px;font-size:12px;font-weight:600;flex-shrink:0;}
.drop-h-badge.ok{background:var(--green-bg);color:var(--green);border-color:var(--green-brd)}

.drop-wrap{border:2px dashed var(--brd2);border-radius:14px;background:var(--sur2);overflow:hidden;transition:border-color .2s,background .2s;}
.drop-wrap.has-file{border-style:solid;border-color:var(--green-brd);background:var(--green-bg)}
.drop-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer;user-select:none;gap:12px;}
.drop-bar:hover{background:rgba(15,23,42,.03)}
.drop-wrap.has-file .drop-bar:hover{background:rgba(13,156,107,.06)}
.drop-bar-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.drop-bar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.drop-toggle{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;color:var(--t3);transition:all .15s;}
.drop-toggle:hover{background:var(--brd);color:var(--t1)}
.drop-body{display:flex;align-items:center;justify-content:center;min-height:220px;cursor:pointer;padding:16px;}
.drop-body-inner{display:flex;flex-direction:column;align-items:center;gap:12px;padding:36px 32px;text-align:center;pointer-events:none;}
.drop-body-inner button{pointer-events:all}
.drop-wrap:not(.has-file) .drop-body:hover,.drop-wrap:not(.has-file) .drop-body.drag{background:var(--blue-bg);}
.drop-wrap:not(.has-file) .drop-body:hover .drop-h-ic,
.drop-wrap:not(.has-file) .drop-body.drag .drop-h-ic{background:var(--blue-mid)}
.drop-wrap:not(.has-file) .drop-body:hover .drop-h-ic svg,
.drop-wrap:not(.has-file) .drop-body.drag .drop-h-ic svg{stroke:var(--blue)}

.notes-card{border:1.5px solid var(--brd);border-radius:12px;overflow:hidden;background:var(--sur);}
.notes-card-hd{display:flex;align-items:center;gap:9px;padding:12px 18px;border-bottom:1px solid var(--brd);background:var(--sur2);font-size:14px;font-weight:600;color:var(--t2);}
.notes-ta{width:100%;border:none;outline:none;resize:vertical;padding:14px 18px;font-size:16.5px;min-height:110px;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:var(--t1);background:var(--sur);line-height:1.6;}
.notes-ta::placeholder{color:var(--t2);opacity:.55}

.form-panel{border:1.5px solid var(--brd);border-radius:14px;background:var(--sur);overflow:hidden;}
.form-panel-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer;user-select:none;gap:12px;transition:background .15s;}
.form-panel-bar:hover{background:var(--sur2)}
.form-panel-body{border-top:1px solid var(--brd);padding:18px 16px;position:relative;}

.form-loading-wrap{position:relative}
.form-overlay{position:absolute;inset:0;background:rgba(247,249,252,.82);backdrop-filter:blur(3px);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:20;}

.fname-row{display:flex;align-items:center;gap:10px;background:var(--sur);border:1.5px solid var(--brd);border-radius:11px;padding:12px 16px;}
.fname-row label{font-size:14px;font-weight:600;color:var(--t2);white-space:nowrap;flex-shrink:0}
.fname-row input{flex:1;border:none;outline:none;font-size:16px;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:var(--t1);background:transparent;min-width:0;}
.fname-row input::placeholder{color:var(--t3)}
.fname-row button{background:none;border:none;cursor:pointer;font-size:12px;color:var(--blue);padding:0;white-space:nowrap;flex-shrink:0;}
.fname-row button:hover{text-decoration:underline}

/* ═══════════════════════════════════════════════════════════
   LOGIN PAGE — aurora gradient backdrop
   ═══════════════════════════════════════════════════════════ */
.login-wrap{
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  padding:20px;position:relative;overflow:hidden;
  background:var(--bg);
  background-image:
    radial-gradient(at 20% 25%, rgba(99,102,241,.22) 0, transparent 50%),
    radial-gradient(at 85% 75%, rgba(34,211,238,.18) 0, transparent 50%),
    radial-gradient(at 50% 100%, rgba(168,85,247,.15) 0, transparent 55%);
}
body.dark .login-wrap{
  background-image:
    radial-gradient(at 20% 25%, rgba(99,102,241,.35) 0, transparent 50%),
    radial-gradient(at 85% 75%, rgba(34,211,238,.22) 0, transparent 50%),
    radial-gradient(at 50% 100%, rgba(168,85,247,.22) 0, transparent 55%);
}
.login-bg-blob{
  position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;opacity:.5;
  animation:floaty 12s var(--ez) infinite alternate;
}
@keyframes floaty{from{transform:translate(0,0) scale(1)}to{transform:translate(20px,-20px) scale(1.05)}}
.login-bg-blob-1{
  width:520px;height:520px;
  background:radial-gradient(circle,rgba(99,102,241,.45) 0%,transparent 70%);
  top:-160px;right:-120px;animation-delay:0s;
}
.login-bg-blob-2{
  width:420px;height:420px;
  background:radial-gradient(circle,rgba(34,211,238,.38) 0%,transparent 70%);
  bottom:-100px;left:-100px;animation-delay:2s;
}
.login-card{
  width:100%;max-width:440px;
  background:rgba(255,255,255,.85);
  -webkit-backdrop-filter:saturate(180%) blur(24px);
  backdrop-filter:saturate(180%) blur(24px);
  border:1px solid rgba(255,255,255,.6);
  border-radius:24px;padding:38px 36px 30px;
  box-shadow:0 30px 70px rgba(11,16,32,.18),0 8px 20px rgba(11,16,32,.08),inset 0 1px 0 rgba(255,255,255,.6);
  position:relative;z-index:1;
  animation:login-in .55s var(--ez-out);
}
body.dark .login-card{
  background:rgba(23,28,50,.72);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 30px 70px rgba(0,0,0,.55),0 8px 20px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08);
}
@keyframes login-in{
  from{opacity:0;transform:translateY(20px) scale(.96)}
  to{opacity:1;transform:none}
}
.login-brand{display:flex;align-items:center;gap:16px;margin-bottom:26px}
.login-logo-wrap{
  width:68px;height:68px;border-radius:20px;
  background:linear-gradient(135deg,var(--g1),var(--g2));
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 10px 24px rgba(99,102,241,.40);
  position:relative;overflow:hidden;
}
.login-logo-wrap::after{
  content:"";position:absolute;inset:2px;border-radius:18px;
  background:rgba(255,255,255,.96);
  display:flex;
}
.login-logo-wrap img{position:relative;z-index:1}
body.dark .login-logo-wrap::after{background:rgba(23,28,50,.96)}
.login-app-name{font-size:23px;font-weight:700;color:var(--t1);letter-spacing:-.4px;line-height:1.2}
.login-app-sub{font-size:14px;color:var(--t3);margin-top:5px;font-weight:400;line-height:1.4}
.login-divider{height:1px;background:linear-gradient(90deg,transparent,var(--brd),transparent);margin-bottom:26px}
.login-field{display:flex;flex-direction:column;gap:8px}
.login-label{font-size:14.5px;font-weight:700;color:var(--t2)}
.login-input-wrap{
  display:flex;align-items:center;
  border:1.5px solid var(--brd);border-radius:12px;
  background:var(--sur2);transition:border-color .15s,box-shadow .15s;
  overflow:hidden;
}
.login-input-wrap:focus-within{
  border-color:var(--blue);background:var(--sur);
  box-shadow:0 0 0 3px rgba(30,111,229,.10);
}
.login-input-ico{
  padding:0 0 0 15px;color:var(--t3);flex-shrink:0;
  display:flex;align-items:center;pointer-events:none;
}
.login-input-wrap:focus-within .login-input-ico{color:var(--blue)}
.login-input{
  flex:1;border:none;outline:none;padding:14px 14px;
  font-size:16px;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:var(--t1);background:transparent;min-width:0;
}
.login-input::placeholder{color:var(--t3)}
.login-input:disabled{opacity:.6;cursor:not-allowed}
.login-eye{
  background:none;border:none;cursor:pointer;
  padding:0 13px;color:var(--t3);display:flex;align-items:center;
  flex-shrink:0;transition:color .12s;height:100%;
}
.login-eye:hover{color:var(--blue)}
.login-submit{
  width:100%;justify-content:center;
  padding:15px 22px;font-size:17px;border-radius:12px;
  margin-top:4px;letter-spacing:.2px;
}
.login-footer{
  margin-top:24px;
  display:flex;align-items:center;justify-content:center;gap:6px;
  font-size:13px;color:var(--t3);
}
/* logout button — ไม่แสดงในมือถือ (ใช้ mobile menu แทน) */
.sb-logout{color:var(--t2)}
.sb-logout:hover{background:var(--red-bg) !important;border-color:var(--red-brd) !important;color:var(--red) !important}
@media(max-width:639px){
  .login-wrap{padding:16px;align-items:flex-start;padding-top:40px}
  .login-card{padding:26px 20px 22px;border-radius:16px}
  .login-app-name{font-size:19px}
  .login-app-sub{font-size:13px}
  .login-logo-wrap{width:52px;height:52px;border-radius:14px}
  .login-submit{padding:14px 20px;font-size:16px}
  .login-bg-blob-1,.login-bg-blob-2{display:none}
}
@media(max-width:380px){
  .login-card{padding:22px 16px 18px}
  .login-brand{gap:12px}
}
/* ═══════════════════════════════════════════════════════════ */

@media(max-width:1100px){.upload-split{grid-template-columns:320px 1fr}}
@media(max-width:860px){
  .detail-split,.upload-split{grid-template-columns:1fr}
  .detail-aside,.upload-aside{position:static;max-width:100%;overflow:hidden}
  .upload-aside .pdf-iframe{height:70vh !important;min-height:500px !important}
  .pdf-preview-wrap .pdf-iframe{height:75vh !important;min-height:500px !important}
}
@media(max-width:639px){
  /* ซ่อน live preview ฝั่งขวาบนจอเล็ก (กว้าง < 640px) — กว้างเกินจะดูไม่รู้เรื่อง */
  .detail-aside{display:none !important}
  /* PremiumGrid compact — ลด padding/font ให้พอดี viewport */
  .premium-grid-table th, .premium-grid-table td{padding:6px 4px !important;font-size:12.5px !important}
  .premium-grid-table input{padding:6px 8px !important;font-size:13px !important;min-width:60px !important}
  .premium-grid-table{min-width:0 !important}
  /* "รวม" column sticky right — ผู้ใช้เห็นยอดรวมตลอด แม้ scroll กลาง */
  .premium-grid-table th:last-child, .premium-grid-table td:last-child{
    position:sticky;right:0;background:var(--blue-bg);
    box-shadow:-4px 0 8px -4px rgba(0,0,0,.08);
  }
  .page-hd{padding:8px 12px;gap:8px;flex-wrap:nowrap;align-items:center}
  .page-hd-div{display:none}
  .page-body{padding:12px}                 /* mobile */
  .page-title{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .page-sub{font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .page-hd-info{flex:1 1 auto;min-width:0;overflow:hidden}
  /* title + badge บรรทัดเดียวกัน, badge ไม่ wrap */
  .page-hd-info > div:first-child{display:flex !important;align-items:center;gap:8px !important;min-width:0;flex-wrap:nowrap;overflow:hidden}
  .page-hd-info > div:first-child .badge{flex-shrink:0}
  .page-hd-right{gap:8px;margin-left:auto;flex-shrink:0;flex-wrap:nowrap}
  /* ปุ่ม mobile — ใหญ่ ชัด มี shadow */
  .page-hd-right .btn{
    padding:0 !important;
    width:46px;height:46px;
    min-width:46px;min-height:46px;
    font-size:13.5px;gap:0;border-radius:12px;
    border-width:2px;
    display:inline-flex;align-items:center;justify-content:center;
    flex-shrink:0;
    box-shadow:0 2px 6px rgba(0,0,0,.08);
    transition:transform .12s, box-shadow .12s;
  }
  .page-hd-right .btn:active{transform:scale(.94);box-shadow:0 1px 3px rgba(0,0,0,.12)}
  /* icon ใหญ่ขึ้น เห็นชัดมือถือ */
  .page-hd-right .btn svg{width:22px !important;height:22px !important}
  .page-back{
    padding:0 !important;width:46px;height:46px;min-width:46px;min-height:46px;
    flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;
    border-radius:12px;border-width:2px;
    box-shadow:0 2px 6px rgba(0,0,0,.08);
    background:var(--sur2);
  }
  .page-back svg{width:22px !important;height:22px !important}
  .page-back .btn-label{display:none}
  /* ── PremiumGrid table — แน่นบนมือถือ ── */
  .info-card-bd table{min-width:380px !important}
  .info-card-bd table th{padding:8px 7px !important;font-size:12px !important}
  .info-card-bd table td{padding:5px 5px !important;font-size:12.5px !important}
  .info-card-bd table input{padding:6px 7px !important;font-size:12.5px !important}
  /* ── PolicyTable — compact cells ── */
  .card table th,.card table td{padding:11px 9px;font-size:13.5px}
  .card table td.tm{font-size:13px;letter-spacing:0}
  .plate{padding:4px 8px;font-size:13px}
  .card .badge{padding:4px 9px;font-size:12.5px}
  .info-row{grid-template-columns:1fr;gap:14px}
  .info-row.fw{grid-template-columns:1fr}
  .info-row[style*="margin-bottom"]{margin-bottom:14px !important}
  .info-card{margin-bottom:14px;border-radius:13px}
  .info-card-hd{padding:11px 14px}
  .info-card-title{font-size:15.5px}
  .info-card-bd{padding:13px 14px !important}
  .info-label{font-size:13px;margin-bottom:4px}
  .info-val{font-size:15.5px}
  .info-val.hi{font-size:20px !important}
  /* hero "เลขกรมธรรม์" card — ลด padding และ font-size */
  .info-card-bd > .info-field[style*="blue-bg"]{padding:12px 14px !important;margin-bottom:12px !important;border-radius:10px !important}
  .info-card-bd > .info-field[style*="blue-bg"] .info-val{font-size:19px !important}
  .pdf-preview-wrap .pdf-iframe{height:55vh !important;min-height:280px !important}
  .pdf-preview-bar{padding:10px 12px;gap:7px}
  .pdf-zoom-btn{width:34px;height:34px}
}
@media(max-width:480px){
  .page-hd{padding:7px 10px}
  .page-back{padding:8px 10px;font-size:0;gap:0;min-width:38px;justify-content:center}
  .page-back svg{flex-shrink:0}
  /* ซ่อนข้อความปุ่ม action — เหลือไอคอนอย่างเดียว */
  .page-hd-right .btn .btn-label{display:none}
  .page-hd-right .btn{padding:9px;min-width:40px;justify-content:center;gap:0}
  /* ซ่อน field ที่ค่าว่าง บนจอเล็ก เพื่อลดความยาวหน้า */
  .info-field-empty{display:none}
  .info-card-bd{padding:12px !important}
  .page-body{padding:10px}                 /* small mobile */
}
`

export default CSS
