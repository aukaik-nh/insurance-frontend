// QuestUI light palette only. Layout, spacing, typography, and radii stay unchanged.
export default `
:root{
 --bg:#F4F0E8;--bg2:#E8DECD;--sur:#FFFDF7;--sur2:#F3EBDD;
 --brd:#D1C0A5;--brd2:#B79B73;--blue:#8A5D03;--blue-h:#B8780A;
 --blue-bg:rgba(202,138,4,.11);--blue-mid:rgba(202,138,4,.26);--accent:#CA8A04;
 --g1:#991B1B;--g2:#CA8A04;--g3:#581C87;
 --green:#15803D;--green-bg:rgba(34,197,94,.11);--green-brd:rgba(21,128,61,.30);
 --amber:#8A5D03;--amber-bg:rgba(202,138,4,.12);--amber-brd:rgba(202,138,4,.34);
 --purple:#581C87;--purple-bg:rgba(88,28,135,.08);--purple-brd:rgba(88,28,135,.30);
 --red:#991B1B;--red-bg:rgba(153,27,27,.10);--red-brd:rgba(153,27,27,.28);
 --t1:#2C1A10;--t2:#5C4636;--t3:#7B6A57;
 --sh0:0 1px 3px rgba(92,61,46,.08);--sh1:0 3px 10px rgba(92,61,46,.11);
 --sh2:0 7px 20px rgba(92,61,46,.14);--sh3:0 18px 40px rgba(92,61,46,.18);
 --shB:0 3px 12px rgba(202,138,4,.20)
}
body.dark{
 --bg:#120A07;--bg2:#1A0F0A;--sur:#24150D;--sur2:#2C1A10;
 --brd:#5C3D2E;--brd2:#7A5038;--blue:#DAA520;--blue-h:#CA8A04;
 --blue-bg:rgba(202,138,4,.14);--blue-mid:rgba(202,138,4,.32);--accent:#CA8A04;
 --g1:#991B1B;--g2:#CA8A04;--g3:#581C87;
 --green:#22C55E;--green-bg:rgba(34,197,94,.13);--green-brd:rgba(34,197,94,.36);
 --amber:#DAA520;--amber-bg:rgba(202,138,4,.14);--amber-brd:rgba(202,138,4,.40);
 --purple:#D8B4FE;--purple-bg:rgba(88,28,135,.22);--purple-brd:rgba(192,132,252,.35);
 --red:#F87171;--red-bg:rgba(153,27,27,.20);--red-brd:rgba(248,113,113,.42);
 --t1:#F5E6D3;--t2:#D8C6AE;--t3:#BFA98A
}
.overview-stat{border-left-color:var(--accent);box-shadow:0 4px 20px rgba(202,138,4,.10)}
.overview-stat-expiring{border-left-color:var(--amber)}
.overview-stat-expiring .overview-stat-icon{background:var(--amber-bg);color:var(--amber)}
.dashboard-action-primary,body:not(.dark) .dashboard-action-primary{background:var(--blue-bg);border-color:var(--amber-brd);color:var(--t1)}
.dashboard-action-primary .dashboard-action-icon{background:var(--accent);color:#1A0F0A}
.dashboard-action-primary strong,.dashboard-action-primary .dashboard-action-cta{color:var(--blue)}
body:not(.dark) .btn-b,.btn-b{background:linear-gradient(135deg,#DAA520,#CA8A04);border-color:#CA8A04;color:#1A0F0A;box-shadow:0 4px 16px rgba(202,138,4,.24)}
body:not(.dark) .btn-b:hover,.btn-b:hover{background:#B8780A;color:#1A0F0A}
body:not(.dark) .fi input,body:not(.dark) .fi select,body:not(.dark) .fi textarea{background:var(--sur)}
.big-srch:focus-within,.dashboard-filter-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(202,138,4,.18)}
.sb,body.dark .sb{background:var(--bg2);border-color:var(--brd)}
.sb-brand{color:var(--t1)}.sb-brand-sub,.sb-status-txt{color:var(--t3)}
.sb-nav-link{color:var(--t2)}.sb-nav-link:hover{background:var(--blue-bg);color:var(--blue)}
body:not(.dark) .sb-nav-link.on,.sb-nav-link.on{background:#CA8A04;color:#1A0F0A;box-shadow:0 4px 12px rgba(202,138,4,.24)}
body:not(.dark) .sb-nav-link.on .sb-nav-icon,.sb-nav-link.on .sb-nav-icon{background:transparent;color:#1A0F0A;box-shadow:none}
body:not(.dark) .sb-nav-primary,body:not(.dark) .sb-nav-primary.on,.sb-nav-primary,.sb-nav-primary.on{background:#CA8A04;border-color:#DAA520;color:#1A0F0A;box-shadow:0 4px 16px rgba(202,138,4,.24)}
.sb-nav-primary:hover{background:#B8780A;color:#1A0F0A}
.sb .theme-btn,.sb .ham{background:var(--sur);color:var(--t2);border-color:var(--brd)}
.sb-tools{border-color:var(--brd)}
.mobile-bottom-primary,.mobile-bottom-primary.on{background:#CA8A04;color:#1A0F0A;box-shadow:0 4px 12px rgba(202,138,4,.24)}
.reader-upload-cloud{background:var(--blue-mid);color:var(--blue);filter:drop-shadow(0 10px 18px rgba(202,138,4,.16))}
body.dark .reader-upload-cloud{background:var(--blue-mid);color:var(--blue)}
.toast,body.dark .toast{background:color-mix(in srgb,var(--sur) 92%,transparent)}
.dashboard-search-heading{align-items:center;margin:6px 0 10px;padding:0;background:transparent;border:0}
.dashboard-search-mark{width:42px;height:42px;border-radius:13px;background:var(--blue-bg);color:var(--blue)}
.dashboard-search-title{font-size:18px;line-height:1.25}
.dashboard-search-sub{display:block;margin-top:3px;font-size:14px;color:var(--t3)}
.filter-wrap.dashboard-filter-wrap{padding:7px;border:1px solid var(--brd2);border-radius:18px;background:var(--sur);box-shadow:0 5px 18px rgba(92,61,46,.10);margin-bottom:22px}
.dashboard-filter-wrap .big-srch{min-height:52px;padding:9px 12px 9px 15px;border:0;border-radius:13px;background:transparent;box-shadow:none;gap:12px}
.dashboard-filter-wrap .big-srch:focus-within{box-shadow:none}
.dashboard-filter-wrap .big-srch input{font-size:16px;font-weight:500}
.dashboard-filter-wrap .big-srch input::placeholder{font-size:15px;color:#95836f}
.dashboard-filter-wrap .btn{min-height:52px;border-radius:13px;padding:0 24px!important}
@media(max-width:639px){
 .dashboard-search-heading{align-items:flex-start;margin-bottom:9px}.dashboard-search-mark{width:38px;height:38px;border-radius:11px}
 .dashboard-search-title{font-size:17px}.dashboard-search-sub{font-size:13px;line-height:1.4}
 .filter-wrap.dashboard-filter-wrap{padding:6px;border-radius:16px}
 .dashboard-filter-wrap .big-srch{min-height:48px}.dashboard-filter-wrap .btn{min-height:48px}
}
`
