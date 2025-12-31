package handlers

import (
	"crypto/tls"
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
	// Send the email
	addr := smtpHost + ":" + smtpPort
	var err error

	if smtpPort == "587" {
		// SSL/TLS connection for Port 587 (Render)
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         smtpHost,
		}

		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			fmt.Printf("Error dialing TLS: %v\n", err)
			http.Error(w, "Failed to connect to email server", http.StatusInternalServerError)
			return
		}

		client, err := smtp.NewClient(conn, smtpHost)
		if err != nil {
			fmt.Printf("Error creating SMTP client: %v\n", err)
			http.Error(w, "Failed to create email client", http.StatusInternalServerError)
			return
		}
		defer client.Quit()

		if err = client.Auth(auth); err != nil {
			fmt.Printf("Error authenticating: %v\n", err)
			http.Error(w, "Email authentication failed", http.StatusInternalServerError)
			return
		}

		if err = client.Mail(smtpEmail); err != nil {
			fmt.Printf("Error setting sender: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}
		if err = client.Rcpt(to[0]); err != nil {
			fmt.Printf("Error setting recipient: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}

		wData, err := client.Data()
		if err != nil {
			fmt.Printf("Error getting data writer: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}

		_, err = wData.Write(msg)
		if err != nil {
			fmt.Printf("Error writing email body: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}

		err = wData.Close()
		if err != nil {
			fmt.Printf("Error closing data writer: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}

	} else {
		// Standard STARTTLS (Port 587)
		err = smtp.SendMail(addr, auth, smtpEmail, to, msg)
		if err != nil {
			fmt.Printf("Error sending email: %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Message sent successfully"})
}
