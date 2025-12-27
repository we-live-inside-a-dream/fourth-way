package handlers

import (
	"context"
	"encoding/json"
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
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		http.Error(w, "Server error: could not initialize Cloudinary", http.StatusInternalServerError)
		return
	}

	// 4. Upload to Cloudinary
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: "fourth-way", // Organize uploads in a folder
	})
	if err != nil {
		http.Error(w, "Server error: could not upload to Cloudinary", http.StatusInternalServerError)
		return
	}

	// 5. Return the Cloudinary URL
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": uploadResult.SecureURL,
	})
}
