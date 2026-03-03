package com.example.demo.controller;

import com.example.demo.model.Item;
import com.example.demo.model.ItemImage;
import com.example.demo.repository.ItemImageRepository;
import com.example.demo.service.CloudinaryService;
import com.example.demo.service.ItemService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;
    private final CloudinaryService cloudinaryService;
    private final ItemImageRepository itemImageRepository;

    public ItemController(ItemService itemService,
                          CloudinaryService cloudinaryService,
                          ItemImageRepository itemImageRepository) {
        this.itemService = itemService;
        this.cloudinaryService = cloudinaryService;
        this.itemImageRepository = itemImageRepository;
    }

    /**
     * Get all items currently in the system.
     */
    @GetMapping
    public List<Item> getAllItems() {
        return itemService.getAllItems();
    }

    /**
     * Create a new item for rent.
     */
    @PostMapping
    public Item createItem(@RequestBody Item item) {
        return itemService.createItem(item);
    }

    /**
     * Search for items by category and/or keyword.
     */
    @GetMapping("/search")
    public List<Item> search(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return itemService.searchItems(categoryId, keyword);
    }

    /**
     * Upload an image for a specific item using Cloudinary.
     */
    @PostMapping("/{id}/images")
    public ItemImage uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        // Find the item first to ensure it exists
        Item item = itemService.getItemById(id);

        // Upload physical file to Cloudinary cloud storage
        Map<?, ?> result = cloudinaryService.upload(file);

        // Save the resulting URL and Public ID to our Neon database
        ItemImage image = new ItemImage();
        image.setItem(item);
        image.setImageUrl(result.get("url").toString());
        image.setCloudinaryPublicId(result.get("public_id").toString());

        return itemImageRepository.save(image);
    }
}