/* ============================================================================
   Springfield Bridge Plan — Data Dashboard
   Budget dataset (v1) — Springfield School District 19 (Lane County, OR)

   SOURCES (all public):
   - SD19 Adopted Budget Documents (Business & Finance / District Budget page).
     The "All Funds Historical Budget Summary" and "General Fund Revenue/
     Expenditure Detail" tables in the FY2025-26 adopted budget document
     provide consistent multi-year (FY2022-23 → FY2025-26) figures.
   - FY2026-27 figures are from the Budget-Committee-approved budget
     (approved 6-3 on May 7, 2026). The General Fund total is published;
     full all-funds/function detail is pending the complete adopted document
     (Board adoption due by June 30, 2026), so FY2026-27 detail is marked
     provisional.

   SCHEMA NOTE: this object mirrors the planned Supabase schema
   (district -> financials by fiscal_year, by fund, by revenue source, by
   function). When the ETL/Supabase layer is built, it can emit this same
   shape so the dashboard front-end stays unchanged.
   ============================================================================ */
window.SBP_BUDGET = {
  meta: {
    generated: "2026-05-30",
    currency: "USD",
    note: "Figures are adopted budget appropriations (not audited actuals) unless noted. Dollars shown as published."
  },

  districts: [
    {
      id: "sd19",
      name: "Springfield SD 19",
      county: "Lane County",
      state: "Oregon",
      odeId: "2080",
      permanentTaxRate: 4.6412, // per $1,000 assessed value
      stateSchoolFundShareOfGF: 0.70,

      // Fiscal years available, oldest -> newest
      fiscalYears: ["2022-23", "2023-24", "2024-25", "2025-26", "2026-27"],
      yearStatus: {
        "2022-23": "Adopted",
        "2023-24": "Adopted",
        "2024-25": "Adopted",
        "2025-26": "Adopted",
        "2026-27": "Committee-Approved (Board adoption due by June 30, 2026)"
      },

      // ---- ALL FUNDS total budget by year ----
      allFundsTotal: {
        "2022-23": 275287113,
        "2023-24": 278676894,
        "2024-25": 270826854,
        "2025-26": 266188367,
        "2026-27": null // full all-funds total pending complete adopted document
      },

      // ---- ALL FUNDS by fund (adopted budget appropriation) ----
      funds: [
        { key: "General Operating Fund",        group: "100", values: { "2022-23":134412244, "2023-24":138838161, "2024-25":143400750, "2025-26":151276166, "2026-27":148100000 } },
        { key: "Special Revenue – Grants",      group: "200", values: { "2022-23":71070085,  "2023-24":61729760,  "2024-25":50382912,  "2025-26":39719747,  "2026-27":null } },
        { key: "Special Revenue – Other",       group: "200", values: { "2022-23":9119016,   "2023-24":11419384,  "2024-25":14411827,  "2025-26":15015267,  "2026-27":null } },
        { key: "Nutrition Services Fund",       group: "200", values: { "2022-23":5722228,   "2023-24":6552813,   "2024-25":6128379,   "2025-26":7111640,   "2026-27":null } },
        { key: "Co-Curricular Fund",            group: "200", values: { "2022-23":3131704,   "2023-24":3097505,   "2024-25":2289114,   "2025-26":230000,    "2026-27":null } },
        { key: "Student Body Fund",             group: "200", values: { "2022-23":3380000,   "2023-24":3540000,   "2024-25":3215000,   "2025-26":2885000,   "2026-27":null } },
        { key: "Debt Service Fund",             group: "300", values: { "2022-23":20496246,  "2023-24":20688896,  "2024-25":20591474,  "2025-26":21448156,  "2026-27":null } },
        { key: "Capital Projects Fund",         group: "400", values: { "2022-23":1199972,   "2023-24":4680054,   "2024-25":2305000,   "2025-26":383376,    "2026-27":null } },
        { key: "Insurance Fund",                group: "600", values: { "2022-23":24715969,  "2023-24":26382321,  "2024-25":26376398,  "2025-26":26400268,  "2026-27":null } },
        { key: "Print Services Fund",           group: "600", values: { "2022-23":836650,    "2023-24":815000,    "2024-25":880000,    "2025-26":1085747,   "2026-27":null } },
        { key: "VER Trust Fund",                group: "700", values: { "2022-23":1203000,   "2023-24":933000,    "2024-25":846000,    "2025-26":633000,    "2026-27":null } }
      ],

      // ---- GENERAL FUND revenue by source ----
      // FY2022-23 & FY2023-24 are actuals; FY2024-25 budgeted; FY2025-26 adopted.
      generalFundTotal: {
        "2022-23": 139317598, "2023-24": 144053400, "2024-25": 143400750,
        "2025-26": 151276166, "2026-27": 148100000
      },
      generalFundRevenue: [
        { key: "State School Fund",        values: { "2022-23":84708838, "2023-24":87079545, "2024-25":88974235, "2025-26":92227519, "2026-27":null } },
        { key: "Current Property Taxes",   values: { "2022-23":30368890, "2023-24":31398594, "2024-25":32435783, "2025-26":33710653, "2026-27":null } },
        { key: "Beginning Fund Balance",   values: { "2022-23":19648105, "2023-24":19759871, "2024-25":19038670, "2025-26":21001494, "2026-27":null } },
        { key: "Interest on Investments",  values: { "2022-23":1575207,  "2023-24":2312918,  "2024-25":640000,   "2025-26":1250000,  "2026-27":null } },
        { key: "Common School Fund",       values: { "2022-23":1336642,  "2023-24":1445253,  "2024-25":1237062,  "2025-26":1400000,  "2026-27":null } },
        { key: "Prior-Year Property Taxes",values: { "2022-23":458624,   "2023-24":351301,   "2024-25":375000,   "2025-26":400000,   "2026-27":null } },
        { key: "County School Fund",       values: { "2022-23":345014,   "2023-24":256886,   "2024-25":190000,   "2025-26":250000,   "2026-27":null } },
        { key: "Other Local / State / Federal", values: { "2022-23":876278, "2023-24":1449032, "2024-25":510000, "2025-26":1036500, "2026-27":null } }
      ],

      // ---- GENERAL FUND expenditures by function ----
      generalFundExpenditure: [
        { key: "Instruction (1000)",                    values: { "2022-23":64714654, "2023-24":66016537, "2024-25":73279424, "2025-26":79073712, "2026-27":null } },
        { key: "Support Services (2000)",               values: { "2022-23":48973736, "2023-24":51891339, "2024-25":55776986, "2025-26":59504772, "2026-27":null } },
        { key: "Community Services (3000)",             values: { "2022-23":0,        "2023-24":35996,    "2024-25":0,        "2025-26":0,        "2026-27":null } },
        { key: "Facilities Acq. & Construction (4000)", values: { "2022-23":1635090,  "2023-24":1616651,  "2024-25":864090,   "2025-26":1924090,  "2026-27":null } },
        { key: "Transfers / Other Uses (5000)",         values: { "2022-23":4234246,  "2023-24":4231896,  "2024-25":5065842,  "2025-26":2488314,  "2026-27":null } },
        { key: "Contingency (6000)",                    values: { "2022-23":0,        "2023-24":0,        "2024-25":800000,   "2025-26":1000000,  "2026-27":null } },
        { key: "Unappropriated Ending Balance (7000)",  values: { "2022-23":19759871, "2023-24":20260981, "2024-25":7614409,  "2025-26":7285278,  "2026-27":null } }
      ],

      // ---- ALL FUNDS salaries & benefits history ----
      salariesBenefits: {
        salaries: { "2022-23":79975845, "2023-24":82372937, "2024-25":93607129, "2025-26":91459624, "2026-27":null },
        benefits: { "2022-23":65467507, "2023-24":65513842, "2024-25":76287491, "2025-26":83241162, "2026-27":null }
      },

      // FY2026-27 narrative highlights (committee-approved)
      fy2627: {
        generalFund: 148100000,
        gfChangeFromPriorAdopted: -3176166,
        deficit: 7900000,
        reservesUsed: 6200000,
        fteCut: 33.5,
        committeeVote: "6-3 (approved May 7, 2026)"
      },

      // ---- SCHOOLS ----
      // SD19's published budget appropriates at the district + major-function
      // level, NOT per school. School-level dollar allocations are therefore
      // not itemized in the source documents. Schools are listed so the filter
      // is real; per-school financials show as "not itemized" until a future
      // data source (e.g. ODE school-level expenditure file) is ingested.
      schoolDataAvailable: false,
      schools: [
        { id: "centennial", name: "Centennial Elementary", level: "Elementary" },
        { id: "douglas-gardens", name: "Douglas Gardens Elementary", level: "Elementary" },
        { id: "page", name: "Elizabeth Page Elementary", level: "Elementary" },
        { id: "guy-lee", name: "Guy Lee Elementary", level: "Elementary" },
        { id: "maple", name: "Maple Elementary", level: "Elementary" },
        { id: "mt-vernon", name: "Mt. Vernon Elementary", level: "Elementary" },
        { id: "ridgeview", name: "Ridgeview Elementary", level: "Elementary" },
        { id: "riverbend", name: "Riverbend Elementary", level: "Elementary" },
        { id: "thurston-elem", name: "Thurston Elementary", level: "Elementary" },
        { id: "trdr", name: "Two Rivers-Dos Ríos", level: "Elementary" },
        { id: "walterville", name: "Walterville Elementary", level: "Elementary" },
        { id: "yolanda", name: "Yolanda Elementary", level: "Elementary" },
        { id: "agnes-stewart", name: "Agnes Stewart Middle", level: "Middle" },
        { id: "briggs", name: "Briggs Middle", level: "Middle" },
        { id: "hamlin", name: "Hamlin Middle", level: "Middle" },
        { id: "thurston-ms", name: "Thurston Middle", level: "Middle" },
        { id: "a3", name: "Academy of Arts and Academics", level: "High" },
        { id: "brattain", name: "Brattain Campus", level: "Alternative" },
        { id: "shs", name: "Springfield High", level: "High" },
        { id: "ths", name: "Thurston High", level: "High" }
      ],

      sources: [
        { label: "SD19 District Budget page (all budget documents)", url: "https://www.springfield.k12.or.us/services/business/budget" },
        { label: "FY2025-26 Adopted Budget Document (PDF)", url: "https://www.springfield.k12.or.us/fs/resource-manager/view/0695e4c2-b8ad-4726-bd33-43b7901c8872" },
        { label: "FY2024-25 Adopted Budget Document (PDF)", url: "https://www.springfield.k12.or.us/fs/resource-manager/view/d9f928d1-470a-48b6-b87b-7605459faa19" },
        { label: "FY2023-24 Adopted Budget Document (PDF)", url: "https://www.springfield.k12.or.us/fs/resource-manager/view/ac6bdde4-6da3-493a-9f0f-00cfda130463" },
        { label: "FY2026-27 budget update — projected $10.4M structural deficit", url: "https://www.springfield.k12.or.us/news/news-details/~board/springfield-public-schools-news/post/budget-update-2026-27" }
      ]
    }
  ]
};
