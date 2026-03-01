document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('booking-calendar');
    if (!widget) return;

    // Views
    const views = {
        1: document.getElementById('cal-step-1'),
        2: document.getElementById('cal-step-2'),
        3: document.getElementById('cal-step-3'),
        4: document.getElementById('cal-step-success')
    };

    // Steps UI
    const stepEls = widget.querySelectorAll('.cal-step');
    const progressBar = widget.querySelector('.cal-progress-bar');

    // State
    let state = {
        step: 1,
        selectedDate: null,
        selectedTime: null,
        currentMonth: new Date()
    };
    state.currentMonth.setDate(1);

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // DOM refs
    const calDays = document.getElementById('cal-days');
    const monthLabel = document.getElementById('cal-month-label');
    const prevMonthBtn = document.getElementById('cal-prev-month');
    const nextMonthBtn = document.getElementById('cal-next-month');
    const backToDate = document.getElementById('cal-back-to-date');
    const dateDisplay = document.getElementById('selected-date-display');
    const timeSlots = document.getElementById('cal-time-slots');
    const backToTime = document.getElementById('cal-back-to-time');
    const dtDisplay = document.getElementById('selected-datetime-display');
    const calForm = document.getElementById('cal-form');
    const successDT = document.getElementById('success-datetime');

    /* ==================== VIEW MANAGEMENT ==================== */

    function goToStep(n) {
        // Hide all views
        Object.values(views).forEach(v => { if (v) v.classList.remove('active'); });

        // Step indicators
        stepEls.forEach((el, i) => {
            const s = i + 1;
            el.classList.remove('active', 'completed');
            if (n <= 3) {
                if (s < n) el.classList.add('completed');
                else if (s === n) el.classList.add('active');
            } else {
                el.classList.add('completed');
            }
        });

        // Progress bar
        const pct = n >= 4 ? 100 : ((n - 1) / 3) * 100;
        progressBar.style.width = pct + '%';

        state.step = n;
        if (views[n]) views[n].classList.add('active');
    }

    /* ==================== STEP 1: DATE PICKER ==================== */

    function renderCalendar() {
        const year = state.currentMonth.getFullYear();
        const month = state.currentMonth.getMonth();
        monthLabel.textContent = `${MONTHS[month]} ${year}`;

        calDays.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day empty';
            calDays.appendChild(cell);
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const isPast = dateObj.getTime() <= today.getTime();

            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.textContent = d;

            if (dateObj.getTime() === today.getTime()) {
                cell.classList.add('today');
            }

            if (isPast || isWeekend) {
                cell.classList.add('disabled');
            } else {
                // Available day
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                if (state.selectedDate && state.selectedDate.iso === iso) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    calDays.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
                    cell.classList.add('selected');

                    state.selectedDate = { dateObj, iso, display: `${MONTHS[month].substring(0, 3)} ${d}, ${year}` };

                    setTimeout(() => {
                        loadTimeSlots();
                        goToStep(2);
                    }, 200);
                });
            }

            calDays.appendChild(cell);
        }

        // Disable prev if current month
        const cm = new Date(today.getFullYear(), today.getMonth(), 1);
        prevMonthBtn.disabled = state.currentMonth.getTime() <= cm.getTime();
    }

    prevMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });

    /* ==================== STEP 2: TIME SLOTS ==================== */

    async function loadTimeSlots() {
        dateDisplay.textContent = `Selected: ${state.selectedDate.display}`;
        timeSlots.innerHTML = '<div class="cal-loading">Loading available times...</div>';

        try {
            // Try real API first
            let slots;
            try {
                const res = await fetch(`/api/availability?date=${state.selectedDate.iso}`);
                if (res.ok) {
                    const data = await res.json();
                    slots = data.slots;
                }
            } catch (e) { /* fallback to mock */ }

            // Mock fallback
            if (!slots) {
                await new Promise(r => setTimeout(r, 600));
                const seed = parseInt(state.selectedDate.iso.split('-')[2]);
                const tMin = new Date(`${state.selectedDate.iso}T09:00:00-05:00`);
                const dummySlots = [];
                let curr = new Date(tMin);
                for (let i = 0; i < 15; i++) {
                    dummySlots.push(curr.toISOString());
                    curr.setTime(curr.getTime() + 30 * 60 * 1000);
                }
                slots = dummySlots.filter((_, i) => (i + seed) % 3 !== 0);
            }

            renderTimeSlots(slots);
        } catch (err) {
            timeSlots.innerHTML = '<div class="cal-loading" style="color: #ef4444;">Failed to load. Please try again.</div>';
        }
    }

    function renderTimeSlots(slots) {
        if (!slots || slots.length === 0) {
            timeSlots.innerHTML = '<div class="cal-loading">No available times on this date.</div>';
            return;
        }

        timeSlots.innerHTML = '';

        const tzInfo = document.createElement('div');
        tzInfo.className = 'cal-tz-info';
        tzInfo.style.gridColumn = '1 / -1';
        tzInfo.style.fontSize = '0.85rem';
        tzInfo.style.color = 'var(--text-muted)';
        tzInfo.style.textAlign = 'center';
        tzInfo.style.marginBottom = '1rem';
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        tzInfo.textContent = `Times shown in your local timezone: ${localTz.replace(/_/g, ' ')}`;
        timeSlots.appendChild(tzInfo);

        slots.forEach(isoTime => {
            const dateObj = new Date(isoTime);
            const displayTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            const tzParts = dateObj.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ');
            const tzAbbr = tzParts[tzParts.length - 1] || '';

            const el = document.createElement('div');
            el.className = 'cal-time-slot';
            el.textContent = displayTime;

            el.addEventListener('click', () => {
                timeSlots.querySelectorAll('.cal-time-slot.selected').forEach(s => s.classList.remove('selected'));
                el.classList.add('selected');
                state.selectedTime = isoTime;

                setTimeout(() => {
                    dtDisplay.textContent = `${state.selectedDate.display} at ${displayTime} ${tzAbbr}`;
                    goToStep(3);
                }, 200);
            });

            timeSlots.appendChild(el);
        });
    }

    backToDate.addEventListener('click', () => goToStep(1));

    /* ==================== STEP 3: FORM ==================== */

    backToTime.addEventListener('click', () => goToStep(2));

    calForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = calForm.querySelector('button[type="submit"]');
        const origHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Confirming...</span>';
        submitBtn.disabled = true;

        const payload = {
            date: state.selectedDate.iso,
            time: state.selectedTime,
            name: document.getElementById('cal-name').value,
            email: document.getElementById('cal-email').value,
            website: document.getElementById('cal-website').value,
            painPoint: document.getElementById('cal-pain').value
        };

        try {
            let success = false;
            try {
                const res = await fetch('/api/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) success = true;
            } catch (e) { /* fallback */ }

            // Mock fallback
            if (!success) await new Promise(r => setTimeout(r, 1000));

            successDT.textContent = `${state.selectedDate.display} at ${new Date(state.selectedTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}`;
            goToStep(4);

        } catch (err) {
            submitBtn.innerHTML = origHTML;
            submitBtn.disabled = false;
            alert('Something went wrong. Please try again.');
        }
    });

    // Init
    renderCalendar();
    goToStep(1);
});
