package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"fourth-way-backend/models"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load .env
	if err := godotenv.Load("../.env"); err != nil {
		// Try loading from current dir if running from root or backend
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found")
		}
	}
    
    mongoURI := os.Getenv("MONGO_URI")
    if mongoURI == "" {
        mongoURI = "mongodb://localhost:27017"
    }

	// Connect to DB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database("fourthway")

	// Seed Books
	booksColl := db.Collection("books")
	books := []interface{}{
		models.Book{
			ID: "callOfSilence",
			Title: models.LocalizedString{
				En: "The Call of Silence",
				Fa: "ندای سکوت",
			},
			Author: models.LocalizedString{
				En: "By The Author",
				Fa: "نوشته نویسنده",
			},
			Description: models.LocalizedString{
				En: "The Call of Silence is a work centered on consciousness and self-discovery...",
				Fa: "«.ندای سکوت» کتابی در حوزهٔ آگاهی و خودشناسی است...",
			},
			Image: "/assets/images/call-of-silence-cover.jpeg",
			Link: "https://payhip.com/b/FY1c4",
			BtnText: models.LocalizedString{
				En: "Buy on Payhip",
				Fa: "خرید در Payhip",
			},
			Category: "written",
            Featured: true,
		},
		models.Book{
			ID: "inRealityOfBeing",
			Title: models.LocalizedString{
				En: "In Search of Being",
				Fa: "واقعیت بودن",
			},
			Author: models.LocalizedString{
				En: "Jeanne De Salzmann",
				Fa: "اثر جین دی سالزمن",
			},
			Translator: models.LocalizedString{
				En: "Babak Lotfikish",
				Fa: "بابک لطفیکیش",
			},
			Description: models.LocalizedString{
				En: "A definitive translation of Jeanne de Salzmann’s record...",
				Fa: "ترجمه‌ای نهایی از مکتوبات ژان دو سالزمن...",
			},
			Image: "/assets/images/in-search-of-being-cover.png",
			Link: "#",
			BtnText: models.LocalizedString{
				En: "Coming Soon...",
				Fa: "...به زودی",
			},
			Category: "translated",
            Featured: true,
		},
	}

	_, err = booksColl.InsertMany(ctx, books)
	if err != nil {
		log.Printf("Error inserting books (might already exist): %v", err)
	} else {
		fmt.Println("Books seeded successfully")
	}

    // Seed Hero
    heroColl := db.Collection("hero")
    hero := models.Hero{
        Title: models.LocalizedString{
            En: "Exploring the Fourth Way",
            Fa: "کاوش در راه چهارم",
        },
        Subtitle: models.LocalizedString{
            En: "A collection of written and translated works dedicated to spiritual development...",
            Fa: "مجموعه‌ای از آثار تالیفی و ترجمه شده...",
        },
        WrittenBtn: models.LocalizedString{
            En: "Browse Written Works",
            Fa: "مشاهده آثار تالیفی",
        },
        TranslatedBtn: models.LocalizedString{
            En: "Explore Translations",
            Fa: "کاوش در ترجمه‌ها",
        },
        CallCaption: models.LocalizedString{
            En: "The Call of Silence: Reflections on Awareness...",
            Fa: "ندای سکوت: تاملاتی درباره آگاهی...",
        },
    }
    
    // Upsert Hero (replace if exists)
    _, err = heroColl.DeleteMany(ctx, map[string]interface{}{}) // Clear old
    if err != nil {
         log.Fatal(err)
    }
    _, err = heroColl.InsertOne(ctx, hero)
    if err != nil {
        log.Fatal(err)
    }
	fmt.Println("Hero seeded successfully")

	// Seed Admin User
	usersColl := db.Collection("users")
	admin := models.User{
		Username: "admin",
		Password: "password123", // Default password, change in production
	}

	// Check if admin exists
	var existingAdmin models.User
	err = usersColl.FindOne(ctx, map[string]interface{}{"username": "admin"}).Decode(&existingAdmin)
	if err == mongo.ErrNoDocuments {
		_, err = usersColl.InsertOne(ctx, admin)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println("Admin user seeded successfully")
	} else {
		fmt.Println("Admin user already exists")
	}
}
