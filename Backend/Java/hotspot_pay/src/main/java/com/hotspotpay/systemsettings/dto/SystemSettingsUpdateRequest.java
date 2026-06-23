package com.hotspotpay.systemsettings.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SystemSettingsUpdateRequest {

    @NotEmpty(message = "Aucun paramètre à enregistrer")
    @Valid
    private List<SettingItemUpdateRequest> settings;
}
