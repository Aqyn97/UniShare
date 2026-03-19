package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.ItemCreateRequest;
import kz.pmproject.model.market.dto.ItemResponse;
import kz.pmproject.model.market.dto.ItemUpdateRequest;
import kz.pmproject.model.market.entity.Category;
import kz.pmproject.model.market.entity.Item;
import kz.pmproject.model.user.entity.User;
import kz.pmproject.repository.CategoryRepository;
import kz.pmproject.repository.ItemImageRepository;
import kz.pmproject.repository.ItemRepository;
import kz.pmproject.repository.UserRepository;
import kz.pmproject.service.AuthorizationService;
import kz.pmproject.service.ItemMapper;
import kz.pmproject.service.ItemSpecs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {
    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ItemImageRepository itemImageRepository;
    private final AuthorizationService authorizationService;
    private final ItemMapper itemMapper;

    @PostMapping
    public ResponseEntity<ItemResponse> create(@Valid @RequestBody ItemCreateRequest request) {
        Long userId = authorizationService.getCurrentUserId();
        if (userId == null) throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Category not found"));
        }

        String currency = request.getCurrency() == null || request.getCurrency().isBlank() ? "KZT" : request.getCurrency().trim();
        Item saved = itemRepository.save(Item.builder()
                .owner(owner)
                .category(category)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .currency(currency)
                .published(false)
                .build());

        return ResponseEntity.status(CREATED).body(itemMapper.toResponse(saved, itemImageRepository.findByItemIdOrderByIdAsc(saved.getId())));
    }

    @GetMapping
    public ResponseEntity<Page<ItemResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size < 1 || size > 100) throw new ResponseStatusException(BAD_REQUEST, "size must be between 1 and 100");
        if (page < 0) throw new ResponseStatusException(BAD_REQUEST, "page must be >= 0");

        Specification<Item> spec = ItemSpecs.search(q);
        spec = andIfNotNull(spec, ItemSpecs.categoryId(categoryId));
        spec = andIfNotNull(spec, ItemSpecs.minPrice(minPrice));
        spec = andIfNotNull(spec, ItemSpecs.maxPrice(maxPrice));
        spec = andIfNotNull(spec, ItemSpecs.published(published));

        Page<Item> items = itemRepository.findAll(spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<ItemResponse> mapped = items.map(i -> itemMapper.toResponse(i, itemImageRepository.findByItemIdOrderByIdAsc(i.getId())));
        return ResponseEntity.ok(mapped);
    }

    private static Specification<Item> andIfNotNull(Specification<Item> base, Specification<Item> next) {
        if (next == null) return base;
        if (base == null) return next;
        return base.and(next);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ItemResponse> get(@PathVariable Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        return ResponseEntity.ok(itemMapper.toResponse(item, itemImageRepository.findByItemIdOrderByIdAsc(id)));
    }

    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<ItemResponse> update(@PathVariable Long id, @Valid @RequestBody ItemUpdateRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));

        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }

        if (request.getTitle() != null) item.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getPrice() != null) item.setPrice(request.getPrice());
        if (request.getCurrency() != null) item.setCurrency(request.getCurrency().trim());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Category not found"));
            item.setCategory(category);
        }

        return ResponseEntity.ok(itemMapper.toResponse(item, itemImageRepository.findByItemIdOrderByIdAsc(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }
        itemRepository.delete(item);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @Transactional
    public ResponseEntity<ItemResponse> publish(@PathVariable Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }
        item.setPublished(true);
        return ResponseEntity.ok(itemMapper.toResponse(item, itemImageRepository.findByItemIdOrderByIdAsc(id)));
    }

    @PostMapping("/{id}/hide")
    @Transactional
    public ResponseEntity<ItemResponse> hide(@PathVariable Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Item not found"));
        if (!authorizationService.canModifyItemOwnerId(item.getOwner().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Forbidden");
        }
        item.setPublished(false);
        return ResponseEntity.ok(itemMapper.toResponse(item, itemImageRepository.findByItemIdOrderByIdAsc(id)));
    }
}

