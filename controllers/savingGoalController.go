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

	// Ambil data deposit
	var input models.SavingsDeposit

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Jalankan semua proses dalam database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Cari savings goal milik user
		var goal models.SavingsGoal

		if err := tx.
			Where("id = ? AND user_id = ?", goalID, userID).
			First(&goal).Error; err != nil {

			return err
		}

		// Hubungkan deposit dengan user, workspace, dan goal
		input.UserID = userID.(uint)
		input.WorkspaceID = goal.WorkspaceID
		input.SavingsGoalID = goal.ID

		// Simpan deposit
		if err := tx.Create(&input).Error; err != nil {
			return err
		}

		// Tambahkan nominal deposit ke current amount
		goal.CurrentAmount += input.Amount

		// Simpan perubahan goal
		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		return nil
	})

	// Jika transaction gagal
	if err != nil {

	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "savings goal not found!",
		})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{
		"error": err.Error(),
	})
	return
}

	// Ambil goal terbaru untuk response
	var goal models.SavingsGoal

	if err := config.DB.
		Where("id = ? AND user_id = ?", goalID, userID).
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

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Jalankan penghapusan dalam database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Cari savings goal milik user
		var goal models.SavingsGoal

		if err := tx.
			Where("id = ? AND user_id = ?", goalID, userID).
			First(&goal).Error; err != nil {

			return err
		}

		// Hapus semua deposit yang terkait dengan goal
		if err := tx.
			Where("savings_goal_id = ? AND user_id = ?", goal.ID, userID).
			Delete(&models.SavingsDeposit{}).Error; err != nil {

			return err
		}

		// Hapus savings goal
		if err := tx.Delete(&goal).Error; err != nil {
			return err
		}

		return nil
	})

	// Jika transaction gagal
	if err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "savings goal not found!",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "savings goal and related deposits deleted successfully!",
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
		Where("savings_goal_id = ? AND user_id = ?", goal.ID, userID).
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
			"amount":     deposit.Amount,
			"notes":      deposit.Notes,
			"created_at": deposit.CreatedAt,
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
		Amount float64 `json:"amount" binding:"required,gt=0"`
		Notes  string  `json:"notes" binding:"max=255"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Jalankan semua proses dalam database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Cari deposit milik user
		var deposit models.SavingsDeposit

		if err := tx.
			Where("id = ? AND user_id = ?", depositID, userID).
			First(&deposit).Error; err != nil {

			return err
		}

		// Cari savings goal
		var goal models.SavingsGoal

		if err := tx.
			Where("id = ? AND user_id = ?", deposit.SavingsGoalID, userID).
			First(&goal).Error; err != nil {

			return err
		}

		// Hitung selisih nominal deposit
		difference := input.Amount - deposit.Amount

		// Update deposit
		deposit.Amount = input.Amount
		deposit.Notes = input.Notes

		if err := tx.Save(&deposit).Error; err != nil {
			return err
		}

		// Update current amount goal
		goal.CurrentAmount += difference

		// Pastikan current amount tidak negatif
		if goal.CurrentAmount < 0 {
			goal.CurrentAmount = 0
		}

		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		return nil
	})

	// Jika transaction gagal
	if err != nil {

	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "savings deposit or savings goal not found!",
		})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{
		"error": err.Error(),
	})
	return
}

	// Ambil data terbaru untuk response
	var deposit models.SavingsDeposit

	if err := config.DB.
		Where("id = ? AND user_id = ?", depositID, userID).
		First(&deposit).Error; err != nil {

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
				"amount":     deposit.Amount,
				"notes":      deposit.Notes,
				"created_at": deposit.CreatedAt,
				"updated_at": deposit.UpdatedAt,
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

	depositID := c.Param("deposit_id")

	// Ambil user ID dari JWT
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized!",
		})
		return
	}

	// Jalankan semua proses dalam database transaction
	err := config.DB.Transaction(func(tx *gorm.DB) error {

		// Cari deposit milik user
		var deposit models.SavingsDeposit

		if err := tx.
			Where("id = ? AND user_id = ?", depositID, userID).
			First(&deposit).Error; err != nil {

			return err
		}

		// Cari savings goal
		var goal models.SavingsGoal

		if err := tx.
			Where("id = ? AND user_id = ?", deposit.SavingsGoalID, userID).
			First(&goal).Error; err != nil {

			return err
		}

		// Kurangi current amount dengan nominal deposit
		goal.CurrentAmount -= deposit.Amount

		// Pastikan current amount tidak menjadi negatif
		if goal.CurrentAmount < 0 {
			goal.CurrentAmount = 0
		}

		// Simpan perubahan goal
		if err := tx.Save(&goal).Error; err != nil {
			return err
		}

		// Hapus deposit
		if err := tx.Delete(&deposit).Error; err != nil {
			return err
		}

		return nil
	})

	// Jika transaction gagal
	if err != nil {

	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "savings deposit or savings goal not found!",
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