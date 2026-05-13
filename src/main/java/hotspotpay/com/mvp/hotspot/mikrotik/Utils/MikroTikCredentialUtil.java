package hotspotpay.com.mvp.hotspot.mikrotik.Utils;

import lombok.RequiredArgsConstructor;
import org.jasypt.encryption.StringEncryptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MikroTikCredentialUtil {

    private final StringEncryptor stringEncryptor;

    public String encrypt(String plainPassword) {
        return stringEncryptor.encrypt(plainPassword);
    }

    public String decrypt(String encryptedPassword) {
        return stringEncryptor.decrypt(encryptedPassword);
    }
}
