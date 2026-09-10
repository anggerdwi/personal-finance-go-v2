package controllers

import (
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"

	"github.com/gin-gonic/gin"
)

func CreateCategory(c *gin.Context) {

	var input models.Category

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

	// Pastikan workspace milik user yang sedang login
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
		"message": "category created successfully!",
		"data":    input,
	})
}

func GetCategories(c *gin.Context) {

	var categories []models.Category

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

	// Pastikan workspace milik user
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Ambil kategori hanya dari user + workspace tersebut
	if err := config.DB.
		Where("user_id = ? AND workspace_id = ?", userID, workspaceID).
		Order("id ASC").
		Find(&categories).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

func GetCategoryByID(c *gin.Context) {

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

	// Pastikan workspace milik user
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var category models.Category

	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&category).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "category not found!",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": category,
	})
}

func UpdateCategory(c *gin.Context) {

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

	// Pastikan workspace milik user
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var category models.Category

	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&category).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "category not found!",
		})
		return
	}

	var input models.Category

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	category.Name = input.Name

	if err := config.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "category updated successfully!",
		"data":    category,
	})
}

func DeleteCategory(c *gin.Context) {

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

	// Pastikan workspace milik user
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	var category models.Category

	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			userID,
			workspaceID,
		).
		First(&category).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "category not found!",
		})
		return
	}

	if err := config.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to delete category",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "category deleted successfully!",
	})
}