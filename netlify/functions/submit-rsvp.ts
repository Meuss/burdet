import type { Config, Context } from '@netlify/functions';
import { google } from 'googleapis';
import { Resend } from 'resend';

interface RsvpPayload {
    fullName: string;
    plusOne: string;
    address: string;
    locality: string;
    phone: string;
    email: string;
    childrenCount: string;
    dietary: string;
    ownVehicle: string;
    message: string;
    website: string;
}

interface ParsedPayload extends RsvpPayload {
    submissionId: string;
    submittedAt: string;
}

// If you reorder/add columns here, update the sheet header row in the Google Sheet by hand.
const SHEET_COLUMNS: Array<keyof ParsedPayload | 'submittedAt' | 'submissionId'> = [
    'submittedAt',
    'submissionId',
    'fullName',
    'plusOne',
    'address',
    'locality',
    'phone',
    'email',
    'childrenCount',
    'dietary',
    'ownVehicle',
    'message',
];

function jsonResponse(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function parsePayload(raw: unknown): RsvpPayload | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
    return {
        fullName: str(r.fullName),
        plusOne: str(r.plusOne),
        address: str(r.address),
        locality: str(r.locality),
        phone: str(r.phone),
        email: str(r.email),
        childrenCount: str(r.childrenCount),
        dietary: str(r.dietary),
        ownVehicle: str(r.ownVehicle),
        message: str(r.message),
        website: str(r.website),
    };
}

function validate(p: RsvpPayload): string | null {
    if (!p.fullName) return 'Nom et prénom manquants.';
    if (!p.address) return 'Adresse manquante.';
    if (!p.locality) return 'Localité manquante.';
    if (!p.phone) return 'Téléphone manquant.';
    const yn = new Set(['oui', 'non']);
    if (!yn.has(p.ownVehicle)) return 'Réponse propre véhicule manquante.';
    if (p.email && !/^\S+@\S+\.\S+$/.test(p.email)) return 'E-mail invalide.';
    if (p.childrenCount && !/^\d+$/.test(p.childrenCount)) return 'Nombre d’enfants invalide.';
    return null;
}

async function appendToSheet(p: ParsedPayload): Promise<void> {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!email || !rawKey || !sheetId) {
        throw new Error('Google Sheets credentials not configured');
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const row = SHEET_COLUMNS.map((key) => (p as unknown as Record<string, string>)[key] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
}

function formatEmailBody(p: ParsedPayload): { text: string; html: string } {
    const rows: Array<[string, string]> = [
        ['Nom et prénom', p.fullName],
        ['Accompagnant·e', p.plusOne || '—'],
        ['Adresse', p.address],
        ['Localité', p.locality],
        ['Téléphone', p.phone],
        ['E-mail', p.email || '—'],
        ['Enfants (nombre)', p.childrenCount || '—'],
        ['Restrictions alimentaires', p.dietary || '—'],
        ['Propre véhicule', p.ownVehicle],
        ['Message', p.message || '—'],
        ['Submission ID', p.submissionId],
        ['Reçu le', p.submittedAt],
    ];

    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

    const html = `<!doctype html><html><body style="font-family:Georgia,serif;color:#111;line-height:1.5">
<h2 style="color:#c49b3d;font-family:Georgia,serif">Nouvelle réponse RSVP</h2>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows
    .map(
        ([k, v]) =>
            `<tr><td style="border-bottom:1px solid #eee;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}
</table></body></html>`;

    return { text, html };
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function sendEmail(p: ParsedPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_ADDRESS;
    const recipients = process.env.NOTIFICATION_RECIPIENTS;
    if (!apiKey || !from || !recipients) {
        throw new Error('Resend credentials not configured');
    }

    const to = recipients
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

    const resend = new Resend(apiKey);
    const statusBits: string[] = [];
    if (p.ownVehicle === 'oui') statusBits.push('véhicule perso');
    if (p.ownVehicle === 'non') statusBits.push('sans véhicule');
    if (p.childrenCount && Number(p.childrenCount) > 0) statusBits.push(`${p.childrenCount} enfant(s)`);
    const statusTag = statusBits.join(' · ');
    const subject = `RSVP — ${p.fullName}${p.plusOne ? ` (+ ${p.plusOne})` : ''}${statusTag ? ` [${statusTag}]` : ''}`;
    const { text, html } = formatEmailBody(p);

    const result = await resend.emails.send({ from, to, subject, text, html });
    if (result.error) {
        throw new Error(`Resend: ${result.error.message}`);
    }
}

async function captureToNetlifyForms(p: ParsedPayload, siteUrl: string): Promise<void> {
    const body = new URLSearchParams({
        'form-name': 'rsvp',
        fullName: p.fullName,
        plusOne: p.plusOne,
        address: p.address,
        locality: p.locality,
        phone: p.phone,
        email: p.email,
        childrenCount: p.childrenCount,
        dietary: p.dietary,
        ownVehicle: p.ownVehicle,
        message: p.message,
        submissionId: p.submissionId,
        submittedAt: p.submittedAt,
    });

    const res = await fetch(siteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!res.ok) {
        throw new Error(`Netlify Forms capture returned ${res.status}`);
    }
}

export default async (req: Request, context: Context): Promise<Response> => {
    if (req.method !== 'POST') {
        return jsonResponse(405, { message: 'Method not allowed' });
    }

    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return jsonResponse(400, { message: 'Corps de requête invalide.' });
    }

    const parsed = parsePayload(raw);
    if (!parsed) return jsonResponse(400, { message: 'Corps de requête invalide.' });

    // Honeypot: silently succeed to avoid telegraphing the filter.
    if (parsed.website) {
        return jsonResponse(200, { ok: true });
    }

    const validationError = validate(parsed);
    if (validationError) {
        return jsonResponse(400, { message: validationError });
    }

    const enriched: ParsedPayload = {
        ...parsed,
        submissionId: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
    };

    const siteUrl = context.site.url ?? `https://${req.headers.get('host')}`;

    const results = await Promise.allSettled([
        appendToSheet(enriched),
        sendEmail(enriched),
        captureToNetlifyForms(enriched, siteUrl),
    ]);

    const [sheetResult, emailResult, netlifyResult] = results;

    const log = {
        submissionId: enriched.submissionId,
        sheet: sheetResult.status,
        email: emailResult.status,
        netlifyForms: netlifyResult.status,
    };
    console.log('rsvp submission', log);
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`rsvp sink ${['sheet', 'email', 'netlifyForms'][i]} failed`, r.reason);
        }
    });

    if (sheetResult.status === 'fulfilled' || emailResult.status === 'fulfilled') {
        return jsonResponse(200, { ok: true, submissionId: enriched.submissionId });
    }

    return jsonResponse(502, {
        message:
            "Votre réponse n'a pas pu être enregistrée. Merci de réessayer ou de contacter les mariés directement.",
    });
};

export const config: Config = {
    path: '/.netlify/functions/submit-rsvp',
};
