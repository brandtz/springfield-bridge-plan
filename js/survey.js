/**
 * Springfield Bridge Plan — survey.js
 * Single-page staff survey with Supabase submission
 *
 * Supabase schema (run in SQL editor):
 * ------------------------------------------------
 * create table survey_responses (
 *   id uuid default gen_random_uuid() primary key,
 *   submitted_at timestamptz default now(),
 *   respondent_name text,
 *   respondent_email text,
 *   q1_role text, q2_level text, q3_tenure text, q4_status text,
 *   q5 int, q6 int, q7 int, q8 int,
 *   q9_oop text,
 *   q10 int, q11 int, q12 int,
 *   q13 int, q14 int, q15 int, q16 int,
 *   q17_workload text, q18 int,
 *   q19_gap_amount int, q20_levy_support text,
 *   q21_biggest_impact text, q22_board_message text, q23_other text
 * );
 * alter table survey_responses enable row level security;
 * create policy "anon insert only" on survey_responses
 *   for insert to anon with check (true);
 * create unique index survey_responses_email_unique
 *   on survey_responses (respondent_email)
 *   where respondent_email is not null;
 * ------------------------------------------------
 */

const SUPABASE_URL      = 'https://wigrqjhqgpindlwartzn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YKWdMuB4Xyt-MKKohAzYQg_28nhpEGJ';

const surveyForm    = document.getElementById('survey-form');
const surveySuccess = document.getElementById('survey-success');
const surveySubmit  = document.getElementById('survey-submit');

// ── Validation on submit ──────────────────────────────────────────────────────
function validate() {
    document.querySelectorAll('.survey-question.has-error')
        .forEach(el => el.classList.remove('has-error'));

    const required = [
        { name: 'respondent_name',  msg: 'Please enter your name.' },
        { name: 'respondent_email', msg: 'Please enter a valid email address.' },
        { name: 'q1_role',          msg: 'Please select your role.' },
    ];

    let valid = true;
    let firstError = null;

    required.forEach(({ name }) => {
        const el = surveyForm.querySelector(`[name="${name}"]`);
        if (!el) return;
        let ok = el.value.trim().length > 0;
        if (name === 'respondent_email' && ok) {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        }
        if (!ok) {
            valid = false;
            const q = el.closest('.survey-question');
            if (q) {
                q.classList.add('has-error');
                if (!firstError) firstError = q;
            }
        }
    });

    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
}

// Clear error on input
surveyForm && surveyForm.addEventListener('input', e => {
    e.target.closest('.survey-question')?.classList.remove('has-error');
});
surveyForm && surveyForm.addEventListener('change', e => {
    e.target.closest('.survey-question')?.classList.remove('has-error');
});

// ── Submit ────────────────────────────────────────────────────────────────────
surveyForm && surveyForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    surveySubmit.disabled = true;
    surveySubmit.textContent = 'Submitting...';

    const fd = new FormData(surveyForm);
    const intKeys = ['q5','q6','q7','q8','q10','q11','q12','q13','q14','q15','q16','q18','q19_gap_amount'];
    const data = {};
    fd.forEach((val, key) => {
        data[key] = intKeys.includes(key) && val !== ''
            ? parseInt(val)
            : (val || null);
    });

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
            surveySubmit.disabled = false;
            surveySubmit.textContent = 'Submit Survey ✓';
            alert('It looks like a response from this email has already been recorded. If you believe this is an error, contact us at springfieldbridgeplan.org.');
            return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        surveyForm.hidden = true;
        surveySuccess.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error('[Survey]', err);
        surveySubmit.disabled = false;
        surveySubmit.textContent = 'Submit Survey ✓';
        alert('There was a problem submitting your response. Please try again or contact us at springfieldbridgeplan.org.');
    }
});
