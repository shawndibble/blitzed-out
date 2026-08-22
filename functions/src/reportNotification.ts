import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';

import { RUNTIME_OPTIONS } from './runtime';

interface ReportDoc {
  packId?: string;
  reporterUid?: string;
  reason?: string;
  createdAt?: number;
}

/**
 * Email a moderator when a content pack is reported.
 *
 * Reports are written client-side to `reports/{reportId}` (see reportPack in
 * src/services/contentPacks.ts). This trigger enriches the report with the
 * pack's denormalized metadata and sends a notification so moderation no longer
 * depends on manually polling the Firestore console.
 *
 * Requires the SENDGRID_API_KEY secret and a SendGrid-verified MODERATION_FROM
 * sender; the destination is MODERATION_TO.
 */
export const onPackReported = onDocumentCreated(
  { document: 'reports/{reportId}', secrets: ['SENDGRID_API_KEY'], ...RUNTIME_OPTIONS },
  async (event) => {
    // v2 hands the snapshot in `event.data`, and types it optional: a retried
    // delivery for an already-deleted document arrives with nothing to read.
    const snap = event.data;
    if (!snap) {
      logger.warn('Report document missing on delivery; nothing to notify', {
        reportId: event.params.reportId,
      });
      return;
    }

    const report = snap.data() as ReportDoc;
    const packId = report.packId ?? '(unknown)';

    const to = process.env.MODERATION_TO || 'shawndibble@gmail.com';
    const from = process.env.MODERATION_FROM || 'reports@blitzedout.com';
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      logger.error('SENDGRID_API_KEY not set; cannot send report email', { packId });
      return;
    }
    sgMail.setApiKey(apiKey);

    let packName = '(unknown)';
    let authorName = '(unknown)';
    let visibility = '(unknown)';
    try {
      const packSnap = await getFirestore().collection('content-packs').doc(packId).get();
      const pack = packSnap.data();
      if (pack) {
        packName = pack.name ?? packName;
        authorName = pack.authorName ?? authorName;
        visibility = pack.visibility ?? visibility;
      }
    } catch (error) {
      logger.warn('Failed to load reported pack metadata', { packId, error });
    }

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'blitzout-49b39';
    const consoleUrl =
      `https://console.firebase.google.com/project/${projectId}/firestore/data/` +
      `~2Fcontent-packs~2F${packId}`;
    const lines = [
      `Pack "${packName}" was reported.`,
      '',
      `Pack name:    ${packName}`,
      `Pack id:      ${packId}`,
      `Author:       ${authorName}`,
      `Visibility:   ${visibility}`,
      `Reporter uid: ${report.reporterUid ?? '(unknown)'}`,
      `Reason:       ${report.reason ?? '(none)'}`,
      '',
      `Review/remove in console: ${consoleUrl}`,
    ];

    try {
      await sgMail.send({
        to,
        from,
        subject: `Pack reported: ${packName}`,
        text: lines.join('\n'),
      });
      logger.info('Sent pack-report notification email', { packId });
    } catch (error) {
      logger.error('Failed to send pack-report email', { packId, error });
    }
  }
);
