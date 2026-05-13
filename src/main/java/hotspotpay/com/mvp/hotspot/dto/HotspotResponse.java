package hotspotpay.com.mvp.hotspot.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HotspotResponse {
    private String hotspotId;
    private String name;
    private String location;
    private String mikrotikIp;
    private Integer mikrotikPort;
    private String mikrotikUser;
    private String hotspotProfile;
    private Boolean isOnline;
    private LocalDateTime lastPingAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}