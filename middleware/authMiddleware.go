package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"personal-finance-gin/config"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// Ambil Authorization Header
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "authorization header required!",
			})
			c.Abort()
			return
		}

		// Pisahkan "Bearer TOKEN"
		parts := strings.SplitN(authHeader, " ", 2)

		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format!",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

			// Pastikan algoritma yang digunakan adalah HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			return config.GetJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			c.Abort()
			return
		}

		// Ambil claims
		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid token claims",
			})
			c.Abort()
			return
		}

		// Ambil user_id
		userIDFloat, ok := claims["user_id"].(float64)

		if !ok || userIDFloat <= 0 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid user_id in token",
			})
			c.Abort()
			return
		}

		userID := uint(userIDFloat)

		// Simpan user_id ke Gin Context
		c.Set("user_id", userID)

		c.Next()
	}
}