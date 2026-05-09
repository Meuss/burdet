import type { Config, Context } from '@netlify/functions';
import { google } from 'googleapis';
import { Resend } from 'resend';

const NOTIFICATION_FROM = 'no-reply@stephanie-jeremy.ch';
const NOTIFICATION_TO = 'thomas.miller147@gmail.com';
const OPS_ALERT_TO = 'thomas.miller147@gmail.com';

interface DeclinePayload {
    fullName: string;
    message: string;
    website: string;
}

interface ParsedPayload extends DeclinePayload {
    submissionId: string;
    submittedAt: string;
}

const SHEET_COLUMNS: Array<keyof ParsedPayload> = ['submittedAt', 'submissionId', 'fullName', 'message'];

function jsonResponse(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parsePayload(raw: unknown): DeclinePayload | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
    return {
        fullName: str(r.fullName),
        message: str(r.message),
        website: str(r.website),
    };
}

async function appendToSheet(p: ParsedPayload): Promise<void> {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!email || !rawKey || !sheetId) {
        throw new Error('Google Sheets credentials not configured (decline)');
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const row = SHEET_COLUMNS.map((key) => (p as unknown as Record<string, unknown>)[key] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Déclinés!A1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
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
    const subject = `RSVP décliné — ${p.fullName}`;

    const rows: Array<[string, string]> = [
        ['Nom et prénom', p.fullName],
        ['Message', p.message || '—'],
        ['Submission ID', p.submissionId],
        ['Reçu le', p.submittedAt],
    ];

    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    const html = `<!doctype html><html><body style="font-family:Georgia,serif;color:#111;line-height:1.5">
<h2 style="color:#c49b3d;font-family:Georgia,serif">RSVP décliné</h2>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows
    .map(
        ([k, v]) =>
            `<tr><td style="border-bottom:1px solid #eee;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}
</table></body></html>`;

    const result = await resend.emails.send({ from: NOTIFICATION_FROM, to, subject, text, html });
    if (result.error) {
        throw new Error(`Resend: ${result.error.message}`);
    }
}

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

const SINK_NAMES = ['Google Sheet (decline)', 'Notification email'] as const;

async function sendOpsAlert(p: ParsedPayload, results: PromiseSettledResult<void>[]): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;

    const failures: Array<{ sink: string; result: PromiseRejectedResult }> = [];
    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            failures.push({ sink: SINK_NAMES[i] ?? `Sink #${i}`, result });
        }
    });
    if (failures.length === 0) return;

    const allFailed = failures.length === results.length;
    const title = allFailed ? '🚨 Decline COMPLETELY LOST' : '⚠️ Decline partial failure';
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

    const resend = new Resend(apiKey);
    await resend.emails
        .send({
            from: NOTIFICATION_FROM,
            to: OPS_ALERT_TO.split(',')
                .map((r) => r.trim())
                .filter(Boolean),
            subject: `${title} — ${p.fullName || '(sans nom)'}`,
            text: body,
            html: alertHtml(title, allFailed ? '#b00020' : '#c49b3d', body),
        })
        .catch((e) => console.error('ops alert send failed', e));
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

        if (parsed.website) {
            return jsonResponse(200, { ok: true });
        }

        if (!parsed.fullName) {
            return jsonResponse(400, { message: 'Nom et prénom manquants.' });
        }

        const enriched: ParsedPayload = {
            ...parsed,
            submissionId: crypto.randomUUID(),
            submittedAt: new Date().toISOString(),
        };

        const results = await Promise.allSettled([appendToSheet(enriched), sendEmail(enriched)]);

        const [sheetResult, emailResult] = results;

        console.log('decline submission', {
            submissionId: enriched.submissionId,
            sheet: sheetResult.status,
            email: emailResult.status,
        });
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`decline sink ${SINK_NAMES[i]} failed`, r.reason);
            }
        });

        if (results.some((r) => r.status === 'rejected')) {
            await sendOpsAlert(enriched, results);
        }

        if (sheetResult.status === 'fulfilled' || emailResult.status === 'fulfilled') {
            return jsonResponse(200, { ok: true, submissionId: enriched.submissionId });
        }

        return jsonResponse(502, {
            message:
                "Votre réponse n'a pas pu être enregistrée. Merci de réessayer ou de contacter les mariés directement.",
        });
    } catch (err) {
        console.error('decline handler crashed', err);
        return jsonResponse(500, {
            message:
                "Votre réponse n'a pas pu être enregistrée. Merci de réessayer ou de contacter les mariés directement.",
        });
    }
};

export const config: Config = {
    path: '/.netlify/functions/submit-decline',
};
