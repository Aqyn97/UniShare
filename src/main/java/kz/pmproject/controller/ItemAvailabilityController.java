package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.AvailabilityBlockDto;
import kz.pmproject.model.market.dto.AvailabilityPatchRequest;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.market.entity.ItemAvailabilityBlock;
import kz.pmproject.repository.ItemAvailabilityBlockRepository;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.service.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/items/{id}/availability")
@RequiredArgsConstructor
public class ItemAvailabilityController {
    private final ItemRepository itemRepository;
    private final ItemAvailabilityBlockRepository blockRepository;
    private final AuthorizationService authorizationService;

    @GetMapping
    public ResponseEntity<List<ItemAvailabilityBlock>> getAvailability(@PathVariable Long id) {
        if (!itemRepository.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "Item not found");
        return ResponseEntity.ok(blockRepository.findByItemIdOrderByStartDateAsc(id));
    }

    @PatchMapping
    @Transactional
    public ResponseEntity<List<ItemAvailabilityBlock>> patchAvailability(@PathVariable Long id, @Valid @RequestBody AvailabilityPatchRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));

        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }

        for (AvailabilityBlockDto b : request.getBlocks()) {
            if (b.getStartDate().isAfter(b.getEndDate())) {
                throw new ResponseStatusException(BAD_REQUEST, "startDate must be <= endDate");
            }
        }

        blockRepository.deleteByItemId(id);
        List<ItemAvailabilityBlock> saved = blockRepository.saveAll(
                request.getBlocks().stream()
                        .map(b -> ItemAvailabilityBlock.builder()
                                .item(item)
                                .startDate(b.getStartDate())
                                .endDate(b.getEndDate())
                                .build())
                        .toList()
        );
        return ResponseEntity.ok(saved);
    }
}

