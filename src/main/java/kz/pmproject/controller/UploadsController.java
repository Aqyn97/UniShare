package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.CloudinarySignatureRequest;
import kz.pmproject.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class UploadsController {
    private final CloudinaryService cloudinaryService;

    @PostMapping("/cloudinary/signature")
    public ResponseEntity<Map<String, Object>> signature(@Valid @RequestBody CloudinarySignatureRequest request) {
        if (request.getParams() == null || request.getParams().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "params is required");
        }
        if (!request.getParams().containsKey("timestamp")) {
            throw new ResponseStatusException(BAD_REQUEST, "timestamp is required");
        }
        String signature = cloudinaryService.signParams(request.getParams());
        return ResponseEntity.ok(Map.of(
                "signature", signature,
                "apiKey", cloudinaryService.getApiKey(),
                "cloudName", cloudinaryService.getCloudName(),
                "params", request.getParams()
        ));
    }
}

