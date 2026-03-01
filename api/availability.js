const { google } = require('googleapis');

// Helper to check if credentials exist
const checkAuth = () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        return false;
    }
    return true;
};

const getOauth2Client = () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        // Redirect URI not strictly needed for server-to-server with existing refresh token
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return oauth2Client;
};

module.exports = async (req, res) => {
    // CORS Support
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { date } = req.query; // Expected 'YYYY-MM-DD'

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    // If no credentials, gracefully fallback to mock data (useful for frontend dev before backend is fully wired)
    if (!checkAuth()) {
        console.warn("Google credentials missing. Returning mock availability data.");
        const dummySlots = ['09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '03:00 PM', '04:00 PM'];

        // Simulate slight delay and some random missing slots
        await new Promise(r => setTimeout(r, 600));
        const seed = parseInt(date.split('-')[2]);
        const mockSlots = dummySlots.filter((_, i) => (i + seed) % 3 !== 0);

        return res.status(200).json({
            date,
            timezone: 'America/New_York',
            slots: mockSlots.length > 0 ? mockSlots : dummySlots.slice(0, 3)
        });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: getOauth2Client() });
        const calendarId = process.env.SANGEET_CALENDAR_ID || 'primary';

        // Time boundaries (9 AM - 5 PM EST)
        const timeMin = new Date(`${date}T09:00:00-05:00`); // EST offset
        const timeMax = new Date(`${date}T17:00:00-05:00`);

        // No same-day bookings
        const now = new Date();
        // Add 24h buffer
        const bufferTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (timeMin.getTime() < bufferTime.getTime()) {
            return res.status(200).json({ error: 'Too close to start time', slots: [] });
        }

        const freeBusyObj = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                timeZone: 'America/New_York',
                items: [{ id: calendarId }]
            }
        });

        const busySlots = freeBusyObj.data.calendars[calendarId].busy || [];

        // Generate all theoretical 30m slots for the day
        const availableSlots = [];
        const currentSlot = new Date(timeMin.getTime());

        while (currentSlot.getTime() < timeMax.getTime()) {
            const slotEnd = new Date(currentSlot.getTime() + 30 * 60 * 1000); // +30m

            // Check if this slot overlaps with any busy event
            const isOverlap = busySlots.some(busy => {
                const busyStart = new Date(busy.start).getTime();
                const busyEnd = new Date(busy.end).getTime();
                return (currentSlot.getTime() < busyEnd && slotEnd.getTime() > busyStart);
            });

            if (!isOverlap) {
                // Format to 'HH:MM AM/PM'
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/New_York',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                availableSlots.push(formatter.format(currentSlot));
            }

            currentSlot.setTime(currentSlot.getTime() + 30 * 60 * 1000);
        }

        return res.status(200).json({
            date,
            timezone: 'America/New_York',
            slots: availableSlots
        });

    } catch (err) {
        console.error('Google Calendar Error:', err);
        return res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
};
