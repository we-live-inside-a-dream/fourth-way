package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"fourth-way-backend/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Login handles admin authentication
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var creds models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	collection := h.Client.Database("fourthway").Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	// For simplicity in this learning project, we are storing/checking plain text password.
	// In production, ALWAYS use bcrypt to hash passwords.
	err := collection.FindOne(ctx, bson.M{"username": creds.Username, "password": creds.Password}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Generate JWT
    jwtKey := []byte(os.Getenv("JWT_SECRET"))
    if len(jwtKey) == 0 {
        jwtKey = []byte("default_secret_key_change_me")
    }

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &jwt.RegisteredClaims{
		Subject:   user.Username,
		ExpiresAt: jwt.NewNumericDate(expirationTime),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Could not generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.LoginResponse{Token: tokenString})
}
