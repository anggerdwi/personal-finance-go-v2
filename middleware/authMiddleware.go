package middleware

import(
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc{
	return func(c *gin.Context){
		authHeader := c.GetHeader("Authorization")

		if authHeader == ""{
			c.JSON(http.StatusUnauthorized, gin.H{
				"error" : "authorization header required!",
			})
			c.Abort()
			return
		}
		tokenString := strings.Split(authHeader," ")

		if len(tokenString) != 2{
			c.JSON(http.StatusUnauthorized, gin.H{
				"error" : "authorization header required!",
			})
			c.Abort()
			return
		}
		token, err := jwt.Parse(tokenString[1], func(token *jwt.Token) (interface{}, error) {
			return []byte("secret_key"), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Next()
	}
}