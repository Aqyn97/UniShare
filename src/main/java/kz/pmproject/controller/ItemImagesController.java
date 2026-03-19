package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.ItemImageAttachRequest;
import kz.pmproject.model.market.dto.ItemImageResponse;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.ItemImage;
import kz.pmproject.repository.ItemImageRepository;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.service.AuthorizationService;
import kz.pmproject.service.ItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/items/{id}/images")
@RequiredArgsConstructor
public class ItemImagesController {
    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final AuthorizationService authorizationService;
    private final ItemMapper itemMapper;

    @PostMapping
    @Transactional
    public ResponseEntity<List<ItemImageResponse>> attach(@PathVariable Long id, @Valid @RequestBody ItemImageAttachRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }

        ItemImage saved = itemImageRepository.save(ItemImage.builder()
                .item(item)
                .cloudinaryPublicId(request.getPublicId().trim())
                .url(request.getUrl().trim())
                .build());

        List<ItemImageResponse> images = itemImageRepository.findByItemIdOrderByIdAsc(id).stream()
                .map(itemMapper::toImageResponse)
                .toList();
        return ResponseEntity.status(CREATED).body(images);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @PathVariable Long imageId) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }

        if (!itemImageRepository.existsById(imageId)) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }
        itemImageRepository.deleteByIdAndItemId(imageId, id);
        return ResponseEntity.noContent().build();
    }
}

