const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const checkAuth = () => {
    return (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
};

const getOauth2Client = () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return oauth2Client;
};

// Parse '09:30 AM' into hours and minutes
function parseTimeString(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { date, time, name, email, website, painPoint } = req.body;

    if (!date || !time || !name || !email || !painPoint) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!checkAuth()) {
        console.warn("Google credentials missing. Mocking success response.");
        await new Promise(r => setTimeout(r, 1000));
        return res.status(200).json({
            success: true,
            eventId: 'mock_' + Date.now(),
            meetLink: 'https://meet.google.com/mock-link',
            datetime: `${date} at ${time} EST`
        });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: getOauth2Client() });
        const calendarId = process.env.SANGEET_CALENDAR_ID || 'primary';

        // Construct start/end dates
        // Assuming EST logic for demo purposes. Best practice is to use moment-timezone or deal with precise offsets
        const timeInfo = parseTimeString(time);

        // YYYY-MM-DD
        const startDate = new Date(`${date}T00:00:00-05:00`);
        startDate.setHours(timeInfo.hours, timeInfo.minutes, 0);

        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

        // Double check availability to prevent double booking
        const freeBusy = await calendar.freebusy.query({
            requestBody: {
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                timeZone: 'America/New_York',
                items: [{ id: calendarId }]
            }
        });

        const busyArr = freeBusy.data.calendars[calendarId].busy || [];
        if (busyArr.length > 0) {
            return res.status(409).json({ error: 'Slot no longer available' });
        }

        // Create Calendar Event
        const event = {
            summary: `Automation Audit — ${name}`,
            description: `Client: ${name}\nEmail: ${email}\nWebsite: ${website || 'N/A'}\nPain Point: ${painPoint}`,
            start: { dateTime: startDate.toISOString(), timeZone: 'America/New_York' },
            end: { dateTime: endDate.toISOString(), timeZone: 'America/New_York' },
            attendees: [{ email: process.env.SANGEET_EMAIL || calendarId }, { email }],
            conferenceData: {
                createRequest: {
                    requestId: `meet_${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            reminders: { useDefault: true }
        };

        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all' // Sends calendar invite email to attendees
        });

        const meetLink = createdEvent.data.hangoutLink;

        // Send confirmation email via Nodemailer
        if (process.env.SENDGRID_API_KEY) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
            });

            const emailBody = `SANGEET — AI AUTOMATION\n\nYour audit is confirmed.\n\nDate: ${date}\nTime: ${time} EST\nDuration: 30 minutes\nMeeting: ${meetLink || 'See calendar invite'}\n\nBefore we meet — bring one thing:\nWrite down the 3 tasks that eat most of your week.\nWe'll work on your actual business, not hypotheticals.\n\nQuestions? Reply to this email.\n\n— Sangeet`;

            await transporter.sendMail({
                from: `"Sangeet — AI" <${process.env.SANGEET_EMAIL || 'hi@sangeet.ai'}>`,
                to: email,
                subject: `Your Automation Audit is Confirmed — ${date} at ${time} EST`,
                text: emailBody
            });
        }

        return res.status(200).json({
            success: true,
            eventId: createdEvent.data.id,
            meetLink: meetLink || '',
            datetime: `${date} at ${time} EST`
        });

    } catch (err) {
        console.error('Booking Error:', err);
        return res.status(500).json({ error: 'Failed to complete booking' });
    }
};
