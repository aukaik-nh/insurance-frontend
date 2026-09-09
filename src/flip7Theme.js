// Flip7 dashboard palette, adapted for readable Thai insurance workflows.
export default `
:root{
 --bg:#EFF8F7;--bg2:#E8F6F5;--sur:#FFFFFF;--sur2:#E8F6F5;
 --brd:#D9EBE8;--brd2:#B5DAD5;--blue:#087F7A;--blue-h:#066963;
 --blue-bg:#E8F6F5;--blue-mid:#B9EAE5;--accent:#2BA8A2;
 --g1:#087F7A;--g2:#2BA8A2;--g3:#3CC4BD;
 --green:#197344;--green-bg:#EDF8F0;--green-brd:#BDDCC7;
 --amber:#906600;--amber-bg:#FFF7DE;--amber-brd:#ECD58B;
 --red:#BC343C;--red-bg:#FFF0F0;--red-brd:#EFC4C7;
 --t1:#173B3A;--t2:#486866;--t3:#627C79;
 --sh0:0 1px 2px rgba(43,168,162,.04);--sh1:0 2px 8px rgba(43,168,162,.05);
 --sh2:0 6px 18px rgba(43,168,162,.08);--sh3:0 18px 40px rgba(43,168,162,.16);
 --shB:0 3px 10px rgba(43,168,162,.14);--r:10px;--rL:12px;--rXL:16px;
}
body.dark{
 --bg:#102826;--bg2:#173330;--sur:#1C3936;--sur2:#244540;
 --brd:#355651;--brd2:#52756E;--blue:#7CDED5;--blue-h:#B1F0E9;
 --blue-bg:#234C47;--blue-mid:#356D64;--accent:#2BA8A2;
 --g1:#087F7A;--g2:#2BA8A2;--g3:#3CC4BD;
 --t1:#FAFAF9;--t2:#CAE3DE;--t3:#A1C1BA;
 --amber:#EEC975;--amber-bg:#463C26;--amber-brd:#756239;
 --red:#FFA2A7;--red-bg:#4D3033;--red-brd:#795053;
}
body{font-size:17px;line-height:1.65}
.top{background:var(--bg);border-bottom:1px solid var(--brd);box-shadow:none}
.top-title,.dash-bar-ttl,.page-title{font-weight:700;letter-spacing:0;line-height:1.4}
.dash-bar-ttl{font-size:30px}
.dash-bar{padding:4px 0 24px;background:transparent;border:0;box-shadow:none}
.dash-bar-sub{font-size:15px}
.dash-chip{border-radius:8px;background:var(--sur);border:1px solid var(--brd);box-shadow:none}
.card,.info-card,.filter-wrap,.table-card{border-radius:12px;box-shadow:var(--sh0);border-color:var(--brd)}
.sec-hd{padding-bottom:8px;color:var(--t1);border:0;font-size:16px;letter-spacing:0}
.sec-hd small{color:var(--t3);font-size:13px}
.overview-stat{position:relative;overflow:hidden;border:1px solid var(--brd);border-left:4px solid #2BA8A2;border-radius:12px;background:var(--sur);box-shadow:var(--sh0);padding:22px;transition:box-shadow .15s,border-color .15s}
.overview-stat:hover{transform:none;box-shadow:var(--sh2);border-color:var(--brd2)}
.overview-stat-expiring{border-left-color:#D49A14}
.overview-stat-icon{background:var(--blue-bg);color:var(--blue);border-radius:10px;border:0}
.overview-stat-expiring .overview-stat-icon{background:var(--amber-bg);color:var(--amber)}
.overview-stat-copy strong{color:var(--t1);font-size:34px;font-weight:700}
.overview-stat-label{color:var(--t2);font-size:16px}
.overview-stat-detail{color:var(--t3);font-size:14px}
.overview-stat-action{color:var(--blue)}
.dashboard-action{border-radius:12px;border:1px solid var(--brd);background:var(--sur);box-shadow:none}
.dashboard-action-primary,body:not(.dark) .dashboard-action-primary{background:var(--blue-bg);border-color:var(--blue-mid);color:var(--t1)}
.dashboard-action-icon,.dashboard-action-primary .dashboard-action-icon{background:var(--blue-bg);color:var(--blue);border-radius:10px}
.dashboard-action-primary strong,.dashboard-action-primary .dashboard-action-cta{color:var(--blue)}
.dashboard-action:hover{transform:none;border-color:var(--brd2);box-shadow:var(--sh1)}
.dashboard-search-heading{justify-content:flex-start;align-items:center;background:transparent;border:0;padding-left:0;padding-right:0}
.dashboard-search-mark{background:var(--blue-bg);color:var(--blue);border-radius:10px}
.dashboard-search-title{font-size:18px}.dashboard-search-note{display:none}
.btn,.btn-b,.page-back{border-radius:8px;min-height:44px;box-shadow:none}
body:not(.dark) .btn-b,.btn-b{background:#2BA8A2;border-color:#2BA8A2;color:#fff;box-shadow:none}
body:not(.dark) .btn-b:hover,.btn-b:hover{background:#087F7A;color:#fff;box-shadow:var(--shB)}
body:not(.dark) .fi input,body:not(.dark) .fi select,body:not(.dark) .fi textarea{background:#fff;border-color:var(--brd2);border-radius:8px}
.big-srch{border-radius:8px;background:var(--sur);border-color:var(--brd2);box-shadow:none}
.big-srch input{font-size:17px}
.big-srch:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(43,168,162,.12)}
th{background:var(--sur2);color:var(--t2);font-size:14px;letter-spacing:0}
td{font-size:16px;color:var(--t1)}
tbody tr:hover{background:var(--blue-bg)}
.sb,body.dark .sb{background:#292723;border-color:#423D38;box-shadow:none}
.sb-brand{color:#fff}.sb-brand-sub{color:#C9C3BC}
.sb-nav-link{color:#E5E0D9;border-radius:8px}
.sb-nav-icon{background:transparent;color:inherit;box-shadow:none}
.sb-nav-link:hover{background:#3C3832;color:#fff;border-color:transparent;transform:none}
body:not(.dark) .sb-nav-link.on,.sb-nav-link.on{background:#2BA8A2;color:#fff;border-color:transparent;box-shadow:none;border-radius:8px}
body:not(.dark) .sb-nav-link.on .sb-nav-icon,.sb-nav-link.on .sb-nav-icon{background:transparent;color:#fff;box-shadow:none}
body:not(.dark) .sb-nav-primary,body:not(.dark) .sb-nav-primary.on,.sb-nav-primary,.sb-nav-primary.on{background:#2BA8A2;color:#fff;border:1px solid #DD722D;border-radius:8px;box-shadow:none}
.sb-nav-primary:hover{background:#087F7A;color:#fff}
.sb-nav-primary-icon{background:transparent;color:inherit;border-radius:6px}
.sb .theme-btn,.sb .ham{background:#38342F;color:#EAE5DF;border:1px solid #534C43;border-radius:8px;box-shadow:none}
.sb-status-txt{color:#C9C3BC}
.sb-logo{border:0}.sb-logo::after{display:none}
.sb-logo img:first-child{background:#EFF8F7;border-radius:8px;padding:3px}
.sb-logo img:nth-child(2){display:none}
@media(min-width:1280px){
 .app{padding-left:256px}
 .sb{position:fixed;left:0;top:0;bottom:0;width:256px;height:100dvh;flex-direction:column;align-items:stretch;padding:28px 16px 22px;gap:32px;border:0;border-right:1px solid #423D38;overflow-y:auto}
 .sb-logo{height:auto;padding:0 4px;margin:0;gap:10px;min-width:0}
 .sb-logo img:first-child{width:44px !important;height:44px !important}
 .sb-brand{font-size:21px}.sb-brand-sub{font-size:13px}
 .sb-nav{display:flex;flex-direction:column;align-items:stretch;gap:24px;flex:1;width:100%;overflow:visible}
 .sb-nav-group{flex-direction:column;align-items:stretch;gap:6px;width:100%}
 .sb-nav-link{width:100%;justify-content:flex-start;height:48px;padding:0 12px;font-size:16px}
 .sb-nav-primary{width:100%;justify-content:center;margin-top:8px;font-size:16px}
 .sb-tools{margin:0;display:flex;justify-content:flex-start;flex-wrap:wrap;gap:10px;padding:16px 4px 0;border-top:1px solid #49433C}
 .sb-status{width:100%;margin-bottom:8px}.sb-status-txt{font-size:13px}
 .sb-divider,.ham{display:none}.main{width:100%}
 .body{padding:28px 32px}.top{padding-left:32px;padding-right:32px}
}
@media(max-width:1279px){.sb-logo{height:auto}.sb{position:relative}.sb-nav-link{font-size:14px}}
@media(max-width:639px){
 .sb{padding:0 12px}.sb-brand{font-size:18px}.sb-brand-sub{display:none}
 .sb-logo{margin-right:0;padding-right:0}.sb-logo img:first-child{width:36px !important;height:36px !important}
 .dash-bar-ttl{font-size:25px}.dash-bar-sub{font-size:14px}
 .overview-stat{padding:16px 12px;border-radius:12px;gap:10px}
 .overview-stat-label{font-size:14px}.overview-stat-copy strong{font-size:28px}.overview-stat-detail{font-size:13px}
 .card,.info-card,.dashboard-action{border-radius:12px}.dashboard-action strong{font-size:16px}
 .btn{min-height:44px}.big-srch{border-radius:8px}.dashboard-search-title{font-size:17px}
 .overview-stat-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:360px){.overview-stat-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.overview-stat,.btn,.sb-nav-link{transition:none}}

.card,.info-card,.filter-wrap,.table-card{border-radius:24px;box-shadow:var(--sh1)}
.overview-stat{border:0;border-left:4px solid #2BA8A2;border-radius:24px;box-shadow:0 4px 20px rgba(43,168,162,.08)}
.overview-stat-expiring{border-left-color:#FFD23F}
.overview-stat-icon{border-radius:50%;background:var(--blue-mid)}
.overview-stat-expiring .overview-stat-icon{background:#FFF0AD;color:#876600}
.dashboard-action{border-radius:22px;box-shadow:var(--sh1)}
.dashboard-action-primary,body:not(.dark) .dashboard-action-primary{background:#FFF8E7;border-color:#FFE47A;color:#173B3A}
.dashboard-action-primary .dashboard-action-icon{background:#FFD23F;color:#695200;border-radius:50%}
.dashboard-action-primary strong,.dashboard-action-primary .dashboard-action-cta{color:#695200}
.dashboard-search-mark{border-radius:50%;background:var(--blue-mid)}
.sec-hd{border-bottom:1px dashed var(--brd2);padding-bottom:10px;color:var(--blue)}
.btn,.btn-b,.page-back,.big-srch{border-radius:999px}
body:not(.dark) .btn-b,.btn-b{background:linear-gradient(135deg,#FFE47A,#FFD23F);border-color:#FFD23F;color:#514000;box-shadow:0 4px 16px rgba(255,210,63,.24)}
body:not(.dark) .btn-b:hover,.btn-b:hover{background:#FFE47A;color:#514000}
.sb,body.dark .sb{background:var(--bg2);border-color:var(--brd)}
.sb-brand{color:var(--t1)}.sb-brand-sub,.sb-status-txt{color:var(--t3)}
.sb-nav-link{color:var(--t2);border-radius:999px}
.sb-nav-link:hover{background:var(--blue-bg);color:var(--blue)}
body:not(.dark) .sb-nav-link.on,.sb-nav-link.on{background:#108F88;border-radius:999px;color:#fff;box-shadow:0 4px 12px rgba(43,168,162,.22)}
body:not(.dark) .sb-nav-primary,body:not(.dark) .sb-nav-primary.on,.sb-nav-primary,.sb-nav-primary.on{background:#FFD23F;border-color:#FFD23F;color:#514000;border-radius:999px;box-shadow:0 4px 16px rgba(255,210,63,.24)}
.sb-nav-primary:hover{background:#FFE47A;color:#514000}
.sb .theme-btn,.sb .ham{background:var(--sur);color:var(--t2);border-color:var(--brd);border-radius:50%}
.sb-tools{border-color:var(--brd)}.sb-logo img:first-child{background:transparent;padding:0}
.mobile-bottom-primary,.mobile-bottom-primary.on{background:#108F88;color:#fff;box-shadow:0 4px 12px rgba(43,168,162,.22)}
body:not(.dark) .fi input,body:not(.dark) .fi select,body:not(.dark) .fi textarea{background:#FFFDF5;border-radius:12px}
@media(max-width:639px){.overview-stat,.card,.info-card,.dashboard-action{border-radius:20px}.big-srch{border-radius:16px}}

/* Finishing: consistent spacing, controls, and document workspaces. */
:root{--r:16px;--rL:24px;--rXL:28px;--red:#B54B32;--red-bg:#FFF0E9;--red-brd:#F2C6B8}
body.dark{--red:#FFAA90;--red-bg:#4B302A;--red-brd:#795044;--green:#87D4AD;--green-bg:#203F33;--green-brd:#416B54}
.main{min-width:0}
.dash-bar{padding-bottom:18px;margin-bottom:18px}
.dash-chip{border-radius:999px;padding:8px 14px}
.sec-hd{margin-top:0;margin-bottom:12px;gap:10px}
.sec-hd::after{display:none}
.overview-stat-grid{gap:18px;margin-bottom:24px}
.dashboard-action-row{gap:14px;margin-bottom:26px}
.overview-stat-end{gap:12px}.overview-stat-action{white-space:nowrap}
.overview-stat-copy strong{font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.dashboard-search-heading{margin:0 0 12px;padding:0;gap:12px;justify-content:flex-start;align-items:center}
.dashboard-search-copy{flex:1;min-width:0}
.filter-wrap.dashboard-filter-wrap{padding:8px;border:1px solid var(--brd);border-radius:22px;background:var(--sur);box-shadow:var(--sh1);margin-bottom:22px}
.dashboard-filter-wrap .big-srch{border:0;border-radius:16px;background:transparent;min-height:54px;padding:10px 14px;box-shadow:none;gap:12px}
.dashboard-filter-wrap .big-srch input{border:0 !important;background:transparent !important;box-shadow:none !important;outline:none;min-width:0;padding:0;width:100%;border-radius:0}
.dashboard-filter-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(43,168,162,.13)}
.dashboard-filter-wrap .btn{border-radius:16px;min-height:54px}
.big-srch input{min-width:0}
button:disabled{cursor:not-allowed;opacity:.5;box-shadow:none;transform:none}
.btn:focus-visible,.sb-nav-link:focus-visible,th:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.policy-list-card{overflow:hidden;border:1px solid var(--brd)}
.policy-list-heading{padding:22px 24px;gap:12px;align-items:center;flex-wrap:wrap}
.policy-list-heading .card-title{font-size:20px}
.policy-list-heading .card-sub{font-size:14px;line-height:1.7;margin-top:4px}
.policy-list-order{font-size:12px;white-space:nowrap;border-radius:999px}
.policy-table-wrap th{padding-top:15px;padding-bottom:15px;font-size:13px;font-weight:600}
.policy-table-wrap td{padding-top:17px;padding-bottom:17px;line-height:1.55;border-bottom-color:var(--brd)}
.policy-table-wrap tbody tr:last-child td{border-bottom:0}
.policy-mobile-card{border:1px solid var(--brd);border-radius:18px;box-shadow:none}
.policy-mobile-name{font-size:17px}.policy-mobile-meta{line-height:1.7}
.page-hd{background:var(--bg);border-bottom:1px solid var(--brd);box-shadow:none;gap:16px}
.page-title{font-size:27px}.page-sub{font-size:14px;color:var(--t3)}
.page-hd-right{gap:10px;flex-wrap:wrap}
.page-back{border-color:var(--brd);background:var(--sur);color:var(--blue);box-shadow:none}
.reader-empty{box-shadow:var(--sh1);border-radius:24px;gap:24px}
.reader-drop{border-radius:20px;background:var(--blue-bg);border-color:var(--brd2)}
.reader-upload-cloud{background:#B9EAE5;color:#087F7A;filter:drop-shadow(0 10px 18px rgba(43,168,162,.13))}
.reader-step-icon{border-radius:50%;background:var(--blue-bg);border:0}
.reader .reader-pick{border-radius:999px}
.reader-tabs button{min-height:44px}.reader-format{border-radius:999px}
body.dark .reader-upload-cloud{background:#356D64;color:#B1F0E9}
body.dark .dashboard-action-primary{background:#3F3C25;border-color:#756239;color:var(--t1)}
body.dark .dashboard-action-primary strong,body.dark .dashboard-action-primary .dashboard-action-cta{color:#FFE47A}
@media(min-width:1280px){
 .list-layout:not(.has-pvp){width:100%;max-width:1664px;margin:0 auto}
 .page-body{width:100%;max-width:1664px;margin-left:auto;margin-right:auto}
 .body{padding:28px 32px 40px}.sb{gap:30px}
 .sb-nav-group{gap:8px}.sb-nav-link{height:48px}
 .page-hd{padding:22px 32px}.page-body{padding:26px 32px}
}
@media(min-width:640px) and (max-width:1279px){
 .sb-nav{display:none}.ham{display:flex}.sb-tools{margin-left:auto}
 .sb{height:72px;padding:0 20px}.sb-status{display:flex}
 .body,.page-body{padding:24px}.page-hd{padding:18px 24px}
}
@media(max-width:639px){
 .body,.page-body{padding:18px 12px 28px}.dash-bar{padding:2px 0 12px;margin-bottom:16px}
 .dash-bar-ttl{font-size:25px}.dash-bar-sub{font-size:13px}
 .overview-stat-grid{gap:10px;margin-bottom:20px}.overview-stat{padding:16px 12px;min-height:136px;align-items:flex-start;flex-direction:column;gap:10px}
 .overview-stat-icon{width:32px;height:32px}.overview-stat-label{font-size:13px}.overview-stat-copy strong{font-size:28px}
 .overview-stat-detail{font-size:12px}.overview-stat-end{display:none}
 .dashboard-action-row{gap:10px;margin-bottom:22px}.dashboard-action{min-height:82px}
 .dashboard-search-heading{gap:10px}.dashboard-search-title{font-size:16px}.dashboard-search-sub{font-size:13px}
 .filter-wrap.dashboard-filter-wrap{padding:6px;gap:6px !important;border-radius:18px}
 .dashboard-filter-wrap .big-srch{padding:8px;gap:8px;min-height:48px}.dashboard-filter-wrap .big-srch input{font-size:16px}
 .dashboard-filter-wrap .big-srch input::placeholder{font-size:14px}
 .dashboard-filter-wrap .btn{padding:0 12px !important;min-height:48px;border-radius:13px}
 .policy-list-heading{padding:18px 16px}.policy-list-heading .card-title{font-size:18px}
 .policy-list-heading .card-sub{font-size:13px}.policy-list-order{font-size:11px}
 .page-hd{padding:16px 12px;gap:10px}.page-title{font-size:23px}.page-sub{font-size:13px}
 .reader-empty{padding:14px;border-radius:20px;gap:18px}.reader-drop{padding:30px 14px;min-height:300px}
 .reader .reader-intro h2{font-size:24px}.reader-format{white-space:normal}
 .mobile-bottom-nav{border-top:1px solid var(--brd);box-shadow:0 -4px 20px rgba(43,168,162,.06)}
}
@media print{.sb,.mobile-bottom-nav,.scroll-top{display:none !important}.app{padding-left:0}}

@media(min-width:1280px){
 .sb-tools{justify-content:center;text-align:center}
 .sb-tools .sb-status{justify-content:center;width:100%}
}
`
