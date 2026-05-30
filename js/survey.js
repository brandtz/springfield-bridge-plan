/**
 * Springfield Bridge Plan — survey.js
 * Multi-step survey with Supabase submission
 *
 * TO ACTIVATE: Replace SUPABASE_URL and SUPABASE_ANON_KEY below
 * with your project credentials from app.supabase.com
 *
 * Supabase table schema (run in SQL editor):
 * ------------------------------------------------
 * create table survey_responses (
 *   id uuid default gen_random_uuid() primary key,
 *   submitted_at timestamptz default now(),
 *   q1_role text,
 *   q2_level text,
 *   q3_tenure text,
 *   q4_status text,
 *   q5 int,  q6 int,  q7 int,  q8 int,
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
 * -- Allow anonymous inserts, no reads from anon
 * alter table survey_responses enable row level security;
 * create policy "anon insert only" on survey_responses
 *   for insert to anon with check (true);
 * ------------------------------------------------
 */

const SUPABASE_URL = 'https://wigrqjhqgpindlwartzn.supabase.co';       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_YKWdMuB4Xyt-MKKohAzYQg_28nhpEGJ';      // public anon key — safe to expose

// ── Step navigation ──────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;
let currentStep = 1;

const steps = document.querySelectorAll('.survey-step');
const prevBtn = document.getElementById('survey-prev');
const nextBtn = document.getElementById('survey-next');
const submitBtn = document.getElementById('survey-submit');
const progressFill = document.getElementById('survey-progress-fill');
const progressText = document.getElementById('survey-progress-text');
const surveyForm = document.getElementById('survey-form');
const surveySuccess = document.getElementById('survey-success');

function showStep(n) {
    steps.forEach(s => s.hidden = parseInt(s.dataset.step) !== n);
    prevBtn.hidden = n === 1;
    nextBtn.hidden = n === TOTAL_STEPS;
    submitBtn.hidden = n !== TOTAL_STEPS;
    const pct = ((n - 1) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = pct + '%';
    progressText.textContent = `Section ${n} of ${TOTAL_STEPS}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (currentStep < TOTAL_STEPS) { currentStep++; showStep(currentStep); }
    });
}
if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) { currentStep--; showStep(currentStep); }
    });
}

// ── Form submission ───────────────────────────────────────────────────────────
if (surveyForm) {
    surveyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const fd = new FormData(surveyForm);
        const data = {};
        fd.forEach((val, key) => {
            // Convert numeric likert values to integers
            const intKeys = ['q5','q6','q7','q8','q10','q11','q12','q13','q14','q15','q16','q18','q19_gap_amount'];
            data[key] = intKeys.includes(key) && val !== '' ? parseInt(val) : val;
        });

        // If Supabase isn't configured yet, log and show success anyway (dev mode)
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('[Survey] Supabase not configured. Response data:', data);
            surveyForm.hidden = true;
            surveySuccess.hidden = false;
            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';
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
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            surveyForm.hidden = true;
            surveySuccess.hidden = false;
            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';
        } catch (err) {
            console.error('[Survey] Submission error:', err);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Survey ✓';
            alert('There was a problem submitting your response. Please try again or contact us at springfieldbridgeplan.org.');
        }
    });
}

// Init
showStep(1);
