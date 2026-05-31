/* ============================================================================
   Springfield Bridge Plan — Data Dashboard logic
   Vanilla JS + Chart.js. Reads window.SBP_BUDGET (js/dashboard-data.js).
   ============================================================================ */
(function () {
  "use strict";

  var DATA = window.SBP_BUDGET;
  if (!DATA) return;

  // ---- palette (matches site CSS variables) ----
  var C = {
    primary: "#1e40af", primaryLight: "#3b82f6", primary200: "#bfdbfe",
    accent: "#0ea5e9", accentDark: "#0284c7",
    success: "#10b981", warning: "#f59e0b", error: "#ef4444",
    gray400: "#94a3b8", gray600: "#475569", gray200: "#e2e8f0"
  };
  var SERIES = [C.primary, C.accent, C.success, C.warning, C.error,
                C.primaryLight, C.accentDark, C.gray400];

  // ---- state ----
  var state = { districtId: DATA.districts[0].id, year: null, schoolId: "all" };
  var charts = {};

  // ---- helpers ----
  function district() { return DATA.districts.filter(function (d) { return d.id === state.districtId; })[0]; }
  function fmt(n) {
    if (n === null || n === undefined) return "—";
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function fmtM(n) {
    if (n === null || n === undefined) return "—";
    return "$" + (n / 1e6).toFixed(1) + "M";
  }
  function pct(n) { return (n === null || n === undefined) ? "—" : n.toFixed(1) + "%"; }
  function el(id) { return document.getElementById(id); }
  function destroy(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }

  // ---------------------------------------------------------------- controls
  function buildControls() {
    var d = district();

    // district select
    var ds = el("districtSelect");
    ds.innerHTML = DATA.districts.map(function (x) {
      return '<option value="' + x.id + '">' + x.name + " — " + x.county + "</option>";
    }).join("");
    ds.value = state.districtId;
    ds.addEventListener("change", function () {
      state.districtId = this.value; state.year = null; state.schoolId = "all";
      buildControls(); render();
    });

    // year select (default to newest with data = latest in list)
    var ys = el("yearSelect");
    state.year = state.year || d.fiscalYears[d.fiscalYears.length - 1];
    ys.innerHTML = d.fiscalYears.slice().reverse().map(function (y) {
      return '<option value="' + y + '">FY ' + y + " — " + d.yearStatus[y] + "</option>";
    }).join("");
    ys.value = state.year;
    ys.onchange = function () { state.year = this.value; render(); };

    // school select
    var ss = el("schoolSelect");
    var opts = ['<option value="all">All schools (district-wide)</option>'];
    d.schools.forEach(function (s) {
      opts.push('<option value="' + s.id + '">' + s.name + " (" + s.level + ")</option>");
    });
    ss.innerHTML = opts.join("");
    ss.value = state.schoolId;
    ss.onchange = function () { state.schoolId = this.value; render(); };
  }

  // ---------------------------------------------------------------- KPIs
  function renderKPIs() {
    var d = district(), y = state.year;
    var allFunds = d.allFundsTotal[y];
    var gf = d.generalFundTotal[y];
    var fys = d.fiscalYears;
    var prevYear = fys[fys.indexOf(y) - 1];

    // all-funds YoY
    var afPrev = prevYear ? d.allFundsTotal[prevYear] : null;
    var afChange = (allFunds && afPrev) ? ((allFunds - afPrev) / afPrev) * 100 : null;
    // gf YoY
    var gfPrev = prevYear ? d.generalFundTotal[prevYear] : null;
    var gfChange = (gf && gfPrev) ? ((gf - gfPrev) / gfPrev) * 100 : null;

    // instruction share of GF
    var instr = pick(d.generalFundExpenditure, "Instruction (1000)")[y];
    var instrPct = (instr && gf) ? (instr / gf) * 100 : null;
    // state school fund share of GF
    var ssf = pick(d.generalFundRevenue, "State School Fund")[y];
    var ssfPct = (ssf && gf) ? (ssf / gf) * 100 : null;

    var tiles = [
      { label: "All Funds Budget", value: fmtM(allFunds), sub: trend(afChange, "vs prior year"), tone: toneOf(afChange, true) },
      { label: "General Fund", value: fmtM(gf), sub: trend(gfChange, "vs prior year"), tone: toneOf(gfChange, true) },
      { label: "Instruction Share of GF", value: pct(instrPct), sub: instr ? fmtM(instr) : "—", tone: "neutral" },
      { label: "State School Fund Share", value: pct(ssfPct), sub: ssf ? fmtM(ssf) : "—", tone: "neutral" }
    ];

    el("kpiRow").innerHTML = tiles.map(function (t) {
      return '<div class="kpi-tile kpi-' + t.tone + '">' +
        '<span class="kpi-label">' + t.label + "</span>" +
        '<span class="kpi-value">' + t.value + "</span>" +
        '<span class="kpi-sub">' + t.sub + "</span></div>";
    }).join("");
  }
  function trend(ch, label) {
    if (ch === null) return label;
    var arrow = ch > 0.05 ? "▲" : (ch < -0.05 ? "▼" : "▬");
    return arrow + " " + Math.abs(ch).toFixed(1) + "% " + label;
  }
  function toneOf(ch, fundingIsGood) {
    if (ch === null) return "neutral";
    if (Math.abs(ch) < 0.05) return "neutral";
    var up = ch > 0;
    return (up === fundingIsGood) ? "pos" : "neg";
  }
  function pick(arr, key) { return arr.filter(function (r) { return r.key === key; })[0].values; }

  // ---------------------------------------------------------------- charts
  function yearsWithData(map) {
    return district().fiscalYears.filter(function (y) { return map[y] !== null && map[y] !== undefined; });
  }

  function renderRevenueDonut() {
    var d = district(), y = state.year;
    var rows = d.generalFundRevenue.filter(function (r) { return r.values[y] !== null; });
    destroy("rev");
    if (!rows.length) { noData("revChart", "General Fund revenue detail not yet published for FY " + y + "."); return; }
    clearNote("revChart");
    charts.rev = new Chart(el("revChart"), {
      type: "doughnut",
      data: {
        labels: rows.map(function (r) { return r.key; }),
        datasets: [{ data: rows.map(function (r) { return r.values[y]; }), backgroundColor: SERIES, borderWidth: 2, borderColor: "#fff" }]
      },
      options: donutOpts()
    });
  }

  function renderExpenditureDonut() {
    var d = district(), y = state.year;
    var rows = d.generalFundExpenditure.filter(function (r) { return r.values[y] !== null && r.values[y] > 0; });
    destroy("exp");
    if (!rows.length) { noData("expChart", "General Fund function detail not yet published for FY " + y + "."); return; }
    clearNote("expChart");
    charts.exp = new Chart(el("expChart"), {
      type: "doughnut",
      data: {
        labels: rows.map(function (r) { return r.key; }),
        datasets: [{ data: rows.map(function (r) { return r.values[y]; }), backgroundColor: SERIES, borderWidth: 2, borderColor: "#fff" }]
      },
      options: donutOpts()
    });
  }

  function renderAllFundsTrend() {
    var d = district();
    var ys = yearsWithData(d.allFundsTotal);
    destroy("trend");
    charts.trend = new Chart(el("trendChart"), {
      type: "line",
      data: {
        labels: ys,
        datasets: [
          { label: "All Funds", data: ys.map(function (y) { return d.allFundsTotal[y]; }), borderColor: C.primary, backgroundColor: "rgba(30,64,175,.08)", fill: true, tension: .3, pointRadius: 4 },
          { label: "General Fund", data: ys.map(function (y) { return d.generalFundTotal[y]; }), borderColor: C.accent, backgroundColor: "rgba(14,165,233,.05)", fill: false, tension: .3, pointRadius: 4 }
        ]
      },
      options: lineOpts()
    });
  }

  function renderFundStack() {
    var d = district();
    var ys = d.fiscalYears.filter(function (y) { return d.funds.some(function (f) { return f.values[y] !== null; }); });
    destroy("fund");
    charts.fund = new Chart(el("fundChart"), {
      type: "bar",
      data: {
        labels: ys,
        datasets: d.funds.map(function (f, i) {
          return { label: f.key, data: ys.map(function (y) { return f.values[y]; }), backgroundColor: SERIES[i % SERIES.length] };
        })
      },
      options: stackedBarOpts()
    });
  }

  function renderSalBen() {
    var d = district();
    var ys = yearsWithData(d.salariesBenefits.salaries);
    destroy("salben");
    charts.salben = new Chart(el("salbenChart"), {
      type: "bar",
      data: {
        labels: ys,
        datasets: [
          { label: "Salaries", data: ys.map(function (y) { return d.salariesBenefits.salaries[y]; }), backgroundColor: C.primary },
          { label: "Benefits", data: ys.map(function (y) { return d.salariesBenefits.benefits[y]; }), backgroundColor: C.accent }
        ]
      },
      options: stackedBarOpts()
    });
  }

  // ---------------------------------------------------------------- chart opts
  var moneyTip = function (ctx) {
    var v = ctx.parsed.y !== undefined && ctx.parsed.y !== null ? ctx.parsed.y : ctx.parsed;
    var lbl = ctx.label || ctx.dataset.label || "";
    return " " + (ctx.dataset.label ? ctx.dataset.label + ": " : "") + fmt(v);
  };
  function donutOpts() {
    return {
      responsive: true, maintainAspectRatio: false, cutout: "58%",
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (ctx) {
          var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
          var p = total ? (ctx.parsed / total * 100).toFixed(1) : 0;
          return " " + ctx.label + ": " + fmt(ctx.parsed) + " (" + p + "%)";
        } } }
      }
    };
  }
  function lineOpts() {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top" }, tooltip: { callbacks: { label: moneyTip } } },
      scales: { y: { ticks: { callback: function (v) { return "$" + (v / 1e6).toFixed(0) + "M"; } } } }
    };
  }
  function stackedBarOpts() {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: moneyTip } } },
      scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: function (v) { return "$" + (v / 1e6).toFixed(0) + "M"; } } } }
    };
  }

  // ---------------------------------------------------------------- no-data
  function noData(canvasId, msg) {
    var c = el(canvasId); var parent = c.parentNode;
    clearNote(canvasId);
    c.style.display = "none";
    var n = document.createElement("div");
    n.className = "chart-nodata"; n.dataset.for = canvasId; n.textContent = msg;
    parent.appendChild(n);
  }
  function clearNote(canvasId) {
    el(canvasId).style.display = "";
    var existing = document.querySelector('.chart-nodata[data-for="' + canvasId + '"]');
    if (existing) existing.remove();
  }

  // ---------------------------------------------------------------- school note
  function renderSchoolNote() {
    var d = district();
    var box = el("schoolNote");
    if (state.schoolId === "all") { box.style.display = "none"; return; }
    var s = d.schools.filter(function (x) { return x.id === state.schoolId; })[0];
    box.style.display = "block";
    box.innerHTML = "<strong>" + s.name + " (" + s.level + ")</strong> — " +
      "SD 19 appropriates its budget at the district and major-function level. " +
      "Per-school dollar allocations are <em>not itemized</em> in the published budget documents, " +
      "so figures above reflect district-wide totals. School-level spending can be layered in later " +
      "from ODE school-level expenditure data (planned ETL source).";
  }

  // ---------------------------------------------------------------- freshness + sources
  function renderMeta() {
    var d = district();
    el("freshTag").innerHTML =
      'Showing <strong>' + d.name + '</strong> · FY <strong>' + state.year + '</strong> (' + d.yearStatus[state.year] + ') · ' +
      'Adopted budget appropriations · Source: SD19 District Budget documents';

    var f = d.fy2627;
    el("fy2627Note").innerHTML =
      "<strong>FY2026-27 (committee-approved " + f.committeeVote + "):</strong> " +
      "General Fund " + fmtM(f.generalFund) + " (" + fmtM(f.gfChangeFromPriorAdopted) + " vs prior adopted) · " +
      "projected deficit " + fmtM(f.deficit) + " · " + fmtM(f.reservesUsed) + " reserves used · " +
      f.fteCut + " FTE reduced. Full all-funds & function detail is marked provisional until the complete adopted document is published (Board adoption due by June 30, 2026).";

    el("sourceList").innerHTML = d.sources.map(function (s) {
      return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + s.label + "</a></li>";
    }).join("");
  }

  // ---------------------------------------------------------------- render
  function render() {
    renderMeta();
    renderKPIs();
    renderRevenueDonut();
    renderExpenditureDonut();
    renderAllFundsTrend();
    renderFundStack();
    renderSalBen();
    renderSchoolNote();
  }

  // ---------------------------------------------------------------- init
  document.addEventListener("DOMContentLoaded", function () {
    buildControls();
    render();
  });
})();
