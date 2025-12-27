package handlers

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"
)

// UploadFile handles image uploads
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

    // 3. Create Uploads Directory if it doesn't exist
    // We assume backend runs in /backend, so public is ../public
    uploadDir := "../public/uploads"
    if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
        http.Error(w, "Server error: could not create upload directory", http.StatusInternalServerError)
        return
    }

    // 4. Generate Unique Filename
    filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
    filePath := filepath.Join(uploadDir, filename)

    // 5. Save File
    dst, err := os.Create(filePath)
    if err != nil {
        http.Error(w, "Server error: could not save file", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    if _, err := io.Copy(dst, file); err != nil {
        http.Error(w, "Server error: could not write file", http.StatusInternalServerError)
        return
    }

    // 6. Return URL
    // Use absolute URL so images are served from the backend
    baseURL := os.Getenv("BASE_URL")
    if baseURL == "" {
        baseURL = "http://localhost:8080"
    }
    fileURL := fmt.Sprintf("%s/uploads/%s", baseURL, filename)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "url": fileURL,
    })
}
