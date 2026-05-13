package hotspotpay.com.mvp.plan.service;

import hotspotpay.com.mvp.plan.dto.CreatePlanRequest;
import hotspotpay.com.mvp.plan.dto.PlanResponse;
import hotspotpay.com.mvp.plan.dto.UpdatePlanRequest;

import java.util.List;

public interface PlanService {
    PlanResponse create(String userId, String hotspotId, CreatePlanRequest request);
    List<PlanResponse> findAll(String userId, String hotspotId);
    List<PlanResponse> findActive(String hotspotId);  // pour le portail captif
    PlanResponse findById(String userId, String hotspotId, String planId);
    PlanResponse update(String userId, String hotspotId, String planId, UpdatePlanRequest request);
    void toggleActive(String userId, String hotspotId, String planId);
    void delete(String userId, String hotspotId, String planId);
}