/**
 * Springfield Bridge Plan — survey.js
 * Multi-step survey with Supabase submission + step validation
 *
 * Supabase schema (run in SQL editor):
 * ------------------------------------------------
 * create table survey_responses (
 *   id uuid default gen_random_uuid() primary key,
 *   submitted_at timestamptz default now(),
 *   respondent_name text,
 *   respondent_email text,
 *   q1_role text,
 *   q2_level text,
 *   q3_tenure text,
 *   q4_status text,
 *   q5 int, q6 int, q7 int, q8 int,
 *   q9_oop text,
 *   q10 int, q11 int, q12 int,
 *   q13 int, q14 int, q15 int, q16 int,
 *   q17_workload text,
 *   q18 int,
 *   q19_gap_amount int,
 *   q20_levy_support text,
 *   q21_biggest_impact text,
 *   q22_board_message text,
 *   q23_other text
 * );
 * alter table survey_responses enable row level security;
 * create policy "anon insert only" on survey_responses
 *   for insert to anon with check (true);
 * create unique index survey_responses_email_unique
 *   on survey_responses (respondent_email)
 *   where respondent_email is not null;
 * ------------------------------------------------
 */

const SUPABASE_URL = 'https://wigrqjhqgpindlwartzn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YKWdMuB4Xyt-MKKohAzYQg_28nhpEGJ';

// Required fields per step — name|email validated separately
const STEP_REQUIRED = {
    1: ['respondent_name', 'respondent_email', 'q1_role'],
    2: [], // likert optional — don't block on these
    3: [],
    4: [],
    5: [],
    6: [],
};

const TOTAL_STEPS = 6;
let currentStep = 1;

const steps       = document.querySelectorAll('.survey-step');
const prevBtn     = document.getElementById('survey-prev');
const nextBtn     = document.getElementById('survey-next');
const submitBtn   = document.getElementById('survey-submit');
const progressFill = document.getElementById('survey-progress-fill');
const progressText = document.getElementById('survey-progress-text');
const surveyForm   = document.getElementById('survey-form');
const surveySuccess = document.getElementById('survey-success');

// ── Validation ────────────────────────────────────────────────────────────────
function validateStep(n) {
    const required = STEP_REQUIRED[n] || [];
    let valid = true;

    // Clear previous errors
    document.querySelectorAll('.survey-question.has-error').forEach(el => el.classList.remove('has-error'));

    required.forEach(name => {
        const el = surveyForm.querySelector(`[name="${name}"]`);
        if (!el) return;
        const val = el.value.trim();
        let ok = val.length > 0;

        // Extra: email format check
        if (name === 'respondent_email' && ok) {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }

        if (!ok) {
            valid = false;
            const question = el.closest('.survey-question');
            if (question) question.classList.add('has-error');
        }
    });

    if (!valid) {
        // Scroll to first error
        const firstError = document.querySelector('.survey-question.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
}

// ── Navigation ────────────────────────────────────────────────────────────────
function showStep(n) {
    steps.forEach(s => { s.hidden = parseInt(s.dataset.step) !== n; });
    prevBtn.hidden  = n === 1;
    nextBtn.hidden  = n === TOTAL_STEPS;
    submitBtn.hidden = n !== TOTAL_STEPS;

    const pct = ((n - 1) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = pct + '%';
    progressText.textContent = `Section ${n} of ${TOTAL_STEPS}`;

    window.scrollTo({ top: document.querySelector('.survey-wrapper').offsetTop - 80, behavior: 'smooth' });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (!validateStep(currentStep)) return;
        if (currentStep < TOTAL_STEPS) { currentStep++; showStep(currentStep); }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) { currentStep--; showStep(currentStep); }
    });
}

// Clear error state on input change
surveyForm && surveyForm.addEventListener('input', e => {
    const q = e.target.closest('.survey-question');
    if (q) q.classList.remove('has-error');
});
surveyForm && surveyForm.addEventListener('change', e => {
    const q = e.target.closest('.survey-question');
    if (q) q.classList.remove('has-error');
});

// ── Submission ────────────────────────────────────────────────────────────────
if (surveyForm) {
    surveyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const fd = new FormData(surveyForm);
        const data = {};
        const intKeys = ['q5','q6','q7','q8','q10','q11','q12','q13','q14','q15','q16','q18','q19_gap_amount'];
        fd.forEach((val, key) => {
            data[key] = intKeys.includes(key) && val !== '' ? parseInt(val) : val || null;
        });

        if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('[Survey] Dev mode — response:', data);
            showSuccess();
            return;
        }

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses`, {
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
                // Duplicate email — unique constraint violation
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Survey ✓';
                alert('It looks like a response from this email has already been recorded. If you believe this is an error, contact us at springfieldbridgeplan.org.');
                return;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            showSuccess();

        } catch (err) {
            console.error('[Survey] Error:', err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Survey ✓';
            alert('There was a problem submitting your response. Please try again or email us at springfieldbridgeplan.org.');
        }
    });
}

function showSuccess() {
    surveyForm.hidden = true;
    surveySuccess.hidden = false;
    progressFill.style.width = '100%';
    progressText.textContent = 'Complete! Thank you.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Init
showStep(1);
