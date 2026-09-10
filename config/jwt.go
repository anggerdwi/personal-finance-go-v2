package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func GetJWTSecret() []byte {

	err := godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found")
	}

	secret := os.Getenv("JWT_SECRET")

	if secret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	return []byte(secret)
}