package com.hotspotpay.portal.service;

import com.hotspotpay.portal.dto.PortalPageDto;
import com.hotspotpay.portal.dto.PortalPaymentRequest;
import com.hotspotpay.portal.dto.PortalPaymentResponse;
import com.hotspotpay.portal.dto.PortalStatusResponse;

public interface PortalService {

    /**
     * Charge les infos du hotspot + forfaits actifs.
     * Appelé par MikroTik redirect : /portal/{hotspotId}?mac=XX:XX:XX:XX:XX:XX
     */
    PortalPageDto loadPage(String hotspotId, String mac);

    /**
     * Initie un paiement MoMo depuis le portail captif.
     */
    PortalPaymentResponse pay(PortalPaymentRequest request);

    /**
     * Vérifie le statut du paiement — appelé en polling par le frontend.
     */
    PortalStatusResponse checkStatus(String reference);
}