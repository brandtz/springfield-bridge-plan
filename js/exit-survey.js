/**
 * Springfield Bridge Plan — exit-survey.js
 * Family Exit Survey: dynamic student cards, conditional SPED, Supabase submission
 *
 * Supabase schema (run in SQL editor):
 * ─────────────────────────────────────────────────────────
 * create table exit_survey_responses (
 *   id uuid default gen_random_uuid() primary key,
 *   submitted_at timestamptz default now(),
 *   respondent_name text,
 *   respondent_email text,
 *   respondent_zip text,
 *   year_left text,
 *   students jsonb,
 *   rating_school_admin int,
 *   rating_district_admin int,
 *   rating_curriculum int,
 *   rating_facilities int,
 *   rating_conflict int,
 *   rating_communication int,
 *   rating_safety int,
 *   aware_budget_cuts text,
 *   budget_affected_child text,
 *   budget_impacts text[],
 *   budget_influenced_leaving text,
 *   reasons_leaving text[],
 *   reasons_other text,
 *   primary_reason_detail text,
 *   current_setting text,
 *   current_district_name text,
 *   current_satisfaction int,
 *   what_child_gets_now text,
 *   return_conditions text[],
 *   return_conditions_other text,
 *   likelihood_recommend int,
 *   levy_support text,
 *   board_recommendation text,
 *   additional_comments text,
 *   allow_excerpts text
 * );
 * alter table exit_survey_responses enable row level security;
 * create policy "anon insert only" on exit_survey_responses
 *   for insert to anon with check (true);
 * create unique index exit_survey_email_unique
 *   on exit_survey_responses (respondent_email)
 *   where respondent_email is not null;
 * ─────────────────────────────────────────────────────────
 */

const SUPABASE_URL      = 'https://wigrqjhqgpindlwartzn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YKWdMuB4Xyt-MKKohAzYQg_28nhpEGJ';

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS  = 8;
const MAX_STUDENTS = 5;

const GRADES = [
    'Pre-K / Kindergarten','1st grade','2nd grade','3rd grade','4th grade',
    '5th grade','6th grade','7th grade','8th grade','9th grade',
    '10th grade','11th grade','12th grade',
];
const SCHOOLS = [
    'Agnes Stewart Middle','Brattain Elementary','Briggs Middle','Douglas Gardens Elementary',
    'Elizabeth Page Elementary','Gateways High / Alternative','Guy Lee Elementary',
    'Hamlin Middle','Harvey Clarke Elementary','Maple Elementary','Mt. Vernon Elementary',
    'Page Elementary','Pioneer Park Elementary','Ridgeview Elementary','Springfield High',
    'Thurston High','Thurston Middle','Walterville Elementary','Willamalane Elementary',
    'Willamette Leadership Academy (WLA)','Yolanda Elementary','Other / Not Listed',
];

// ── State ─────────────────────────────────────────────────────────────────────
let currentStep   = 1;
let studentCount  = 0;
let studentIds    = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form         = document.getElementById('exit-survey-form');
const successEl    = document.getElementById('exit-survey-success');
const prevBtn      = document.getElementById('exit-prev');
const nextBtn      = document.getElementById('exit-next');
const submitBtn    = document.getElementById('exit-submit');
const progFill     = document.getElementById('exit-progress-fill');
const progText     = document.getElementById('exit-progress-text');
const progPct      = document.getElementById('exit-progress-pct');
const addStudentBtn    = document.getElementById('add-student-btn');
const studentContainer = document.getElementById('student-cards-container');
const limitNote    = document.getElementById('student-limit-note');

// ── Step navigation ───────────────────────────────────────────────────────────
function showStep(n) {
    document.querySelectorAll('.survey-step').forEach(s => {
        s.hidden = parseInt(s.dataset.step) !== n;
    });
    prevBtn.hidden   = n === 1;
    nextBtn.hidden   = n === TOTAL_STEPS;
    submitBtn.hidden = n !== TOTAL_STEPS;

    const pct = Math.round(((n - 1) / (TOTAL_STEPS - 1)) * 100);
    progFill.style.width = pct + '%';
    progText.textContent  = `Section ${n} of ${TOTAL_STEPS}`;
    progPct.textContent   = pct + '%';

    window.scrollTo({ top: document.querySelector('.survey-wrapper').offsetTop - 80, behavior: 'smooth' });
}

// ── Validation ────────────────────────────────────────────────────────────────
const STEP_REQUIRED = {
    1: ['respondent_name', 'respondent_email', 'year_left'],
};

function validateStep(n) {
    document.querySelectorAll('.survey-question.has-error').forEach(el => el.classList.remove('has-error'));
    const required = STEP_REQUIRED[n] || [];
    let valid = true;

    required.forEach(name => {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el) return;
        let ok = el.value.trim().length > 0;
        if (name === 'respondent_email' && ok) {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        }
        if (!ok) {
            valid = false;
            const q = el.closest('.survey-question');
            if (q) q.classList.add('has-error');
        }
    });

    // Step 2: need at least one student
    if (n === 2 && studentIds.length === 0) {
        valid = false;
        document.querySelector('.no-students-warning')?.classList.add('visible');
    }

    if (!valid) {
        const firstErr = document.querySelector('.survey-question.has-error, .no-students-warning.visible');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
}

nextBtn?.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) { currentStep++; showStep(currentStep); }
});
prevBtn?.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
});

form?.addEventListener('input', e => {
    const q = e.target.closest('.survey-question');
    if (q) q.classList.remove('has-error');
    document.querySelector('.no-students-warning')?.classList.remove('visible');
});
form?.addEventListener('change', e => {
    const q = e.target.closest('.survey-question');
    if (q) q.classList.remove('has-error');

    // Show/hide "other district" field
    if (e.target.name === 'current_setting') {
        const otherQ = document.getElementById('other-district-q');
        if (otherQ) {
            otherQ.style.display = ['public_other','public_charter'].includes(e.target.value) ? 'block' : 'none';
        }
    }
});

// ── Student card builder ──────────────────────────────────────────────────────
function buildStudentCard(id) {
    const num    = studentIds.indexOf(id) + 1;
    const prefix = `student_${id}`;

    // Grade options
    const gradeOpts = GRADES.map(g =>
        `<option value="${g}">${g}</option>`
    ).join('');

    // School options
    const schoolOpts = SCHOOLS.map(s =>
        `<option value="${s}">${s}</option>`
    ).join('');

    // Mini likert builder
    const miniLikert = (name, labels) => {
        return labels.map((lbl, i) => `
            <div class="mini-likert-option">
                <input type="radio" name="${prefix}_${name}" value="${i+1}" id="${prefix}_${name}_${i+1}">
                <label for="${prefix}_${name}_${i+1}">
                    <span class="mini-likert-num">${i+1}</span>
                    ${lbl}
                </label>
            </div>`).join('');
    };

    const ratingLabels = ['Very Poor','Poor','Neutral','Good','Excellent'];

    const card = document.createElement('div');
    card.className = 'student-card';
    card.id = `student-card-${id}`;
    card.innerHTML = `
        <div class="student-card-header" onclick="toggleStudentCard(${id})">
            <div class="student-card-title">
                <div class="student-card-icon">👤</div>
                <span id="student-card-label-${id}">Student ${num}</span>
            </div>
            <div class="student-card-actions">
                <span class="student-card-toggle" id="student-toggle-${id}">▲ Collapse</span>
                ${studentIds.length > 1 || studentCount > 1 ? `<button type="button" class="btn-remove-student" onclick="removeStudent(${id}); event.stopPropagation()">Remove</button>` : ''}
            </div>
        </div>

        <div class="student-card-body" id="student-body-${id}">

            <div class="student-fields">
                <div class="student-field">
                    <label for="${prefix}_nickname">Student nickname / label <span style="font-weight:400;color:#94a3b8">(optional — for your reference only)</span></label>
                    <input type="text" name="${prefix}_nickname" id="${prefix}_nickname" placeholder="e.g. 'My daughter' or 'Child 1'"
                        oninput="document.getElementById('student-card-label-${id}').textContent = this.value || 'Student ${num}'">
                </div>
                <div class="student-field">
                    <label for="${prefix}_grade">Grade at time of leaving *</label>
                    <select name="${prefix}_grade" id="${prefix}_grade">
                        <option value="" disabled selected>Select grade</option>
                        ${gradeOpts}
                    </select>
                </div>
                <div class="student-field">
                    <label for="${prefix}_school">Primary school attended *</label>
                    <select name="${prefix}_school" id="${prefix}_school">
                        <option value="" disabled selected>Select school</option>
                        ${schoolOpts}
                    </select>
                </div>
                <div class="student-field">
                    <label for="${prefix}_years">Years enrolled in Springfield SD 19</label>
                    <select name="${prefix}_years" id="${prefix}_years">
                        <option value="" disabled selected>Select</option>
                        <option value="less_1">Less than 1 year</option>
                        <option value="1-2">1–2 years</option>
                        <option value="3-5">3–5 years</option>
                        <option value="6-9">6–9 years</option>
                        <option value="10+">10+ years</option>
                    </select>
                </div>
            </div>

            <div class="student-ratings">
                <h4>Per-Student Experience Ratings</h4>
                <div class="student-rating-row">
                    <span class="student-rating-label">Classroom teachers</span>
                    <div class="mini-likert">${miniLikert('rating_teachers', ratingLabels)}</div>
                </div>
                <div class="student-rating-row">
                    <span class="student-rating-label">Educational aides</span>
                    <div class="mini-likert">${miniLikert('rating_aides', ratingLabels)}</div>
                </div>
                <div class="student-rating-row">
                    <span class="student-rating-label">Overall experience</span>
                    <div class="mini-likert">${miniLikert('rating_overall', ratingLabels)}</div>
                </div>
            </div>

            <!-- SPED Branch -->
            <div class="sped-toggle-row">
                <label class="sped-main-label">Did this student receive Special Education, IEP, or 504 services?</label>
                <div class="sped-radio-row">
                    <div class="sped-radio-btn">
                        <input type="radio" name="${prefix}_sped" value="yes" id="${prefix}_sped_yes"
                            onchange="toggleSped(${id}, 'yes')">
                        <label for="${prefix}_sped_yes">✓ Yes</label>
                    </div>
                    <div class="sped-radio-btn">
                        <input type="radio" name="${prefix}_sped" value="no" id="${prefix}_sped_no"
                            onchange="toggleSped(${id}, 'no')">
                        <label for="${prefix}_sped_no">✗ No</label>
                    </div>
                    <div class="sped-radio-btn sped-na">
                        <input type="radio" name="${prefix}_sped" value="na" id="${prefix}_sped_na"
                            onchange="toggleSped(${id}, 'na')">
                        <label for="${prefix}_sped_na">— N/A</label>
                    </div>
                </div>

                <div class="sped-branch" id="${prefix}_sped_branch">
                    <h5>Special Education Experience</h5>

                    <div class="sped-question">
                        <label>Type of services received</label>
                        <select name="${prefix}_sped_type">
                            <option value="" disabled selected>Select</option>
                            <option value="iep">IEP (Individualized Education Program)</option>
                            <option value="504">504 Plan</option>
                            <option value="both">Both IEP and 504</option>
                            <option value="eval_only">Evaluation only — no services granted</option>
                            <option value="other">Other specialized services</option>
                        </select>
                    </div>

                    <div class="sped-question">
                        <label>How satisfied were you with the quality of SPED services?</label>
                        <div class="mini-likert" style="max-width:420px">${miniLikert('sped_satisfaction', ratingLabels)}</div>
                    </div>

                    <div class="sped-question">
                        <label>IEP / 504 goals were clearly communicated and implemented</label>
                        <div class="mini-likert" style="max-width:420px">
                            ${['Strongly Disagree','Disagree','Neutral','Agree','Strongly Agree'].map((lbl, i) => `
                            <div class="mini-likert-option">
                                <input type="radio" name="${prefix}_sped_iep_implementation" value="${i+1}" id="${prefix}_siep_${i+1}">
                                <label for="${prefix}_siep_${i+1}"><span class="mini-likert-num">${i+1}</span>${lbl}</label>
                            </div>`).join('')}
                        </div>
                    </div>

                    <div class="sped-question">
                        <label>Staff had appropriate knowledge and training to support this student's needs</label>
                        <div class="mini-likert" style="max-width:420px">${miniLikert('sped_staff_knowledge', ratingLabels)}</div>
                    </div>

                    <div class="sped-question">
                        <label>Communication with the SPED team was timely and helpful</label>
                        <div class="mini-likert" style="max-width:420px">${miniLikert('sped_communication', ratingLabels)}</div>
                    </div>

                    <div class="sped-question">
                        <label>Did budget cuts specifically reduce services for this student?</label>
                        <select name="${prefix}_sped_budget_impact">
                            <option value="" disabled selected>Select</option>
                            <option value="yes_significantly">Yes — significantly</option>
                            <option value="yes_somewhat">Yes — somewhat</option>
                            <option value="no">No noticeable impact</option>
                            <option value="unsure">Unsure</option>
                        </select>
                    </div>

                    <div class="sped-question">
                        <label>Any additional comments about this student's SPED experience? <span style="font-weight:400;color:#64748b">(optional)</span></label>
                        <textarea name="${prefix}_sped_comments" rows="3" placeholder="Share anything else about the special education experience for this child..."></textarea>
                    </div>
                </div>
            </div>

        </div>
    `;
    return card;
}

// ── Toggle SPED branch ────────────────────────────────────────────────────────
window.toggleSped = function(id, value) {
    const branch = document.getElementById(`student_${id}_sped_branch`);
    if (!branch) return;
    if (value === 'yes') {
        branch.classList.add('visible');
    } else {
        branch.classList.remove('visible');
    }
};

// ── Toggle card collapse ──────────────────────────────────────────────────────
window.toggleStudentCard = function(id) {
    const body   = document.getElementById(`student-body-${id}`);
    const toggle = document.getElementById(`student-toggle-${id}`);
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    toggle.textContent = collapsed ? '▼ Expand' : '▲ Collapse';
};

// ── Add student ───────────────────────────────────────────────────────────────
function addStudent() {
    if (studentIds.length >= MAX_STUDENTS) return;

    studentCount++;
    const id = studentCount;
    studentIds.push(id);

    // Collapse all existing cards
    studentIds.forEach(sid => {
        const body = document.getElementById(`student-body-${sid}`);
        const tog  = document.getElementById(`student-toggle-${sid}`);
        if (body && sid !== id) {
            body.classList.add('collapsed');
            if (tog) tog.textContent = '▼ Expand';
        }
    });

    const card = buildStudentCard(id);
    studentContainer.appendChild(card);

    // Update remove buttons visibility
    refreshRemoveButtons();

    if (studentIds.length >= MAX_STUDENTS) {
        addStudentBtn.hidden = true;
        limitNote.hidden = false;
    }

    // Scroll to new card
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Remove student ────────────────────────────────────────────────────────────
window.removeStudent = function(id) {
    if (studentIds.length <= 1) return;
    studentIds = studentIds.filter(s => s !== id);
    const card = document.getElementById(`student-card-${id}`);
    if (card) card.remove();

    addStudentBtn.hidden = false;
    limitNote.hidden = true;

    refreshRemoveButtons();
    renumberCards();
};

function renumberCards() {
    studentIds.forEach((id, idx) => {
        const label = document.getElementById(`student-card-label-${id}`);
        const input = document.querySelector(`[name="student_${id}_nickname"]`);
        if (label && (!input || !input.value)) {
            label.textContent = `Student ${idx + 1}`;
        }
    });
}

function refreshRemoveButtons() {
    studentIds.forEach(id => {
        const card = document.getElementById(`student-card-${id}`);
        if (!card) return;
        const existing = card.querySelector('.btn-remove-student');
        if (studentIds.length <= 1) {
            if (existing) existing.remove();
        } else if (!existing) {
            const actions = card.querySelector('.student-card-actions');
            if (actions) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-remove-student';
                btn.textContent = 'Remove';
                btn.onclick = (e) => { e.stopPropagation(); removeStudent(id); };
                actions.appendChild(btn);
            }
        }
    });
}

// ── Collect student data ──────────────────────────────────────────────────────
function collectStudents() {
    return studentIds.map(id => {
        const prefix = `student_${id}`;
        const get = name => {
            const el = form.querySelector(`[name="${prefix}_${name}"]`);
            if (!el) return null;
            if (el.type === 'radio') {
                const checked = form.querySelector(`[name="${prefix}_${name}"]:checked`);
                return checked ? (isNaN(checked.value) ? checked.value : parseInt(checked.value)) : null;
            }
            return el.value || null;
        };

        const student = {
            label:         form.querySelector(`[name="${prefix}_nickname"]`)?.value || `Student ${studentIds.indexOf(id)+1}`,
            grade:         get('grade'),
            school:        get('school'),
            years:         get('years'),
            rating_teachers: get('rating_teachers'),
            rating_aides:    get('rating_aides'),
            rating_overall:  get('rating_overall'),
            sped:            get('sped'),
        };

        if (student.sped === 'yes') {
            Object.assign(student, {
                sped_type:            get('sped_type'),
                sped_satisfaction:    get('sped_satisfaction'),
                sped_iep_implementation: get('sped_iep_implementation'),
                sped_staff_knowledge: get('sped_staff_knowledge'),
                sped_communication:   get('sped_communication'),
                sped_budget_impact:   get('sped_budget_impact'),
                sped_comments:        form.querySelector(`[name="${prefix}_sped_comments"]`)?.value || null,
            });
        }
        return student;
    });
}

// ── Submission ────────────────────────────────────────────────────────────────
form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const fd = new FormData(form);

    // Collect checkboxes as arrays
    const checkboxArrays = {};
    ['budget_impacts','reasons_leaving','return_conditions'].forEach(name => {
        checkboxArrays[name] = fd.getAll(name);
    });

    // Scalar fields
    const intFields = [
        'rating_school_admin','rating_district_admin','rating_curriculum',
        'rating_facilities','rating_conflict','rating_communication','rating_safety',
        'current_satisfaction','likelihood_recommend',
    ];
    const data = {};
    fd.forEach((val, key) => {
        if (['budget_impacts','reasons_leaving','return_conditions'].includes(key)) return;
        if (key.startsWith('student_')) return; // handled separately
        data[key] = intFields.includes(key) ? (val ? parseInt(val) : null) : (val || null);
    });

    // Merge checkbox arrays
    Object.assign(data, checkboxArrays);

    // Attach students
    data.students = collectStudents();

    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('[Exit Survey] Dev mode:', data);
        showSuccess();
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/exit_survey_responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(data),
        });

        if (res.status === 409) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Survey ✓';
            alert('It looks like a response from this email has already been recorded. If you believe this is an error, please contact us at springfieldbridgeplan.org.');
            return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showSuccess();

    } catch (err) {
        console.error('[Exit Survey]', err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Survey ✓';
        alert('There was a problem submitting your response. Please try again or contact us at springfieldbridgeplan.org.');
    }
});

function showSuccess() {
    form.hidden = true;
    successEl.hidden = false;
    progFill.style.width = '100%';
    progText.textContent = 'Complete! Thank you.';
    progPct.textContent  = '100%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Insert warning placeholder before add button
const warning = document.createElement('div');
warning.className = 'no-students-warning';
warning.textContent = 'Please add at least one student before continuing.';
studentContainer.parentNode.insertBefore(warning, studentContainer);

addStudentBtn?.addEventListener('click', addStudent);

// Auto-add first student
addStudent();

showStep(1);
