package main

import (
	"github.com/gin-gonic/gin"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
)
func main(){
	config.ConnectDB()

	err := config.DB.AutoMigrate(&models.Transaction{})
	if err != nil {
		panic(err)
	}

	r := gin.Default()

	r.POST("/transactions", controllers.CreateTransaction)

	r.GET("/", func(c *gin.Context){
		c.JSON(200, gin.H{
			"message": "personal finance API running",
		})
	})
	r.Run(":8080")
}