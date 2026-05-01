package kz.pmproject.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {
    private String frontendBaseUrl = "http://localhost:5173";
    private boolean emailEnabled = true;
    private String mailMode = "log";
    private String mailFrom = "no-reply@unishare.local";
    private long verificationTtlHours = 24;
    private long passwordResetTtlMinutes = 30;
}
