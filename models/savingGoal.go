package models

import "gorm.io/gorm"

type SavingsGoal struct {
	gorm.Model

	UserID      uint    `json:"user_id"`
	WorkspaceID uint    `json:"workspace_id"`
	Name        string  `json:"name" binding:"required"`
	TargetAmount float64 `json:"target_amount" binding:"required,gt=0"`
	CurrentAmount float64 `json:"current_amount" binding:"gte=0"`
	Deadline    string  `json:"deadline"`
	Frequency   string  `json:"frequency" binding:"required,oneof=daily weekly monthly"`
}