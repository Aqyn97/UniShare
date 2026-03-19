package kz.pmproject.model.market.dto;

import lombok.Data;

import java.util.Map;

@Data
public class CloudinarySignatureRequest {
    /**
     * Cloudinary params to sign (e.g. timestamp, folder, public_id, eager, etc.)
     * Do NOT include api_key/signature/file.
     */
    private Map<String, Object> params;
}

