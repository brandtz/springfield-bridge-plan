/**
 * Springfield Bridge Plan — levy.js
 * Calculator and volunteer form logic
 */

// Cost Calculator
const calcAV = document.getElementById('calc-av');
const calcRate = document.getElementById('calc-rate');
const calcAnnual = document.getElementById('calc-annual');
const calcMonthly = document.getElementById('calc-monthly');
const calcDaily = document.getElementById('calc-daily');
const calcPerStudent = document.getElementById('calc-per-student');

function updateCalc() {
    const av = parseFloat(calcAV.value) || 0;
    const rate = parseFloat(calcRate.value) || 1.75;
    const annual = (av / 1000) * rate;
    const monthly = annual / 12;
    const daily = annual / 365;
    const perStudentDaily = daily / 8900;

    calcAnnual.textContent = '$' + annual.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    calcMonthly.textContent = '$' + monthly.toFixed(2);
    calcDaily.textContent = '$' + daily.toFixed(2);
    calcPerStudent.textContent = '$' + perStudentDaily.toFixed(4) + '/day';
}

if (calcAV && calcRate) {
    calcAV.addEventListener('input', updateCalc);
    calcRate.addEventListener('change', updateCalc);
    updateCalc();
}

// Volunteer form → Google Sheets (reuse existing GAS endpoint)
const VOLUNTEER_URL = 'https://script.google.com/macros/s/AKfycbxWWI-Nmj2qb683USxW9Nq3Ayylo9AT134wU9OknjmnB8IaDPztQFu5VzvglL-05VHj/exec';
const volForm = document.getElementById('volunteer-form');
const volSuccess = document.getElementById('vol-success');
const volSubmit = document.getElementById('vol-submit');

if (volForm) {
    volForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(volForm));
        data.type = 'volunteer';
        volSubmit.disabled = true;
        volSubmit.classList.add('loading');
        try {
            await fetch(VOLUNTEER_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            volForm.hidden = true;
            volSuccess.hidden = false;
        } catch {
            // no-cors won't surface errors; treat as success
            volForm.hidden = true;
            volSuccess.hidden = false;
        }
        volSubmit.disabled = false;
        volSubmit.classList.remove('loading');
    });
}
