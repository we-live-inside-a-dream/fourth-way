package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// UploadFile handles image uploads to Cloudinary
func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// 1. Parse Multipart Form (10 MB max)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// 2. Validate File Extension
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
		http.Error(w, "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.", http.StatusBadRequest)
		return
	}

	// 3. Initialize Cloudinary
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	log.Printf("Cloudinary config - Cloud: %s, Key: %s..., Secret: %s...",
		cloudName,
		apiKey[:min(4, len(apiKey))],
		apiSecret[:min(4, len(apiSecret))])

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		log.Println("ERROR: Cloudinary credentials are missing!")
		http.Error(w, "Server error: Cloudinary not configured", http.StatusInternalServerError)
		return
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		log.Printf("ERROR initializing Cloudinary: %v", err)
		http.Error(w, "Server error: could not initialize Cloudinary", http.StatusInternalServerError)
		return
	}

	// 4. Upload to Cloudinary
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	log.Printf("Uploading file: %s", handler.Filename)
	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: "fourth-way",
	})
	if err != nil {
		log.Printf("ERROR uploading to Cloudinary: %v", err)
		http.Error(w, fmt.Sprintf("Upload failed: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Upload successful! URL: %s", uploadResult.SecureURL)

	// 5. Return the Cloudinary URL
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": uploadResult.SecureURL,
	})
}
