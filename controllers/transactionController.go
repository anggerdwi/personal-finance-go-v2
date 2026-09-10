package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
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

	// Pastikan account milik user dan workspace yang sama
	var account models.Account

	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			input.AccountID,
			UserID,
			input.WorkspaceID,
		).
		First(&account).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found!",
		})
		return
	}

	input.UserID = UserID.(uint)

	// Ubah expense menjadi nilai negatif
	if input.Type == "expense" {
		input.Amount = -input.Amount
	}

	// Transaction database
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Update saldo account
		account.Balance += input.Amount

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// Simpan transaksi
		if err := tx.Create(&input).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
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
		Preload("Account").
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
		Preload("Account").
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

	// Pastikan workspace milik user
	var workspace models.Workspace
	if err := config.DB.
		Where("id = ? AND user_id = ?", workspaceID, UserID).
		First(&workspace).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "workspace not found!",
		})
		return
	}

	// Ambil transaksi lama
	var transaction models.Transaction
	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			UserID,
			workspaceID,
		).
		First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "transaction not found!",
		})
		return
	}

	// Ambil input transaksi baru
	var input models.Transaction
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Validasi category
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

	// Validasi account baru
	var newAccount models.Account
	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			input.AccountID,
			UserID,
			workspaceID,
		).
		First(&newAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found!",
		})
		return
	}

	oldAmount := transaction.Amount
	oldAccountID := transaction.AccountID

	newAmount := input.Amount

	if input.Type == "expense" {
		newAmount = -newAmount
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// =========================================
		// 1. KEMBALIKAN EFEK TRANSAKSI LAMA
		// =========================================

		if oldAccountID != 0 {

			var oldAccount models.Account

			if err := tx.
				Where(
					"id = ? AND user_id = ? AND workspace_id = ?",
					oldAccountID,
					UserID,
					workspaceID,
				).
				First(&oldAccount).Error; err != nil {
				return err
			}

			oldAccount.Balance -= oldAmount

			if err := tx.Save(&oldAccount).Error; err != nil {
				return err
			}
		}

		// =========================================
		// 2. TERAPKAN EFEK TRANSAKSI BARU
		// =========================================

		// Kalau account baru sama dengan account lama,
		// saldo sudah dikembalikan di langkah sebelumnya.
		// Jadi sekarang kita ambil ulang account dari database.
		var account models.Account

		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				input.AccountID,
				UserID,
				workspaceID,
			).
			First(&account).Error; err != nil {
			return err
		}

		account.Balance += newAmount

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// =========================================
		// 3. UPDATE DATA TRANSAKSI
		// =========================================

		transaction.CategoryID = input.CategoryID
		transaction.AccountID = input.AccountID
		transaction.Type = input.Type
		transaction.Amount = newAmount
		transaction.Notes = input.Notes

		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "transaction updated successfully!",
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

	// Cari transaksi
	var transaction models.Transaction

	if err := config.DB.
		Where(
			"id = ? AND user_id = ? AND workspace_id = ?",
			id,
			UserID,
			workspaceID,
		).
		First(&transaction).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "transaction not found!",
		})
		return
	}

	// Hapus transaksi + kembalikan saldo account
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Cari account yang digunakan transaksi
		var account models.Account

		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				transaction.AccountID,
				UserID,
				workspaceID,
			).
			First(&account).Error; err != nil {

			return err
		}

		// Kembalikan efek transaksi ke saldo
		//
		// Expense disimpan sebagai negatif:
		// -75.000 → saldo dikembalikan +75.000
		//
		// Income disimpan sebagai positif:
		// +500.000 → saldo dikurangi kembali -500.000
		account.Balance -= transaction.Amount

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// Soft delete transaksi
		if err := tx.Delete(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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

	// =========================================
	// 1. TOTAL INCOME
	// =========================================

	if err := config.DB.
		Model(&models.Transaction{}).
		Where(
			"user_id = ? AND workspace_id = ? AND type = ?",
			UserID,
			workspaceID,
			"income",
		).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&totalIncome).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 2. TOTAL EXPENSE
	// =========================================

	if err := config.DB.
		Model(&models.Transaction{}).
		Where(
			"user_id = ? AND workspace_id = ? AND type = ?",
			UserID,
			workspaceID,
			"expense",
		).
		Select("COALESCE(SUM(ABS(amount)), 0)").
		Scan(&totalExpense).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 3. TOTAL BALANCE ACCOUNT
	// =========================================

	if err := config.DB.
		Model(&models.Account{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Select("COALESCE(SUM(balance), 0)").
		Scan(&balance).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_Income":  totalIncome,
		"total_Expense": totalExpense,
		"balance":       balance,
	})
}
