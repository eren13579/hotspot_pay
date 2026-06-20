package com.hotspotpay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final Path uploadDir;

    public WebMvcConfig(
            @Value("${app.upload.dir:${user.home}/hotspotpay-uploads}") String uploadDirPath
    ) {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir.toAbsolutePath() + "/");
    }
}
