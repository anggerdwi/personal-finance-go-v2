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
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
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
	var input models.User
	var user models.User

	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
		}
		config.DB.Where("email = ?", input.Email).First(&user)
		// compare password
		err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
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
	tokenString, _ := token.SignedString(jwtkey)

	c.JSON(http. StatusOK, gin.H{
		"token" : tokenString,
	})
}