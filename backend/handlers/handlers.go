package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"fourth-way-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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
