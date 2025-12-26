package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"fourth-way-backend/handlers"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var handler *handlers.Handler

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// 0. Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 1. Connect to MongoDB
	// Use environment variable for URI or default to localhost
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}

	// Ping the database to verify connection
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Could not connect to MongoDB:", err)
	}
	fmt.Println("Connected to MongoDB!")

	// 2. Set up HTTP Server
    handler = &handlers.Handler{Client: client}
    
    // Use a new ServeMux for routing
    mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Welcome to the Fourth Way API!")
	})

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

    mux.HandleFunc("/api/books", func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodPost {
            handler.CreateBook(w, r)
            return
        }
        handler.GetBooks(w, r)
    })
    
    // Handle specific book operations (e.g. PUT /api/books/{id})
    mux.HandleFunc("/api/books/", func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodPut {
            handler.UpdateBook(w, r)
            return
        }
        if r.Method == http.MethodGet {
             handler.GetBook(w, r)
             return
        }
        http.NotFound(w, r)
    })

    mux.HandleFunc("/api/hero", func(w http.ResponseWriter, r *http.Request) {
        if r.Method == http.MethodPut {
            handler.UpdateHero(w, r)
            return
        }
        handler.GetHero(w, r)
    })
    mux.HandleFunc("/api/login", handler.Login)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s...\n", port)
    
    // Wrap the entire mux with CORS
	if err := http.ListenAndServe(":"+port, enableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}
