package controllers

import(
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
	"github.com/gin-gonic/gin"
)

func CreateTransaction(c *gin.Context){
	println("FUNCTION CREATE TRANSACTION KEJALAN")

	var input models.Transaction

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
	}
	config.DB.Create(&input)

	c.JSON(http.StatusOK, gin.H{
		"message" : "Transaction created succesfully!",
		"data" : input,
	})
}
	
