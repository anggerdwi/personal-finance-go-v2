package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
	"strconv"
)
type DashboardTransactionResponse struct {
	ID       uint    `json:"id"`
	Type     string  `json:"type"`
	Amount   float64 `json:"amount"`
	Category string  `json:"category"`
	Account  *string `json:"account"`
	Notes    string  `json:"notes"`
}

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

	// Filter
	typeFilter := c.Query("type")
	minAmount := c.Query("min_amount")
	search := c.Query("search")
	categoryID := c.Query("category_id")
	accountID := c.Query("account_id")

	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	offset := (page - 1) * limit

	// Query dasar
	query := config.DB.Model(&models.Transaction{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		)

	// Filter berdasarkan type
	if typeFilter != "" {
		query = query.Where(
			"type = ?",
			typeFilter,
		)
	}

	// Filter minimum amount
	minAmountInt, err := strconv.Atoi(minAmount)
	if err == nil {
		query = query.Where(
			"ABS(amount) >= ?",
			minAmountInt,
		)
	}

	// Search berdasarkan catatan transaksi
	if search != "" {
		query = query.Where(
			"notes LIKE ?",
			"%"+search+"%",
		)
	}

	// Filter berdasarkan category
	if categoryID != "" {
		query = query.Where(
			"category_id = ?",
			categoryID,
		)
	}

	// Filter berdasarkan account
	if accountID != "" {
		query = query.Where(
			"account_id = ?",
			accountID,
		)
	}

	// Ambil data transaksi
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

		// Hanya kembalikan saldo jika transaksi
		// memiliki account
		if transaction.AccountID != 0 {

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

			// Expense disimpan sebagai negatif:
			// -50.000 → saldo dikembalikan +50.000
			//
			// Income disimpan sebagai positif:
			// +500.000 → saldo dikurangi kembali -500.000
			account.Balance -= transaction.Amount

			if err := tx.Save(&account).Error; err != nil {
				return err
			}
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

	// =========================================
	// 1. VALIDASI WORKSPACE
	// =========================================

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
	// 2. TOTAL INCOME
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
	// 3. TOTAL EXPENSE
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
	// 4. TOTAL BALANCE ACCOUNT
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

	// =========================================
	// 5. ACCOUNT UTAMA
	// =========================================

	var account models.Account

	if err := config.DB.
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Order("id ASC").
		First(&account).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 6. TOTAL SAVINGS GOAL
	// =========================================

	var totalSavingsTarget float64
	var totalSavingsCurrent float64

	if err := config.DB.
		Model(&models.SavingsGoal{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Select("COALESCE(SUM(target_amount), 0)").
		Scan(&totalSavingsTarget).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := config.DB.
		Model(&models.SavingsGoal{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Select("COALESCE(SUM(current_amount), 0)").
		Scan(&totalSavingsCurrent).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 7. RESPONSE
	// =========================================

	c.JSON(http.StatusOK, gin.H{
		"total_Income":  totalIncome,
		"total_Expense": totalExpense,
		"balance":       balance,

		"account": gin.H{
			"id":      account.ID,
			"name":    account.Name,
			"balance": account.Balance,
		},

		"savings": gin.H{
			"total_target": totalSavingsTarget,
			"total_saved":  totalSavingsCurrent,
		},
	})
}

func GetDashboard(c *gin.Context) {
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

	// =========================================
	// 1. VALIDASI WORKSPACE
	// =========================================

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
	// 2. TOTAL INCOME
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
	// 3. TOTAL EXPENSE
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
	// 4. TOTAL BALANCE
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

	// =========================================
	// 5. ACCOUNT UTAMA
	// =========================================

	var account models.Account

	if err := config.DB.
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Order("id ASC").
		First(&account).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 6. SAVINGS
	// =========================================

	var totalSavingsTarget float64
	var totalSavingsCurrent float64

	if err := config.DB.
		Model(&models.SavingsGoal{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Select("COALESCE(SUM(target_amount), 0)").
		Scan(&totalSavingsTarget).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := config.DB.
		Model(&models.SavingsGoal{}).
		Where(
			"user_id = ? AND workspace_id = ?",
			UserID,
			workspaceID,
		).
		Select("COALESCE(SUM(current_amount), 0)").
		Scan(&totalSavingsCurrent).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// =========================================
	// 7. TRANSAKSI TERBARU
	// =========================================

	var transactions []models.Transaction

	if err := config.DB.
	Where(
		"user_id = ? AND workspace_id = ?",
		UserID,
		workspaceID,
	).
	Preload("Category").
	Preload("Account").
	Order("id DESC").
	Limit(5).
	Find(&transactions).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	recentTransactions := make([]DashboardTransactionResponse, 0, len(transactions))

for _, transaction := range transactions {

    var accountName *string

    if transaction.AccountID != 0 {
        accountName = &transaction.Account.Name
    }

    recentTransactions = append(
        recentTransactions,
        DashboardTransactionResponse{
            ID:       transaction.ID,
            Type:     transaction.Type,
            Amount:   transaction.Amount,
            Category: transaction.Category.Name,
            Account:  accountName,
            Notes:    transaction.Notes,
        },
    )
}

	// =========================================
	// 8. RESPONSE
	// =========================================

	c.JSON(http.StatusOK, gin.H{
		"summary": gin.H{
			"balance":       balance,
			"total_income":  totalIncome,
			"total_expense": totalExpense,
		},

		"account": gin.H{
			"id":      account.ID,
			"name":    account.Name,
			"balance": account.Balance,
		},

		"savings": gin.H{
			"total_target": totalSavingsTarget,
			"total_saved":   totalSavingsCurrent,
		},

		"recent_transactions": recentTransactions,
	})
}