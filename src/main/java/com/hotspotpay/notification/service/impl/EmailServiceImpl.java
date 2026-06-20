package com.hotspotpay.notification.service.impl;

import com.hotspotpay.notification.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service email avec templates HTML.
 * Tous les envois sont @Async — ne bloquent jamais le thread principal.
 *
 * En cas d'erreur d'envoi → log warn seulement (non-bloquant pour le flux paiement).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@hotspotpay.cm}")
    private String from;

    @Value("${app.name:HotspotPay}")
    private String appName;

    // ── Bienvenue ─────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendWelcome(String to, String fullName) {
        String name = fullName != null ? fullName : "cher utilisateur";
        send(to, "Bienvenue sur " + appName + " 🎉", html(
                "Bienvenue " + name + " !",
                "Votre compte <strong>" + appName + "</strong> est créé avec succès.",
                "Vous pouvez maintenant configurer vos hotspots et encaisser vos revenus WiFi " +
                "directement sur votre téléphone Mobile Money.",
                null, null
        ));
    }

    // ── Paiement ──────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendPaymentConfirmation(String to, String reference, String amount,
                                         String planName, String hotspotName) {
        send(to, "✅ Paiement confirmé — " + planName, html(
                "Paiement confirmé !",
                "Votre paiement a été traité avec succès.",
                "<table style='width:100%;border-collapse:collapse;'>" +
                "<tr><td style='padding:6px;color:#666'>Référence</td>" +
                "<td style='padding:6px;font-weight:bold'>" + reference + "</td></tr>" +
                "<tr style='background:#f9f9f9'><td style='padding:6px;color:#666'>Forfait</td>" +
                "<td style='padding:6px;font-weight:bold'>" + planName + "</td></tr>" +
                "<tr><td style='padding:6px;color:#666'>Hotspot</td>" +
                "<td style='padding:6px;font-weight:bold'>" + hotspotName + "</td></tr>" +
                "<tr style='background:#f9f9f9'><td style='padding:6px;color:#666'>Montant</td>" +
                "<td style='padding:6px;font-weight:bold'>" + amount + " XAF</td></tr>" +
                "</table>",
                "Votre connexion WiFi s'active dans quelques secondes. Bon surf !",
                null
        ));
    }

    @Async
    @Override
    public void sendPaymentFailed(String to, String reference, String reason) {
        send(to, "❌ Paiement échoué", html(
                "Votre paiement n'a pas abouti",
                "La transaction <strong>" + reference + "</strong> a échoué.",
                reason != null ? "<p style='color:#c0392b'>Raison : " + reason + "</p>" : null,
                "Veuillez réessayer ou choisir un autre opérateur Mobile Money.",
                null
        ));
    }

    // ── Tickets ───────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendTicketActivated(String to, String username,
                                     String hotspotName, String expiresAt) {
        send(to, "🔑 Ticket WiFi activé — " + hotspotName, html(
                "Votre accès WiFi est actif",
                "Votre ticket a été activé sur <strong>" + hotspotName + "</strong>.",
                "<table style='width:100%;border-collapse:collapse;'>" +
                "<tr><td style='padding:6px;color:#666'>Username</td>" +
                "<td style='padding:6px;font-weight:bold;font-family:monospace'>" + username + "</td></tr>" +
                "<tr style='background:#f9f9f9'><td style='padding:6px;color:#666'>Expire</td>" +
                "<td style='padding:6px;font-weight:bold'>" + expiresAt + "</td></tr>" +
                "</table>",
                "Connectez-vous avec ce username/password sur la page WiFi.",
                null
        ));
    }

    // ── Session ───────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendSessionExpiryWarning(String to, String hotspotName, int minutesLeft) {
        send(to, "⏱ Votre session WiFi expire bientôt", html(
                "Expiration dans " + minutesLeft + " minute(s)",
                "Votre session sur <strong>" + hotspotName + "</strong> expire dans " +
                "<strong>" + minutesLeft + " minute(s)</strong>.",
                null,
                "Reconnectez-vous au portail pour renouveler votre accès.",
                null
        ));
    }

    // ── Retrait ───────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendWithdrawalConfirmation(String to, String withdrawalId, String amount) {
        send(to, "💰 Demande de retrait reçue", html(
                "Votre demande de retrait a été enregistrée",
                null,
                "<table style='width:100%;border-collapse:collapse;'>" +
                "<tr><td style='padding:6px;color:#666'>Référence</td>" +
                "<td style='padding:6px;font-weight:bold'>" + withdrawalId + "</td></tr>" +
                "<tr style='background:#f9f9f9'><td style='padding:6px;color:#666'>Montant</td>" +
                "<td style='padding:6px;font-weight:bold'>" + amount + " XAF</td></tr>" +
                "</table>",
                "Traitement sous 24h ouvrables.",
                null
        ));
    }

    // ── Abonnement ────────────────────────────────────────────────────────

    @Async
    @Override
    public void sendSubscriptionActivated(String to, String planName, String expiresAt) {
        send(to, "🚀 Abonnement " + planName + " activé", html(
                "Votre abonnement est actif",
                "Votre plan <strong>" + planName + "</strong> est maintenant actif.",
                "<p style='color:#27ae60'>Expire le : <strong>" + expiresAt + "</strong></p>",
                "Profitez de toutes les fonctionnalités de votre plan.",
                null
        ));
    }

    @Async
    @Override
    public void sendSubscriptionExpired(String to, String planName) {
        send(to, "⚠️ Abonnement " + planName + " expiré", html(
                "Votre abonnement a expiré",
                "Votre plan <strong>" + planName + "</strong> a expiré.",
                "<p style='color:#e74c3c'>Votre compte a été rétrogradé au plan BASIC.</p>",
                "Renouvelez votre abonnement pour retrouver toutes vos fonctionnalités.",
                null
        ));
    }

    // ── Privé — Template HTML ─────────────────────────────────────────────

    private void send(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) {
            log.debug("Email ignoré — destinataire vide (subject={})", subject);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            helper.setFrom(from, appName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
            log.info("Email envoyé à {} : {}", to, subject);
        } catch (Exception e) {
            log.warn("Erreur envoi email à {} ({}): {}", to, subject, e.getMessage());
        }
    }

    /**
     * Template HTML HotspotPay réutilisable.
     * Tous les emails partagent ce layout cohérent.
     */
    private String html(String title, String subtitle, String body,
                         String footer, String ctaLink) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body " +
               "style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4'>" +
               "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4;padding:20px'>" +
               "<tr><td><table width='600' align='center' cellpadding='0' cellspacing='0' " +
               "style='background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)'>" +

               // Header
               "<tr><td style='background:#1A3C5E;padding:24px 32px;text-align:center'>" +
               "<span style='color:#ffffff;font-size:22px;font-weight:bold'>" + appName + "</span>" +
               "</td></tr>" +

               // Title
               "<tr><td style='padding:28px 32px 0'>" +
               "<h2 style='margin:0;color:#1A3C5E;font-size:20px'>" + title + "</h2>" +
               (subtitle != null ? "<p style='color:#555;margin:8px 0 0'>" + subtitle + "</p>" : "") +
               "</td></tr>" +

               // Body
               (body != null ? "<tr><td style='padding:20px 32px'>" + body + "</td></tr>" : "") +

               // Footer text
               (footer != null ? "<tr><td style='padding:0 32px 20px;color:#777;font-size:14px'>" +
               "<p>" + footer + "</p></td></tr>" : "") +

               // CTA button
               (ctaLink != null ? "<tr><td style='padding:0 32px 28px;text-align:center'>" +
               "<a href='" + ctaLink + "' style='display:inline-block;padding:12px 32px;" +
               "background:#2E75B6;color:#fff;border-radius:6px;text-decoration:none;" +
               "font-weight:bold'>Accéder à mon compte</a></td></tr>" : "") +

               // Footer brand
               "<tr><td style='background:#f8f8f8;padding:16px 32px;text-align:center;" +
               "border-top:1px solid #eee'>" +
               "<small style='color:#999'>" + appName + " — Votre portail WiFi intelligent</small>" +
               "</td></tr>" +

               "</table></td></tr></table></body></html>";
    }
}
