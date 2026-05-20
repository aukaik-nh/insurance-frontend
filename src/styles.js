const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --w:264px;
  --bg:#F0F2F5;
  --sur:#FFFFFF;
  --sur2:#F7F9FC;
  --brd:#E0E5ED;
  --brd2:#C4CEDB;
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
  --t2:#344054;
  --t3:#64748B;
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
body{font-family:'Sarabun','Noto Sans Thai',sans-serif;font-size:16px;background:var(--bg);color:var(--t1);-webkit-font-smoothing:antialiased;line-height:1.55}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#C8D3DF;border-radius:99px}
::-webkit-scrollbar-track{background:transparent}

.app{display:flex;flex-direction:column;min-height:100vh}

.sb{
  width:100%;background:var(--sur);
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;
  border-bottom:1px solid var(--brd);
  box-shadow:var(--sh0);padding:0 24px;height:64px;gap:0;
}
.theme-btn{
  width:42px;height:42px;border-radius:10px;
  background:none;border:1.5px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .12s;
}
.theme-btn:hover{background:var(--sur2);color:var(--t1)}
.ham{
  width:42px;height:42px;border-radius:10px;
  background:none;border:1.5px solid var(--brd);
  color:var(--t2);cursor:pointer;
  display:none;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .12s;
}
.ham:hover{background:var(--sur2);color:var(--t1)}
.mob-menu{
  display:none;position:absolute;top:64px;left:0;right:0;
  background:var(--sur);border-bottom:1px solid var(--brd);
  box-shadow:var(--sh2);z-index:99;
  flex-direction:column;padding:12px 14px 16px;
}
.mob-menu.open{display:flex;animation:slideDown .18s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
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
  display:flex;align-items:center;gap:10px;
  padding:0 20px 0 0;border-right:1px solid var(--brd);
  margin-right:10px;height:100%;flex-shrink:0;
}
.sb-mark{
  width:42px;height:42px;
  background:var(--blue-bg);
  border-radius:11px;display:flex;align-items:center;
  justify-content:center;flex-shrink:0;
}
.sb-brand{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.2}
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
.sb-status-txt{font-size:14px;color:var(--t3)}

.main{flex:1;display:flex;flex-direction:column;min-width:0}

.top{
  min-height:62px;background:var(--sur);border-bottom:1px solid var(--brd);
  display:flex;align-items:center;padding:8px 24px;gap:14px;
  box-shadow:0 1px 4px rgba(15,23,42,.05);
}
.top-l{flex:1;min-width:0}
.top-title{font-size:19px;font-weight:700;color:var(--t1);letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
.top-sub{font-size:14px;color:var(--t3);margin-top:2px;font-weight:400}
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
  position:sticky;top:126px;height:calc(100vh - 126px);
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
.pvp-close{
  background:var(--sur2);border:1.5px solid var(--brd);border-radius:8px;
  width:34px;height:34px;cursor:pointer;display:flex;
  align-items:center;justify-content:center;
  color:var(--t1);flex-shrink:0;transition:all .15s;margin-left:auto;
}
.pvp-close:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}
.pvp-backdrop{display:none}
@media(max-width:767px){
  .pvp-backdrop{display:block;position:fixed;inset:0;z-index:149;background:rgba(0,0,0,.4)}
  .pvp-close{width:44px;height:44px}
}
.pvp-body{overflow-y:auto;padding:14px 18px;flex-shrink:0}
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

/* Filter bar — collapsible panel */
.filter-bar{
  background:var(--sur);border:1.5px solid var(--brd);border-radius:14px;
  padding:18px 24px;display:flex;align-items:center;
  flex-wrap:wrap;gap:18px;box-shadow:var(--sh0);
  animation:fbar-in .15s ease;
}
@media(max-width:900px){
  .filter-bar{flex-direction:column;align-items:stretch;gap:14px}
  .fbar-div{display:none}
  .fbar-group{flex-wrap:wrap}
}
@keyframes fbar-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.fbar-group{display:flex;align-items:center;gap:10px;flex-shrink:0}
.fbar-lbl{font-size:14px;font-weight:700;color:var(--t2);white-space:nowrap;letter-spacing:.2px}
.fbar-opts{display:flex;gap:6px;flex-wrap:wrap}
.fbar-div{width:1px;height:28px;background:var(--brd);flex-shrink:0}
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
.big-srch-wrap{margin-bottom:20px}
.big-srch{
  display:flex;align-items:center;gap:14px;
  background:var(--sur);border:2px solid var(--brd);
  border-radius:14px;padding:14px 22px;
  box-shadow:var(--sh1);transition:all .2s;
}
.big-srch:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(30,111,229,.10)}
.big-srch svg{color:var(--t3);flex-shrink:0;transition:color .2s}
.big-srch:focus-within svg{color:var(--blue)}
.big-srch input{
  flex:1;border:none;outline:none;font-size:17px;
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

.btn{
  display:inline-flex;align-items:center;gap:9px;
  padding:13px 22px;border-radius:11px;border:none;
  cursor:pointer;font-size:16px;font-weight:600;
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

.body{padding:20px 28px}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:24px}
.sc{
  background:var(--sur);border:none;
  border-radius:16px;padding:20px 22px 18px;
  box-shadow:0 2px 8px rgba(15,23,42,.08),0 0 0 1px rgba(15,23,42,.04);
  display:flex;align-items:flex-start;justify-content:space-between;
  transition:box-shadow .2s,transform .2s;
}
.sc:hover{box-shadow:0 8px 24px rgba(15,23,42,.12),0 0 0 1px rgba(15,23,42,.05);transform:translateY(-2px)}
.sc-ico{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sc-ico.bl{background:linear-gradient(135deg,#E8F0FE,#C7D9FD);color:#1E6FE5}
.sc-ico.gr{background:linear-gradient(135deg,#E6F9F0,#BCEDD7);color:#0D9C6B}
.sc-ico.am{background:linear-gradient(135deg,#FFF7E0,#FDEDB0);color:#C07000}
.sc-ico.pu{background:linear-gradient(135deg,#F2EEFF,#DACCFF);color:#6C3CE0}
.sc-bd{min-width:0;flex:1}
.sc-lbl{font-size:15px;font-weight:600;color:var(--t2);margin-bottom:8px;line-height:1.3}
.sc-val{font-size:34px;font-weight:700;color:var(--t1);letter-spacing:-.8px;line-height:1;font-family:'Sarabun',sans-serif}
.sc-sub{font-size:14px;color:var(--t3);margin-top:8px;font-weight:400;display:flex;align-items:center;gap:6px}

.card{background:var(--sur);border:1px solid var(--brd);border-radius:16px;overflow:hidden;box-shadow:var(--sh0)}
.card-hd{padding:18px 24px;border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:19px;font-weight:700;color:var(--t1)}
.card-sub{font-size:15px;color:var(--t3);margin-top:4px;font-weight:400}

table{width:100%;border-collapse:collapse}
thead{background:var(--sur2)}
th{padding:14px 20px;text-align:left;font-size:14px;font-weight:700;color:var(--t2);text-transform:none;letter-spacing:.2px;border-bottom:1px solid var(--brd);white-space:nowrap;font-family:'Sarabun',sans-serif}
tbody tr{border-bottom:1px solid var(--brd);transition:background .1s;cursor:pointer}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:#EEF4FF}
td{padding:16px 20px;font-size:17px;color:var(--t2);line-height:1.4}
td.tw{color:var(--t1);font-weight:600}
td.tm{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:15px;color:var(--t1);font-weight:600;letter-spacing:.3px}
td.tr{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:var(--t1)}

.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:14px;font-weight:600;white-space:nowrap}
.bdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.b-on{background:var(--green-bg);color:var(--green);border:1px solid var(--green-brd)}
.b-on .bdot{background:var(--green)}
.b-soon{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-brd)}
.b-soon .bdot{background:#F59E0B}
.b-off{background:var(--red-bg);color:var(--red);border:1px solid var(--red-brd)}
.b-off .bdot{background:var(--red)}
.plate{
  display:inline-block;background:var(--sur2);
  border:1.5px solid var(--brd2);border-radius:9px;
  padding:7px 14px;font-size:15px;font-weight:700;
  color:var(--t1);letter-spacing:.5px;
  font-family:'SF Mono','Fira Code','Consolas',monospace;
}

.pg{padding:14px 22px;border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;background:var(--sur2);flex-wrap:wrap;gap:10px}
.pg-info{font-size:15px;color:var(--t2);font-weight:500}
.pg-btns{display:flex;gap:6px}
.pg-btn{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1.5px solid var(--brd);background:var(--sur);color:var(--t2);transition:all .12s;font-family:'Sarabun',sans-serif;font-size:15.5px}
.pg-btn:hover:not(:disabled){background:var(--blue-bg);border-color:var(--blue-mid);color:var(--blue)}
.pg-btn.cur{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700}
.pg-btn:disabled{opacity:.3;cursor:default}
.pg-dots{width:32px;height:42px;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--t3);user-select:none}

.ov{position:fixed;inset:0;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(5px);padding:16px}
.modal{background:var(--sur);border:1px solid var(--brd);border-radius:18px;max-height:90vh;overflow-y:auto;box-shadow:var(--sh3);width:100%}
.modal-hd{padding:22px 22px 0;display:flex;align-items:flex-start;justify-content:space-between;position:sticky;top:0;background:var(--sur);border-bottom:1px solid var(--brd);padding-bottom:16px;z-index:10}
.modal-title{font-size:20px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.modal-sub{font-size:15px;color:var(--t3);margin-top:4px;font-weight:400}
.modal-bd{padding:22px}
.xbtn{width:32px;height:32px;border-radius:8px;background:var(--sur2);border:1.5px solid var(--brd);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.xbtn:hover{background:var(--red-bg);border-color:var(--red-brd);color:var(--red)}

.shd{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;background:var(--blue-bg);border:1px solid var(--blue-mid);margin-bottom:16px}
.shd svg{color:var(--blue);flex-shrink:0}
.shd-lbl{font-size:14px;font-weight:600;color:var(--blue)}

.fg{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fi{background:var(--sur2);border:1.5px solid var(--brd);border-radius:10px;padding:13px 16px}
.fi.fw{grid-column:1/-1}
.fi label{display:block;font-size:14px;font-weight:600;color:var(--t2);text-transform:none;letter-spacing:.2px;margin-bottom:8px}
.fi-v{font-size:17px;color:var(--t1);font-weight:500;line-height:1.4}
.fi-v.hi{font-size:22px;font-weight:700;color:var(--blue)}
.fi input{width:100%;border:1.5px solid var(--brd2);border-radius:10px;padding:13px 16px;font-size:17px;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:var(--t1);background:var(--sur);outline:none;transition:all .15s;margin-top:2px}
.fi input:focus{border-color:var(--blue);background:var(--blue-bg);box-shadow:0 0 0 3px rgba(30,111,229,.09)}

.drop{border:2px dashed var(--brd2);border-radius:14px;padding:36px 24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--sur2);margin-bottom:16px}
.drop:hover,.drop.drag{border-color:var(--blue);background:var(--blue-bg)}
.drop-ic{width:52px;height:52px;border-radius:14px;background:#DDE5EF;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;transition:all .2s}
.drop:hover .drop-ic,.drop.drag .drop-ic{background:var(--blue-mid)}
.drop:hover .drop-ic svg,.drop.drag .drop-ic svg{stroke:var(--blue)}
.drop-main{font-size:17px;font-weight:600;color:var(--t1);margin-bottom:6px}
.drop-hint{font-size:15px;color:var(--t3)}

.bnr{border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;margin-bottom:20px}
.bnr.am{background:var(--amber-bg);border:1px solid var(--amber-brd)}
.bnr.er{background:var(--red-bg);border:1px solid var(--red-brd)}
.bnr-body{flex:1;min-width:0}
.bnr-t{font-size:17px;font-weight:600}
.bnr-s{font-size:15.5px;margin-top:5px}
.am .bnr-t{color:#7C4A00}.am .bnr-s{color:var(--amber)}.am svg{color:var(--amber)}
.er .bnr-t{color:var(--red)}.er svg{color:var(--red)}

.ldg{text-align:center;padding:64px 20px}
.spin{width:32px;height:32px;border-radius:50%;border:2.5px solid var(--brd);border-top-color:var(--blue);animation:spin .65s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.ldg-t{font-size:14px;font-weight:500;color:var(--t2)}
.ldg-s{font-size:13px;color:var(--t3);margin-top:4px}
.empty{text-align:center;padding:64px 20px}
.empty svg{margin:0 auto 16px;display:block;stroke:var(--t3)}
.empty-t{font-size:15px;font-weight:600;color:var(--t2);margin-bottom:5px}
.empty-s{font-size:13px;color:var(--t3)}

.toast{position:fixed;bottom:26px;right:26px;background:var(--sur);border:1.5px solid var(--brd);border-radius:14px;padding:16px 20px;font-size:16px;font-weight:500;z-index:400;box-shadow:var(--sh3);display:flex;align-items:center;gap:12px;max-width:380px;animation:tIn .22s ease;color:var(--t1)}
.toast.ok{border-left:4px solid var(--green)}
.toast.er{border-left:4px solid var(--red)}
@keyframes tIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}

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
}
@media(max-width:639px){
  .stats{grid-template-columns:1fr 1fr;gap:12px}
  .sc{padding:16px 18px 14px}
  .sc-ico{width:46px;height:46px;border-radius:13px}
  .sc-val{font-size:28px}
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

.page-wrap{display:block;min-height:calc(100vh - 64px)}
.page-hd{
  padding:14px 24px;background:var(--sur);
  border-bottom:1px solid var(--brd);
  display:flex;align-items:center;gap:18px;
  position:sticky;top:64px;z-index:40;box-shadow:var(--sh0);
  flex-wrap:wrap;
}
.page-back{
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 20px;border-radius:11px;
  border:1.5px solid var(--brd);background:var(--sur);
  color:var(--t2);cursor:pointer;font-size:17px;font-weight:500;
  transition:all .13s;font-family:'Sarabun','Noto Sans Thai',sans-serif;
  flex-shrink:0;
}
.page-back:hover{background:var(--sur2);color:var(--t1);border-color:var(--brd2)}
.page-hd-div{width:1px;height:26px;background:var(--brd);flex-shrink:0}
.page-hd-info{min-width:0}
.page-title{font-size:19px;font-weight:700;color:var(--t1);letter-spacing:-.2px;line-height:1.3}
.page-sub{font-size:14px;color:var(--t3);margin-top:3px;font-weight:400}
.page-hd-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.page-body{padding:22px 28px;flex:1}

.detail-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start}
.detail-aside{position:sticky;top:calc(64px + 62px + 14px)}
.info-card{background:var(--sur);border:1px solid var(--brd);border-radius:16px;box-shadow:var(--sh0);margin-bottom:28px;overflow:hidden}
.info-card-hd{display:flex;align-items:center;gap:10px;padding:14px 20px;background:var(--sur2);border-bottom:1px solid var(--brd)}
.info-card-hd svg{color:var(--blue)}
.info-card-title{font-size:17px;font-weight:700;color:var(--t1)}
.info-card-bd{padding:20px 22px}
.info-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.info-row.fw{grid-template-columns:1fr}
.info-field{padding:0;margin-bottom:0}
.info-label{font-size:14px;font-weight:600;color:var(--t2);margin-bottom:7px}
.info-val{font-size:17px;color:var(--t1);font-weight:500;line-height:1.4;word-break:break-word}
.info-val.hi{font-size:24px;font-weight:700;color:var(--blue)}
.info-val.mono{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:15.5px;letter-spacing:.3px}

.upload-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:flex-start}
.upload-aside{position:sticky;top:calc(64px + 62px + 14px)}
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

@media(max-width:1100px){.upload-split{grid-template-columns:320px 1fr}}
@media(max-width:860px){
  .detail-split,.upload-split{grid-template-columns:1fr}
  .detail-aside,.upload-aside{position:static}
  .upload-aside .pdf-iframe{height:400px !important}
}
@media(max-width:639px){
  .page-hd{padding:10px 14px;gap:10px}
  .page-body{padding:18px 16px}
  .page-title{font-size:15.5px}
  .info-row{grid-template-columns:1fr}
  .info-card-bd{padding:18px 16px}
  .info-card{margin-bottom:16px}
}
`

export default CSS
