package controllers

import(
	"fmt"
	"net/http"
	"time"

	"personal-finance-gin/config"
	"personal-finance-gin/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtkey = []byte("secret_key")
type LoginInput struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
}

func Register(c *gin.Context){
	var input models.User

	if config.DB == nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "Database not connected",
	})
	return
}

	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
	}
	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword(
	[]byte(input.Password),
	bcrypt.DefaultCost,
)

if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "failed to hash password",
	})
	return
}

input.Password = string(hashedPassword)

	result := config.DB.Create(&input)

if result.Error != nil {
	fmt.Println("ERROR REGISTER:", result.Error)
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": result.Error.Error(),
	})
	return
}

	c.JSON(http. StatusOK, gin.H{
		"message" : "User registered succesfully!",
	})
}

func Login(c *gin.Context){
	var input LoginInput
	var user models.User

	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
		}
		result := config.DB.Where("email = ?", input.Email).First(&user)

if result.Error != nil {
	c.JSON(http.StatusUnauthorized, gin.H{
		"error": "invalid credentials!",
	})
	return
}

// compare password
err := bcrypt.CompareHashAndPassword(
	[]byte(user.Password),
	[]byte(input.Password),
)

if err != nil {
	c.JSON(http.StatusUnauthorized, gin.H{
		"error": "invalid credentials!",
	})
	return
}
		if err != nil{
			c.JSON(http.StatusUnauthorized, gin.H{
				"error" : "invalid credentials!",
			})
			return
	}
	// create token
	claims := jwt.MapClaims{
		"user_id" : user.ID,
		"exp" : time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

tokenString, err := token.SignedString(config.GetJWTSecret())

if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "failed to create token",
	})
	return
}

if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "failed to create token",
	})
	return
}

	c.JSON(http. StatusOK, gin.H{
		"token" : tokenString,
	})
}