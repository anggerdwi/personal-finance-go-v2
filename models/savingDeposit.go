package models

import "gorm.io/gorm"

type SavingsDeposit struct {
	gorm.Model

	UserID        uint    `json:"user_id"`
	WorkspaceID   uint    `json:"workspace_id"`
	SavingsGoalID uint    `json:"savings_goal_id"`
	AccountID     uint    `json:"account_id"`

	Amount float64 `json:"amount" binding:"required,gt=0"`
	Notes  string  `json:"notes" binding:"max=255"`
}