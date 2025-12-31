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

	// Logging for debugging (keep this until fixed)
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

	// Compose the email
	to := []string{contactEmail}
	subject := "New Contact Form Submission: " + req.Name

	// MIME headers
	msg := []byte("To: " + contactEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		"Name: " + req.Name + "\r\n" +
		"Email: " + req.Email + "\r\n\r\n" +
		"Message:\r\n" + req.Message + "\r\n")

	addr := smtpHost + ":" + smtpPort
	auth := smtp.PlainAuth("", smtpEmail, smtpPassword, smtpHost)

	var err error

	// Handle Port 465 (Implicit SSL) vs 587 (STARTTLS)
	if smtpPort == "465" {
		// SSL/TLS connection for Port 465
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         smtpHost,
		}

		var conn *tls.Conn
		conn, err = tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			fmt.Printf("Error dialing TLS: %v\n", err)
			http.Error(w, "Failed to connect to email server", http.StatusInternalServerError)
			return
		}

		var client *smtp.Client
		client, err = smtp.NewClient(conn, smtpHost)
		if err != nil {
			fmt.Printf("Error creating SMTP client: %v\n", err)
			http.Error(w, "Failed to create email client", http.StatusInternalServerError)
			return
		}
		defer client.Quit()

		// Authenticate
		if err = client.Auth(auth); err != nil {
			fmt.Printf("Error authenticating: %v\n", err)
			http.Error(w, "Email authentication failed", http.StatusInternalServerError)
			return
		}

		// Send Mail
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

		// actually client.Data returns a WriteCloser
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
			fmt.Printf("Error sending email (SendMail): %v\n", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Message sent successfully"})
}
