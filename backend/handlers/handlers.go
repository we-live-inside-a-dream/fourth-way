package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"fourth-way-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Handler struct {
	Client *mongo.Client
}

// GetBooks fetches all books from the database
func (h *Handler) GetBooks(w http.ResponseWriter, r *http.Request) {
	collection := h.Client.Database("fourthway").Collection("books")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var books []models.Book
	if err := cursor.All(ctx, &books); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

// GetBook fetches a single book by ID
func (h *Handler) GetBook(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Path[len("/api/books/"):]
    collection := h.Client.Database("fourthway").Collection("books")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var book models.Book
    err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&book)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            http.Error(w, "Book not found", http.StatusNotFound)
            return
        }
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(book)
}

// GetHero fetches the hero section content
func (h *Handler) GetHero(w http.ResponseWriter, r *http.Request) {
	collection := h.Client.Database("fourthway").Collection("hero")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var hero models.Hero
	// Assuming only one hero document exists
	err := collection.FindOne(ctx, bson.M{}).Decode(&hero)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return empty object if not found
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{})
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hero)
}

// UpdateBook updates a specific book
func (h *Handler) UpdateBook(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL path (e.g., /api/books/callOfSilence)
	id := r.URL.Path[len("/api/books/"):]
    if id == "" {
         http.Error(w, "Missing book ID", http.StatusBadRequest)
         return
    }

	var book models.Book
	if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	collection := h.Client.Database("fourthway").Collection("books")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

    // Ensure ID matches
    book.ID = id

	// Upsert: true (create if not exists, though usually update implies existence)
    // We'll use $set to accept partial updates if needed, but for now replace is easier or specific fields.
    // Let's replace the document for simplicity with ReplaceOne, or just map fields.
    // Since we are sending the full object from the form, ReplaceOne is fine.
    
    // However, to keep it safe, let's use UpdateOne with $set
    update := bson.M{"$set": book}

	_, err := collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Book updated successfully"})
}

// CreateBook adds a new book
func (h *Handler) CreateBook(w http.ResponseWriter, r *http.Request) {
    var book models.Book
    if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Generate ID if not provided (though usually not provided for create)
    if book.ID == "" {
        book.ID = primitive.NewObjectID().Hex()
    }

    collection := h.Client.Database("fourthway").Collection("books")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := collection.InsertOne(ctx, book)
    if err != nil {
        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(book)
}

// UpdateHero updates the hero section
func (h *Handler) UpdateHero(w http.ResponseWriter, r *http.Request) {
    var hero models.Hero
    if err := json.NewDecoder(r.Body).Decode(&hero); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    collection := h.Client.Database("fourthway").Collection("hero")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // We assume single document for hero, so just update the first one found or upsert
    // In seed we didn't set an ID, so we might update all or find one.
    // Let's simpler: Delete all and insert new, OR UpdateOne with empty filter and Upsert.
    
    opts := options.Update().SetUpsert(true)
    update := bson.M{"$set": hero}
    
    // FindOneAndUpdate is also good, but UpdateOne is fine.
    // We'll filter by {} (empty) to match any, but risky if multiple. 
    // Ideally we should have a constant ID for hero.
    // For now, let's assume we want to update the *single* hero document.
    
    // Better strategy: Use the ID from the payload if it exists, or just update the first one.
    // Let's use DeleteMany then InsertOne to ensure clean state, mirroring seed? No, that clears ID.
    // Let's use UpdateOne with Upsert.
    
    _, err := collection.UpdateOne(ctx, bson.M{}, update, opts)
    if err != nil {
        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Hero updated successfully"})
}
