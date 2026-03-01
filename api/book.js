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

// Time parser removed since we now use strictly ISO strings
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
        const dtStr = new Date(time).toLocaleString(undefined, { timeZoneName: 'short' });
        return res.status(200).json({
            success: true,
            eventId: 'mock_' + Date.now(),
            meetLink: 'https://meet.google.com/mock-link',
            datetime: dtStr
        });
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: getOauth2Client() });
        const calendarId = process.env.SANGEET_CALENDAR_ID || 'primary';

        // Construct start/end dates from the ISO string provided by the frontend
        const startDate = new Date(time);
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

            const dtStr = new Date(time).toLocaleString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
            });

            const emailBody = `SANGEET — AI AUTOMATION\n\nYour audit is confirmed.\n\nDate & Time: ${dtStr}\nDuration: 30 minutes\nMeeting: ${meetLink || 'See calendar invite'}\n\nBefore we meet — bring one thing:\nWrite down the 3 tasks that eat most of your week.\nWe'll work on your actual business, not hypotheticals.\n\nQuestions? Reply to this email.\n\n— Sangeet`;

            await transporter.sendMail({
                from: `"Sangeet — AI" <${process.env.SANGEET_EMAIL || 'hi@sangeet.ai'}>`,
                to: email,
                subject: `Your Automation Audit is Confirmed — ${dtStr}`,
                text: emailBody
            });
        }

        return res.status(200).json({
            success: true,
            eventId: createdEvent.data.id,
            meetLink: meetLink || '',
            datetime: new Date(time).toLocaleString(undefined, { timeZoneName: 'short' })
        });

    } catch (err) {
        console.error('Booking Error:', err);
        return res.status(500).json({ error: 'Failed to complete booking' });
    }
};
