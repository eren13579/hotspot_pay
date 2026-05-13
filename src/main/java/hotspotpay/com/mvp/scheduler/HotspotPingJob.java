package hotspotpay.com.mvp.scheduler;

import hotspotpay.com.mvp.hotspot.mikrotik.MikroTikClient;
import hotspotpay.com.mvp.hotspot.mikrotik.Utils.MikroTikCredentialUtil;
import hotspotpay.com.mvp.hotspot.model.Hotspot;
import hotspotpay.com.mvp.hotspot.repository.HotspotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class HotspotPingJob {

    private final HotspotRepository hotspotRepository;
    private final MikroTikClient mikrotikClient;
    private final MikroTikCredentialUtil credentialUtil;

    // Ping tous les hotspots toutes les 2 minutes
    @Scheduled(fixedDelay = 120_000)
    @Transactional
    public void pingAllHotspots() {
        List<Hotspot> hotspots = hotspotRepository.findAll();
        if (hotspots.isEmpty()) return;

        log.debug("Pinging {} hotspots...", hotspots.size());
        int online = 0, offline = 0;

        for (Hotspot hotspot : hotspots) {
            try {
                String plainPassword = credentialUtil.decrypt(hotspot.getMikrotikPasswordEnc());
                boolean isOnline = mikrotikClient.ping(hotspot, plainPassword);

                hotspotRepository.updateOnlineStatus(
                        hotspot.getHotspotId(),
                        isOnline,
                        LocalDateTime.now()
                );

                if (isOnline) online++; else offline++;

            } catch (Exception e) {
                log.warn("Ping error for hotspot {}: {}", hotspot.getHotspotId(), e.getMessage());
                hotspotRepository.updateOnlineStatus(
                        hotspot.getHotspotId(), false, LocalDateTime.now()
                );
                offline++;
            }
        }
        log.info("Hotspot ping done — online: {}, offline: {}", online, offline);
    }
}