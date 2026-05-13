package hotspotpay.com.mvp.hotspot.mikrotik;

import hotspotpay.com.mvp.common.exception.AppException;
import hotspotpay.com.mvp.hotspot.model.Hotspot;
import lombok.extern.slf4j.Slf4j;
import me.legrange.mikrotik.ApiConnection;
import me.legrange.mikrotik.MikrotikApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.net.SocketFactory;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class MikroTikClient {

    @Value("${mikrotik.connection-timeout-ms:5000}")
    private int connectionTimeoutMs;

    /**
     * Ouvre une connexion RouterOS.
     * Utilise le port configuré sur le hotspot + timeout depuis application.properties.
     */
    public ApiConnection connect(Hotspot hotspot, String plainPassword) {
        try {
            ApiConnection conn = ApiConnection.connect(
                    SocketFactory.getDefault(),
                    hotspot.getMikrotikIp(),
                    hotspot.getMikrotikPort(),
                    connectionTimeoutMs
            );
            conn.login(hotspot.getMikrotikUser(), plainPassword);
            log.debug("Connected to MikroTik: ip={}, port={}",
                    hotspot.getMikrotikIp(), hotspot.getMikrotikPort());
            return conn;
        } catch (MikrotikApiException e) {
            log.error("MikroTik connection failed: ip={}, port={}, error={}",
                    hotspot.getMikrotikIp(), hotspot.getMikrotikPort(), e.getMessage());
            throw AppException.badRequest(
                    "Impossible de se connecter au routeur MikroTik : " + e.getMessage()
            );
        }
    }

    /**
     * Teste la connexion — retourne true/false sans lever d'exception.
     */
    public boolean ping(Hotspot hotspot, String plainPassword) {
        try {
            ApiConnection conn = connect(hotspot, plainPassword);
            conn.close();
            return true;
        } catch (Exception e) {
            log.warn("MikroTik ping failed: ip={}, port={}",
                    hotspot.getMikrotikIp(), hotspot.getMikrotikPort());
            return false;
        }
    }

    /**
     * Crée un compte HotSpot User après validation du paiement.
     * limitUptime en minutes (ex: 60 pour 1h).
     */
    public void createHotspotUser(Hotspot hotspot, String plainPassword,
                                  String username, String userPassword,
                                  String macAddress, int limitUptime) {
        ApiConnection conn = connect(hotspot, plainPassword);
        try {
            conn.execute(String.format(
                    "/ip/hotspot/user/add =name=%s =password=%s =mac-address=%s =limit-uptime=%dm =profile=%s",
                    username, userPassword, macAddress, limitUptime, hotspot.getHotspotProfile()
            ));
            log.info("HotSpot user created: username={}, mac={}, uptime={}m, hotspot={}",
                    username, macAddress, limitUptime, hotspot.getHotspotId());
        } catch (MikrotikApiException e) {
            log.error("Failed to create HotSpot user {}: {}", username, e.getMessage());
            throw AppException.badRequest("Erreur activation MikroTik : " + e.getMessage());
        } finally {
            closeQuietly(conn);
        }
    }

    /**
     * Supprime un compte HotSpot User (expiration ou révocation).
     * Ne lève pas d'exception si le user n'existe plus (déjà expiré sur MikroTik).
     */
    public void removeHotspotUser(Hotspot hotspot, String plainPassword, String username) {
        ApiConnection conn = null;
        try {
            conn = connect(hotspot, plainPassword);
            List<Map<String, String>> users = conn.execute(
                    "/ip/hotspot/user/print ?name=" + username
            );
            if (!users.isEmpty()) {
                String internalId = users.getFirst().get(".id");
                conn.execute("/ip/hotspot/user/remove =.id=" + internalId);
                log.info("HotSpot user removed: username={}, hotspot={}",
                        username, hotspot.getHotspotId());
            } else {
                log.debug("HotSpot user not found (already removed?): username={}", username);
            }
        } catch (MikrotikApiException e) {
            log.warn("Failed to remove HotSpot user {}: {}", username, e.getMessage());
        } finally {
            closeQuietly(conn);
        }
    }

    /**
     * Déconnecte les sessions actives d'un utilisateur (kick immédiat).
     */
    public void kickActiveSession(Hotspot hotspot, String plainPassword, String username) {
        ApiConnection conn = null;
        try {
            conn = connect(hotspot, plainPassword);
            List<Map<String, String>> sessions = conn.execute(
                    "/ip/hotspot/active/print ?user=" + username
            );
            for (Map<String, String> session : sessions) {
                conn.execute("/ip/hotspot/active/remove =.id=" + session.get(".id"));
            }
            log.info("Kicked {} active session(s) for username={}",
                    sessions.size(), username);
        } catch (MikrotikApiException e) {
            log.warn("Failed to kick session for {}: {}", username, e.getMessage());
        } finally {
            closeQuietly(conn);
        }
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private void closeQuietly(ApiConnection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (Exception e) {
                log.warn("Error closing MikroTik connection: {}", e.getMessage());
            }
        }
    }
}