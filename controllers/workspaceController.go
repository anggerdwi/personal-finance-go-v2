package controllers

import (
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
	"github.com/gin-gonic/gin"
)

func CreateWorkspace(c *gin.Context) {
	var input models.Workspace

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Ambil data dari JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Hubungkan workspace dengan user yang sedang login
	input.UserID = userID.(uint)

	// Simpan ke database
	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "workspace created successfully!",
		"data":    input,
	})
}

func GetWorkspaces(c *gin.Context){
	var workspaces []models.Workspace

	userID, exists := c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}
	if err := config.DB.Where("user_id = ?", userID).
	Find(&workspaces).Error; err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": workspaces,
	})
}