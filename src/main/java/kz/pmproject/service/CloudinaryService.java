package kz.pmproject.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CloudinaryService {

    @Value("${cloudinary.cloudName:}")
    private String cloudName;

    @Value("${cloudinary.apiKey:}")
    private String apiKey;

    @Value("${cloudinary.apiSecret:}")
    private String apiSecret;

    public String getCloudName() {
        return cloudName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public String signParams(Map<String, Object> params) {
        if (apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("Cloudinary apiSecret is not configured");
        }
        String toSign = params.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getValue() != null)
                .filter(e -> !e.getKey().equals("file"))
                .filter(e -> !e.getKey().equals("api_key"))
                .filter(e -> !e.getKey().equals("signature"))
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(e -> e.getKey() + "=" + String.valueOf(e.getValue()))
                .collect(Collectors.joining("&"));

        return sha1Hex(toSign + apiSecret);
    }

    private static String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to compute signature", e);
        }
    }
}

