package controllers

import (
	"errors"
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateSavingsGoal(c *gin.Context) {

	var input models.SavingsGoal

	// Ambil user ID dari JWT
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

	// Hubungkan goal dengan user
	input.UserID = userID.(uint)

	// Simpan ke database
	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "savings goal created successfully!",
		"data":    input,
	})
}

func GetSavingsGoals(c *gin.Context) {

	var goals []models.SavingsGoal

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	workspaceID := c.Query("workspace_id")

	// Workspace wajib dipilih
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

	// Ambil semua savings goal dalam workspace
	if err := config.DB.
		Where("user_id = ? AND workspace_id = ?", userID, workspaceID).
		Find(&goals).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Buat response dengan progress
	var response []gin.H

	for _, goal := range goals {

		progress := (goal.CurrentAmount / goal.TargetAmount) * 100

		// Jangan sampai progress lebih dari 100%
		if progress > 100 {
			progress = 100
		}

		response = append(response, gin.H{
			"id":             goal.ID,
			"name":           goal.Name,
			"target_amount":  goal.TargetAmount,
			"current_amount": goal.CurrentAmount,
			"progress":       progress,
			"deadline":       goal.Deadline,
			"frequency":      goal.Frequency,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

func CreateSavingsDeposit(c *gin.Context) {

	goalID := c.Param("id")

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Data deposit yang dikirim dari client
	var input models.SavingsDeposit

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Jalankan semua proses dalam satu database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// ==========================================
		// 1. Cari Savings Goal
		// ==========================================

		var goal models.SavingsGoal

		if err := tx.
			Where("id = ? AND user_id = ?", goalID, userID).
			First(&goal).Error; err != nil {

			return err
		}

		// ==========================================
		// 2. Cari Account
		// ==========================================

		var account models.Account

		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				input.AccountID,
				userID,
				goal.WorkspaceID,
			).
			First(&account).Error; err != nil {

			return err
		}

		// ==========================================
		// 3. Pastikan saldo cukup
		// ==========================================

		if account.Balance < input.Amount {
			return errors.New("insufficient account balance")
		}

		// ==========================================
		// 4. Hubungkan deposit dengan user,
		//    workspace, dan savings goal
		// ==========================================

		input.UserID = userID.(uint)
		input.WorkspaceID = goal.WorkspaceID
		input.SavingsGoalID = goal.ID

		// ==========================================
		// 5. Kurangi saldo Account
		// ==========================================

		account.Balance -= input.Amount

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// ==========================================
		// 6. Tambahkan nominal ke Savings Goal
		// ==========================================

		goal.CurrentAmount += input.Amount

		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		// ==========================================
		// 7. Simpan Savings Deposit
		// ==========================================

		if err := tx.Create(&input).Error; err != nil {
			return err
		}

		return nil
	})

	// ==========================================
	// Jika transaction gagal
	// ==========================================

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "savings goal or account not found!",
			})
			return
		}

		if err.Error() == "insufficient account balance" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "insufficient account balance!",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

		// ==========================================
	// Ambil data terbaru untuk response
	// ==========================================

	var account models.Account

	if err := config.DB.
		Where("id = ? AND user_id = ?", input.AccountID, userID).
		First(&account).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var goal models.SavingsGoal

	if err := config.DB.
		Where("id = ? AND user_id = ?", input.SavingsGoalID, userID).
		First(&goal).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "savings deposit created successfully!",
		"data": gin.H{
			"deposit": input,
			"account": gin.H{
				"id":      account.ID,
				"name":    account.Name,
				"balance": account.Balance,
			},
			"goal": gin.H{
				"id":             goal.ID,
				"name":           goal.Name,
				"target_amount":  goal.TargetAmount,
				"current_amount": goal.CurrentAmount,
			},
		},
	})
}

func UpdateSavingsGoal(c *gin.Context) {

	goalID := c.Param("id")

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Cari savings goal milik user
	var goal models.SavingsGoal

	if err := config.DB.
		Where("id = ? AND user_id = ?", goalID, userID).
		First(&goal).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "savings goal not found!",
		})
		return
	}

	// Ambil data baru dari JSON
	var input struct {
		Name         string  `json:"name" binding:"required"`
		TargetAmount float64 `json:"target_amount" binding:"required,gt=0"`
		Deadline     string  `json:"deadline"`
		Frequency    string  `json:"frequency" binding:"required,oneof=daily weekly monthly"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Update data goal
	goal.Name = input.Name
	goal.TargetAmount = input.TargetAmount
	goal.Deadline = input.Deadline
	goal.Frequency = input.Frequency

	// Simpan perubahan
	if err := config.DB.Save(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Hitung progress terbaru
	progress := (goal.CurrentAmount / goal.TargetAmount) * 100

	if progress > 100 {
		progress = 100
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "savings goal updated successfully!",
		"data": gin.H{
			"id":             goal.ID,
			"name":           goal.Name,
			"target_amount":  goal.TargetAmount,
			"current_amount": goal.CurrentAmount,
			"progress":       progress,
			"deadline":       goal.Deadline,
			"frequency":      goal.Frequency,
		},
	})
}

func DeleteSavingsGoal(c *gin.Context) {
	goalID := c.Param("id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// 1. Cari savings goal
		var goal models.SavingsGoal
		if err := tx.
			Where("id = ? AND user_id = ?", goalID, userID).
			First(&goal).Error; err != nil {
			return err
		}

		// 2. Ambil semua deposit aktif dari goal
		var deposits []models.SavingsDeposit

		if err := tx.
			Where(
				"savings_goal_id = ? AND user_id = ? AND workspace_id = ?",
				goal.ID,
				userID,
				goal.WorkspaceID,
			).
			Find(&deposits).Error; err != nil {
			return err
		}

		// 3. Kembalikan setiap deposit ke account masing-masing
		for _, deposit := range deposits {

			var account models.Account

			if err := tx.
				Where(
					"id = ? AND user_id = ? AND workspace_id = ?",
					deposit.AccountID,
					userID,
					deposit.WorkspaceID,
				).
				First(&account).Error; err != nil {
				return err
			}

			account.Balance += deposit.Amount

			if err := tx.Save(&account).Error; err != nil {
				return err
			}

			// Soft delete deposit
			if err := tx.Delete(&deposit).Error; err != nil {
				return err
			}
		}

		// 4. Soft delete savings goal
		if err := tx.Delete(&goal).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "savings goal or account not found!",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "savings goal deleted successfully!",
	})
}

func GetSavingsDeposits(c *gin.Context) {

	goalID := c.Param("id")

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Pastikan savings goal milik user
	var goal models.SavingsGoal

	if err := config.DB.
		Where("id = ? AND user_id = ?", goalID, userID).
		First(&goal).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{
			"error": "savings goal not found!",
		})
		return
	}

	// Ambil semua deposit dari savings goal
	var deposits []models.SavingsDeposit

	if err := config.DB.
		Where(
			"savings_goal_id = ? AND user_id = ? AND workspace_id = ?",
			goal.ID,
			userID,
			goal.WorkspaceID,
		).
		Order("created_at DESC").
		Find(&deposits).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Buat response yang lebih bersih
	var response []gin.H

	for _, deposit := range deposits {

		response = append(response, gin.H{
			"id":         deposit.ID,
			"account_id": deposit.AccountID,
			"amount":     deposit.Amount,
			"notes":      deposit.Notes,
			"created_at": deposit.CreatedAt,
			"updated_at": deposit.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

func UpdateSavingsDeposit(c *gin.Context) {

	depositID := c.Param("deposit_id")

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Data baru
	var input struct {
		Amount  float64 `json:"amount" binding:"required,gt=0"`
		Notes   string  `json:"notes" binding:"max=255"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Jalankan semua proses dalam satu database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// ==========================================
		// 1. Cari deposit
		// ==========================================

		var deposit models.SavingsDeposit

		if err := tx.
			Where("id = ? AND user_id = ?", depositID, userID).
			First(&deposit).Error; err != nil {

			return err
		}

		// ==========================================
		// 2. Cari Savings Goal
		// ==========================================

		var goal models.SavingsGoal

		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				deposit.SavingsGoalID,
				userID,
				deposit.WorkspaceID,
			).
			First(&goal).Error; err != nil {

			return err
		}

		// ==========================================
		// 3. Cari Account
		// ==========================================

		var account models.Account

		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				deposit.AccountID,
				userID,
				deposit.WorkspaceID,
			).
			First(&account).Error; err != nil {

			return err
		}

		// ==========================================
		// 4. Hitung selisih deposit
		// ==========================================

		difference := input.Amount - deposit.Amount

		// ==========================================
		// 5. Jika deposit bertambah,
		//    pastikan saldo Account cukup
		// ==========================================

		if difference > 0 && account.Balance < difference {
			return errors.New("insufficient account balance")
		}

		// ==========================================
		// 6. Update saldo Account
		// ==========================================

		account.Balance -= difference

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// ==========================================
		// 7. Update Savings Goal
		// ==========================================

		goal.CurrentAmount += difference

		// Jangan sampai current amount negatif
		if goal.CurrentAmount < 0 {
			goal.CurrentAmount = 0
		}

		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		// ==========================================
		// 8. Update Savings Deposit
		// ==========================================

		deposit.Amount = input.Amount
		deposit.Notes = input.Notes

		if err := tx.Save(&deposit).Error; err != nil {
			return err
		}

		return nil
	})

	// ==========================================
	// Jika transaction gagal
	// ==========================================

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "savings deposit, savings goal, or account not found!",
			})
			return
		}

		if err.Error() == "insufficient account balance" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "insufficient account balance!",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// ==========================================
	// Ambil data terbaru untuk response
	// ==========================================

	var deposit models.SavingsDeposit

	if err := config.DB.
		Where("id = ? AND user_id = ?", depositID, userID).
		First(&deposit).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var account models.Account

	if err := config.DB.
		Where("id = ? AND user_id = ?", deposit.AccountID, userID).
		First(&account).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var goal models.SavingsGoal

	if err := config.DB.
		Where("id = ? AND user_id = ?", deposit.SavingsGoalID, userID).
		First(&goal).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "savings deposit updated successfully!",
		"data": gin.H{
			"deposit": gin.H{
				"id":         deposit.ID,
				"account_id": deposit.AccountID,
				"amount":     deposit.Amount,
				"notes":      deposit.Notes,
				"created_at": deposit.CreatedAt,
				"updated_at": deposit.UpdatedAt,
			},
			"account": gin.H{
				"id":      account.ID,
				"name":    account.Name,
				"balance": account.Balance,
			},
			"goal": gin.H{
				"id":             goal.ID,
				"name":           goal.Name,
				"target_amount":  goal.TargetAmount,
				"current_amount": goal.CurrentAmount,
			},
		},
	})
}

func DeleteSavingsDeposit(c *gin.Context) {
	goalID := c.Param("id")
	depositID := c.Param("deposit_id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// 1. Cari deposit
		var deposit models.SavingsDeposit
		if err := tx.
			Where(
				"id = ? AND savings_goal_id = ? AND user_id = ?",
				depositID,
				goalID,
				userID,
			).
			First(&deposit).Error; err != nil {
			return err
		}

		// 2. Cari savings goal
		var goal models.SavingsGoal
		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				deposit.SavingsGoalID,
				userID,
				deposit.WorkspaceID,
			).
			First(&goal).Error; err != nil {
			return err
		}

		// 3. Cari account
		var account models.Account
		if err := tx.
			Where(
				"id = ? AND user_id = ? AND workspace_id = ?",
				deposit.AccountID,
				userID,
				deposit.WorkspaceID,
			).
			First(&account).Error; err != nil {
			return err
		}

		// 4. Kembalikan uang ke account
		account.Balance += deposit.Amount

		if err := tx.Save(&account).Error; err != nil {
			return err
		}

		// 5. Kurangi uang dari savings goal
		goal.CurrentAmount -= deposit.Amount

		if goal.CurrentAmount < 0 {
			goal.CurrentAmount = 0
		}

		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		// 6. Hapus deposit
		if err := tx.Delete(&deposit).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "savings deposit, savings goal, or account not found!",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "savings deposit deleted successfully!",
	})
}