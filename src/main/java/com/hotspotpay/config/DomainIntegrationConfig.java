package com.hotspotpay.config;

import com.hotspotpay.common.orchestration.PaymentOrchestrationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Configuration centrale pour intégrer tous les domaines
 * Importe tous les composants nécessaires
 */
@Configuration
@Import({
        // Orchestration
        com.hotspotpay.common.orchestration.BusinessFlowCoordinator.class,
        // Events
        PaymentOrchestrationListener.class,
        // Services applicatifs
        com.hotspotpay.payment.service.PaymentWorkflowService.class,
        // Controllers
        com.hotspotpay.common.controller.WorkflowController.class
})
public class DomainIntegrationConfig {
}