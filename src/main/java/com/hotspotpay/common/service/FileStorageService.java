package com.hotspotpay.common.service;

import com.hotspotpay.common.exception.AppException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "gif", "svg", "webp", "ico"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private final Path uploadDir;

    public FileStorageService(
            @Value("${app.upload.dir:${user.home}/hotspotpay-uploads}") String uploadDirPath
    ) {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("Upload directory created/verified: {}", uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire d'upload: " + uploadDir, e);
        }
    }

    /**
     * Stocke un fichier uploadé et retourne l'URL publique d'accès.
     *
     * @param file     Fichier multipart
     * @param subDir   Sous-répertoire (ex: "logo", "about", "favicon")
     * @return URL publique du fichier (ex: /api/V1/uploads/logo/xxx.png)
     */
    public String store(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("Fichier vide ou inexistant");
        }

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw AppException.badRequest(
                    "Extension non autorisée : " + extension + ". Formats acceptés : " + ALLOWED_EXTENSIONS
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw AppException.badRequest(
                    "Fichier trop volumineux (max 5 Mo). Taille envoyée : " + (file.getSize() / 1024) + " Ko"
            );
        }

        try {
            Path targetDir = uploadDir.resolve(subDir);
            Files.createDirectories(targetDir);

            String storedName = UUID.randomUUID() + "." + extension;
            Path targetPath = targetDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/uploads/" + subDir + "/" + storedName;
            log.info("File stored: {} ({} bytes)", publicUrl, file.getSize());
            return publicUrl;
        } catch (IOException e) {
            log.error("Erreur lors du stockage du fichier", e);
            throw AppException.internalError("Erreur lors de l'enregistrement du fichier");
        }
    }

    /**
     * Supprime un fichier par son URL publique.
     */
    public void delete(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) return;

        String relativePath = publicUrl.startsWith("/uploads/")
                ? publicUrl.substring("/uploads/".length())
                : publicUrl;

        Path filePath = uploadDir.resolve(relativePath).normalize();

        // Sécurité : vérifier que le chemin résolu est bien dans le répertoire d'upload
        if (!filePath.startsWith(uploadDir)) {
            log.warn("Tentative de suppression hors du répertoire d'upload : {}", publicUrl);
            return;
        }

        try {
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", publicUrl);
        } catch (IOException e) {
            log.warn("Impossible de supprimer le fichier : {}", publicUrl, e);
        }
    }
}
