package com.hotspotpay.common.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private boolean       success;
    private String        message;
    private String        errorCode;
    private T             data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> ok(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse<JsonNode> okFromFastApi(JsonNode fastApiResponse) {
        if (fastApiResponse == null) {
            return ApiResponse.<JsonNode>builder()
                    .success(false)
                    .errorCode("PROXY_ERROR")
                    .message("FastAPI returned null")
                    .timestamp(LocalDateTime.now())
                    .build();
        }
        // Certains endpoints FastAPI renvoient {"success":true,"data":...},
        // d'autres renvoient un objet plat (ex: hotspot). On gère les deux.
        boolean hasDataField = fastApiResponse.has("data");
        JsonNode innerData = hasDataField ? fastApiResponse.get("data") : null;
        boolean success = fastApiResponse.has("success") ? fastApiResponse.get("success").asBoolean() : true;
        String message = fastApiResponse.has("message") ? fastApiResponse.get("message").asText() : null;
        // If FastAPI returned an error, map it
        if (!success) {
            String errorCode = fastApiResponse.has("errorCode") ? fastApiResponse.get("errorCode").asText() : "FASTAPI_ERROR";
            return ApiResponse.<JsonNode>builder()
                    .success(false)
                    .errorCode(errorCode)
                    .message(message != null ? message : "FastAPI request failed")
                    .data(innerData)
                    .timestamp(LocalDateTime.now())
                    .build();
        }
        // Si FastAPI n'a pas wrappé la réponse, on utilise toute la réponse comme data
        if (!hasDataField) {
            innerData = fastApiResponse;
        }
        return ApiResponse.<JsonNode>builder()
                .success(true)
                .message(message)
                .data(innerData)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .errorCode(code)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .errorCode(code)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
