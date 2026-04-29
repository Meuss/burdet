import type { Config, Context } from '@netlify/functions';
import { google } from 'googleapis';
import { Resend } from 'resend';

const NOTIFICATION_FROM = 'no-reply@stephanie-jeremy.ch';
const NOTIFICATION_TO = 'thomas.miller147@gmail.com';
const OPS_ALERT_TO = 'thomas.miller147@gmail.com';

interface RsvpPayload {
    fullName: string;
    plusOne: string;
    address: string;
    npa: string;
    locality: string;
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
    'npa',
    'locality',
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
        npa: str(r.npa),
        locality: str(r.locality),
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
    if (!p.npa) return 'Code postal manquant.';
    if (!p.locality) return 'Ville manquante.';
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
        ['Code postal', p.npa],
        ['Ville', p.locality],
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
    if (!apiKey) {
        throw new Error('Resend credentials not configured');
    }

    const to = NOTIFICATION_TO.split(',')
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

    const result = await resend.emails.send({ from: NOTIFICATION_FROM, to, subject, text, html });
    if (result.error) {
        throw new Error(`Resend: ${result.error.message}`);
    }
}

const SINK_NAMES = ['Google Sheet', 'Notification email'] as const;

function describeReason(reason: unknown): string {
    if (reason instanceof Error) {
        return reason.stack ? `${reason.message}\n${reason.stack}` : reason.message;
    }
    try {
        return JSON.stringify(reason, null, 2);
    } catch {
        return String(reason);
    }
}

function alertHtml(title: string, color: string, body: string): string {
    return `<!doctype html><html><body style="font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;color:#111;line-height:1.5">
<h2 style="font-family:Georgia,serif;color:${color};margin:0 0 12px">${escapeHtml(title)}</h2>
<pre style="white-space:pre-wrap;background:#f6f6f4;padding:12px;border-radius:4px;margin:0">${escapeHtml(body)}</pre>
</body></html>`;
}

async function sendOpsAlert(p: ParsedPayload, results: PromiseSettledResult<void>[]): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('ops alert skipped: no RESEND_API_KEY');
        return;
    }

    const failures: Array<{ sink: string; result: PromiseRejectedResult }> = [];
    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            failures.push({ sink: SINK_NAMES[i] ?? `Sink #${i}`, result });
        }
    });

    if (failures.length === 0) return;

    const allFailed = failures.length === results.length;
    const title = allFailed ? '🚨 RSVP COMPLETELY LOST' : '⚠️ RSVP partial failure';

    const reasonText = failures
        .map(({ sink, result }) => `--- ${sink} ---\n${describeReason(result.reason)}`)
        .join('\n\n');

    let dump: string;
    try {
        dump = JSON.stringify(p, null, 2);
    } catch {
        dump = '(payload could not be serialized)';
    }

    const body = [
        `Severity: ${title}`,
        `Submission ID: ${p.submissionId}`,
        `When: ${p.submittedAt}`,
        '',
        'Failures:',
        reasonText,
        '',
        'Full submission payload:',
        dump,
    ].join('\n');

    const subject = `${title} — ${p.fullName || '(sans nom)'}`;
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
        from: NOTIFICATION_FROM,
        to: OPS_ALERT_TO.split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        subject,
        text: body,
        html: alertHtml(title, allFailed ? '#b00020' : '#c49b3d', body),
    });
    if (result.error) {
        throw new Error(`ops alert send failed: ${result.error.message}`);
    }
}

async function sendCrashAlert(raw: unknown, err: unknown): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('crash alert skipped: no RESEND_API_KEY');
        return;
    }

    let dump: string;
    try {
        dump = JSON.stringify(raw, null, 2);
    } catch {
        dump = String(raw);
    }

    const body = [
        'The RSVP function crashed before completing.',
        `When: ${new Date().toISOString()}`,
        '',
        'Error:',
        describeReason(err),
        '',
        'Raw request body:',
        dump,
    ].join('\n');

    const title = '🚨 RSVP function crash';
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
        from: NOTIFICATION_FROM,
        to: OPS_ALERT_TO.split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        subject: title,
        text: body,
        html: alertHtml(title, '#b00020', body),
    });
    if (result.error) {
        throw new Error(`crash alert send failed: ${result.error.message}`);
    }
}

export default async (req: Request, _context: Context): Promise<Response> => {
    if (req.method !== 'POST') {
        return jsonResponse(405, { message: 'Method not allowed' });
    }

    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return jsonResponse(400, { message: 'Corps de requête invalide.' });
    }

    try {
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

        const results = await Promise.allSettled([appendToSheet(enriched), sendEmail(enriched)]);

        const [sheetResult, emailResult] = results;

        console.log('rsvp submission', {
            submissionId: enriched.submissionId,
            sheet: sheetResult.status,
            email: emailResult.status,
        });
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`rsvp sink ${SINK_NAMES[i]} failed`, r.reason);
            }
        });

        if (results.some((r) => r.status === 'rejected')) {
            await sendOpsAlert(enriched, results).catch((e) => console.error('ops alert send failed', e));
        }

        if (sheetResult.status === 'fulfilled' || emailResult.status === 'fulfilled') {
            return jsonResponse(200, { ok: true, submissionId: enriched.submissionId });
        }

        return jsonResponse(502, {
            message:
                "Votre réponse n'a pas pu être enregistrée. Merci de réessayer ou de contacter les mariés directement.",
        });
    } catch (err) {
        console.error('rsvp handler crashed', err);
        await sendCrashAlert(raw, err).catch((e) => console.error('crash alert send failed', e));
        return jsonResponse(500, {
            message:
                "Votre réponse n'a pas pu être enregistrée. Merci de réessayer ou de contacter les mariés directement.",
        });
    }
};

export const config: Config = {
    path: '/.netlify/functions/submit-rsvp',
};
