package models

import "gorm.io/gorm"

type Account struct {
	gorm.Model

	UserID      uint    `json:"user_id"`
	WorkspaceID uint    `json:"workspace_id"`
	Name        string  `json:"name" binding:"max=100"`
	Balance     float64 `json:"balance" binding:"gte=0"`
}