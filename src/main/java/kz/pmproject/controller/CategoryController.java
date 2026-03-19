package kz.pmproject.controller;

import jakarta.validation.Valid;
import kz.pmproject.model.market.dto.CategoryRequest;
import kz.pmproject.model.market.entity.Category;
import kz.pmproject.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("@authorization.canManageCategories()")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new ResponseStatusException(CONFLICT, "Category already exists");
        }
        Category saved = categoryRepository.save(Category.builder().name(request.getName().trim()).build());
        return ResponseEntity.status(CREATED).body(saved);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("@authorization.canManageCategories()")
    @Transactional
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Category not found"));

        String newName = request.getName().trim();
        categoryRepository.findByNameIgnoreCase(newName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(CONFLICT, "Category already exists");
                });

        category.setName(newName);
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorization.canManageCategories()")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Category not found");
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

