package controllers

import (
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"

	"github.com/gin-gonic/gin"
)

func CreateAccount(c *gin.Context) {
	var input models.Account

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", input.WorkspaceID, userID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	input.UserID = userID.(uint)

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "account created successfully!",
		"data":    input,
	})
}

func GetAccounts(c *gin.Context) {
	var accounts []models.Account

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	workspaceID := c.Query("workspace_id")
	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "workspace_id is required!",
		})
		return
	}

	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	if err := config.DB.
		Where("user_id = ? AND workspace_id = ?", userID, workspaceID).
		Order("id ASC").
		Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": accounts,
	})
}

func GetAccountByID(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "workspace_id is required!",
		})
		return
	}

	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var account models.Account
	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found!",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": account,
	})
}

func UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "workspace_id is required!",
		})
		return
	}

	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var account models.Account
	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found!",
		})
		return
	}

	var input models.Account
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	account.Name = input.Name

	if err := config.DB.Save(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "account updated successfully!",
		"data":    account,
	})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "workspace_id is required!",
		})
		return
	}

	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var account models.Account
	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&account).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found!",
		})
		return
	}

	if err := config.DB.Delete(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to delete account",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "account deleted successfully!",
	})
}