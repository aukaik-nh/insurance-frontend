export default `
.sb-collapse-toggle{display:none}
.utility-header{display:none}
@media(min-width:1280px){
  .app,.sb,.sb-logo,.sb-brand-wrap,.sb-nav-link,.sb-nav-primary,.sb-tools{
    transition:width .28s ease,padding .28s ease,gap .28s ease,opacity .2s ease,transform .28s ease;
  }
  .app{padding-left:256px;transition:padding-left .28s ease}
  .sb{width:256px;overflow:visible}
  .sb-collapse-toggle{
    display:grid;place-items:center;position:absolute;top:50%;right:-19px;z-index:5;
    width:38px;height:38px;padding:0;border:1px solid color-mix(in srgb,var(--t1) 72%,transparent);border-radius:50%;
    background:var(--t1);color:var(--sur);cursor:pointer;box-shadow:0 4px 10px rgba(44,26,16,.20);
    transform:translateY(-50%);transition:transform .16s,background .16s,border-color .16s,box-shadow .16s;
  }
  .sb-collapse-toggle:hover{transform:translate(2px,-50%);background:var(--accent);color:#1a0f0a;border-color:var(--accent);box-shadow:0 5px 13px rgba(92,61,46,.26)}
  .sidebar-collapsed{padding-left:88px}
  .sidebar-collapsed .sb{width:88px;padding-left:12px;padding-right:12px;gap:28px}
  .sidebar-collapsed .sb-logo{justify-content:center;width:100%;padding:0;margin:0;gap:0}
  .sidebar-collapsed .sb-logo img:first-child{width:42px !important;height:42px !important}
  .sidebar-collapsed .sb-brand-wrap{
    width:0;max-width:0;opacity:0;overflow:hidden;pointer-events:none;transform:translateX(-8px);
  }
  .sidebar-collapsed .sb-nav{align-items:center;width:100%}
  .sidebar-collapsed .sb-nav-group{align-items:center;width:100%}
  .sidebar-collapsed .sb-nav-link{
    position:relative;width:56px;height:52px;padding:0;justify-content:center;gap:0;border-radius:16px;
  }
  .sidebar-collapsed .sb-nav-icon{width:38px;height:38px}
  .sidebar-collapsed .sb-nav-label{width:0;max-width:0;opacity:0;overflow:hidden;pointer-events:none}
  .sidebar-collapsed .sb-nav-badge{
    position:absolute;right:0;top:-3px;min-width:20px;height:20px;padding:0 5px;border-width:1px;font-size:10px;
  }
  .sidebar-collapsed .sb-nav-primary{width:56px;height:52px;padding:0;gap:0;border-radius:16px}
  .sidebar-collapsed .sb-nav-primary > span:last-child{width:0;max-width:0;opacity:0;overflow:hidden;pointer-events:none}
  .sidebar-collapsed .sb-nav-primary-icon{width:38px;height:38px}
  .sidebar-collapsed .sb-tools{justify-content:center;width:100%;padding-left:0;padding-right:0;gap:8px}
  .sidebar-collapsed .sb-status{justify-content:center;width:100%}
  .sidebar-collapsed .sb-status-txt{display:none}
  .sidebar-collapsed .theme-btn{width:42px;height:42px}
  .utility-header{
    display:flex;align-items:center;justify-content:space-between;gap:24px;
    position:sticky;top:0;z-index:90;min-height:64px;padding:10px 32px;
    background:color-mix(in srgb,var(--sur) 92%,transparent);border-bottom:1px solid var(--brd);
    box-shadow:0 4px 18px rgba(92,61,46,.035);backdrop-filter:blur(12px);
  }
  .utility-search{
    display:flex;align-items:center;gap:10px;width:min(420px,42vw);height:40px;padding:0 14px;
    color:var(--t3);background:var(--sur2);border:1px solid transparent;border-radius:999px;
    transition:width .24s ease,background .16s,border-color .16s,box-shadow .16s;
  }
  .utility-search:focus-within{width:min(500px,48vw);background:var(--sur);border-color:var(--brd2);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent)}
  .utility-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--t1);font:inherit;font-size:14px}
  .utility-search input::placeholder{color:var(--t3)}
  .utility-search input::-webkit-search-cancel-button{cursor:pointer}
  .utility-actions{display:flex;align-items:center;gap:12px;min-width:0;flex:0 1 auto;margin-left:auto}
  .utility-profile{display:grid;place-items:center;margin-left:3px;width:38px;height:38px;border-radius:50%}
  .utility-profile img{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:center 18%;border:2px solid var(--green-brd);box-shadow:0 2px 7px rgba(92,61,46,.14)}
  body:not(.dark) .utility-header{
    background:rgba(232,222,205,.96);
    border-bottom-color:#c8b89e;
    box-shadow:0 4px 16px rgba(92,61,46,.10);
  }
  body:not(.dark) .utility-search{
    background:#fffdf7;
    border-color:#d6c8b2;
  }
}
@media(prefers-reduced-motion:reduce){
  .app,.sb,.sb-logo,.sb-brand-wrap,.sb-nav-link,.sb-nav-primary,.sb-tools,.sb-collapse-toggle,.utility-search{transition:none !important}
}
@media print{.utility-header{display:none !important}}
`
