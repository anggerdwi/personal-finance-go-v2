package controllers

import(
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
	"github.com/gin-gonic/gin"
	"strconv"

)

func CreateTransaction(c *gin.Context) {

	var input models.Transaction

	UserID, exists := c.Get("user_id")
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
		Where("id = ? AND user_id = ?", input.WorkspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	if err := config.DB.
	Where("id = ? AND user_id = ?", input.WorkspaceID, UserID).
	First(&workspace).Error; err != nil {

	c.JSON(http.StatusNotFound, gin.H{
		"error": "workspace not found!",
	})
	return
}

// Pastikan category milik user dan workspace yang sama
var category models.Category

if err := config.DB.
	Where(
		"id = ? AND user_id = ? AND workspace_id = ?",
		input.CategoryID,
		UserID,
		input.WorkspaceID,
	).
	First(&category).Error; err != nil {

	c.JSON(http.StatusNotFound, gin.H{
		"error": "category not found!",
	})
	return
}

	input.UserID = UserID.(uint)

	if input.Type == "expense" {
		input.Amount = -input.Amount
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "transaction created successfully!",
		"data":    input,
	})
}

func GetTransaction(c *gin.Context) {
	var transactions []models.Transaction

	UserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Ambil workspace_id dari query
	workspaceID := c.Query("workspace_id")

	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "workspace_id is required!",
		})
		return
	}

	// Pastikan workspace milik user yang sedang login
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	typeFilter := c.Query("type")
	minAmount := c.Query("min_amount")

	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	offset := (page - 1) * limit

	query := config.DB.Model(&models.Transaction{}).
		Where("user_id = ? AND workspace_id = ?", UserID, workspaceID)

	// Filter by type
	if typeFilter != "" {
		query = query.Where("type = ?", typeFilter)
	}

	// Filter minimum amount
	minAmountInt, err := strconv.Atoi(minAmount)
	if err == nil {
		query = query.Where("ABS(amount) >= ?", minAmountInt)
	}

	if err := query.
		Preload("Category").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"data":  transactions,
	})
}

func GetTransactionByID(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	UserID, exists := c.Get("user_id")
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

	// Pastikan workspace milik user yang sedang login
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Cari transaksi berdasarkan ID, user, dan workspace
	var transaction models.Transaction

	if err := config.DB.
		Preload("Category").
		Where("id = ? AND user_id = ? AND workspace_id = ?", id, UserID, workspaceID).
		First(&transaction).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "transaction not found!",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": transaction,
	})
}

func Updatetransaction(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	UserID, exists := c.Get("user_id")
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

	// Pastikan workspace milik user yang sedang login
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Cari transaksi berdasarkan ID, user, dan workspace
	var transaction models.Transaction

	if err := config.DB.
		Where("id = ? AND user_id = ? AND workspace_id = ?", id, UserID, workspaceID).
		First(&transaction).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "transaction not found!",
		})
		return
	}

	// Ambil data baru
	var input models.Transaction

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// UPDATE
// Pastikan category milik user dan workspace yang sama
var category models.Category

if err := config.DB.
	Where(
		"id = ? AND user_id = ? AND workspace_id = ?",
		input.CategoryID,
		UserID,
		workspaceID,
	).
	First(&category).Error; err != nil {

	c.JSON(http.StatusNotFound, gin.H{
		"error": "category not found!",
	})
	return
}

// UPDATE
	transaction.CategoryID = input.CategoryID
	transaction.Type = input.Type
	transaction.Amount = input.Amount
	transaction.Notes = input.Notes

	if transaction.Type == "expense" {
		transaction.Amount = -transaction.Amount
	}

	if err := config.DB.Save(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction updated successfully!",
		"data":    transaction,
	})
}

func DeleteTransaction(c *gin.Context) {
	id := c.Param("id")
	workspaceID := c.Query("workspace_id")

	UserID, exists := c.Get("user_id")
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

	// Pastikan workspace milik user yang sedang login
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Cari transaksi berdasarkan ID, user, dan workspace
	var transaction models.Transaction

	if err := config.DB.
		Where("id = ? AND user_id = ? AND workspace_id = ?", id, UserID, workspaceID).
		First(&transaction).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "transaction not found!",
		})
		return
	}

	// Hapus transaksi
	if err := config.DB.Delete(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to delete transaction",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "transaction deleted successfully!",
	})
}

func GetSummary(c *gin.Context) {
	var totalIncome float64
	var totalExpense float64
	var balance float64

	UserID, exists := c.Get("user_id")
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

	// Pastikan workspace milik user yang sedang login
	var workspace models.Workspace

	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Total income
	if err := config.DB.Model(&models.Transaction{}).
		Where("user_id = ? AND workspace_id = ? AND amount > 0", UserID, workspaceID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalIncome).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Total expense
	if err := config.DB.Model(&models.Transaction{}).
		Where("user_id = ? AND workspace_id = ? AND amount < 0", UserID, workspaceID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Balance
	if err := config.DB.Model(&models.Transaction{}).
		Where("user_id = ? AND workspace_id = ?", UserID, workspaceID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&balance).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_Income":  totalIncome,
		"total_Expense": -totalExpense,
		"balance":      balance,
	})
}
	
