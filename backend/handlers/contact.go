package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
)

type ContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

// SendContactEmail handles the contact form submission
func (h *Handler) SendContactEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Name == "" || req.Email == "" || req.Message == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	// Get SMTP configuration from environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	contactEmail := os.Getenv("CONTACT_EMAIL")

	if smtpHost == "" {
		fmt.Println("Error: SMTP_HOST is missing")
	}
	if smtpPort == "" {
		fmt.Println("Error: SMTP_PORT is missing")
	}
	if smtpEmail == "" {
		fmt.Println("Error: SMTP_EMAIL is missing")
	}
	if smtpPassword == "" {
		fmt.Println("Error: SMTP_PASSWORD is missing")
	}
	if contactEmail == "" {
		fmt.Println("Error: CONTACT_EMAIL is missing")
	}

	if smtpHost == "" || smtpPort == "" || smtpEmail == "" || smtpPassword == "" || contactEmail == "" {
		http.Error(w, "Email configuration error - check server logs", http.StatusInternalServerError)
		return
	}

	// Set up authentication
	auth := smtp.PlainAuth("", smtpEmail, smtpPassword, smtpHost)

	// Compose the email
	to := []string{contactEmail}
	subject := "New Contact Form Submission: " + req.Name

	// Create the email message
	// MIME headers are important for proper formatting
	msg := []byte("To: " + contactEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		"Name: " + req.Name + "\r\n" +
		"Email: " + req.Email + "\r\n\r\n" +
		"Message:\r\n" + req.Message + "\r\n")

	// Send the email
	addr := smtpHost + ":" + smtpPort
	err := smtp.SendMail(addr, auth, smtpEmail, to, msg)
	if err != nil {
		fmt.Printf("Error sending email: %v\n", err)
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Message sent successfully"})
}
